import { computeFaceDistance, FACE_MATCH_THRESHOLD } from "@/lib/face-distance";

type FaceApiModule = typeof import("@vladmandic/face-api");

let faceapiModule: FaceApiModule | null = null;
let modelsPromise: Promise<void> | null = null;

async function getFaceApi(): Promise<FaceApiModule> {
  if (typeof window === "undefined") {
    throw new Error("Face API can only run in the browser");
  }
  if (!faceapiModule) {
    faceapiModule = await import("@vladmandic/face-api");
  }
  return faceapiModule;
}

/**
 * Loads face models on-demand. Cached for the session — never called on dashboard mount.
 */
export async function loadFaceApiModels(): Promise<void> {
  if (typeof window === "undefined") return;
  if (modelsPromise) return modelsPromise;

  modelsPromise = (async () => {
    const faceapi = await getFaceApi();
    const MODEL_URL = "/models";

    try {
      if (faceapi.tf) {
        await (faceapi.tf as unknown as { ready: () => Promise<void> }).ready();
      }
    } catch (tfErr) {
      console.warn("TensorFlow.js ready check failed, attempting to load models anyway:", tfErr);
    }

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
  })();

  return modelsPromise;
}

/** @deprecated Models are loaded on first capture, not preloaded on dashboard. */
export const preloadFaceApiModels = loadFaceApiModels;

export async function getFaceDescriptor(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  await loadFaceApiModels();
  const faceapi = await getFaceApi();

  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 160,
    scoreThreshold: 0.5,
  });

  const detection = await faceapi
    .detectSingleFace(input, options)
    .withFaceLandmarks(true)
    .withFaceDescriptor();

  return detection?.descriptor ?? null;
}

export async function verifyFaceMatch(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  referenceEmbedding: number[] | Float32Array,
  threshold = FACE_MATCH_THRESHOLD
): Promise<{ matched: boolean; distance: number; descriptor: Float32Array | null }> {
  const descriptor = await getFaceDescriptor(input);
  if (!descriptor) {
    return { matched: false, distance: Infinity, descriptor: null };
  }
  const distance = computeFaceDistance(descriptor, referenceEmbedding);
  return { matched: distance < threshold, distance, descriptor };
}

/** @deprecated Use computeFaceDistance from face-distance.ts */
export const computeDistance = computeFaceDistance;

export function averageDescriptors(descriptors: (Float32Array | number[])[]): number[] {
  if (descriptors.length === 0) return [];
  const len = descriptors[0].length;
  const avg = new Array(len).fill(0);
  for (const desc of descriptors) {
    for (let i = 0; i < len; i++) {
      avg[i] += desc[i];
    }
  }
  for (let i = 0; i < len; i++) {
    avg[i] /= descriptors.length;
  }
  return avg;
}

export function compressImage(
  file: File,
  maxDimension: number = 800,
  quality: number = 0.85
): Promise<File> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            resolve(
              new File([blob], `${baseName}.jpg`, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
            );
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}
