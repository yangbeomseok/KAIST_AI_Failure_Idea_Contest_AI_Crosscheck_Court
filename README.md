# 🏛️ AI Crosscheck Court

A revolutionary multi-AI collaboration platform that verifies the reliability of AI responses. Watch multiple AI models cross-verify each other's answers and engage in real-time discussions to reach consensus.

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat&logo=three.js&logoColor=white)](https://threejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)

## 📖 Project Overview

AI Crosscheck Court is an experimental platform designed to enhance AI reliability through transparent multi-model verification. By orchestrating debates between leading AI models (Claude, ChatGPT, Gemini, Perplexity, Grok, CLOVA X), the platform exposes the decision-making process behind AI responses and identifies potential biases, hallucinations, and uncertainties.

This project was born from the need to address the growing concern about AI reliability in critical decision-making scenarios. Rather than relying on a single AI's output, the platform creates a virtual courtroom where multiple AI models serve as both witnesses and judges, cross-examining each other's responses to arrive at more trustworthy conclusions.

## 🎯 Project Goals

- **Cross-verify responses** from multiple AI models (Claude, ChatGPT, Gemini, Perplexity, Grok, CLOVA X)
- **Transparently visualize** AI discussion and consensus-building processes
- **Automatically detect** hallucinations, biases, and uncertainties
- **Clearly display** confidence scores and source attribution
- **Promote critical thinking** about AI-generated content among users
- **Advance research** in multi-agent AI systems and reliability assessment

## ✨ Key Features

### 🔍 Multi-AI Verification Engine
- **Simultaneous querying** of multiple state-of-the-art AI models
- **Real-time response comparison** and discrepancy analysis
- **Conflict detection** when models disagree on factual claims
- **Consensus building** through iterative discussion rounds

### 💬 Real-time Debate System
- **Dynamic discussion orchestration** between AI models
- **Argument strength assessment** and counter-argument generation
- **Visual debate flow** showing the evolution of arguments
- **Moderator AI** that guides discussions and identifies key points

### 📊 Advanced Reliability Analysis
- **Multi-dimensional confidence scoring** based on model agreement
- **Source transparency** with detailed citation tracking
- **Uncertainty quantification** for ambiguous or disputed claims
- **Bias detection algorithms** that flag potential prejudices

### 🎯 Intelligent Error Detection
- **Hallucination identification** through fact-checking and cross-referencing
- **Logical consistency analysis** within and across responses
- **Emotional bias detection** in subjective topics
- **Knowledge gap identification** where all models show uncertainty

### 🎨 Immersive Visual Experience
- **3D ASCII art animations** using Three.js for cyberpunk aesthetics
- **Interactive debate visualization** showing argument flow
- **Real-time confidence meters** and reliability indicators
- **Responsive design** optimized for desktop and tablet viewing

## 🛠 Tech Stack

### Frontend Architecture
- **React 18** - Modern UI framework with hooks and concurrent features
- **Three.js** - 3D graphics library for ASCII text animations and visual effects
- **React Router v6** - Client-side routing and navigation
- **CSS3 Animations** - Smooth transitions and cyberpunk aesthetics
- **Responsive Design** - Mobile-first approach with CSS Grid and Flexbox

### Backend Infrastructure
- **Node.js** - Server-side JavaScript runtime
- **Express.js** - Lightweight web framework for REST API
- **Axios** - HTTP client for AI API communications
- **CORS** - Cross-origin resource sharing middleware
- **Environment Management** - Secure API key handling with dotenv

### AI Model Integration
- <img width="30" height="30" alt="Image" src="https://github.com/user-attachments/assets/75f525a9-bff6-40db-a1e2-ac7380d295ec" /> **OpenAI GPT-4/3.5** - Advanced language understanding and generation
- <img width="30" height="30" alt="Image" src="https://github.com/user-attachments/assets/1f51309c-e56f-4f67-8a24-f354a193dbe1" /> **Anthropic Claude** - Constitutional AI with strong reasoning capabilities
- <img width="30" height="30" alt="Image" src="https://github.com/user-attachments/assets/a2dae770-9774-4e5a-ad92-cdfa98c153bd" /> **Google Gemini Pro** - Multimodal AI with latest Google innovations
- <img width="30" height="30" alt="Image" src="https://github.com/user-attachments/assets/bba146cb-a262-49c7-9836-bb3391ac1d60"  /> **Perplexity AI** - Search-augmented AI with real-time web access
- <img width="30" height="30" alt="Image" src="https://github.com/user-attachments/assets/2a60b965-b2e5-4d94-92a9-25960577fb99" /> **Grok AI** - X's AI model with real-time information access (mock implementation for testing)
- <img width="30" height="30" alt="Image" src="https://github.com/user-attachments/assets/3d8a14d8-4b0d-4043-8f15-c80e24d946be" /> **CLOVA X** - NAVER's advanced Korean-optimized language model (mock implementation for testing)
- **Custom Orchestration Layer** - Manages multi-model communication and consensus

### Development Tools
- **Nodemon** - Development server auto-restart
- **Jest** - Testing framework (configured)

## 🚀 Installation and Setup

### Prerequisites
- **Node.js** 16.0 or higher
- **npm** 8.0 or higher
- API keys for at least two AI services (OpenAI, Claude, Gemini, Perplexity, Grok, or CLOVA X)
- Modern web browser with WebGL support for 3D animations

### 1. Clone Repository
```bash
git clone https://github.com/your-username/KAIST_AI_Failure_Idea_Contest_AI_Crosscheck_Court.git
cd KAIST_AI_Failure_Idea_Contest_AI_Crosscheck_Court
```

### 2. Backend Configuration
```bash
cd backend
npm install

# Environment setup
cp .env.example .env
# Edit .env file and add your API keys (see configuration section below)
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. Development Server Launch

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001

## 🏗 Project Structure

```
KAIST_AI_Failure_Idea_Contest_AI_Crosscheck_Court/
├── frontend/                      # React Frontend Application
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── App.js               # Main application component
│   │   └── index.js             # Application entry point
│   ├── package.json             # Frontend dependencies
│   └── package-lock.json        # Frontend dependency lock file
│
├── backend/                       # Express.js Backend API
│   ├── src/
│   │   ├── controllers/          # Request handlers (planned)
│   │   ├── routes/               # API endpoints (planned)
│   │   ├── services/             # Business logic layer (planned)
│   │   └── server.js            # Server entry point
│   ├── package.json             # Backend dependencies
│   └── package-lock.json        # Backend dependency lock file
│
├── image/                        # Image assets and screenshots
├── .gitignore                   # Git ignore rules
├── LICENSE                      # Project license
└── README.md                    # Main project documentation
```

## 🔧 Environment Configuration

### Backend Environment Variables

Create a `.env` file in the backend directory with the following configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=5001
FRONTEND_URL=http://localhost:3000

# Security
SESSION_SECRET=your_session_secret_here
JWT_SECRET=your_jwt_secret_here

# AI API Keys (Add at least 2 for cross-verification)
OPENAI_API_KEY=your_openai_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
GROK_API_KEY=your_grok_api_key_here
CLOVA_X_API_KEY=your_clova_x_api_key_here

# AI Model Configuration
DEFAULT_MODELS=openai,claude,gemini,grok,clova_x
MAX_TOKENS=2000
TEMPERATURE=0.7
DEBATE_ROUNDS=3

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Feature Flags
ENABLE_BIAS_DETECTION=true
ENABLE_FACT_CHECKING=true
ENABLE_DEBATE_MODE=true
```

### API Key Acquisition Guide

#### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Generate a new secret key
5. Copy and paste into your `.env` file

#### Claude API Key
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up for access to Claude API
3. Generate an API key from your dashboard
4. Add to your environment variables

#### Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key
4. Configure your project settings

#### Perplexity API Key
1. Visit [Perplexity AI](https://www.perplexity.ai/)
2. Sign up for API access
3. Navigate to your dashboard
4. Generate an API key for your project

#### Grok API Key
1. Visit [X AI](https://x.ai/)
2. Sign up for Grok API access
3. Navigate to your developer console
4. Generate an API key for your project
*Note: Currently using mock implementation for testing purposes*

#### CLOVA X API Key
1. Visit [NAVER Cloud Platform](https://www.ncloud.com/)
2. Sign up and access CLOVA Studio
3. Enable CLOVA X API access
4. Generate API credentials from your console
*Note: Currently using mock implementation for testing purposes*

## 🎨 UI/UX Design Philosophy

### Cyberpunk Aesthetic
- **3D ASCII Art**: Three.js-powered dynamic text animations that respond to user interaction
- **Retro-Futuristic Theme**: Matrix-inspired visual effects with flowing code aesthetics
- **Interactive Elements**: Mouse movements trigger particle effects and text transformations
- **Neon Color Palette**: Electric blues, cyans, and greens against dark backgrounds

### Modern Usability
- **Dark Theme Interface**: Reduces eye strain during extended use sessions
- **Navy/Blue Color Scheme**: Conveys trust, reliability, and technological sophistication
- **Responsive Design**: Optimized for desktop, tablet, and mobile viewing
- **Accessibility Features**: High contrast ratios, keyboard navigation, and screen reader support

### Debate Visualization
- **Real-time Flow Charts**: Visual representation of argument progression between AI models
- **Confidence Indicators**: Color-coded reliability meters and percentage displays
- **Interactive Timeline**: Scrub through debate history and see decision evolution
- **Conflict Highlighting**: Visual emphasis on disagreements and consensus points

## 🔄 API Documentation

### Core Endpoints

#### POST /api/ai/query
Submits a question to multiple AI models and returns cross-verification results.

**Request Body:**
```json
{
  "query": "Your question here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "responses": [
      {
        "model": "openai",
        "response": "AI response text",
        "processing_time": 1.2
      }
    ]
  }
}
```

#### GET /api/ai/models
Returns available AI models.

**Response:**
```json
{
  "success": true,
  "data": {
    "models": ["openai", "claude", "gemini", "perplexity", "grok", "clova_x"]
  }
}
```

#### GET /api/health
Returns server health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🧪 Development and Testing

### Development Workflow
```bash
# Backend development with auto-restart
cd backend
set PORT=5001 && npm run dev

# Frontend development server
cd frontend
npm start
```

### Testing Suite
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Production Build
```bash
# Build frontend for production
cd frontend
npm run build

# Start production server
cd backend
npm start
```

## 🤝 Contributing

We welcome contributions to improve AI reliability verification! Here's how to get started:

### Development Setup
1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/AI_Crosscheck_Court.git`
3. **Create branch**: `git checkout -b feature/amazing-feature`
4. **Install dependencies**: `npm install` in both frontend and backend directories
5. **Set up environment**: Copy `.env.example` to `.env` and add your API keys

### Contribution Guidelines
- Follow the existing code style and conventions
- Write tests for new features and bug fixes
- Update documentation for API changes
- Ensure all tests pass before submitting PR
- Use descriptive commit messages

### Areas for Contribution
- **AI Model Integration**: Add support for new AI models
- **Bias Detection**: Improve bias and hallucination detection algorithms
- **UI/UX**: Enhance the debate visualization and user interface
- **Performance**: Optimize response times and resource usage
- **Documentation**: Improve setup guides and API documentation

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🎓 Educational Mission

AI Crosscheck Court serves as an experimental platform exploring "AI Failures and Coexistence":

### Core Principles
- **Transparency First**: Openly expose AI limitations and errors rather than hiding them
- **Collaborative Intelligence**: Demonstrate how multiple AI systems can work together for better outcomes
- **Critical Thinking**: Help users develop skills to critically evaluate AI-generated content
- **Research Advancement**: Contribute to academic research in multi-agent AI systems

### Educational Value
- **AI Literacy**: Teaches users about the capabilities and limitations of different AI models
- **Bias Awareness**: Highlights how different AI systems may exhibit various forms of bias
- **Verification Skills**: Develops critical thinking skills for evaluating AI responses
- **Technology Ethics**: Promotes discussion about responsible AI development and deployment

## 🚀 Future Roadmap

### Phase 1: Core Platform (Current)
- ✅ Multi-AI query system
- ✅ Basic debate visualization
- ✅ Confidence scoring
- 🔄 Enhanced bias detection

### Phase 2: Advanced Features
- 📋 Historical analysis and trends
- 📋 User feedback integration
- 📋 Real-time fact-checking with external sources
- 📋 Advanced debate moderation AI

### Phase 3: Research Platform
- 📋 Academic research tools
- 📋 Dataset generation for AI reliability research
- 📋 Public API for researchers
- 📋 Integration with academic institutions

## 📞 Contact and Support

### Get Help
- 📧 **General Questions**: Create an issue with the `question` label
- 🐛 **Bug Reports**: Use the `bug` label with detailed reproduction steps
- 💡 **Feature Requests**: Submit with the `enhancement` label
- 🔒 **Security Issues**: Email kmou20201305@g.kmou.ac.kr

**🎯 Mission**: Rather than hiding AI failures, we embrace transparency in the verification process to create better AI-human collaboration models for the future.
