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
        # 원래 안정적 설정으로 복원 (small 모델이 한국어에서 오히려 악화)
        result = self.model.transcribe(
            audio_path,
            language="ko",
            word_timestamps=True,
            no_speech_threshold=0.6,
            logprob_threshold=-0.8,
            condition_on_previous_text=False,
            compression_ratio_threshold=2.0,
        )
        
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
                "confidence": seg.get("avg_logprob", 0),
                "words": words_info
            })
            
        return segments
# Singleton — base 모델 사용 (한국어 안정성 확인됨)
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
