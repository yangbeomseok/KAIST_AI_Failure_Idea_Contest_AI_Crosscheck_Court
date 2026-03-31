# AI Crosscheck Court

여러 AI 모델에 동일한 질문을 던지고, 응답을 교차 검증하여 신뢰도를 평가하는 플랫폼입니다. AI의 할루시네이션과 편향을 탐지하기 위해 만들었습니다.

## 동작 방식

1. 사용자가 질문을 입력합니다
2. Claude, Gemini, Perplexity 등 여러 AI 모델에 동시에 질문을 전송합니다
3. 각 응답에 대해 신뢰도 점수를 산출합니다 (출처 신뢰성, 사실 정확도, 논리적 일관성 등)
4. Gemini API를 통해 응답 간 합의/불일치/할루시네이션을 분석합니다
5. 신뢰도가 높은 응답에 가중치를 두어 최종 통합 답변을 생성합니다

## 주요 기능

- **멀티 AI 검증** - 최대 6개 모델의 응답을 동시에 비교합니다
- **신뢰도 점수** - 다차원 지표 기반으로 각 응답의 신뢰도를 수치화합니다
- **할루시네이션 탐지** - 모델 간 교차 검증으로 허위 정보를 식별합니다
- **편향 감지** - 특정 모델의 편향된 응답을 감지합니다
- **합의 분석** - 모델 간 일치/불일치 지점을 시각화합니다

## 🛠 기술 스택

### Frontend
| 기술 | 용도 |
|------|------|
| React 18 | UI 프레임워크 |
| Three.js | 3D ASCII 텍스트 애니메이션 |
| React Router v6 | 클라이언트 라우팅 |

### Backend
| 기술 | 용도 |
|------|------|
| Node.js + Express | REST API 서버 |
| Axios | AI API 통신 |
| dotenv | 환경변수 관리 |

### AI 모델
| 모델 | 상태 |
|------|------|
| Anthropic Claude | API 연동 |
| Google Gemini Pro | API 연동 |
| Perplexity AI | API 연동 |
| OpenAI GPT-4 | Mock |
| Grok AI | Mock |
| CLOVA X | Mock |

## 📁 프로젝트 구조

```
├── frontend/
│   └── src/
│       ├── components/        # UI 컴포넌트
│       ├── contexts/          # 언어 전환 Context
│       └── pages/             # 랜딩, 쿼리 페이지
├── backend/
│   └── src/
│       ├── controllers/       # 요청 핸들러
│       ├── routes/            # API 라우트
│       ├── services/
│       │   ├── aiService.js          # AI 모델 통신
│       │   ├── advancedAnalytics.js  # 신뢰도 점수 산출
│       │   └── consensusAnalyzer.js  # 합의 분석
│       └── server.js
└── image/                     # AI 모델 아이콘
```

## 설치 및 실행

### 요구사항
- Node.js 16.0+
- AI API 키 2개 이상 (Claude, Gemini, Perplexity 중)

### 설정

```bash
git clone https://github.com/yangbeomseok/ai_crosscheck_court.git
cd ai_crosscheck_court
```

백엔드 환경변수를 설정합니다.

```bash
cd backend
npm install
cp .env.example .env
```

`.env` 파일에 API 키를 입력합니다.

```env
PORT=5001
OPENAI_API_KEY=your_key
CLAUDE_API_KEY=your_key
GEMINI_API_KEY=your_key
PERPLEXITY_API_KEY=your_key
```

프론트엔드를 설치합니다.

```bash
cd ../frontend
npm install
```

### 실행

```bash
# 터미널 1 - 백엔드
cd backend && npm run dev

# 터미널 2 - 프론트엔드
cd frontend && npm start
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5001

## API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/ai/query` | AI 모델에 질문 전송 및 교차 검증 |
| GET | `/api/ai/models` | 사용 가능한 AI 모델 목록 |
| GET | `/api/health` | 서버 상태 확인 |

## 📄 라이선스

MIT License
