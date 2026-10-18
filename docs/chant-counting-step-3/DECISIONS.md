# Decisions on the review (Claude, 2026-10-19)

Brief: sohum-contracts `docs/phases/CHANT_COUNTING_STEP_3_frontend.md` (contract pin b8fc7f3). Review: `REVIEW.md` in this folder. All items are technical; none changes privacy, money, scope or devotee-facing wording, so none needed the owner.

| # | Decision | Binding detail for the build |
|---|---|---|
| 1 | Accept | A start token per `start()`; a `getUserMedia` that resolves after Stop, unmount or hide stops its tracks immediately and is discarded. Queued PCM and events are dropped. Resume only on an explicit tap. |
| 2 | Accept | **Finish session** first stops detection and freezes all counts; the saved count is the frozen one. On a save error, keep the frozen counts, show the error and allow retry; do not restart the microphone. |
| 3 | Accept | Keep a PCM tail (frame length minus hop) between chunks so the framing is continuous. A test proves identical features and counts for chunk sizes 128, 1000 and 4096. |
| 4 | Accept | After a `count`, frames up to the end of the matched subsequence are consumed. The refractory period (0.6 × template length) runs from that end. `unsure` is also suppressed during the refractory period, and at most one `unsure` is emitted per template length. |
| 5 | Accept | Per-band mean and variance normalisation, using statistics from the calibration audio (applied to the stream too). Distance: Euclidean per frame, with the DTW cost divided by the warping-path length, and a Sakoe-Chiba band of 20%. Threshold with 2 or more samples: 1.5 × the largest inter-sample distance. With 1 sample: match the template against copies of itself stretched ±10% with −20 dB noise added; threshold = 1.5 × the largest of those distances. |
| 6 | Accept | Reject a sample (ask to chant again) if it has under 0.4 s voiced, clipping on over 1% of samples, or exceeds 30 s (per sample). With 2 or more samples, reject one whose voiced length differs from the median by more than 1.6×. One good sample is enough; **Done** finishes. |
| 7 | Accept | Seeded PRNG. Sample rates 16 kHz and 48 kHz. SNR as an RMS ratio. Three seeds each for V1 to V5. Also cover back-to-back repetitions with no gap (counted) and a partial phrase (the first half only; not counted). |
| 8 | Accept | Supported template length 0.3 to 8 s (reject calibration outside that). Evaluate the detector every 50 ms, not every hop. Keep at most 1.3 × template length of features. If the worklet backlog exceeds 2 s, drop the oldest chunks. A test asserts a bounded working set over a 30-minute synthetic stream. |
| 9 | Accept | Switching mode, Stop, Cancel, denial and track end stop the microphone. "Used Voice" becomes true when listening first starts in this session and stays true. **Reset** zeroes the counts, resets the detector and clears "used Voice". Cancelling calibration returns to Tap. |
| 10 | Accept | Duration starts at the first count of any kind (tap, voice or +1), as tap mode does today, and is wall time to Finish, pauses included. Calibration does not start the clock. |
| 11 | Accept | `voice_count` applies to the main mantra's session only; deity sessions stay `tap`. Test a mixed session. |
| 12 | Accept | The worklet is a static same-origin file, `apps/web/public/voice-count-worklet.js`. When `AudioWorklet` or `getUserMedia` is unsupported, show "Voice counting isn't available in this browser. You can count by tapping." (the only new string beyond the brief) and fall back to Tap. Treat a suspended or interrupted context as `paused-hidden`. |
| 13 | Accept | The template JSON has an explicit schema: `{ v: 1, sampleRate, bands, frames, mean[], std[], features: number[][], threshold }`. Validate the version, the dimensions, finite values and a size cap (≤ 800 frames) on load; on any failure, discard it and recalibrate. Test malformed storage. |
| 14 | Accept | A minimal fix in `useWakeLock.ts`: clear the sentinel on `release` so the lock is taken again when the page is visible. The microphone still restarts only on an explicit tap. |
| 15 | Decline as stated | `AGENTS.md` isn't on `main`; the same guidance is in the repository's `CLAUDE.md`. Read that instead. |
