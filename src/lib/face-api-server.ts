import path from "path";
import {
  averageDescriptors,
  computeFaceDistance,
  cosineSimilarity,
  cosineToScore,
  faceDistanceToScore,
  isFaceMatch,
} from "@/lib/face-distance";
import { extractKeyFromUrl } from "@/lib/storage/public-url";
import { fetchR2Object } from "@/lib/storage/r2";

type FaceApiModule = typeof import("@vladmandic/face-api/dist/face-api.node-wasm.js");

let initPromise: Promise<FaceApiModule> | null = null;

async function loadFaceApi(): Promise<FaceApiModule> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const tf = await import("@tensorflow/tfjs");
    const wasm = await import("@tensorflow/tfjs-backend-wasm");
    const faceapi = (await import("@vladmandic/face-api/dist/face-api.node-wasm.js")) as FaceApiModule;
    const canvas = await import("canvas");

    faceapi.env.monkeyPatch({
      Canvas: canvas.Canvas,
      Image: canvas.Image,
      ImageData: canvas.ImageData,
    } as never);

    const wasmDir = path.join(process.cwd(), "public", "tfjs-wasm");
    const fs = await import("fs");
    const wasmDirExists = fs.existsSync(wasmDir);

    // Node cannot fetch file:// URLs — use fs.readFileSync (usePlatformFetch: false).
    wasm.setWasmPaths(
      wasmDirExists
        ? `${wasmDir}${path.sep}`
        : "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.22.0/dist/",
      false
    );

    await tf.setBackend("wasm");
    await tf.ready();

    const modelPath = path.join(process.cwd(), "public", "models");
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath),
      faceapi.nets.faceLandmark68TinyNet.loadFromDisk(modelPath),
      faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath),
    ]);

    return faceapi;
  })();

  return initPromise;
}

function parseBase64Image(base64: string): Buffer {
  const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (matches?.[2]) {
    return Buffer.from(matches[2], "base64");
  }
  return Buffer.from(base64, "base64");
}

async function extractDescriptorFromBuffer(buffer: Buffer): Promise<Float32Array | null> {
  const faceapi = await loadFaceApi();
  const { loadImage } = await import("canvas");
  const img = await loadImage(buffer);

  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 160,
    scoreThreshold: 0.5,
  });

  const detection = await faceapi
    .detectSingleFace(img as unknown as HTMLCanvasElement, options)
    .withFaceLandmarks(true)
    .withFaceDescriptor();

  return detection?.descriptor ?? null;
}

export async function extractDescriptorFromBase64(base64: string): Promise<Float32Array | null> {
  return extractDescriptorFromBuffer(parseBase64Image(base64));
}

export async function extractDescriptorFromUrl(imageUrl: string): Promise<Float32Array | null> {
  const key = extractKeyFromUrl(imageUrl);
  let buffer: Buffer;

  if (key) {
    const response = await fetchR2Object(key);
    const body = response.Body;
    if (!body) {
      throw new Error("Failed to download image for face analysis.");
    }
    buffer = Buffer.from(await body.transformToByteArray());
  } else {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error("Failed to download image for face analysis.");
    }
    buffer = Buffer.from(await response.arrayBuffer());
  }

  return extractDescriptorFromBuffer(buffer);
}

export async function extractAverageDescriptorFromBuffers(
  buffers: Buffer[]
): Promise<Float32Array | null> {
  const descriptors: Float32Array[] = [];
  for (const buffer of buffers) {
    const desc = await extractDescriptorFromBuffer(buffer);
    if (desc) descriptors.push(desc);
  }
  if (descriptors.length === 0) return null;
  return new Float32Array(averageDescriptors(descriptors));
}

export async function verifyFaceFromBase64(
  base64: string,
  referenceEmbedding: number[]
): Promise<{
  matched: boolean;
  distance: number;
  similarity: number;
  score: number;
}> {
  const descriptor = await extractDescriptorFromBase64(base64);

  if (!descriptor) {
    return { matched: false, distance: Infinity, similarity: 0, score: 0 };
  }

  const distance = computeFaceDistance(descriptor, referenceEmbedding);
  const similarity = cosineSimilarity(descriptor, referenceEmbedding);
  const matched = isFaceMatch(distance, similarity);

  return {
    matched,
    distance,
    similarity,
    score: Math.round((faceDistanceToScore(distance) + cosineToScore(similarity)) / 2),
  };
}

export async function verifyFaceFromUrl(
  imageUrl: string,
  referenceEmbedding: number[]
): Promise<{
  matched: boolean;
  distance: number;
  similarity: number;
  score: number;
}> {
  const descriptor = await extractDescriptorFromUrl(imageUrl);

  if (!descriptor) {
    return { matched: false, distance: Infinity, similarity: 0, score: 0 };
  }

  const distance = computeFaceDistance(descriptor, referenceEmbedding);
  const similarity = cosineSimilarity(descriptor, referenceEmbedding);
  const matched = isFaceMatch(distance, similarity);

  return {
    matched,
    distance,
    similarity,
    score: Math.round((faceDistanceToScore(distance) + cosineToScore(similarity)) / 2),
  };
}
