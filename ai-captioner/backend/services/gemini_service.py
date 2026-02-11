import google.generativeai as genai
import os

class GeminiService:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

    def refine_captions(self, text: str):
        """
        추출된 거친 자막을 문맥에 맞게 자연스럽게 교정합니다.
        """
        if not self.model:
            print("Gemini API key not set. Skipping refinement.")
            return text
            
        prompt = f"""
        다음은 동영상에서 추출된 원본 자막 텍스트입니다. 
        문맥을 파악하여 오타를 수정하고, 자연스러운 한국어 문장으로 다듬어주세요.
        의미를 변경하지 마십시오.
        
        원본: {text}
        
        교정본:
        """
        
        response = self.model.generate_content(prompt)
        return response.text.strip()

gemini_service = GeminiService()
