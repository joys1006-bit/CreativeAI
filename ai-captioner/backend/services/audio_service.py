import subprocess
import os

class AudioService:
    @staticmethod
    def extract_audio(video_path: str, output_path: str):
        """
        동영상 파일에서 오디오를 추출하여 mp3/wav로 저장합니다.
        FFmpeg이 설치되어 있어야 합니다.
        """
        print(f"Extracting audio from {video_path} to {output_path}...")
        try:
            ffmpeg_path = r"C:\MagicMic\x86\rtaivc\env\ffmpeg.exe"
            command = [
                ffmpeg_path,
                '-i', video_path,
                '-vn', # 비디오 제외
                '-acodec', 'libmp3lame',
                '-y', # 덮어쓰기 허용
                output_path
            ]
            subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            return True
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg error: {e.stderr.decode()}")
            return False
        except Exception as e:
            print(f"Error during audio extraction: {e}")
            return False

audio_service = AudioService()
