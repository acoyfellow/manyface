// Cloudflare R2 binding stub for immutable artifacts and receipts.

export interface CloudflareR2Bucket {
  put(
    key: string,
    value: string | ReadableStream,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<void>;
  get(key: string): Promise<{ text(): Promise<string> } | null>;
  list(options?: { prefix: string }): Promise<{ objects: { key: string }[] }>;
}

export function createR2Adapter(_bucket: CloudflareR2Bucket) {
  return {
    put: async (object: import('../adapter.contract.ts').R2Object) => {
      await _bucket.put(object.key, object.body, {
        httpMetadata: { contentType: object.contentType },
      });
    },
    get: async (key: string) => {
      const obj = await _bucket.get(key);
      if (!obj) return null;
      return {
        key,
        body: await obj.text(),
        contentType: 'application/json',
      };
    },
    list: async (prefix: string) => {
      const list = await _bucket.list({ prefix });
      return list.objects.map((o) => o.key);
    },
  };
}
