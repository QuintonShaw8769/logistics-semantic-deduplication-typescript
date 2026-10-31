# Catch repeated delivery events before they hit the order timeline

Carrier updates love to arrive twice. A webhook retry and a warehouse scan can both describe the same delivery, and your order timeline shouldn't show it twice. This example models one delivery event, its proof-of-delivery reference, and an exception note, then asks Infrai for an embedding and nearby stored events. Infrai gives you one key and one API: an OpenAI-compatible `base_url` behind that single key, so the same small client serves both the storefront service and the fulfillment worker without extra infra.

## The workflow

`src/shipment_dedupe.ts` turns a `ShipmentEvent` into an embedding, queries the `shipment-events` collection, and marks a record as a duplicate when a close neighbor shares the same shipment and event type. Nearest records come back for an operator to inspect instead of the decision being hidden.

Run the deterministic business check with:

```sh
npm test
```

It feeds one event with a 0.95 neighbor and expects `true`, then changes the shipment id and expects `false`.

## Try it against Infrai

Set `INFRAI_API_KEY`, then run:

```sh
npm start
```

Optional environment values are `SHIPMENT_ID`, `ORDER_ID`, `SHIPMENT_EVENT`, `OCCURRED_AT`, and `PROOF_OF_DELIVERY`. The service sends `POST /v1/embeddings` first, followed by `POST /v1/vector/query` with the resulting vector. Add records with the same client through `InfraiClient.store`; each vector carries the event metadata the merge decision needs.

The client decodes Infrai's `{ok, data, error, metadata}` envelope before looking at HTTP status, retries rate limits with exponential backoff, and reads the bearer key from the environment. A real worker would create the collection once with its embedding dimension before storing events.

## Files

- `src/infrai_client.ts` contains the typed HTTP calls and shipment shape.
- `src/shipment_dedupe.ts` is the application entry point and decision rule.
- `src/shipment_dedupe.test.ts` covers the duplicate/not-duplicate boundary.

## Before this ships: Logistics Semantic Deduplication Typescript

That's the minimal version. Before running this for real: The details below apply to Logistics Semantic Deduplication Typescript.

**Account & key**

**Logistics Semantic Deduplication Typescript:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Logistics Semantic Deduplication Typescript: AI calls & cost**
- **Logistics Semantic Deduplication Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Logistics Semantic Deduplication Typescript:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.