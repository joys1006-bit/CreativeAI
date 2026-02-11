import whisper
import os

class WhisperService:
    def __init__(self, model_name="base"):
        self.model = None
        self.model_name = model_name

    def load_model(self):
        if self.model is None:
            print(f"Loading Whisper model: {self.model_name}...")
            self.model = whisper.load_model(self.model_name)
            print("Model loaded successfully.")

    def transcribe(self, audio_path: str):
        self.load_model()
        print(f"Transcribing audio: {audio_path}...")
        result = self.model.transcribe(audio_path, language="ko")
        return result["segments"]

# Singleton instance
whisper_service = WhisperService(model_name="base")
