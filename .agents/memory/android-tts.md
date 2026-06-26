---
name: Android TTS Web Speech API
description: How to make Web Speech API TTS work reliably on Android Chrome mobile
---

## Rule
Do NOT use `speechSynthesis.pause()` + `resume()` as a keep-alive trick on mobile. On Android Chrome/WebView, `pause()` often cancels the utterance instead of pausing it — causing TTS to silently stop every N seconds (wherever the interval fires).

## Fix
1. Split text into small chunks (≤100 chars) at sentence boundaries so each utterance finishes in ~5-8s, well below Android's ~15s speech limit.
2. Chain chunks via `utterance.onend` with a 50ms `setTimeout` delay before starting the next chunk.
3. No keep-alive interval needed — chunk chaining handles continuity.
4. Avoid lookbehind regex `(?<=...)` in the chunking function — not supported on older Android WebView. Use `replace(/([.!?])\s*/g, "$1\x00").split("\x00")` instead.

**Why:** Android Chrome enforces a ~15s per-utterance limit and its `pause()` implementation is buggy — it cancels rather than pauses on many devices.

**How to apply:** Any time TTS is implemented for a mobile-first app using Web Speech API.
