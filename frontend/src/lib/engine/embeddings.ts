import type { FeatureExtractionPipeline } from "@xenova/transformers";

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;
const embeddingCache = new Map<string, Float32Array>();

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { env, pipeline } = await import("@xenova/transformers");
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      return pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
      ) as Promise<FeatureExtractionPipeline>;
    })();
  }
  return extractorPromise;
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function encodeText(text: string): Promise<Float32Array> {
  const key = text.trim().toLowerCase();
  const cached = embeddingCache.get(key);
  if (cached) return cached;

  const extractor = await getExtractor();
  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });

  const data = new Float32Array(output.data as Float32Array);
  embeddingCache.set(key, data);
  return data;
}

export async function encodeMany(texts: string[]): Promise<Float32Array[]> {
  const unique = [...new Set(texts.map((t) => t.trim()).filter(Boolean))];
  const missing = unique.filter(
    (t) => !embeddingCache.has(t.toLowerCase()),
  );

  if (missing.length > 0) {
    const extractor = await getExtractor();
    // Encode sequentially to keep browser memory stable on demos.
    for (const text of missing) {
      const output = await extractor(text, {
        pooling: "mean",
        normalize: true,
      });
      embeddingCache.set(
        text.toLowerCase(),
        new Float32Array(output.data as Float32Array),
      );
    }
  }

  return Promise.all(texts.map((t) => encodeText(t)));
}

export async function similarity(a: string, b: string): Promise<number> {
  const [embA, embB] = await Promise.all([encodeText(a), encodeText(b)]);
  return cosineSimilarity(embA, embB);
}

/** Warm the MiniLM model so the first analysis feels snappier. */
export async function preloadEmbeddingModel(): Promise<void> {
  await getExtractor();
}
