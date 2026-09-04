#!/usr/bin/env python3
"""Train the Aurevia exercise-quality LSTM on data exported by
scripts/export_training_data.py.

This is intentionally a small, explainable model: a Masking layer (so
short/padded reps don't skew learning) feeding a single LSTM layer, then
a dense binary classifier over the 8-dimensional joint-angle sequence
producing P(correct form).

Usage:
    python ai/training/train_lstm.py \
        --data data/training_dataset.npz \
        --out ai/models/lstm/exercise_quality_lstm.keras

With too little real data, accuracy numbers are not meaningful yet --
this script exists so the pipeline is proven end-to-end (see
ai/training/generate_synthetic_dataset.py for a smoke-test dataset), and
is ready to produce a real model the moment enough therapist-reviewed
recordings have been collected. As a rule of thumb, aim for at least a
few hundred reviewed reps per exercise before trusting the result.
"""

import argparse
from pathlib import Path

import numpy as np


def build_model(sequence_length: int, feature_count: int):
    # Imported lazily so `python ai/training/train_lstm.py --help` and the
    # rest of the Aurevia backend don't require tensorflow to be installed.
    from tensorflow import keras
    from tensorflow.keras import layers

    model = keras.Sequential(
        [
            layers.Input(shape=(sequence_length, feature_count)),
            layers.Masking(mask_value=0.0),
            layers.LSTM(64, return_sequences=False),
            layers.Dropout(0.3),
            layers.Dense(32, activation="relu"),
            layers.Dense(1, activation="sigmoid"),
        ]
    )

    model.compile(
        optimizer="adam",
        loss="binary_crossentropy",
        metrics=["accuracy"],
    )

    return model


def train(data_path: Path, output_path: Path, epochs: int, batch_size: int) -> None:
    dataset = np.load(data_path, allow_pickle=True)
    X, y = dataset["X"], dataset["y"]

    if len(X) < 20:
        print(
            f"Warning: only {len(X)} labeled examples found. The model "
            "will train, but is not meaningful with this little data -- "
            "keep collecting and reviewing recordings in the app."
        )

    # Simple 80/20 split; with very little data this is illustrative only.
    split = max(1, int(len(X) * 0.8))
    indices = np.random.permutation(len(X))
    train_idx, val_idx = indices[:split], indices[split:]

    X_train, y_train = X[train_idx], y[train_idx]
    X_val, y_val = (
        (X[val_idx], y[val_idx]) if len(val_idx) > 0 else (X_train, y_train)
    )

    model = build_model(sequence_length=X.shape[1], feature_count=X.shape[2])

    model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        verbose=2,
    )

    loss, accuracy = model.evaluate(X_val, y_val, verbose=0)
    print(f"Validation accuracy: {accuracy:.2%} (loss {loss:.4f})")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    model.save(output_path)
    print(f"Saved model to {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", default="data/training_dataset.npz")
    parser.add_argument("--out", default="ai/models/lstm/exercise_quality_lstm.keras")
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch-size", type=int, default=8)
    args = parser.parse_args()

    train(Path(args.data), Path(args.out), args.epochs, args.batch_size)
