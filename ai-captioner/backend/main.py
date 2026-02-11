import sys
import os
import shutil
import uuid
from typing import List, Dict, Optional

# 경로 추가 (임포트 오류 방지)
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="AI Captioner API")

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class CaptionSegment(BaseModel):
    start: float
    end: float
    text: str

class TranscriptionResponse(BaseModel):
    job_id: str
    filename: str
    status: str
    segments: List[CaptionSegment] = []

# 전역 상태 관리
jobs: Dict[str, TranscriptionResponse] = {}

async def process_transcription(job_id: str, video_path: str):
    try:
        # 지연 로딩 (기동 시 오류 방지)
        from services.audio_service import audio_service
        from services.whisper_service import whisper_service
        from services.gemini_service import gemini_service

        audio_path = f"{video_path}.mp3"
        
        # 1. 오디오 추출
        print(f"[{job_id}] Step 1: Extracting audio...")
        success = audio_service.extract_audio(video_path, audio_path)
        if not success:
            jobs[job_id].status = "FAILED"
            return

        # 2. Whisper 전사
        print(f"[{job_id}] Step 2: Transcribing with Whisper...")
        segments_raw = whisper_service.transcribe(audio_path)
        
        # 3. 결과 매핑 및 Gemini 교정
        print(f"[{job_id}] Step 3: Mapping and Refining with Gemini...")
        segments = []
        full_text = ""
        for s in segments_raw:
            seg = CaptionSegment(start=s["start"], end=s["end"], text=s["text"])
            segments.append(seg)
            full_text += s["text"] + " "

        # Gemini 교정 (비동기 호출은 아니지만 일단 동기로 처리)
        try:
            refined_text = gemini_service.refine_captions(full_text)
            print(f"[{job_id}] Refined Text: {refined_text[:50]}...")
        except Exception as ge:
            print(f"Gemini error: {ge}")

        jobs[job_id].segments = segments
        jobs[job_id].status = "COMPLETED"
        print(f"Job {job_id} finished successfully.")
    except Exception as e:
        print(f"Error processing job {job_id}: {e}")
        if job_id in jobs:
            jobs[job_id].status = "FAILED"

@app.get("/")
async def root():
    return {"message": "AI Captioner API is running"}

@app.post("/upload", response_model=TranscriptionResponse)
async def upload_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.mp4', '.mkv', '.avi', '.mov')):
        raise HTTPException(status_code=400, detail="Unsupported video format")
    
    job_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{job_id}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    response = TranscriptionResponse(
        job_id=job_id,
        filename=file.filename,
        status="PROCESSING",
        segments=[]
    )
    jobs[job_id] = response
    
    # 백그라운드 작업 예약
    background_tasks.add_task(process_transcription, job_id, file_path)
    
    return response

@app.get("/status/{job_id}", response_model=TranscriptionResponse)
async def get_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
