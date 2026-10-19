import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(frontendRoot, '..');
const publicRoot = path.join(frontendRoot, 'public');
const visionPackage = path.join(
  frontendRoot,
  'node_modules',
  '@mediapipe',
  'tasks-vision',
);
const wasmSource = path.join(visionPackage, 'wasm');
const wasmDestination = path.join(publicRoot, 'vendor', 'mediapipe', 'wasm');
const poseModel = path.join(
  projectRoot,
  'ai',
  'models',
  'pose_landmarker',
  'pose_landmarker_lite.task',
);
const modelDestination = path.join(publicRoot, 'models');

await mkdir(path.dirname(wasmDestination), { recursive: true });
await mkdir(modelDestination, { recursive: true });
await rm(wasmDestination, { recursive: true, force: true });
await cp(wasmSource, wasmDestination, { recursive: true });
await cp(poseModel, path.join(modelDestination, 'pose_landmarker_lite.task'));

console.info('Prepared local MediaPipe WASM and pose model assets.');
