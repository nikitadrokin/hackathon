# mymind

Private memory studio built with TanStack Start, Convex, and Better Auth.

## Run

```bash
bun install
bun run dev
```

## Build

```bash
bun run build
```

## Checks

```bash
bun run test
bun run check
```

## Product Surface

- `/` is the authenticated library for text, image, and voice cards.
- `/login` handles email/password authentication.
- Mind Mirror runs against saved cards through [`convex/mindMirror.ts`](./convex/mindMirror.ts).

## Notes

- Browser voice capture uses local transcription in [`src/lib/transcribeVoiceBlob.ts`](./src/lib/transcribeVoiceBlob.ts).
- Card auto-structuring uses the OpenRouter-backed classifier in [`convex/mindCards.ts`](./convex/mindCards.ts).
- Mind Mirror expects `MIND_MIRROR_URL` and `MIND_MIRROR_SECRET` in the Convex deployment environment.
