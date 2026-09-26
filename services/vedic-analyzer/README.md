# ChantTracker Vedic Analyzer

Server-side pronunciation analyzer for known Vedic/Sanskrit mantra text.

## Model

Default: `chiranjeevisagi/wav2vec2-vedic-aligner`.

The checkpoint is a CTC forced aligner for chanted Sanskrit, not a general-purpose ASR model. Its real CTC blank is `<s>` token id `0`, so the service explicitly uses `blank=0` during forced alignment.

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

Set the web app environment:

```text
CHANT_ANALYSIS_URL=http://localhost:8000/analyze
CHANT_ANALYSIS_API_KEY=<same optional key on both services>
```

## Current scoring contract

`POST /analyze` accepts multipart `audio`, `mantraId`, and `expectedText` and returns normalized `pronunciationScore`, `svaraScore`, and `confidence` values.

Pronunciation uses forced-alignment posterior confidence against the known reference. `svaraScore` is intentionally neutral (`0.5` for audible audio) until a calibrated udātta/anudātta/svarita reference-contour scorer is implemented. Do not treat the current svara value as a correctness measurement.
