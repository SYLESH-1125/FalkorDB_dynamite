import base64

import httpx

from app.config import settings

SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"

TTS_SPEAKER = "priya"
TTS_MODEL = "bulbul:v3"
STT_MODEL = "saarika:v2.5"

TTS_SUPPORTED_LANGUAGES = {
    "as-IN", "bn-IN", "brx-IN", "doi-IN", "en-IN", "gu-IN", "hi-IN", "kn-IN", "kok-IN",
    "ks-IN", "mai-IN", "ml-IN", "mni-IN", "mr-IN", "ne-IN", "od-IN", "pa-IN", "sa-IN",
    "sat-IN", "sd-IN", "ta-IN", "te-IN", "ur-IN",
}
DEFAULT_TTS_LANGUAGE = "en-IN"

# Sarvam's TTS accepts at most ~1500 characters per request
TTS_MAX_CHARS = 1500


class VoiceNotConfigured(Exception):
    pass


def _headers() -> dict[str, str]:
    if not settings.sarvam_api_key:
        raise VoiceNotConfigured("SARVAM_API_KEY is not set")
    return {"api-subscription-key": settings.sarvam_api_key}


async def transcribe(audio_bytes: bytes, filename: str, language_code: str) -> tuple[str, str]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            SARVAM_STT_URL,
            headers=_headers(),
            data={"model": STT_MODEL, "language_code": language_code},
            files={"file": (filename, audio_bytes, "audio/webm")},
        )
        response.raise_for_status()
        data = response.json()
        return data.get("transcript", ""), data.get("language_code", language_code)


async def synthesize(text: str, language_code: str) -> bytes:
    trimmed = text[:TTS_MAX_CHARS]
    target_language = language_code if language_code in TTS_SUPPORTED_LANGUAGES else DEFAULT_TTS_LANGUAGE
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            SARVAM_TTS_URL,
            headers={**_headers(), "Content-Type": "application/json"},
            json={
                "text": trimmed,
                "target_language_code": target_language,
                "speaker": TTS_SPEAKER,
                "model": TTS_MODEL,
                "speech_sample_rate": 22050,
            },
        )
        response.raise_for_status()
        data = response.json()
        audio_b64 = data["audios"][0]
        return base64.b64decode(audio_b64)
