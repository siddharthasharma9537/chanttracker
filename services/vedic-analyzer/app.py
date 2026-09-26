import io
import os
from functools import lru_cache

import numpy as np
import soundfile as sf
import torch
import torchaudio
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor

MODEL_ID = os.getenv('VEDIC_ALIGNER_MODEL', 'chiranjeevisagi/wav2vec2-vedic-aligner')
API_KEY = os.getenv('CHANT_ANALYSIS_API_KEY')
SAMPLE_RATE = 16_000
BLANK_ID = 0  # Model card: <s> is the real CTC blank.

app = FastAPI(title='ChantTracker Vedic Analyzer', version='0.1.0')


@lru_cache(maxsize=1)
def load_model():
    processor = Wav2Vec2Processor.from_pretrained(MODEL_ID)
    model = Wav2Vec2ForCTC.from_pretrained(MODEL_ID)
    model.eval()
    if torch.cuda.is_available():
        model = model.cuda()
    return processor, model


def read_audio(raw: bytes):
    waveform, sample_rate = sf.read(io.BytesIO(raw), dtype='float32', always_2d=True)
    waveform = waveform.mean(axis=1)
    tensor = torch.from_numpy(waveform)
    if sample_rate != SAMPLE_RATE:
        tensor = torchaudio.functional.resample(tensor, sample_rate, SAMPLE_RATE)
    if tensor.numel() == 0:
        raise ValueError('empty audio')
    return tensor


def normalize_reference(text: str) -> str:
    # Preserve Devanagari graphemes; normalize only spacing here. A later
    # mantra-specific normalizer can preserve/interpret Vedic svara marks.
    return ' '.join(text.strip().split())


def score_alignment(emissions: torch.Tensor, expected_text: str, processor):
    tokenizer = processor.tokenizer
    target = tokenizer(normalize_reference(expected_text), add_special_tokens=False).input_ids
    target = [token for token in target if token != BLANK_ID]
    if not target:
        raise ValueError('reference text produced no alignable tokens')

    log_probs = torch.log_softmax(emissions, dim=-1).cpu()
    targets = torch.tensor([target], dtype=torch.int32)
    input_lengths = torch.tensor([log_probs.shape[1]], dtype=torch.int32)
    target_lengths = torch.tensor([len(target)], dtype=torch.int32)

    # torchaudio forced_align returns the best CTC path constrained by the
    # known transcript. blank=0 is required for this Vedic checkpoint.
    paths, scores = torchaudio.functional.forced_align(
        log_probs,
        targets,
        input_lengths=input_lengths,
        target_lengths=target_lengths,
        blank=BLANK_ID,
    )
    path = paths[0]
    frame_scores = scores[0].exp()
    aligned = path != BLANK_ID
    if not torch.any(aligned):
        raise ValueError('alignment contained no reference tokens')

    pronunciation = float(frame_scores[aligned].mean().item())
    coverage = min(1.0, float(aligned.sum().item()) / max(1, len(target)))
    confidence = max(0.0, min(1.0, pronunciation * (0.75 + 0.25 * coverage)))
    return pronunciation, confidence


def estimate_svara_score(waveform: torch.Tensor) -> float:
    # Placeholder-neutral pitch confidence, not a claim of Vedic svara
    # correctness. Real udātta/anudātta/svarita scoring needs mantra reference
    # pitch contours and calibration data; return 0.5 until that layer exists.
    energy = float(torch.sqrt(torch.mean(waveform ** 2)).item())
    if energy < 1e-4:
        return 0.0
    return 0.5


@app.get('/health')
def health():
    return {'ok': True, 'model': MODEL_ID}


@app.post('/analyze')
async def analyze(
    audio: UploadFile = File(...),
    mantraId: str = Form(...),
    expectedText: str = Form(...),
    authorization: str | None = Header(default=None),
):
    if API_KEY and authorization != f'Bearer {API_KEY}':
        raise HTTPException(status_code=401, detail='Unauthorized')
    if not mantraId.strip() or not expectedText.strip():
        raise HTTPException(status_code=400, detail='mantraId and expectedText are required')

    try:
        waveform = read_audio(await audio.read())
        processor, model = load_model()
        inputs = processor(waveform.numpy(), sampling_rate=SAMPLE_RATE, return_tensors='pt')
        device = next(model.parameters()).device
        input_values = inputs.input_values.to(device)
        with torch.inference_mode():
            emissions = model(input_values).logits.cpu()
        pronunciation, confidence = score_alignment(emissions, expectedText, processor)
        svara = estimate_svara_score(waveform)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f'Unable to analyze chant: {exc}') from exc

    return {
        'pronunciationScore': max(0.0, min(1.0, pronunciation)),
        'svaraScore': max(0.0, min(1.0, svara)),
        'confidence': max(0.0, min(1.0, confidence)),
        'model': MODEL_ID,
        'mantraId': mantraId,
    }
