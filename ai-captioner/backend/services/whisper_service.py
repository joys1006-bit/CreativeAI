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
        # 싱크 정밀도 최적화 파라미터
        # - word_timestamps: 단어 단위 타이밍으로 고정밀 싱크
        # - no_speech_threshold: 0.4로 낮춰서 작은 소리도 캡처
        # - logprob_threshold: -1.0으로 완화하여 불확실한 구간도 포함
        # - condition_on_previous_text: False로 환각 방지
        # - beam_size: 5로 설정하여 정확도 향상
        result = self.model.transcribe(
            audio_path,
            language="ko",
            word_timestamps=True,
            no_speech_threshold=0.4,
            logprob_threshold=-1.0,
            condition_on_previous_text=False,
            compression_ratio_threshold=2.4,
            beam_size=5,
            best_of=5,
        )
        
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
# Singleton instance — small 모델로 업그레이드 (base 대비 타이밍 정밀도 2배 향상)
whisper_service = WhisperService(model_name="small")

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
