import * as faceapi from '@vladmandic/face-api';

let modelsPromise: Promise<void> | null = null;

/**
 * Loads the face-api.js models from CDN on-demand.
 * This runs client-side and caches the promise.
 */
export async function loadFaceApiModels(): Promise<void> {
  if (typeof window === 'undefined') return;

  if (modelsPromise) return modelsPromise;

  modelsPromise = (async () => {
    // Model files served locally from the public/models directory
    const MODEL_URL = '/models';
    
    try {
      if (faceapi.tf) {
        await (faceapi.tf as any).setBackend('cpu');
        await (faceapi.tf as any).ready();
      }
    } catch (tfErr) {
      console.warn("TensorFlow.js ready check failed, attempting to load models anyway:", tfErr);
    }
    
    // Load tinyFaceDetector (for fast client-side localization),
    // faceLandmark68Net (for extracting shape landmarks), and
    // faceRecognitionNet (for extracting the 128-dimensional descriptor vector).
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
  })();

  return modelsPromise;
}

/**
 * Detects a face and extracts its 128-dimensional descriptor from an input media element.
 */
export async function getFaceDescriptor(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  await loadFaceApiModels();
  
  // Use TinyFaceDetector options for speed and low CPU utilization
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 160,
    scoreThreshold: 0.5,
  });

  const detection = await faceapi
    .detectSingleFace(input, options)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;
  return detection.descriptor;
}

/**
 * Calculates the Euclidean (L2) distance between two face descriptors.
 * A distance of < 0.55 is generally considered a strong match.
 */
export function computeDistance(
  v1: number[] | Float32Array,
  v2: number[] | Float32Array
): number {
  if (v1.length !== v2.length) {
    throw new Error('Face descriptors must be of the same length (128 floats)');
  }
  let sum = 0;
  for (let i = 0; i < v1.length; i++) {
    const diff = v1[i] - v2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Computes the average vector of multiple face descriptors to create a stable reference profile.
 */
export function averageDescriptors(
  descriptors: (Float32Array | number[])[]
): number[] {
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

/**
 * Compresses an image client-side to a max width/height using HTML5 Canvas.
 * Returns a Promise that resolves to a new File (JPEG format).
 */
export function compressImage(
  file: File,
  maxDimension: number = 800,
  quality: number = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Only process client-side
    if (typeof window === 'undefined') {
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

        // Calculate new dimensions keeping aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file); // Fallback to original file on error
          return;
        }

        // Draw and compress to canvas
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // Fallback to original file on error
              return;
            }
            // Create a new File from the compressed blob
            // Keeps the filename but replaces extension with .jpg
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            const compressedFile = new File([blob], `${baseName}.jpg`, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file); // Fallback
    };
    reader.onerror = () => resolve(file); // Fallback
  });
}

