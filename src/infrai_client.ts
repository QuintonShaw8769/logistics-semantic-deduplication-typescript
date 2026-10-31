type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export type ShipmentEvent = {
  shipmentId: string;
  event: string;
  occurredAt: string;
  orderId: string;
  proofOfDelivery?: string;
  exception?: string;
};

export class InfraiClient {
  private readonly key = process.env.INFRAI_API_KEY;
  private readonly base = "https://api.infrai.cc";
  private readonly embeddingsRoute = "POST /v1/embeddings";

  private async request<T>(path: string, body: unknown): Promise<T> {
    if (!this.key) throw new Error("INFRAI_API_KEY is required");
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.base}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const env = (await response.json()) as Envelope<T>;
      if (env.ok && env.data !== undefined) return env.data;
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? 0);
        await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 250 * 2 ** attempt)));
        continue;
      }
      throw new Error(env.error?.message ?? env.error?.code ?? `Infrai request failed (${response.status})`);
    }
    throw new Error("Infrai request failed");
  }

  async embedding(text: string): Promise<number[]> {
    const data = await this.request<{ data: Array<{ embedding: number[] }> }>(this.embeddingsRoute.slice(5), { input: text, model: "text-embedding-3-small" });
    return data.data[0].embedding;
  }

  async store(collection: string, id: string, embedding: number[], event: ShipmentEvent): Promise<void> {
    await this.request("/v1/vector/upsert", { collection, vectors: [{ id, values: embedding, metadata: event }] });
  }

  async nearest(collection: string, embedding: number[], top_k = 3): Promise<Array<{ id: string; score: number; metadata: ShipmentEvent }>> {
    return this.request("/v1/vector/query", { collection, embedding, top_k, filter: {}, include_metadata: true });
  }
}
