# AI Crosscheck Court 🏛️

AI 답변의 신뢰성을 검증하는 혁신적인 다중 AI 협업 플랫폼입니다. 여러 AI 모델이 서로의 답변을 교차 검증하고 토론하는 과정을 실시간으로 확인할 수 있습니다.

## 🎯 프로젝트 목표

- 다중 AI 모델(Claude, ChatGPT, Gemini, Perplexity)의 답변을 교차 검증
- AI 간 토론 및 합의 과정을 투명하게 시각화
- 환각(Hallucination), 편향, 불확실성을 자동 탐지
- 신뢰도 점수와 출처를 명확히 표시

## ✨ 주요 기능

### 🔍 다중 AI 검증
- 여러 AI 모델이 동시에 질문에 답변
- 실시간 응답 비교 및 분석

### 💬 실시간 토론 시스템
- AI들 간의 이의 제기 및 합의 과정
- 토론 결과 시각화

### 📊 신뢰도 분석
- 각 답변의 신뢰도 점수 계산
- 출처 및 근거 투명성 제공

### 🎯 오류 탐지
- 환각, 편향, 불확실성 자동 탐지
- 논쟁점 및 합의점 구분

## 🛠️ 기술 스택

### Frontend
- **React 18** - 사용자 인터페이스
- **Three.js** - ASCII 텍스트 3D 애니메이션
- **React Router** - 페이지 라우팅

### Backend
- **Express.js** - REST API 서버
- **Node.js** - 서버 런타임
- **Axios** - API 요청 처리

### AI 통합
- OpenAI GPT API
- Anthropic Claude API  
- Google Gemini API
- Perplexity AI API

## 🚀 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd AI_Crosscheck_Court
```

### 2. 백엔드 설정
```bash
cd backend
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일을 편집하여 API 키들을 입력하세요
```

### 3. 프론트엔드 설정
```bash
cd ../frontend
npm install
```

### 4. 개발 서버 실행

#### 백엔드 실행 (터미널 1)
```bash
cd backend
npm run dev
```

#### 프론트엔드 실행 (터미널 2)
```bash
cd frontend
npm start
```

## 📁 프로젝트 구조

```
AI_Crosscheck_Court/
├── frontend/                 # React 프론트엔드
│   ├── public/
│   ├── src/
│   │   ├── components/       # 재사용 가능한 컴포넌트
│   │   │   └── ASCIIText.js  # 3D ASCII 텍스트 애니메이션
│   │   ├── pages/           # 페이지 컴포넌트
│   │   │   └── LandingPage.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── backend/                  # Express.js 백엔드
│   ├── src/
│   │   ├── controllers/      # API 컨트롤러
│   │   ├── routes/          # API 라우트
│   │   ├── services/        # 비즈니스 로직
│   │   │   └── aiService.js  # AI 통합 서비스
│   │   └── server.js        # 서버 진입점
│   ├── .env.example         # 환경변수 예시
│   └── package.json
│
└── README.md
```

## 🔧 환경변수 설정

백엔드의 `.env` 파일에 다음 API 키들을 설정하세요:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# AI API Keys
OPENAI_API_KEY=your_openai_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here  
GEMINI_API_KEY=your_gemini_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

## 🎨 UI/UX 특징

### ASCII 텍스트 애니메이션
- Three.js 기반 3D ASCII 텍스트 렌더링
- 마우스 인터랙션에 반응하는 동적 애니메이션
- 레트로 사이버펑크 스타일의 시각적 효과

### 현대적인 디자인
- 다크 테마 기반 UI
- 네이비/블루 컬러 팔레트로 신뢰성 강조
- 반응형 디자인으로 모든 기기 지원

## 🔄 API 엔드포인트

### POST /api/ai/query
질문을 여러 AI 모델에 전송하고 교차 검증 결과를 반환합니다.

**요청:**
```json
{
  "query": "사용자의 질문"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "query": "사용자의 질문",
    "responses": [...],
    "crossCheck": {...},
    "finalResult": {
      "answer": "종합된 답변",
      "confidenceScore": 0.85,
      "reliability": "high",
      "sources": ["ChatGPT", "Claude"],
      "warnings": []
    }
  }
}
```

### GET /api/ai/models  
사용 가능한 AI 모델 목록을 반환합니다.

## 🧪 개발 및 테스트

### 개발 모드 실행
```bash
# 백엔드 (nodemon으로 자동 재시작)
set PORT=5001 && npm run dev

# 프론트엔드 (React 개발 서버)
npm start
```

### 프로덕션 빌드
```bash
# 프론트엔드 빌드
cd frontend
npm run build
```

## 🤝 기여 방법

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🎓 교육적 목적

이 프로젝트는 "AI의 실패와 공존"을 주제로 한 실험적/교육적 웹사이트입니다:

- AI 모델들의 한계와 오류를 투명하게 공개
- 다중 AI 협업을 통한 신뢰성 향상 방법 탐구  
- 사용자가 AI 결과를 비판적으로 평가하는 능력 배양

## 📞 문의

프로젝트에 대한 질문이나 제안사항이 있으시면 이슈를 생성해주세요.

---

**🎯 목표**: AI의 실패를 숨기지 않고, 투명한 검증 과정을 통해 더 나은 AI-인간 협업 모델을 제시합니다.
