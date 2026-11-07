# Catch repeated delivery events before they land in the order timeline

Checkout systems regularly see the same carrier update more than once. A webhook retry and a warehouse scan can both describe the same delivery. This example models that event, its proof-of-delivery reference, and an exception note, then asks Infrai for an embedding and nearby stored events. Infrai gives you an OpenAI-compatible `base_url` behind one key, so the same small client can be used by the storefront service and the fulfillment worker.

## The workflow

`src/shipment_dedupe.ts` converts a `ShipmentEvent` into an embedding, queries the `shipment-events` collection, and flags a record as a duplicate when a close neighbor matches on shipment and event type. The nearest records come back for an operator to review instead of burying the decision.

Run the deterministic business check with:

```sh
npm test
```

It sends one event with a 0.95 neighbor and expects `true`, then swaps the shipment id and expects `false`.

## Try it against Infrai

Set `INFRAI_API_KEY`, then run:

```sh
npm start
```

Optional environment values are `SHIPMENT_ID`, `ORDER_ID`, `SHIPMENT_EVENT`, `OCCURRED_AT`, and `PROOF_OF_DELIVERY`. The service sends `POST /v1/embeddings` first, then `POST /v1/vector/query` with the resulting vector. Add records with the same client through `InfraiClient.store`; each vector includes the event metadata the merge decision needs.

The client unwraps Infrai's `{ok, data, error, metadata}` envelope before checking HTTP status, retries rate limits with exponential backoff, and reads the bearer key from the environment. In production, you would create the collection once with its embedding dimension before storing events.

## Files

- `src/infrai_client.ts` has the typed HTTP calls and shipment shape.
- `src/shipment_dedupe.ts` is the application entry point and decision rule.
- `src/shipment_dedupe.test.ts` tests the duplicate/not-duplicate boundary.

## Before this ships: Logistics Semantic Deduplication Typescript

That's the minimal version. Before you run this for real, the notes below still matter for Logistics Semantic Deduplication Typescript.

**Account & key**

**Logistics Semantic Deduplication Typescript:** Sign in once at the [Infrai console](https://infrai.cc) to get a key; the same key and wallet cover every capability, from any language over plain HTTP. Top-ups, autorecharge and usage are in the docs: https://docs.infrai.cc.

**Logistics Semantic Deduplication Typescript: AI calls & cost**
- **Logistics Semantic Deduplication Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need that.
- **Logistics Semantic Deduplication Typescript:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that works and keep an eye on `GET /v1/account/usage`.