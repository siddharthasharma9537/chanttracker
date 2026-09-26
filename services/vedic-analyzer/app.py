import io
import os
import re
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

app = FastAPI(title='ChantTracker Vedic Analyzer', version='0.2.0')


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


def expected_svara_sequence(text: str):
    # Vedic Unicode marks: U+0951 (anudatta/low) and U+0951/U+0952 conventions
    # vary by shakha/edition. We only score text that actually carries marks.
    clusters = re.findall(r'\S+', text)
    sequence = []
    for cluster in clusters:
        if '\u0952' in cluster:
            sequence.append('high')
        elif '\u0951' in cluster:
            sequence.append('low')
        else:
            sequence.append('mid')
    return sequence


def pitch_track(waveform: torch.Tensor):
    # Relative F0 is speaker-normalized, so scoring compares contour rather than
    # absolute male/female pitch. Frame time is ~20 ms at 16 kHz.
    frame_time = 0.02
    frame_length = int(SAMPLE_RATE * 0.04)
    hop = int(SAMPLE_RATE * frame_time)
    f0 = torchaudio.functional.detect_pitch_frequency(
        waveform.unsqueeze(0), SAMPLE_RATE, frame_time=frame_time, win_length=5
    )[0]
    if f0.numel() < 3:
        return None
    voiced = f0[(f0 >= 60) & (f0 <= 500)]
    if voiced.numel() < 3:
        return None
    median = torch.median(voiced)
    relative = torch.log2(torch.clamp(f0, min=1.0) / median)
    return relative


def score_svara(waveform: torch.Tensor, expected_text: str) -> float:
    expected = expected_svara_sequence(expected_text)
    contour = pitch_track(waveform)
    if contour is None or not expected:
        return 0.0

    # Split the utterance into reference-word regions for a first calibrated
    # contour score. Forced token/syllable boundaries can replace this later.
    edges = torch.linspace(0, contour.numel(), len(expected) + 1).round().long()
    observed = []
    for index in range(len(expected)):
        segment = contour[edges[index]:edges[index + 1]]
        segment = segment[torch.isfinite(segment)]
        observed.append(float(torch.median(segment).item()) if segment.numel() else 0.0)

    # Speaker-relative semitone-ish log2 thresholds; high/low direction matters
    # more than absolute frequency. Unmarked/mid expects proximity to baseline.
    scores = []
    margin = 0.08
    for label, value in zip(expected, observed):
        if label == 'high':
            scores.append(max(0.0, min(1.0, (value + margin) / (2 * margin))))
        elif label == 'low':
            scores.append(max(0.0, min(1.0, (-value + margin) / (2 * margin))))
        else:
            scores.append(max(0.0, 1.0 - abs(value) / (2 * margin)))
    return float(np.mean(scores)) if scores else 0.0


@app.get('/health')
def health():
    return {'ok': True, 'model': MODEL_ID, 'svaraScoring': 'relative-f0-v1'}


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
        svara = score_svara(waveform, expectedText)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f'Unable to analyze chant: {exc}') from exc

    return {
        'pronunciationScore': max(0.0, min(1.0, pronunciation)),
        'svaraScore': max(0.0, min(1.0, svara)),
        'confidence': max(0.0, min(1.0, confidence)),
        'model': MODEL_ID,
        'svaraModel': 'relative-f0-v1',
        'mantraId': mantraId,
    }
