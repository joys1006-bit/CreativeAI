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
        if self.model is None:
            raise RuntimeError("Failed to load Whisper model")
            
        print(f"Transcribing audio: {audio_path}...")
        # Enable word_timestamps for Vrew-like precision
        result = self.model.transcribe(audio_path, language="ko", word_timestamps=True)
        
        # Original simple return: return result["segments"]
        # Enriched return for Vrew features (Confidence, Words)
        segments = []
        for seg in result["segments"]:
            words_info = []
            if "words" in seg:
                for w in seg["words"]:
                    words_info.append({
                        "word": w["word"],
                        "start": w["start"],
                        "end": w["end"],
                        "probability": w["probability"]
                    })
            
            segments.append({
                "id": seg["id"],
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"],
                "confidence": seg.get("avg_logprob", 0), # Simple proxy or calculate from words
                "words": words_info
            })
            
        return segments
# Singleton instance
whisper_service = WhisperService(model_name="base")

if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) < 2:
        print(json.dumps({"error": "No audio file provided"}))
        sys.exit(1)

    audio_path = sys.argv[1]
    
    try:
        # Check if file exists
        if not os.path.exists(audio_path):
            print(json.dumps({"error": f"File not found: {audio_path}"}))
            sys.exit(1)

        segments = whisper_service.transcribe(audio_path)
        print(json.dumps(segments, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
