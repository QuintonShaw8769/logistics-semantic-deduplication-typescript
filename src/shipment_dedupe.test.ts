import assert from "node:assert/strict";
import { shouldMerge } from "./shipment_dedupe.ts";
import type { ShipmentEvent } from "./infrai_client.ts";

const event: ShipmentEvent = { shipmentId: "SHP-1", orderId: "ORDER-1", event: "delivered", occurredAt: "2026-01-01T10:00:00Z" };
assert.equal(shouldMerge(event, [{ score: 0.95, metadata: { ...event, occurredAt: "2026-01-01T10:01:00Z" } }]), true);
assert.equal(shouldMerge(event, [{ score: 0.95, metadata: { ...event, shipmentId: "SHP-2" } }]), false);
console.log("shipment duplicate decision: ok");
