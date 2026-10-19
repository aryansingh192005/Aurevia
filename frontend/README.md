# Aurevia frontend

The patient and therapist web application uses React and Vite. From this directory, install the lockfile dependencies with `npm ci`, then run `npm run dev` for local development or `npm run build` to create the production static files.

The `predev` and `prebuild` scripts copy the MediaPipe WASM and the checked-in pose landmarker model into ignored `public/` directories. Those local assets are used by live pose tracking, so no runtime CDN access is needed for pose estimation.

For full setup, environment, API, and Docker deployment instructions, see the repository [README](../README.md).
