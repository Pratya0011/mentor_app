import { File, Paths } from 'expo-file-system';

/**
 * The single model this app downloads and runs on-device.
 * One-time ~1 GB download, then loaded by llama.rn for fully offline chat.
 */
export const MODEL = {
  id: 'qwen2.5-1.5b-instruct-q4km',
  displayName: 'Qwen 2.5 1.5B Instruct',
  quantization: 'Q4_K_M',
  fileName: 'qwen2.5-1.5b-instruct-q4_k_m.gguf',
  url: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf?download=true',
  approxSizeBytes: 1_010_000_000, // ~0.94 GiB, shown before headers arrive
} as const;

export type DownloadProgress = {
  bytesWritten: number;
  totalBytes: number;
  /** 0..1 (0 when the server didn't send a Content-Length). */
  fraction: number;
  /** Live download speed in bytes/sec. */
  bytesPerSec: number;
};

/** The model's location in the app's private document directory. */
export const getModelFile = () => new File(Paths.document, MODEL.fileName);

/** True once the GGUF is fully present on disk. */
export const isModelDownloaded = (): boolean => getModelFile().exists;

/**
 * Downloads the model once, reporting progress and live speed.
 * If it's already on disk, returns immediately.
 */
export async function downloadModel(
  onProgress?: (p: DownloadProgress) => void,
): Promise<string> {
  const file = getModelFile();
  if (file.exists) return file.uri;

  // Speed is sampled every ~0.5s so the UI number stays readable.
  let lastBytes = 0;
  let lastTime = Date.now();
  let speed = 0;

  const task = File.createDownloadTask(MODEL.url, file, {
    onProgress: ({ bytesWritten, totalBytes }) => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      if (dt >= 0.5) {
        speed = (bytesWritten - lastBytes) / dt;
        lastBytes = bytesWritten;
        lastTime = now;
      }
      onProgress?.({
        bytesWritten,
        totalBytes,
        fraction: totalBytes > 0 ? bytesWritten / totalBytes : 0,
        bytesPerSec: speed,
      });
    },
  });

  try {
    const out = await task.downloadAsync();
    if (!out) throw new Error('Download did not complete.');
    return out.uri;
  } catch (err) {
    // Remove any partially-written file so a later launch doesn't mistake
    // an incomplete download for a ready model and fail to load it.
    try {
      if (file.exists) file.delete();
    } catch {
      // best-effort cleanup
    }
    throw err;
  }
}

/** Returns the local model path, downloading first if needed. (Used later by the inference layer.) */
export async function ensureModel(
  onProgress?: (p: DownloadProgress) => void,
): Promise<string> {
  const file = getModelFile();
  return file.exists ? file.uri : downloadModel(onProgress);
}
