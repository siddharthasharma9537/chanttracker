1. Microphone cleanup must handle late `getUserMedia` resolution after Stop, unmount or hiding. Invalidate pending starts, stop late-arriving tracks, and discard queued PCM/events; resume only after an explicit action.

2. `Counter.tsx` allows count changes while saving. Stop detection and freeze counts before submitting so the confirmed count matches the stored count; define retry behavior after failure.

3. Streaming framing is underspecified: independently processing worklet chunks loses or duplicates overlapping frames. Retain only the required PCM tail and verify identical features/counts across arbitrary chunk boundaries.

4. DTW can repeatedly match overlapping windows from one utterance. Define consumed-frame boundaries, refractory timing and re-arming rules for both `count` and `unsure` events.

5. Threshold calibration lacks a distance definition, feature normalization and a justified single-sample default. Specify these together; raw log energies can vary substantially with microphone gain and noise suppression.

6. Silence-only, clipped, truncated and inconsistent calibration samples need rejection criteria. Define minimum voiced duration, the 30-second limit’s scope, and how calibration finishes after one sample.

7. Synthetic acceptance checks need seeded randomness, precise noise amplitude/SNR definitions, sample rates and tempo transformation rules. Test several seeds and chunk sizes, plus partial phrases and back-to-back repetitions.

8. DTW cost and retained features must be bounded for long mantras and sessions. Set a supported template length, cap worklet message backlog, and verify main-thread responsiveness on mobile.

9. Define transitions after Stop, Cancel, denial, permission revocation, Reset and switching modes. Specify when “used Voice” becomes sticky and ensure Reset cannot combine old detector state with a fresh count.

10. The existing timer starts only on a main-area tap; voice-only sessions would otherwise save zero duration. Define whether calibration, pauses and corrections affect duration, then initialize timing consistently.

11. Saving creates separate main and deity sessions. Apply `voice_count` only to the main entry; deity entries remain `tap`, and test mixed-mode sessions alongside V8.

12. Specify a same-origin static AudioWorklet module and its production path; avoid audio-derived URLs. Cover unsupported APIs, suspended/interrupted audio contexts and track termination with actionable Tap fallback.

13. Validate stored template version, dimensions, finite values and size before use. V6’s array-length check cannot establish absence of PCM; serialize an explicit feature-only schema and test malformed storage.

14. `useWakeLock.ts` retains a released sentinel, so its visibility handler may never reacquire the lock. Clear the reference on release; test background/foreground behavior while keeping microphone restart explicit.

15. Repository `AGENTS.md` is missing at the requested path. Resolve its location before building, since the brief attributes additional repository patterns to that file.
