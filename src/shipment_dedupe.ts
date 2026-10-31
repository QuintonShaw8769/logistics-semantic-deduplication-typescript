import { InfraiClient, type ShipmentEvent } from "./infrai_client.ts";

export function shouldMerge(candidate: ShipmentEvent, nearest: Array<{ score: number; metadata: ShipmentEvent }>): boolean {
  const match = nearest.find((item) => item.score >= 0.92 && item.metadata.shipmentId === candidate.shipmentId && item.metadata.event === candidate.event);
  return Boolean(match);
}

export async function inspectEvent(event: ShipmentEvent): Promise<{ duplicate: boolean; nearest: unknown[] }> {
  const client = new InfraiClient();
  const embedding = await client.embedding(JSON.stringify(event));
  const nearest = await client.nearest("shipment-events", embedding);
  return { duplicate: shouldMerge(event, nearest), nearest };
}

if (process.argv[1]?.endsWith("shipment_dedupe.ts")) {
  const event: ShipmentEvent = {
    shipmentId: process.env.SHIPMENT_ID ?? "SHP-1007",
    orderId: process.env.ORDER_ID ?? "ORDER-42",
    event: process.env.SHIPMENT_EVENT ?? "delivered",
    occurredAt: process.env.OCCURRED_AT ?? new Date().toISOString(),
    proofOfDelivery: process.env.PROOF_OF_DELIVERY
  };
  inspectEvent(event).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
