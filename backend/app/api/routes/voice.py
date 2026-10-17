from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from app.api.deps import get_current_user
from app.domain.models import SpeakRequest, TranscribeOut
from app.infrastructure.db.models import User
from app.services.voice import VoiceNotConfigured, synthesize, transcribe

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.post("/transcribe", response_model=TranscribeOut)
async def transcribe_audio(
    file: UploadFile = File(...),
    language_code: str = Form(...),
    _user: User = Depends(get_current_user),
):
    try:
        audio_bytes = await file.read()
        transcript, detected_language = await transcribe(audio_bytes, file.filename or "audio.webm", language_code)
        return TranscribeOut(transcript=transcript, language_code=detected_language)
    except VoiceNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/speak")
async def speak(payload: SpeakRequest, _user: User = Depends(get_current_user)):
    try:
        audio_bytes = await synthesize(payload.text, payload.language_code)
        return Response(content=audio_bytes, media_type="audio/wav")
    except VoiceNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
