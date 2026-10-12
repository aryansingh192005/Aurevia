#!/usr/bin/env python3
"""Train the Aurevia exercise-quality LSTM.

This script expects an .npz file with:
  - X: shape (N, 30, 8) or generally (N, sequence_length, feature_count)
  - y: binary labels where 1 = correct form and 0 = incorrect form

It is intentionally conservative: it uses a small model, a stratified
train/validation split, class weighting for imbalance, and callbacks to
avoid overfitting while still letting the model train long enough to find
its best validation point.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Tuple

import numpy as np


def stratified_split(
    X: np.ndarray,
    y: np.ndarray,
    val_fraction: float = 0.2,
    seed: int = 42,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Split X/y into train and validation sets while preserving class balance."""
    if not 0.0 < val_fraction < 1.0:
        raise ValueError("val_fraction must be between 0 and 1")

    rng = np.random.default_rng(seed)
    y = y.astype(np.int64, copy=False)

    train_indices = []
    val_indices = []

    for cls in np.unique(y):
        cls_indices = np.where(y == cls)[0]
        if len(cls_indices) == 0:
            continue

        rng.shuffle(cls_indices)

        if len(cls_indices) == 1:
            # With only one sample, keep it in the training set.
            train_indices.extend(cls_indices.tolist())
            continue

        n_val = max(1, int(round(len(cls_indices) * val_fraction)))
        n_val = min(n_val, len(cls_indices) - 1)

        val_indices.extend(cls_indices[:n_val].tolist())
        train_indices.extend(cls_indices[n_val:].tolist())

    if not train_indices:
        raise ValueError("Not enough data to create a training split.")

    if not val_indices:
        # Fall back to using the training set as validation if the dataset
        # is tiny. This is not ideal, but it prevents the pipeline from
        # failing on very small sample sizes.
        val_indices = train_indices.copy()

    rng.shuffle(train_indices)
    rng.shuffle(val_indices)

    return (
        X[train_indices],
        X[val_indices],
        y[train_indices],
        y[val_indices],
    )


def compute_class_weight(y_train: np.ndarray) -> dict[int, float]:
    """Compute inverse-frequency class weights for binary classification."""
    counts = np.bincount(y_train.astype(np.int64), minlength=2)
    total = counts.sum()

    class_weight: dict[int, float] = {}
    for cls, count in enumerate(counts):
        if count > 0:
            class_weight[cls] = total / (2.0 * float(count))

    return class_weight


def build_model(sequence_length: int, feature_count: int):
    """Build a small regularized LSTM classifier."""
    # Imported lazily so `--help` works without TensorFlow loaded.
    from tensorflow import keras
    from tensorflow.keras import layers, regularizers

    inputs = keras.Input(shape=(sequence_length, feature_count))
    x = layers.Masking(mask_value=0.0)(inputs)

    x = layers.Bidirectional(
        layers.LSTM(
            64,
            return_sequences=False,
            dropout=0.25,
            recurrent_dropout=0.10,
        )
    )(x)

    x = layers.Dense(
        64,
        activation="relu",
        kernel_regularizer=regularizers.l2(1e-4),
    )(x)
    x = layers.Dropout(0.45)(x)

    x = layers.Dense(
        32,
        activation="relu",
        kernel_regularizer=regularizers.l2(1e-4),
    )(x)
    x = layers.Dropout(0.25)(x)

    outputs = layers.Dense(1, activation="sigmoid")(x)

    model = keras.Model(inputs=inputs, outputs=outputs, name="exercise_quality_lstm")

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="binary_crossentropy",
        metrics=[
            "accuracy",
            keras.metrics.AUC(name="auc"),
            keras.metrics.Precision(name="precision"),
            keras.metrics.Recall(name="recall"),
        ],
    )

    return model


def train(
    data_path: Path,
    output_path: Path,
    epochs: int,
    batch_size: int,
    val_fraction: float,
    seed: int,
) -> None:
    dataset = np.load(data_path, allow_pickle=True)
    X, y = dataset["X"], dataset["y"]

    if X.ndim != 3:
        raise ValueError(f"Expected X to have shape (N, sequence_length, feature_count), got {X.shape}")
    if len(X) != len(y):
        raise ValueError(f"X and y length mismatch: {len(X)} vs {len(y)}")
    if len(X) < 20:
        print(
            f"Warning: only {len(X)} labeled examples found. The model will train, "
            "but results will not be very reliable yet."
        )

    # Make the split deterministic and reproducible.
    np.random.seed(seed)

    X_train, X_val, y_train, y_val = stratified_split(
        X,
        y,
        val_fraction=val_fraction,
        seed=seed,
    )

    model = build_model(sequence_length=X.shape[1], feature_count=X.shape[2])

    class_weight = compute_class_weight(y_train)

    from tensorflow.keras.callbacks import (
        EarlyStopping,
        ModelCheckpoint,
        ReduceLROnPlateau,
        TerminateOnNaN,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)

    callbacks = [
        ModelCheckpoint(
            filepath=str(output_path),
            monitor="val_loss",
            save_best_only=True,
            save_weights_only=False,
            verbose=1,
        ),
        EarlyStopping(
            monitor="val_loss",
            patience=12,
            min_delta=0.001,
            restore_best_weights=True,
            verbose=1,
        ),
        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=5,
            min_delta=0.001,
            min_lr=1e-6,
            verbose=1,
        ),
        TerminateOnNaN(),
    ]

    history = model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        verbose=2,
        class_weight=class_weight,
        callbacks=callbacks,
        shuffle=True,
    )

    # Keep the best model on disk and report validation performance.
    loss, accuracy, auc, precision, recall = model.evaluate(X_val, y_val, verbose=0)
    print(f"Validation loss: {loss:.4f}")
    print(f"Validation accuracy: {accuracy:.2%}")
    print(f"Validation AUC: {auc:.4f}")
    print(f"Validation precision: {precision:.4f}")
    print(f"Validation recall: {recall:.4f}")

    # Save again to make sure the final file is present even if callbacks
    # are disabled or the user changes the monitor later.
    model.save(output_path)
    print(f"Saved model to {output_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", default="data/training_dataset.npz")
    parser.add_argument("--out", default="ai/models/lstm/exercise_quality_lstm.keras")
    parser.add_argument("--epochs", type=int, default=120)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--val-fraction", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    train(
        data_path=Path(args.data),
        output_path=Path(args.out),
        epochs=args.epochs,
        batch_size=args.batch_size,
        val_fraction=args.val_fraction,
        seed=args.seed,
    )


if __name__ == "__main__":
    main()
