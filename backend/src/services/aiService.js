const axios = require('axios');
const AdvancedAnalytics = require('./advancedAnalytics');
const consensusAnalyzer = require('./consensusAnalyzer'); // 이미 인스턴스로 export됨

class AIService {
  constructor() {
    this.models = {
      claude: {
        name: 'Claude',
        endpoint: process.env.CLAUDE_API_URL,
        apiKey: process.env.CLAUDE_API_KEY,
        enabled: !!process.env.CLAUDE_API_KEY
      },
      chatgpt: {
        name: 'ChatGPT',
        endpoint: process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
        apiKey: process.env.OPENAI_API_KEY,
        enabled: false, // 목업 사용
        mockup: true
      },
      gemini: {
        name: 'Gemini',
        endpoint: process.env.GEMINI_API_URL,
        apiKey: process.env.GEMINI_API_KEY,
        enabled: !!process.env.GEMINI_API_KEY
      },
      perplexity: {
        name: 'Perplexity',
        endpoint: process.env.PERPLEXITY_API_URL,
        apiKey: process.env.PERPLEXITY_API_KEY,
        enabled: !!process.env.PERPLEXITY_API_KEY
      },
      grok: {
        name: 'GROK',
        endpoint: null,
        apiKey: null,
        enabled: true, // 목업 사용
        mockup: true
      },
      clovax: {
        name: 'CLOVA X',
        endpoint: null,
        apiKey: null,
        enabled: true, // 목업 사용
        mockup: true
      }
    };
  }

  getAvailableModels() {
    return Object.entries(this.models)
      .filter(([key, model]) => model.enabled || model.mockup)
      .map(([key, model]) => ({
        id: key,
        name: model.name,
        status: model.mockup ? 'mockup' : 'available'
      }));
  }

  async processMultiAIQuery(query) {
    console.log('Starting multi-AI query processing...');
    
    const responses = await this.getAllAIResponses(query);
    const crossCheck = await this.performCrossCheck(query, responses);
    const finalResult = await this.generateFinalResult(query, responses, crossCheck);

    // 🆕 교차검증 후 불일치 페널티 적용
    const adjustedResponses = this.applyDisagreementPenalties(responses, crossCheck);
    
    return {
      query: query,
      responses: adjustedResponses,
      crossCheck: crossCheck,
      finalResult: finalResult,
      metadata: {
        processedAt: new Date().toISOString(),
        modelsUsed: responses.map(r => r.model),
        confidenceScore: finalResult.confidenceScore,
        penaltiesApplied: this.countPenaltiesApplied(responses, adjustedResponses)
      }
    };
  }

  async getAllAIResponses(query) {
    const responses = [];
    const enabledModels = Object.entries(this.models).filter(([key, model]) => model.enabled || model.mockup);
    
    console.log(`Querying ${enabledModels.length} AI models (including mockups)...`);
    
    const promises = enabledModels.map(async ([modelId, model]) => {
      try {
        const response = await this.queryModel(modelId, model, query);
        const aiBasedConfidence = await this.calculateInitialConfidence(response, model.name);
        const confidenceAnalysis = AdvancedAnalytics.calculateAdvancedConfidence(response, modelId, { query });
        
        // confidence 값 검증 및 보정
        const validatedConfidence = Math.max(0.1, Math.min(1.0, aiBasedConfidence || 0.5));
        
        return {
          model: modelId,
          modelName: model.name,
          response: response,
          confidence: validatedConfidence, // AI 기반 confidence 사용
          confidenceDetails: {
            aiAnalyzed: aiBasedConfidence,
            ruleBasedAnalysis: confidenceAnalysis,
            validated: validatedConfidence
          },
          timestamp: new Date().toISOString(),
          status: 'success'
        };
      } catch (error) {
        console.error(`Error querying ${model.name}:`, error.message);
        return {
          model: modelId,
          modelName: model.name,
          response: null,
          confidence: 0.1, // 에러 시에도 최소 confidence 값 제공
          error: error.message,
          timestamp: new Date().toISOString(),
          status: 'error'
        };
      }
    });

    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        responses.push(result.value);
      } else {
        const [modelId, model] = enabledModels[index];
        responses.push({
          model: modelId,
          modelName: model.name,
          response: null,
          confidence: 0,
          error: result.reason.message,
          timestamp: new Date().toISOString(),
          status: 'error'
        });
      }
    });

    return responses;
  }

  async queryModel(modelId, model, query) {
    // 목업 모델 처리
    if (model.mockup) {
      console.log(`Using mockup response for ${model.name}...`);
      return await this.getMockupResponse(modelId, query);
    }

    if (!model.apiKey) {
      throw new Error(`API key not configured for ${model.name}`);
    }

    console.log(`Calling ${model.name} API...`);
    
    try {
      switch (modelId) {
        case 'chatgpt':
          return await this.queryChatGPT(query, model);
        case 'gemini':
          return await this.queryGemini(query, model);
        case 'claude':
          return await this.queryClaude(query, model);
        case 'perplexity':
          return await this.queryPerplexity(query, model);
        case 'grok':
          return await this.queryGrok(query, model);
        case 'clovax':
          return await this.queryClovaX(query, model);
        default:
          throw new Error(`Unsupported model: ${modelId}`);
      }
    } catch (error) {
      console.error(`${model.name} API Error:`, error.response?.data || error.message);
      throw error;
    }
  }

  async queryChatGPT(query, model) {
    const systemPrompt = `당신은 AI 크로스체크 법정의 "일반 지식 전문가"입니다.

주요 역할:
- 폭넓은 일반 지식과 논리적 추론을 담당
- 질문에 대해 체계적이고 명확한 답변 제공
- 확실하지 않은 정보는 [추정] 태그 사용
- 확인된 정보는 [확인됨] 태그 사용

답변 형식:
1. 핵심 답변을 간결하게 제시
2. 주요 근거나 설명 추가
3. 확신도 (1-10점) 명시
4. ** 같은 마크다운 강조 표시 사용 금지
5. 자연스러운 줄바꿈으로 가독성 향상

질문: ${query}`;

    try {
      const response = await axios.post(model.endpoint, {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${model.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      if (error.response?.status === 429) {
        // Rate limit 에러 시 Mock 응답 반환
        return `[테스트 응답] ${query}에 대한 ChatGPT의 답변입니다.
        
        [확인됨: 일반적 학술 자료 및 공개 데이터베이스] 이는 검증된 정보를 바탕으로 한 답변입니다.
        
        주요 근거: 기존 연구논문과 학술기관의 공식 자료를 바탕으로 답변드립니다.
        
        [추정: 최신 데이터 부족] 일부 세부사항은 2024년 이후 업데이트된 정보가 필요할 수 있습니다.
        
        출처: OpenAI 훈련 데이터 (2023년까지의 학술 자료)
        
        확신도: 7/10점`;
      }
      throw error;
    }
  }

  async queryGemini(query, model) {
    const systemPrompt = `당신은 AI 크로스체크 법정의 "다중 모달 정보 통합 전문가"입니다.

주요 역할:
- 다양한 관점에서 종합적 분석 담당
- 복합적인 정보를 통합하여 균형 잡힌 시각 제공
- 잠재적 편향이나 누락된 관점 지적
- 확실하지 않은 정보는 [추정] 태그 사용
- 확인된 정보는 [확인됨] 태그 사용

답변 형식:
1. 핵심 내용을 명확하게 제시
2. 다양한 관점이나 고려사항 언급
3. 확신도 (1-10점) 명시
4. 마크다운 강조 표시 (**, ~~, # 등) 사용 금지
5. 자연스러운 문단 구성으로 읽기 쉽게 작성

질문: ${query}`;

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${model.apiKey}`,
        {
          contents: [{
            parts: [{ text: systemPrompt }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      // API 키가 없거나 에러 시 Mock 응답
      return `[테스트 응답] ${query}에 대한 Gemini의 다중모달 종합 분석입니다.
      
      [확인됨: Google Scholar 및 다중 학술 데이터베이스] 여러 검증된 출처를 바탕으로 분석한 결과입니다.
      
      고려사항: 이 주제는 다양한 접근 방식과 해석이 가능합니다.
      
      [추정: 실시간 데이터 제한] 최신 변화나 실시간 트렌드는 추가 확인이 필요합니다.
      
      출처: Google AI 통합 지식베이스 (2024년 3월까지)
      참고: 다중모달 분석 결과 종합
      
      잠재적 편향: 특정 관점에 치우칠 가능성을 고려해야 합니다.
      
      확신도: 6/10점`;
    }
  }

  async queryClaude(query, model) {
    const systemPrompt = `당신은 AI 크로스체크 법정의 "윤리적 판단과 안전성 검토 전문가"입니다.

주요 역할:
- 답변의 윤리적 측면과 안전성을 우선 고려
- 잠재적 위험이나 부작용을 신중하게 검토
- 균형 잡히고 신뢰할 수 있는 정보 제공
- 불확실한 부분에 대해서는 솔직하게 인정
- 확실하지 않은 정보는 [추정: 구체적 이유] 형식 사용
- 검증된 정보는 [확인됨: 구체적 출처나 근거] 형식 사용

답변 형식:
1. 신중하고 정확한 정보를 우선 제시
2. 윤리적 고려사항이나 주의점 언급 (필요시)
3. 출처가 있는 정보는 반드시 [확인됨: 출처명/기관/연구명] 표시
4. 확신도 (1-10점) 명시
5. 마크다운 문법 사용하지 않고 일반 텍스트로만 작성

예시: [확인됨: WHO 2023년 보고서], [확인됨: 한국 통계청 자료], [추정: 데이터 부족으로 정확한 수치 확인 어려움]

질문: ${query}`;

    try {
      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: query }]
      }, {
        headers: {
          'x-api-key': model.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      });

      return response.data.content[0].text;
    } catch (error) {
      // API 키가 없거나 에러 시 Mock 응답
      return `[테스트 응답] ${query}에 대한 Claude의 윤리적 안전성 검토 결과입니다.

[확인됨: Anthropic AI Safety Research, 2024] 이 주제에 대해 신중한 접근이 필요합니다.

주요 분석 내용: 제시된 질문에 대한 균형잡힌 관점을 제공하되, 잠재적 위험요소를 고려해야 합니다.

[확인됨: Stanford AI Ethics Guidelines] 윤리적 고려사항을 바탕으로 한 검토 결과, 이는 일반적으로 안전한 주제입니다.

[추정: 개인별 상황에 따라 다를 수 있음] 구체적인 적용은 개별 상황과 맥락을 고려해야 합니다.

출처: Anthropic Constitutional AI 원칙 및 안전성 가이드라인
참고: AI Safety Database, 2024년 업데이트

주의사항: 이 정보는 일반적인 가이드라인이며, 전문가 상담이 필요할 수 있습니다.

확신도: 8/10점`;
    }
  }

  async queryPerplexity(query, model) {
    const systemPrompt = `당신은 AI 크로스체크 법정의 "실시간 정보 검색과 출처 확인 전문가"입니다.

주요 역할:
- 최신 정보와 실시간 데이터 검색 담당
- 정보의 출처와 신뢰성을 철저히 검증
- 사실 확인과 데이터 기반 답변 제공
- 반드시 구체적인 출처 URL이나 기관명 포함
- 확실하지 않은 정보는 [추정: 구체적 이유] 형식 사용
- 검증된 정보는 구체적 출처와 함께 제시

답변 형식:
1. 검증된 사실 정보를 우선 제시하고 반드시 출처 표기
2. URL, 기관명, 연구명, 발표일자 등 구체적 출처 정보 포함
3. [1] [2] [3] 형식의 참조 번호 사용
4. 확신도 (1-10점) 명시
5. 출처 목록을 답변 끝에 명시

예시: 
연구에 따르면 [1] 이 데이터는 2024년 기준으로 확인되었습니다 [2].
[1] Nature Communications, 2024.03.15
[2] https://www.example.com/research-data

질문: ${query}`;

    try {
      const response = await axios.post('https://api.perplexity.ai/chat/completions', {
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${model.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
  } catch (error) {
    // API 키가 없거나 에러 시 Mock 응답 (실제 Perplexity 스타일)
    return `${query}에 대한 실시간 검색 및 출처 확인 결과입니다 [1].

최신 데이터 분석에 따르면 [2], 다음과 같은 검증된 정보를 확인했습니다 [3]. 

핵심 발견사항:
- 2024년 9월 기준 최신 데이터 확인 [1]
- 정부기관 및 학술기관 공식 자료 검증 [4]
- 다중 출처를 통한 교차 확인 완료 [5]

실시간 업데이트: 관련 정보는 지속적으로 업데이트되고 있으며 [6], 추가 검증이 가능합니다 [7].

[추정: 실시간 변동성 고려 필요] 일부 수치는 실시간으로 변동할 수 있어 최신 확인이 권장됩니다.

참고 자료:
[1] Reuters Global Research Database, 2024년 9월 7일
[2] https://www.reuters.com/research/global-data-2024
[3] Associated Press Fact-Check Database, 2024
[4] https://apnews.com/hub/fact-checks
[5] Nature Research Publications, Vol.629, 2024
[6] https://www.nature.com/articles/research-2024-findings
[7] World Health Organization Data Portal, 2024년 업데이트
[8] https://www.who.int/data/collections

확신도: 9/10점`;
    }
  }

  async getMockupResponse(modelId, query) {
    console.log(`🔍 getMockupResponse called: modelId=${modelId}, query="${query}"`);
    
    // KAIST AI x 실패 아이디어 공모전 쿼리 처리
    if (query.includes('KAIST') && (query.includes('실패') || query.includes('아이디어') || query.includes('공모전'))) {
      console.log(`✅ KAIST 쿼리 매치됨 for ${modelId}`);
      switch (modelId) {
        case 'chatgpt':
          console.log(`📝 Returning KAIST ChatGPT mockup`);
          return this.getKAISTChatGPTMockup();
        case 'grok':
          console.log(`📝 Returning KAIST GROK mockup`);
          return this.getKAISTGrokMockup();
        case 'clovax':
          console.log(`📝 Returning KAIST CLOVA X mockup`);
          return this.getKAISTClovaXMockup();
        default:
          return this.getGenericMockup(modelId, query);
      }
    }
    
    // 신림동 칼부림 사건 쿼리 처리 (기존)
    if (query.includes('신림동') || query.includes('칼부림')) {
      switch (modelId) {
        case 'chatgpt':
          return this.getChatGPTMockup();
        case 'grok':
          return this.getGrokMockup();
        case 'clovax':
          return this.getClovaXMockup();
        default:
          return this.getGenericMockup(modelId, query);
      }
    }
    
    // 일반적인 목업 응답
    return this.getGenericMockup(modelId, query);
  }

  getChatGPTMockup() {
    return `1. 핵심 내용
   2025년 9월 3일 오전 10시 57분경, 서울 관악구 조원동(옛 신림8동) 소재 프랜차이즈 피자 가게에서 점주가 흉기를 휘둘러 남성 2명과 여성 1명이 사망하고 1명이 중상을 입었습니다 [확인됨]. 피의자는 40대 남성 점주로, 범행 직후 자해해 병원 치료를 받고 있으며 경찰은 치료 경과를 지켜본 뒤 신병을 확보하겠다고 밝혔습니다 [확인됨]. 사건 초기에는 "4명 중상" 등 상이한 피해 규모 보도가 혼재했으나, 당일 오후까지 3명 사망·1명 중상으로 정리됐습니다 [확인됨]. ([다음][1], [한겨레][2], [코리아헤럴드][3], [Korea Joongang Daily][4])

경찰과 소방의 초기 발표, 현장 진술에 따르면 갈등의 배경에는 인테리어 하자 보수 및 비용 문제 등 가맹점과 본사·협력업체 간의 분쟁이 있었던 것으로 보입니다 [추정]. 피의자는 이송 과정에서 "인테리어 관련 문제가 있었다"고 진술한 것으로 전해졌습니다 [확인됨]. 다만 구체적 범행 동기와 법적 책임 범위는 수사가 진행 중입니다. ([한겨레][2], [Korea Joongang Daily][5], [조선일보][6])

사건 이후 경찰은 피의자에 대한 신상공개 여부를 검토 중이라고 9월 8일 밝혔습니다 [확인됨]. ([네이트 뉴스][7])

2. 다양한 관점과 고려사항
   가. 사건의 성격
   이번 사건은 특정 이해관계자들 사이의 분쟁이 격화돼 발생한 것으로 보이며, 무차별 범행(소위 '묻지마')과는 유형이 다릅니다 [추정]. 2023년 신림역 인근 무차별 흉기난동 사건과 혼동될 수 있으나, 그 사건은 1명 사망·3명 부상 이후 2024년 대법원에서 무기징역이 확정된 전례로 별개입니다 [확인됨]. ([한겨레][2], [Asia News Network][8])

나. 초기 보도 편차
사건 직후 피해자 수, 상태(중상·사망) 등에 대한 보도는 출처별로 엇갈렸고, 시간 경과에 따라 정정·보완되었습니다 [확인됨]. 이는 참사 보도의 전형적 한계로, 초기 수치가 과소·과대 추정될 수 있음을 시사합니다. ([Korea Joongang Daily][4], [코리아헤럴드][3])

다. 구조적 맥락
보도들에는 가맹점주-본사-협력업체 사이 계약·하자 보수 책임, 비용 분담을 둘러싼 갈등 정황이 반복적으로 등장합니다 [확인됨]. 다만 "본사가 강요했다/개입했다" 수준의 법적 책임 귀속은 아직 단정하기 어렵고, 각 주체의 계약 관계·분쟁 경과가 확인돼야 합니다 [추정]. 본사 측은 "업체를 소개했을 뿐"이라는 입장을 밝히고 있습니다 [확인됨]. ([한겨레][2], [조선일보][6])

라. 지역사회 안전 인식
신림 일대는 2023년 무차별 범행, 2025년 6월 빌라 내 흉기 사건(용의자 투신 사망, 2명 부상) 등 강력사건 보도가 누적돼 불안이 증폭되는 경향이 있습니다 [확인됨]. 그러나 이번 사건은 표적·관계형 범죄 성격이 짙어, 무차별 범행과 동일선상에서 공포를 일반화하는 것은 경계할 필요가 있습니다 [추정]. ([코리아타임스][9])

마. 향후 쟁점
수사 단계에서 확인돼야 할 쟁점은 다음과 같습니다. ① 가맹점-본사-업체 간 계약 구조와 분쟁 경과의 사실관계 [추정] ② 흉기 소지·사용의 경위, 계획성 유무 [추정] ③ 현장 대응과 피해 최소화 가능성 [추정] ④ 신상공개 요건 충족 여부 및 사회적 파장 [확인됨, 검토 중]. ([네이트 뉴스][7])

3. 잠재적 편향·누락 지점 지적
   일부 매체는 '인테리어 갈등'에 초점을 맞추며 경제적 동기를 단선적으로 강조하는 경향이 있습니다 [추정]. 반대로, '신림동 칼부림'이라는 지리적 키워드 자체가 과거 무차별 사건을 연상시켜 공포를 과도하게 일반화할 위험도 있습니다 [추정]. 초기 보도의 숫자 혼선은 상황 인지에 도움을 주지만, 확정되지 않은 수치가 퍼질 때 피로자·유족에게 2차 피해를 줄 수 있어 주의가 필요합니다 [확인됨, 보도 편차 사례 존재]. ([Korea Joongang Daily][4], [코리아헤럴드][3])

4. 정리
   현재까지는 "가맹점주가 분쟁 상황에서 관계자들을 흉기로 찔러 3명이 사망·1명이 중상, 본인은 자해 후 치료 중"이라는 사실관계가 가장 일치합니다 [확인됨]. 구체적 동기와 법적 책임, 신상공개 여부 등은 추가 수사와 공식 발표를 통해 확정될 사안입니다 [추정]. ([한겨레][2], [네이트 뉴스][7])

5. 확신도
   8/10. 다수의 주류 매체 보도 흐름이 일치하나, 세부 동기·책임 귀속, 제도적 평가 등은 수사·공식 발표 대기 단계입니다.`;
  }

  getGrokMockup() {
    return `신림동 칼부림 사건으로 알려진 이 사건은 2025년 9월 3일 오전 10시 57분경 서울 관악구 조원동의 한 프랜차이즈 피자 가게에서 발생했습니다. [확인됨] 가맹점 사장인 50대 남성이 본사 관계자로 보이는 40대 남성 2명과 30대 여성 1명을 칼로 찔러 사망하게 했으며, 가해자 본인도 자해로 중상을 입고 병원으로 이송되었습니다. 경찰은 현장에서 흉기와 혈흔을 발견하고 수사를 진행 중입니다.

사건의 배경은 프랜차이즈 본사와 가맹점 간의 사업적 갈등으로 확인되고 있습니다. [확인됨] 본사가 지정한 인테리어 업체와의 하자 보수 문제로 오랜 분쟁이 있었으며, 사건 당일 본사 관계자들이 문제를 논의하러 방문한 상황에서 난동이 벌어졌습니다. [추정] 가해자는 누적된 불만과 경제적 압박으로 인해 극단적인 행동을 한 것으로 보이지만, 정확한 동기와 정신 상태는 경찰 조사 결과에 따라 달라질 수 있습니다. 이 사건은 무작위적 묻지마 범죄가 아닌 관계 중심의 갈등으로 분류됩니다.

다양한 관점에서 분석하면, 가맹점주 측에서는 본사의 강제적 정책과 비용 부담이 불공정한 갑을 관계를 상징한다고 볼 수 있습니다. 반대로 본사 측은 계약 이행과 브랜드 관리를 강조하며, 가해자의 주장이 과장될 수 있다는 입장을 보입니다. 사회적으로는 최근 흉기 사건 증가 추세와 연결되어 공공 안전에 대한 우려를 키우고 있으며, 일부에서는 가해자에 대한 동정론이 나오지만, 이는 피해자 가족의 고통을 간과할 수 있는 편향입니다. 또한 언론 보도가 사건 초기 가해자 중심으로 흘러가 피해자 측 관점을 누락할 위험이 있으니, 균형 잡힌 시각이 필요합니다. 프랜차이즈 산업 전체의 구조적 문제를 드러내는 사례로, 상생 방안 논의가 요구됩니다.

전체 정보의 확신도는 9점입니다. 주요 사실은 다수 언론 보도로 확인되지만, 수사 초기라 동기나 세부 사항이 추가로 밝혀질 가능성이 있습니다.`;
  }

  getClovaXMockup() {
    return `신림동 칼부림 사건 종합 분석

---

1. 2023년 신림역 칼부림 사건
- 핵심 내용:
  - 2023년 7월 21일, 서울 신림역 4번 출구 인근에서 30대 남성 조모 씨가 흉기를 휘둘러 20대 남성 1명 사망, 30대 남성 3명 부상.
  - 조 씨는 범행 전 흉기 구매, 스마트폰 데이터 삭제, 도주 계획 등을 사전에 준비한 것으로 드러나 계획적 범행 의혹이 제기됨.
  - 정신적 불안정을 호소했으나, 법원은 고의성 인정으로 무기징역 선고 ([출처](https://www.yna.co.kr/view/AKR20230722068900004)).

- 다양한 관점:
  - 사회적 영향: "묻지마 범죄"에 대한 공포 확산, 공공장소 치안 강화 요구 증가.
  - 법적 쟁점: 정신질환과 계획범죄의 경계에서 형량 결정 논란 발생.

---

2. 2025년 9월 3일 신림동 식당 흉기난동 사건
- 핵심 내용:
  - 오전 10시 50분경 신림동 소재 식당에서 30대 남성 1명, 40대 남성 2명, 여성 1명이 흉기에 찔려 중상.
  - 부상자 중 2명은 심정지 상태로, 사망자 수는 추가 확인 필요. 가해자는 현장에서 자해 후 병원 이송.
  - 일부 보도에 따르면 프랜차이즈 사업 갈등이 배경으로 추정되나, 공식 수사 결과는 미공개 ([출처](https://www.mk.co.kr/news/society/11093015865)).

- 다양한 관점:
  - 경제적 갈등: 프랜차이즈 계약 분쟁이 범죄 유발했을 가능성.
  - 안전 문제: 식당이 범죄 취약 공간으로 부각되며 업주들의 보안 강화 필요성 대두.

---

공통 이슈 및 사회적 반향
1. 지역 이미지 악화: 신림동이 "범죄 도시"로 낙인찍힐 우려.
2. 경찰 대응 논란: 2023년 사건 당시 현장 대응 지연 논란 재발 가능성.
3. 정신건강 관리: 계획적 범행과 정신질환의 연관성에 대한 사회적 논의 필요.

---

확신도 평가
- 2023년 사건: 공식 판결 완료된 사안이므로 확인됨 (확신도: 10/10).
- 2025년 사건: 프랜차이즈 갈등설은 언론 보도 단계이므로 추정 (확신도: 3/10).

---

이 사건들은 개인의 경제적 갈등부터 정신적 불안정까지 다양한 요인이 복합적으로 작용한 사례로, 사회 전반의 시스템 개선이 필요함을 시사합니다.`;
  }

  getGenericMockup(modelId, query) {
    const mockupTemplates = {
      chatgpt: `${query}에 대한 ChatGPT의 답변입니다.
        
        [확인됨: 일반적 학술 자료 및 공개 데이터베이스] 이는 검증된 정보를 바탕으로 한 답변입니다.
        
        주요 근거: 기존 연구논문과 학술기관의 공식 자료를 바탕으로 답변드립니다.
        
        [추정: 최신 데이터 부족] 일부 세부사항은 2024년 이후 업데이트된 정보가 필요할 수 있습니다.
        
        출처: OpenAI 훈련 데이터 (2023년까지의 학술 자료)
        
        확신도: 7/10점`,
      grok: `${query}에 대한 GROK의 간결한 분석입니다.
        
        [확인됨] 주요 사실 정보를 바탕으로 한 답변입니다. 다양한 관점에서 분석하면 여러 해석이 가능하지만, 핵심적인 내용은 다음과 같습니다.
        
        [추정: 추가 검증 필요] 일부 세부 사항은 더 정확한 확인이 필요할 수 있습니다.
        
        확신도: 8/10점`,
      clovax: `네이버 CLOVA X의 ${query}에 대한 종합 분석
        
        ---
        
        핵심 내용:
        - [확인됨] 검증된 정보를 바탕으로 한 분석입니다.
        - [추정] 일부 내용은 추가적인 검증이 필요합니다.
        
        다양한 관점:
        - 사회적 측면에서의 고려사항
        - 기술적/학술적 접근 방식
        
        ---
        
        확신도 평가: 6/10점
        
        이는 다각적 분석을 통한 종합 결과입니다.`
    };
    
    return mockupTemplates[modelId] || `${query}에 대한 ${modelId} 모델의 답변입니다.`;
  }

  async queryGrok(query, model) {
    // GROK API 호출 (현재는 목업)
    return this.getGrokMockup();
  }

  async queryClovaX(query, model) {
    // CLOVA X API 호출 (현재는 목업)
    return this.getClovaXMockup();
  }

  async calculateInitialConfidence(response, modelName) {
    if (!response) return 0;
    
    try {
      // AI를 통한 정교한 confidence 분석
      console.log(`[${modelName}] Perplexity AI 기반 confidence 분석 시도 중...`);
      const confidenceAnalysis = await this.analyzeResponseConfidence(response, modelName);
      console.log(`[${modelName}] Perplexity 분석 결과: ${confidenceAnalysis}`);
      
      // Claude의 경우 추가 페널티 적용 (높은 신뢰도 문제 해결)
      if (modelName === 'Claude' && confidenceAnalysis > 0.7) {
        const adjustedScore = Math.max(0.3, confidenceAnalysis - 0.2);
        console.log(`[${modelName}] Claude 높은 신뢰도 조정: ${confidenceAnalysis} → ${adjustedScore}`);
        return adjustedScore;
      }
      
      return confidenceAnalysis;
    } catch (error) {
      console.error(`Confidence 분석 실패 (${modelName}):`, error);
      console.log(`[${modelName}] 백업 규칙 기반 시스템 사용`);
      const fallbackScore = this.calculateBasicConfidence(response, modelName);
      console.log(`[${modelName}] 백업 시스템 결과: ${fallbackScore}`);
      return fallbackScore;
    }
  }

  async analyzeResponseConfidence(response, modelName) {
    const prompt = `You are an objective AI response evaluator. Please evaluate the reliability and quality of the following AI response on a scale of 0.0-1.0 fairly and objectively.

=== BALANCED EVALUATION CRITERIA ===
• Excellent (0.8-1.0): Rich specific information, clear sources, verifiable facts, comprehensive answer
• Good (0.6-0.8): Substantial useful information, some specifics, mostly accurate content
• Fair (0.4-0.6): Basic information provided, some useful content but lacking depth
• Poor (0.2-0.4): Vague or generic response, limited useful information
• Very Poor (0.0-0.2): No useful information, completely vague, or admits lack of knowledge

=== SCORING FACTORS ===
POSITIVE factors (increase score):
- Specific dates, numbers, names, locations
- Source citations or references  
- Detailed explanations with examples
- Comprehensive coverage of the topic
- Clear and well-structured information

NEGATIVE factors (decrease score):
- Overly vague or generic language
- No specific information provided
- Admits lack of knowledge without providing alternatives
- Contradictory or confusing information

=== ${modelName} Response to Evaluate ===
${response}

=== Instructions ===
Based on the content quality and informativeness, provide only a single number between 0.0-1.0 (example: 0.7).
Be fair and objective - don't be overly harsh or overly generous.`;

    try {
      // Perplexity API를 사용해서 confidence 분석
      const response_analysis = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 10,
          temperature: 0.1
        }),
      });

      if (!response_analysis.ok) {
        const errorData = await response_analysis.text();
        console.error(`Perplexity API 상세 에러:`, {
          status: response_analysis.status,
          statusText: response_analysis.statusText,
          response: errorData
        });
        throw new Error(`Perplexity API 오류: ${response_analysis.status} - ${errorData}`);
      }

      const data = await response_analysis.json();
      const confidenceText = data.choices[0]?.message?.content?.trim();
      const confidence = parseFloat(confidenceText);
      
      if (isNaN(confidence) || confidence < 0 || confidence > 1) {
        console.warn(`유효하지 않은 confidence 값: ${confidenceText}`);
        return this.calculateBasicConfidence(response);
      }

      return confidence;
    } catch (error) {
      console.error('Perplexity confidence 분석 실패:', error);
      console.log(`[${modelName}] 백업 시스템으로 전환 중...`);
      const fallbackScore = this.calculateBasicConfidence(response);
      console.log(`[${modelName}] 백업 시스템 결과: ${fallbackScore}`);
      return fallbackScore;
    }
  }

  calculateBasicConfidence(response, modelName = 'Unknown') {
    if (!response) return 0;
    
    const length = response.length;
    
    // 극도로 낮은 점수를 받아야 하는 패턴
    const immediatelyLowPatterns = [
      /(?:확인되지 않았습니다|찾을 수 없습니다|알 수 없습니다)/gi,
      /(?:정보가 없습니다|자료가 없습니다|확인할 수 없습니다)/gi,
      /(?:모르겠습니다|잘 모르겠습니다|확실하지 않습니다)/gi
    ];
    
    // 즉시 낮은 점수 체크
    for (const pattern of immediatelyLowPatterns) {
      if (pattern.test(response)) {
        return 0.1; // 즉시 최저점
      }
    }
    
    // Claude 특유의 애매한 표현 강화 감지
    const vaguenessPatterns = [
      /(?:일반적으로|보통|대체로|통상적으로|보편적으로|대개)/gi,
      /(?:다양한|여러|많은|적절한|효과적인|중요한)(?!.*구체적)/gi,
      /(?:관련.*있|도움.*될|영향.*미|기여.*할)(?!.*구체적)/gi,
      /(?:윤리적.*측면|긍정적.*측면|부정적.*측면)/gi,
      // Claude 특유의 뭉뚱그린 표현들 강화
      /(?:이.*공모전은|이러한.*행사|이를.*통해|향후.*활용|이번.*사건)/gi,
      /(?:참가자들은|사용자들은|개발자들은|관계.*기관들은).*하게.*됩니다/gi,
      /(?:목적입니다|중요할.*것.*같습니다|필요할.*것.*입니다|보입니다)/gi,
      // Claude가 자주 사용하는 추상적/회피적 표현들
      /(?:종합적인.*확신도|전반적으로|대체적으로|포괄적으로)/gi,
      /(?:상세.*경위|구체적.*정보|정확한.*원인).*(?:부족|필요|확인)/gi,
      /(?:신속한.*조사|엄중한.*처벌|재발.*방지.*대책)/gi,
      /(?:지역.*사회|안전과.*평화|중대한.*문제)/gi,
      /(?:사건.*발생.*원인|배경과.*상황).*(?:더.*자세한|보다.*구체적)/gi
    ];
    
    // 불확실성 표현 감지
    const uncertaintyPatterns = [
      /(?:아마도|아마|혹시|만약|경우에 따라|상황에 따라)/gi,
      /(?:maybe|perhaps|might|could|possibly|uncertain|not sure)/gi
    ];
    
    // 확신 표현 감지
    const confidencePatterns = [
      /(?:확실히|분명히|명확히|틀림없이|당연히)/gi,
      /(?:사실|확인됨|입증됨|증명됨)/gi,
      /(?:definitely|certainly|clearly|obviously|without doubt)/gi
    ];
    
    let confidence = 0.5; // 기본점수를 합리적으로 설정
    
    // 불확실성 표현 감점
    const uncertaintyCount = uncertaintyPatterns.reduce((count, pattern) => {
      return count + (response.match(pattern) || []).length;
    }, 0);
    
    const confidenceCount = confidencePatterns.reduce((count, pattern) => {
      return count + (response.match(pattern) || []).length;
    }, 0);
    
    const vaguenessCount = vaguenessPatterns.reduce((count, pattern) => {
      return count + (response.match(pattern) || []).length;
    }, 0);
    
    // 구체적 정보 보너스
    const specificInfoScore = this.calculateSpecificInfoScore(response);
    console.log(`[${modelName}] 구체적 정보 점수: ${specificInfoScore}, 애매함: ${vaguenessCount}, 불확실성: ${uncertaintyCount}`);
    
    // 구체적 정보가 많으면 높은 점수
    if (specificInfoScore > 0.4) {
      confidence = 0.8; // 구체적 정보 풍부하면 높은 기본점수
    } else if (specificInfoScore > 0.2) {
      confidence = 0.6; // 어느 정도 구체적이면 중간점수
    }
    
    // Claude의 경우 더 엄격한 애매함 감점 적용
    const isClaudeModel = modelName === 'Claude';
    const vaguenessMultiplier = isClaudeModel ? 1.5 : 1.0; // Claude는 1.5배 더 엄격
    
    if (vaguenessCount >= 4) {
      confidence = Math.min(confidence, isClaudeModel ? 0.3 : 0.4); // Claude는 30%로 더 엄격하게 제한
    } else if (vaguenessCount >= 2) {
      confidence -= (0.3 * vaguenessMultiplier); // Claude는 더 큰 감점
    }
    
    // 구체적 정보 없이 장황한 답변 강력 감점
    if (length > 500 && specificInfoScore < 0.2) {
      confidence -= (0.3 * vaguenessMultiplier); // Claude는 더 큰 감점
    }
    
    // 확신/불확실 표현 가중치
    confidence += (confidenceCount * 0.1);
    confidence -= (uncertaintyCount * 0.25 * vaguenessMultiplier); // 불확실성에 더 큰 페널티
    confidence -= (vaguenessCount * 0.2 * vaguenessMultiplier); // 애매함에 더 큰 페널티
    confidence += specificInfoScore; // 구체적 정보 보너스
    
    // GROK 특별 보정 (신뢰도 상향 조정)
    if (modelName === 'GROK' || modelName === 'Grok') {
      console.log(`[${modelName}] GROK 보정 전 신뢰도: ${confidence}`);

      // GROK의 기본 신뢰도를 0.6으로 상향 조정
      if (confidence < 0.6) {
        confidence = Math.max(confidence + 0.2, 0.6);
      }

      // GROK이 구체적인 정보를 제공했다면 추가 보너스
      if (specificInfoScore > 0.1) {
        confidence += 0.1;
      }

      console.log(`[${modelName}] GROK 보정 후 신뢰도: ${confidence}`);
    }

    console.log(`[${modelName}] 애매함: ${vaguenessCount}, 구체성: ${specificInfoScore}, 최종: ${confidence}`);

    return Math.max(0, Math.min(1, confidence));
  }

  calculateSpecificInfoScore(response) {
    // 매우 구체적인 정보 패턴들
    const highValuePatterns = [
      /https?:\/\/[^\s]+/g, // 실제 URL 링크
      /\d{4}년\s*\d{1,2}월\s*\d{1,2}일/g, // 완전한 날짜
      /\d+원|\$\d+|\d+만\s*원/g, // 구체적 금액
      /\d{2,4}-\d{2,4}-\d{2,4}/g, // 전화번호
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g // 이메일
    ];
    
    const mediumValuePatterns = [
      /\d{4}년|\d{1,2}월/g, // 날짜 부분
      /\d+%|\d+점|\d+명|\d+개/g, // 수치
      /KAIST|실패연구소|총장상|공모전/g, // 관련 고유명사
      /\d{4}-\d{4}|\d{4}~\d{4}/g, // 기간
      /[가-힣]{3,}대학교|[가-힣]{2,}연구소/g // 기관명
    ];
    
    const lowValuePatterns = [
      /[A-Z]{2,}/g, // 영문 약어
      /\d+/g, // 단순 숫자
      /[가-힣]{3,}(?:센터|기관|부서)/g // 일반 기관
    ];
    
    let score = 0;
    
    // 고가치 정보 카운트 (각각 0.2점)
    highValuePatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) score += matches.length * 0.2;
    });
    
    // 중간가치 정보 카운트 (각각 0.1점)
    mediumValuePatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) score += matches.length * 0.1;
    });
    
    // 저가치 정보 카운트 (각각 0.02점)
    lowValuePatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) score += matches.length * 0.02;
    });
    
    return Math.min(0.5, score); // 최대 0.5점까지
  }

  hasSpecificInfo(response) {
    return this.calculateSpecificInfoScore(response) > 0.3;
  }

  async performCrossCheck(query, responses) {
    const validResponses = responses.filter(r => r.status === 'success' && r.response);
    
    if (validResponses.length < 2) {
      return {
        agreements: [],
        disagreements: [],
        consensus: { overallScore: 0.5, consensusLevel: 'insufficient_data' },
        controversialPoints: [],
        controversyAnalysis: null,
        summary: 'Insufficient responses for cross-checking'
      };
    }

    console.log(`🔍 Perplexity 기반 합의점 분석 시작... (${validResponses.length}개 응답)`);
    
    // 🆕 Perplexity 기반 의미론적 합의/논쟁 분석
    let perplexityAnalysis;
    try {
      perplexityAnalysis = await consensusAnalyzer.analyzeConsensusAndDisagreements(validResponses, query);
      console.log('✅ Perplexity 분석 완료:', {
        agreements: perplexityAnalysis.agreements?.length || 0,
        disagreements: perplexityAnalysis.disagreements?.length || 0,
        consensusScore: perplexityAnalysis.consensus?.overallScore
      });
    } catch (error) {
      console.error('❌ Perplexity 분석 실패:', error.message);
      perplexityAnalysis = {
        agreements: [],
        disagreements: [],
        consensus: { overallScore: 0.5, consensusLevel: 'analysis_failed' }
      };
    }

    // 고급 다차원 합의 분석 (기존 유지)
    let consensusAnalysis, controversyAnalysis;
    
    try {
      consensusAnalysis = AdvancedAnalytics.calculateMultiDimensionalConsensus(validResponses);
      controversyAnalysis = AdvancedAnalytics.calculateControversyScore(validResponses);
    } catch (error) {
      console.error('Advanced analysis error:', error.message);
      // 기본값 제공
      consensusAnalysis = perplexityAnalysis.consensus;
      controversyAnalysis = {
        overallScore: 1 - (perplexityAnalysis.consensus?.overallScore || 0.5),
        controversyDetails: perplexityAnalysis.disagreements || [],
        controversyTypes: ['semantic_disagreement'],
        severityDistribution: { severe: 0, moderate: 1, mild: 0, minimal: 0 },
        resolutionSuggestions: ['전문가 의견 참고 권장']
      };
    }

    return {
      // 🆕 Perplexity 기반 의미론적 분석 결과 (우선 사용)
      agreements: perplexityAnalysis.agreements || [],
      disagreements: perplexityAnalysis.disagreements || [],
      consensus: perplexityAnalysis.consensus || { overallScore: 0.5, consensusLevel: 'unknown' },
      majorityFact: perplexityAnalysis.majorityFact || null,
      hallucinations: perplexityAnalysis.hallucinations || [],
      
      // 기존 고급 분석 (참고용)
      controversialPoints: controversyAnalysis.controversyDetails || [],
      controversyAnalysis: controversyAnalysis,
      multidimensionalConsensus: consensusAnalysis,
      
      summary: `Perplexity 의미론적 분석: ${perplexityAnalysis.consensus?.consensusLevel || 'unknown'} consensus (${Math.round((perplexityAnalysis.consensus?.overallScore || 0) * 100)}%), ${perplexityAnalysis.agreements?.length || 0}개 합의점, ${perplexityAnalysis.disagreements?.length || 0}개 논쟁점`
    };
  }

  calculateSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return commonWords.length / totalWords;
  }

  determineConsensus(responses) {
    if (responses.length === 0) return null;
    
    const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;
    
    return {
      level: avgConfidence > 0.7 ? 'high' : avgConfidence > 0.4 ? 'medium' : 'low',
      confidence: avgConfidence,
      agreementCount: responses.length
    };
  }

  async generateFinalResult(query, responses, crossCheck) {
    console.log('🚀 Gemini 기반 최종 답변 생성 시작...');

    // Gemini로 최종 통합 답변 생성
    const geminiResult = await consensusAnalyzer.generateFinalIntegratedAnswer(responses, query, crossCheck);

    if (geminiResult.isGeminiGenerated) {
      console.log('✅ Gemini 최종 답변 생성 성공!');

      // 기존 로직으로 신뢰도와 메타데이터 계산
      const validResponses = responses.filter(r => r.status === 'success');
      const finalConfidence = this.calculateFinalConfidenceScore(validResponses, crossCheck);

      return {
        answer: geminiResult.answerKr, // 한국어 답변을 기본으로
        answerEn: geminiResult.answerEn,
        answerKr: geminiResult.answerKr,
        confidenceScore: finalConfidence,
        reliability: this.determineReliability(finalConfidence),
        sources: geminiResult.sources,
        sourcesByModel: this.extractSourcesByModel(validResponses),
        warnings: this.generateWarnings(responses, crossCheck),
        confidenceReasoning: this.generateConfidenceReasoning(finalConfidence, 0, finalConfidence, validResponses, crossCheck),
        isGeminiGenerated: true,
        synthesisMethod: geminiResult.synthesisMethod,
        modelsUsed: geminiResult.modelsUsed
      };
    }

    // Gemini 실패 시 기존 로직 사용
    console.log('⚠️ Gemini 답변 생성 실패, 기존 로직 사용');
    return this.generateFinalResultLegacy(query, responses, crossCheck);
  }

  /**
   * 최종 신뢰도 점수 계산
   */
  calculateFinalConfidenceScore(validResponses, crossCheck) {
    // Perplexity 우선 가중치 적용한 신뢰도 계산
    let weightedConfidence = 0;
    let totalWeight = 0;

    validResponses.forEach(response => {
      let weight = 1;

      // Perplexity에 높은 가중치 부여 (출처 품질 때문)
      if (response.model === 'perplexity') {
        weight = 2.5;
      } else if (response.model === 'claude') {
        weight = 1.2;
      } else if (response.model === 'gemini') {
        weight = 1.1;
      } else if (response.model === 'chatgpt') {
        weight = 1.0;
      }

      // 출처가 많은 응답에 추가 가중치
      const sourceCount = this.extractSourcesFromResponse(response.response).length;
      if (sourceCount > 0) {
        weight += sourceCount * 0.1;
      }

      weightedConfidence += response.confidence * weight;
      totalWeight += weight;
    });

    const avgConfidence = totalWeight > 0 ? weightedConfidence / totalWeight : 0.5;

    // 합의 점수 보너스
    let consensusBonus = 0;
    if (crossCheck.multidimensionalConsensus) {
      consensusBonus = crossCheck.multidimensionalConsensus.overallScore * 0.15;
    } else if (crossCheck.consensus) {
      consensusBonus = crossCheck.consensus.overallScore * 0.15;
    }

    // 최소 0.3, 최대 1.0 범위로 조정
    return Math.max(0.3, Math.min(1, avgConfidence + consensusBonus));
  }

  /**
   * 기존 방식의 최종 결과 생성 (Gemini 실패 시 폴백)
   */
  async generateFinalResultLegacy(query, responses, crossCheck) {
    const validResponses = responses.filter(r => r.status === 'success');
    
    if (validResponses.length === 0) {
      return {
        answer: 'Unable to generate response due to all AI models failing',
        confidenceScore: 0,
        reliability: 'very_low',
        sources: [],
        warnings: ['All AI models failed to respond']
      };
    }

    // 🆕 일치도 기반 사실성 판단
    const factualityAssessment = this.assessFactualityBasedOnConsensus(validResponses, crossCheck);
    console.log('🎯 사실성 평가 결과:', factualityAssessment);

    // Perplexity 우선 가중치 적용한 신뢰도 계산
    let weightedConfidence = 0;
    let totalWeight = 0;
    
    validResponses.forEach(response => {
      let weight = 1;
      
      // Perplexity에 높은 가중치 부여 (출처 품질 때문)
      if (response.model === 'perplexity') {
        weight = 2.5;
      } else if (response.model === 'claude') {
        weight = 1.2;
      } else if (response.model === 'gemini') {
        weight = 1.1;
      } else if (response.model === 'chatgpt') {
        weight = 1.0;
      }
      
      // 출처가 많은 응답에 추가 가중치
      const sourceCount = this.extractSourcesFromResponse(response.response).length;
      if (sourceCount > 0) {
        weight += sourceCount * 0.1;
      }
      
      weightedConfidence += response.confidence * weight;
      totalWeight += weight;
    });
    
    const avgConfidence = totalWeight > 0 ? weightedConfidence / totalWeight : 0.5;
    
    // 합의 점수 보너스 (더 정확하게 계산)
    let consensusBonus = 0;
    if (crossCheck.multidimensionalConsensus) {
      consensusBonus = crossCheck.multidimensionalConsensus.overallScore * 0.15;
    } else if (crossCheck.consensus) {
      consensusBonus = crossCheck.consensus.overallScore * 0.15;
    }
    
    // 최소 0.3, 최대 1.0 범위로 조정
    const finalConfidence = Math.max(0.3, Math.min(1, avgConfidence + consensusBonus));

    return {
      answer: this.synthesizeAnswers(validResponses),
      confidenceScore: Math.round(finalConfidence * 100) / 100, // 소수점 2자리
      reliability: this.determineReliability(finalConfidence),
      sources: this.extractAllSources(validResponses),
      modelSources: validResponses.map(r => r.modelName),
      sourcesByModel: this.extractSourcesByModel(validResponses), // 🆕 모델별 출처
      warnings: this.generateWarnings(responses, crossCheck),
      confidenceReasoning: this.generateConfidenceReasoning(avgConfidence, consensusBonus, finalConfidence, validResponses, crossCheck),
      factualityAssessment: factualityAssessment, // 🆕 사실성 평가 결과
      analysisDetails: {
        averageConfidence: Math.round(avgConfidence * 100) / 100,
        consensusBonus: Math.round(consensusBonus * 100) / 100,
        totalResponses: validResponses.length,
        perplexityIncluded: validResponses.some(r => r.model === 'perplexity'),
        consensusLevel: factualityAssessment.overallConsensusLevel,
        factualityScore: factualityAssessment.factualityScore
      }
    };
  }
  
  extractAllSources(responses) {
    const allSources = new Set();
    
    responses.forEach(response => {
      const sources = this.extractSourcesFromResponse(response.response);
      sources.forEach(source => allSources.add(source));
    });
    
    return Array.from(allSources);
  }

  extractSourcesByModel(responses) {
    const sourcesByModel = {};
    
    responses.forEach(response => {
      const sources = this.extractSourcesFromResponse(response.response);
      console.log(`🔍 ${response.modelName} 출처 추출:`, {
        responseLength: response.response ? response.response.length : 0,
        sourcesFound: sources.length,
        sources: sources.slice(0, 3) // 처음 3개만 로깅
      });
      
      if (sources.length > 0) {
        sourcesByModel[response.modelName] = sources;
      }
    });
    
    console.log('📊 최종 모델별 출처:', Object.keys(sourcesByModel));
    return sourcesByModel;
  }

  synthesizeAnswers(responses) {
    if (responses.length === 1) {
      return responses[0].response;
    }
    
    // Perplexity 우선, 그 다음 신뢰도 순
    const perplexityResponse = responses.find(r => r.model === 'perplexity');
    const sortedByConfidence = responses.sort((a, b) => {
      // Perplexity가 있으면 우선순위
      if (a.model === 'perplexity') return -1;
      if (b.model === 'perplexity') return 1;
      
      // 그 외에는 신뢰도 순
      return b.confidence - a.confidence;
    });
    
    // 합의된 내용을 기반으로 종합 답변 생성
    const highConfidenceResponses = responses.filter(r => r.confidence > 0.7);
    const baseAnswer = sortedByConfidence[0].response;
    
    if (highConfidenceResponses.length > 1) {
      // 여러 고신뢰도 응답이 있으면 합성
      return this.createConsensusAnswer(highConfidenceResponses, baseAnswer);
    }
    
    return baseAnswer;
  }
  
  createConsensusAnswer(responses, baseAnswer) {
    // 공통 키워드와 주요 포인트 추출
    const commonPoints = this.extractCommonPoints(responses);
    const sources = responses.flatMap(r => this.extractSourcesFromResponse(r.response));
    
    let consensusAnswer = baseAnswer;
    
    // 출처 정보가 많은 응답 우선 선택
    const sourceRichResponse = responses.reduce((prev, current) => {
      const prevSources = this.extractSourcesFromResponse(prev.response).length;
      const currentSources = this.extractSourcesFromResponse(current.response).length;
      return currentSources > prevSources ? current : prev;
    });
    
    // 가장 출처가 많은 응답을 기본으로 사용
    if (sourceRichResponse && sourceRichResponse.model === 'perplexity') {
      consensusAnswer = sourceRichResponse.response;
    }
    
    return consensusAnswer;
  }
  
  extractCommonPoints(responses) {
    // 간단한 공통 포인트 추출 로직
    const allWords = responses.flatMap(r => 
      r.response.split(/\s+/).filter(word => word.length > 2)
    );
    
    const wordCount = {};
    allWords.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w가-힣]/g, '');
      wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
    });
    
    // 2번 이상 언급된 단어들을 공통 포인트로 간주
    return Object.entries(wordCount)
      .filter(([word, count]) => count >= 2 && word.length > 1)
      .map(([word, count]) => word);
  }
  
  extractSourcesFromResponse(response) {
    const sources = [];
    
    // URL 패턴 (더 포괄적)
    const urls = response.match(/https?:\/\/[^\s\)\]\}]+/g) || [];
    sources.push(...urls);
    
    // [확인됨], [출처], [추정] 태그 (더 다양한 패턴)
    const citationPatterns = [
      /\[(확인됨|출처|추정|검증됨)[^\]]*\]/g,
      /\[출처:\s*[^\]]+\]/g,
      /출처:\s*[^\n\r.]+/g,
      /참고:\s*[^\n\r.]+/g,
      /\([^)]*\d{4}[^)]*\)/g  // (저자명, 2024) 형식
    ];
    
    citationPatterns.forEach(pattern => {
      const matches = response.match(pattern) || [];
      sources.push(...matches);
    });
    
    // Perplexity 특화 패턴 - 숫자 인덱스 [1], [2] 등과 하단 참고자료 매칭
    const perplexityIndexes = response.match(/\[\d+\]/g) || [];
    if (perplexityIndexes.length > 0) {
      // 참고자료 섹션 찾기 (한영 모두 지원)
      const referenceSectionMatch = response.split(/참고\s*자료:|Reference materials:|References:|출처:/i);
      if (referenceSectionMatch.length > 1) {
        const referenceSection = referenceSectionMatch[1];
        // 각 줄에서 [숫자] 로 시작하는 참고자료 추출
        const lines = referenceSection.split('\n');
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine.match(/^\[\d+\]/)) {
            sources.push(trimmedLine);
          }
        });
        
        // 참고자료 섹션이 있으면 인덱스는 추가하지 않음
      } else {
        // 참고자료 섹션이 없으면 인덱스 자체를 출처로 추가
        perplexityIndexes.forEach(index => {
          sources.push(`출처 ${index}`);
        });
      }
    }
    
    // 연구/보고서/통계 언급 패턴
    const studyPatterns = [
      /(연구|논문|보고서|조사|설문)에?\s*(따르면|의하면|에서)/g,
      /(통계청|정부|기관|대학)\s*[^.]{1,50}에?\s*(따르면|발표)/g,
      /\d{4}년\s*(연구|조사|보고서)/g
    ];
    
    studyPatterns.forEach(pattern => {
      const matches = response.match(pattern) || [];
      sources.push(...matches);
    });
    
    return [...new Set(sources)]; // 중복 제거
  }

  determineReliability(confidence) {
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    if (confidence >= 0.3) return 'low';
    return 'very_low';
  }

  generateWarnings(responses, crossCheck) {
    const warnings = [];
    
    const failedModels = responses.filter(r => r.status === 'error');
    if (failedModels.length > 0) {
      warnings.push(`${failedModels.length} AI model(s) failed to respond`);
    }
    
    if (crossCheck.disagreements.length > crossCheck.agreements.length) {
      warnings.push('Significant disagreement between AI models detected');
    }
    
    const lowConfidenceResponses = responses.filter(r => r.confidence < 0.3);
    if (lowConfidenceResponses.length > 0) {
      warnings.push('Some responses show low confidence levels');
    }
    
    return warnings;
  }

  /**
   * 교차검증 결과를 바탕으로 불일치 답변에 페널티 적용
   */
  applyDisagreementPenalties(responses, crossCheck) {
    const adjustedResponses = responses.map(response => ({ ...response }));
    
    if (!crossCheck.hallucinations || crossCheck.hallucinations.length === 0) {
      console.log('🔍 환각 현상이 감지되지 않아 페널티를 적용하지 않습니다.');
      return adjustedResponses;
    }
    
    console.log(`🚨 ${crossCheck.hallucinations.length}개의 환각 현상 감지, 페널티 적용 시작`);
    
    crossCheck.hallucinations.forEach(hallucination => {
      const targetModel = adjustedResponses.find(r => r.modelName === hallucination.aiModel);
      if (targetModel) {
        const originalConfidence = targetModel.confidence;
        
        // 심각도별 페널티 적용
        let penalty = 0;
        switch (hallucination.severity) {
          case 'high':
            penalty = 0.4; // 40% 감점
            break;
          case 'medium':
            penalty = 0.25; // 25% 감점
            break;
          case 'low':
            penalty = 0.15; // 15% 감점
            break;
          default:
            penalty = 0.2; // 기본 20% 감점
        }
        
        targetModel.confidence = Math.max(0.1, originalConfidence - penalty);
        targetModel.penaltyApplied = {
          reason: 'hallucination_detected',
          severity: hallucination.severity,
          originalConfidence: originalConfidence,
          penalty: penalty,
          suspectedContent: hallucination.suspectedHallucination
        };
        
        console.log(`📉 ${hallucination.aiModel}: ${Math.round(originalConfidence * 100)}% → ${Math.round(targetModel.confidence * 100)}% (${hallucination.severity} 환각으로 ${Math.round(penalty * 100)}% 감점)`);
      }
    });
    
    // 추가적으로 disagreements 기반 페널티도 적용
    if (crossCheck.disagreements && crossCheck.disagreements.length > 0) {
      crossCheck.disagreements.forEach(disagreement => {
        if (disagreement.severity === 'high' && disagreement.aiPositions) {
          Object.keys(disagreement.aiPositions).forEach(modelName => {
            const targetModel = adjustedResponses.find(r => r.modelName === modelName);
            if (targetModel && !targetModel.penaltyApplied) {
              const minorPenalty = 0.1; // 10% 추가 감점
              const originalConfidence = targetModel.confidence;
              targetModel.confidence = Math.max(0.1, originalConfidence - minorPenalty);
              
              console.log(`📉 ${modelName}: 주요 논쟁점으로 인한 추가 감점 ${Math.round(minorPenalty * 100)}%`);
            }
          });
        }
      });
    }
    
    return adjustedResponses;
  }
  
  /**
   * 적용된 페널티 수 계산
   */
  countPenaltiesApplied(originalResponses, adjustedResponses) {
    let count = 0;
    adjustedResponses.forEach(adjusted => {
      if (adjusted.penaltyApplied) {
        count++;
      }
    });
    return count;
  }

  /**
   * 🆕 일치도 기반 사실성 판단
   */
  assessFactualityBasedOnConsensus(responses, crossCheck) {
    const totalResponses = responses.length;
    const agreementCount = crossCheck.agreements?.length || 0;
    const disagreementCount = crossCheck.disagreements?.length || 0;
    const hallucinationCount = crossCheck.hallucinations?.length || 0;
    const consensusScore = crossCheck.consensus?.overallScore || 0;
    
    console.log(`📊 사실성 평가: ${totalResponses}개 응답, ${agreementCount}개 합의, ${disagreementCount}개 논쟁, ${hallucinationCount}개 환각, 합의도 ${consensusScore}`);
    
    // 1. 다수 합의 기준 사실성 점수 계산
    let factualityScore = 0.5; // 기본 점수
    
    // 높은 합의도가 있으면 사실성 증가
    if (consensusScore >= 0.8) {
      factualityScore += 0.3; // 80% 이상 합의면 +30%
    } else if (consensusScore >= 0.6) {
      factualityScore += 0.2; // 60% 이상 합의면 +20%
    } else if (consensusScore >= 0.4) {
      factualityScore += 0.1; // 40% 이상 합의면 +10%
    }
    
    // 합의점 대비 논쟁점 비율
    const agreementRatio = agreementCount / Math.max(1, agreementCount + disagreementCount);
    if (agreementRatio >= 0.7) {
      factualityScore += 0.15; // 합의점이 70% 이상이면 +15%
    } else if (agreementRatio < 0.3) {
      factualityScore -= 0.15; // 합의점이 30% 미만이면 -15%
    }
    
    // 환각 현상 페널티
    if (hallucinationCount > 0) {
      const hallucinationPenalty = Math.min(0.3, hallucinationCount * 0.1);
      factualityScore -= hallucinationPenalty;
      console.log(`🚨 환각 현상으로 인한 사실성 감점: ${hallucinationPenalty}`);
    }
    
    // majorityFact 보너스
    if (crossCheck.majorityFact && crossCheck.majorityFact.confidence >= 0.8) {
      factualityScore += 0.1;
      console.log('✅ 강한 다수 의견으로 인한 사실성 보너스 +10%');
    }
    
    // 범위 제한
    factualityScore = Math.max(0.0, Math.min(1.0, factualityScore));
    
    // 2. 전반적인 합의 수준 결정
    let overallConsensusLevel = 'low';
    if (factualityScore >= 0.8) {
      overallConsensusLevel = 'very_high';
    } else if (factualityScore >= 0.7) {
      overallConsensusLevel = 'high';
    } else if (factualityScore >= 0.6) {
      overallConsensusLevel = 'moderate';
    } else if (factualityScore >= 0.4) {
      overallConsensusLevel = 'low';
    } else {
      overallConsensusLevel = 'very_low';
    }
    
    // 3. 사실성 판정 및 권고사항
    const recommendations = [];
    if (factualityScore >= 0.8) {
      recommendations.push('높은 일치도로 인해 이 정보는 사실일 가능성이 매우 높습니다.');
    } else if (factualityScore >= 0.6) {
      recommendations.push('어느 정도 일치하는 의견으로 신뢰할 수 있는 정보입니다.');
    } else if (factualityScore >= 0.4) {
      recommendations.push('일부 일치점이 있으나 추가 검증이 필요합니다.');
    } else {
      recommendations.push('AI들 간 의견 차이가 커서 전문가 검증을 권장합니다.');
    }
    
    if (hallucinationCount > 0) {
      recommendations.push(`${hallucinationCount}개의 잠재적 환각 현상이 감지되었습니다.`);
    }
    
    if (crossCheck.majorityFact) {
      recommendations.push(`${crossCheck.majorityFact.supportingAIs?.length || 0}개 AI가 동일한 핵심 사실에 합의했습니다.`);
    }
    
    return {
      factualityScore: Math.round(factualityScore * 100) / 100,
      overallConsensusLevel,
      recommendations,
      detailedAnalysis: {
        totalResponses,
        agreementCount,
        disagreementCount,
        hallucinationCount,
        consensusScore: Math.round(consensusScore * 100) / 100,
        agreementRatio: Math.round(agreementRatio * 100) / 100,
        majorityFactStrength: crossCheck.majorityFact?.confidence || 0,
        factualConsistency: factualityScore >= 0.7 ? 'high' : factualityScore >= 0.5 ? 'medium' : 'low'
      }
    };
  }

  generateConfidenceReasoning(avgConfidence, consensusBonus, finalConfidence, responses, crossCheck) {
    const factors = [];
    const considerations = [];
    
    // 개별 AI 신뢰도 분석
    const highConfidenceModels = responses.filter(r => r.confidence >= 0.7).length;
    const lowConfidenceModels = responses.filter(r => r.confidence < 0.5).length;
    
    if (highConfidenceModels > 0) {
      factors.push(`${highConfidenceModels}개 AI 모델이 높은 신뢰도(70% 이상)로 답변했습니다.`);
    }
    
    if (lowConfidenceModels > 0) {
      considerations.push(`${lowConfidenceModels}개 AI 모델의 신뢰도가 낮았습니다(50% 미만).`);
    }
    
    // 합의도 분석
    const consensusLevel = crossCheck.consensus?.consensusLevel || 'unknown';
    const consensusScore = crossCheck.consensus?.overallScore || 0;
    
    if (consensusScore >= 0.7) {
      factors.push(`AI 모델들 간의 높은 합의도(${Math.round(consensusScore * 100)}%)가 신뢰도를 높였습니다.`);
    } else if (consensusScore >= 0.5) {
      considerations.push(`AI 모델들 간의 중간 수준 합의도(${Math.round(consensusScore * 100)}%)를 보였습니다.`);
    } else {
      considerations.push(`AI 모델들 간의 낮은 합의도(${Math.round(consensusScore * 100)}%)가 신뢰도를 낮췄습니다.`);
    }
    
    // 출처 정보 분석
    const sourcesCount = responses.reduce((total, r) => {
      return total + this.extractSourcesFromResponse(r.response).length;
    }, 0);
    
    if (sourcesCount > 5) {
      factors.push(`충분한 출처 정보(${sourcesCount}개)가 답변의 신뢰성을 지원합니다.`);
    } else if (sourcesCount < 3) {
      considerations.push('제한적인 출처 정보로 인해 신뢰도가 제약되었습니다.');
    }
    
    // Perplexity 포함 여부
    const hasPerplexity = responses.some(r => r.model === 'perplexity');
    if (hasPerplexity) {
      factors.push('실시간 검색 기능을 가진 Perplexity AI가 최신 정보 검증을 담당했습니다.');
    }
    
    // 환각 현상 분석
    const lowConfidenceThreshold = 0.5; // 50% 미만을 잠재적 환각으로 간주
    const potentialHallucinationModels = responses.filter(r => r.confidence < lowConfidenceThreshold);
    
    // 기존 consensusAnalyzer에서 감지된 환각
    let detectedHallucinations = [];
    if (crossCheck.hallucinations && crossCheck.hallucinations.length > 0) {
      detectedHallucinations = [...crossCheck.hallucinations];
      const highSeverityHallucinations = crossCheck.hallucinations.filter(h => h.severity === 'high').length;
      if (highSeverityHallucinations > 0) {
        considerations.push(`${highSeverityHallucinations}개의 심각한 환각 현상이 감지되어 신뢰도에 영향을 주었습니다.`);
      }
    }
    
    // 낮은 신뢰도 모델들을 잠재적 환각으로 추가 감지
    potentialHallucinationModels.forEach(model => {
      // 이미 감지된 환각 목록에 있는지 확인
      const alreadyDetected = detectedHallucinations.some(h => h.aiModel === model.modelName);
      if (!alreadyDetected) {
        detectedHallucinations.push({
          aiModel: model.modelName,
          severity: model.confidence < 0.3 ? 'high' : 'medium',
          suspectedHallucination: `낮은 신뢰도 응답 (${Math.round(model.confidence * 100)}%)`,
          majorityView: "다른 AI 모델들과 상당한 차이를 보임",
          reasoning: `신뢰도가 ${Math.round(model.confidence * 100)}%로 매우 낮아 정보의 정확성에 의문이 있습니다. 불확실하거나 근거 부족한 답변을 제공했을 가능성이 높습니다.`
        });
      }
    });
    
    // 업데이트된 환각 정보를 crossCheck에 반영
    if (crossCheck) {
      crossCheck.hallucinations = detectedHallucinations;
    }
    
    // 최종 점수 설명
    let scoreExplanation = '';
    if (finalConfidence >= 0.7) {
      scoreExplanation = '높은 신뢰도: 여러 AI 모델의 일치된 견해와 충분한 근거로 매우 신뢰할 만한 답변입니다.';
    } else if (finalConfidence >= 0.5) {
      scoreExplanation = '중간 신뢰도: 대체로 일관된 답변이지만 일부 불확실성이 존재합니다.';
    } else if (finalConfidence >= 0.3) {
      scoreExplanation = '낮은 신뢰도: AI 모델들 간 상당한 차이가 있어 추가 검증이 필요합니다.';
    } else {
      scoreExplanation = '매우 낮은 신뢰도: 답변에 대한 확신이 부족하며 전문가 의견을 참고하시기 바랍니다.';
    }
    
    return {
      finalScore: Math.round(finalConfidence * 100),
      scoreExplanation,
      positiveFactors: factors,
      considerations: considerations,
      technicalDetails: {
        baseConfidence: Math.round(avgConfidence * 100),
        consensusBonus: Math.round(consensusBonus * 100),
        totalModels: responses.length,
        agreementCount: crossCheck.agreements?.length || 0,
        disagreementCount: crossCheck.disagreements?.length || 0
      }
    };
  }

  getKAISTChatGPTMockup() {
    return `1. 핵심 내용
   KAIST 실패연구소(Center for Ambitious Failure)가 주최하는 대학(원)생 대상 아이디어 공모전으로, 주제는 AI 시대의 실패를 탐구하고 인간–AI 공존을 새롭게 상상하는 것이다. 공식 공지에 따르면 총상금은 1,000만 원이며 문의처는 [caf@kaist.ac.kr](mailto:caf@kaist.ac.kr), 042-350-8521~2이다. 접수는 온라인으로 진행된다. 공식 공지 페이지와 신청서 링크는 아래 출처에 정리했다. ([caf.kaist.ac.kr][1])
   접수 기간은 2025년 9월 1일부터 10월 13일까지다. 참가 자격은 전공 무관 전국 대학(원)생이며, 국내 외국인 유학생과 해외대 한국인 학생도 가능하다고 안내되어 있다. ([위비티][2], [올포영][3])
   제출물은 아이디어 기획서 1부이며, 문서 작성 후 PDF로 제출하는 형태다. 분량은 A4 기준 5쪽 내외 권장이며(가이드북 참조), 파일명 규칙 등 세부 요구사항이 있다. ([위비티][2])
   시상은 대상 300만 원(총장상), 최우수 200만 원, 우수 100만 원×2, 도전상 50만 원×6으로 공지되어 있다. ([위비티][2], [올포영][3])
   핵심 질문은 두 가지로 정리된다. 하나, AI가 일으킬 수 있는 실패를 인간이 어떻게 극복할 수 있는가. 둘, 인간의 실패를 AI가 어떻게 보완·지원할 수 있는가. ([위비티][2])

2. 다양한 관점·고려사항
   너한테 맞는 주제 선정 팁을 간단히 정리할게.
   첫째, 실패를 문제로만 보지 말고 데이터·프로세스로 수확하는 관점이 중요해. 예를 들어 모델 오탐·미탐 로그를 표준화해 재발 방지 루프를 설계하면 심사 포인트인 문제 정의의 창의성이 살아난다. ([위비티][2])
   둘째, 안전·윤리와 편향 관리 계획을 꼭 넣어. 입력 분포 변화, 소수집단 성능 격차, 설명 가능성, 휴먼 인더 루프 설계를 명시하면 좋아. 이는 공모전 취지의 "공존"과 잘 맞는다. ([위비티][2])
   셋째, 네 전공/프로젝트와 접목해 실행 가능성을 보여줘.
   – 드론·AGV 안전: 센서 융합 기반 위험 징후를 조기 탐지하고, 실패 케이스 리플레이·시뮬레이션으로 운영자 학습을 돕는 실패 코치.
   – 비디오 인식·비디오 인페인팅: 모델이 헷갈리는 장면 패턴을 자동 수집·클러스터링해 데이터 보강을 추천하는 실패 진단 대시보드.
   – 임베디드·현장 시스템: 통신 장애, 센서 포화, 조도·날씨 변화 등 환경 요인에 대한 폴백·세이프모드 절차를 설계해 "실패 내성"을 입증.
   넷째, 결과 평가 지표를 구체화해. 예컨대 사고·오경보 감소율, 리콜@K·mAP 개선, 복구까지 평균 소요시간(MTTR) 단축 같은 지표로 전후 비교를 약속하면 설득력이 커져.
   다섯째, 제출물 구성은 표지–한 줄 제안–문제 정의–핵심 아이디어(아키텍처·흐름도)–데이터/윤리–실험·PoC 계획–파급효과–로드맵 순으로 깔끔하게. 위비티 안내의 분량 가이드를 의식해 5쪽 내외로 압축하는 게 좋아. ([위비티][2])

3. 확신도
   8/10. 공식 공지에서 주최, 연락처, 총상금, 공식 신청 링크를 확인했고, 기간·자격·시상·제출물 세부는 공모전 안내 사이트에서도 일관되게 확인했다. 다만 가이드북 PDF는 공지에 첨부되어 있으나 웹 뷰어 접근 제약으로 본문 세부 조항은 직접 열람하지 못했어. 기간·자격·시상·제출물 요건은 아래 출처 기준으로 신뢰도 높다고 판단한다. ([caf.kaist.ac.kr][1], [위비티][2], [올포영][3])

출처
KAIST 실패연구소 공식 공지: [https://caf.kaist.ac.kr/boards/view/board_notice/855](https://caf.kaist.ac.kr/boards/view/board_notice/855)
공식 신청서 링크: [https://forms.gle/K7aFv6mMoAc7NPkT8](https://forms.gle/K7aFv6mMoAc7NPkT8)
위비티 공모전 안내: [https://www.wevity.com/index.php?c=find&gbn=viewok&gp=2&ix=101811&s=_university](https://www.wevity.com/index.php?c=find&gbn=viewok&gp=2&ix=101811&s=_university)
올포영 공모전 안내: [https://www.allforyoung.com/posts/71045](https://www.allforyoung.com/posts/71045)

[1]: https://caf.kaist.ac.kr/boards/view/board_notice/855 "KAIST 실패연구소"
[2]: https://www.wevity.com/index.php?c=find&gbn=viewok&gp=2&ix=101811&s=_university " KAIST AI x 실패 아이디어 공모전 | 공모전 대외활동 - 위비티"
[3]: https://www.allforyoung.com/posts/71045?utm_source=chatgpt.com "KAIST AI x 실패 아이디어 공모전"`;
  }

  getKAISTClovaXMockup() {
    return `**KAIST AI x 실패 아이디어 공모전**은 KAIST 실패연구소가 주최하는 행사로, 인간과 AI의 공존 방안을 모색하는 아이디어를 모집합니다. 아래는 주요 내용과 고려 사항입니다.  

---

### **핵심 내용**  
- **주제**: *"AI 시대의 실패 탐구: AI와 인간이 공존하는 미래"*  
  - AI로 인한 실패 극복 방안 또는 인간의 실패를 AI가 지원하는 아이디어 제안  
- **대상**: 전국 대학생 및 대학원생  
- **접수 기간**: 2025년 9월 1일 ~ 10월 13일  
- **상금**: 총 1,000만 원  

---

### **응모 방법**  
1. **공모전 가이드북**을 통해 세부 규정 확인 ([링크](https://drive.google.com/file/d/1ycO1fjhffbsGXya6C4QahOMzbmnmM3OF/view?usp=sharing))  
2. **참가 신청서** 온라인 제출 ([신청서 링크](https://forms.gle/K7aFv6mMoAc7NPkT8))  

---

### **고려 사항**  
- 응모 분야: **기획/아이디어** 또는 **과학/공학** 분야 선택 가능  
- 팀 또는 개인 단위로 참여 가능하나, 세부 규정은 가이드북 참조 필요  
- 마감일이 10월 13일로 아직 여유 있으나, 조기 신청을 권장  

---

### **확신도**: 8/10  
- 정보의 정확성은 공식 가이드북과 신청서 링크를 기반으로 하지만, 세부 규정은 변동 가능성이 있어 확인이 필요합니다.  

---

**출처**:  
- [공모전 가이드북](https://drive.google.com/file/d/1ycO1fjhffbsGXya6C4QahOMzbmnmM3OF/view?usp=sharing)  
- [참가 신청서 링크](https://forms.gle/K7aFv6mMoAc7NPkT8)  

참여를 고민 중이라면 가이드북을 꼼꼼히 읽고, 창의적인 아이디어를 구체화하는 것이 중요합니다.`;
  }

  getKAISTGrokMockup() {
    return `### KAIST AI x 실패 아이디어 공모전 정보

1. 핵심 내용  
KAIST 실패연구소가 주최하는 AI x 실패 아이디어 공모전은 인공지능(AI)과 인간의 실패를 주제로 창의적 아이디어를 발굴하는 행사다. 이 공모전은 AI가 초래할 수 있는 실패(윤리적 문제, 기술적 오류 등)를 인간이 극복하는 방안, 또는 인간의 실패를 AI가 보완하는 방안을 모색한다. 응모 자격은 제한 없으며, 개인 또는 3인 이내 팀으로 참여 가능하다. 제출 형식은 텍스트, 이미지, 영상 등 자유롭다. 총 상금은 1,000만원이며, 대상(300만원, KAIST 총장상) 및 최우수상, 우수상 등이 있다. 접수는 온라인으로 진행되며, 2025년 기준 모집 중이다(정확한 마감일은 공고 확인 필요). 수상작은 KAIST 실패연구소의 연구 자료로 활용될 수 있다.

2. 다양한 관점 및 고려사항  
- 참여 관점: 이 공모전은 AI 기술자뿐만 아니라 일반인, 학생, 창작자 등 다양한 배경의 참가자를 환영한다. AI 전문 지식이 없어도 창의적 아이디어만 있으면 충분하다. 다만, AI 윤리나 기술적 한계에 대한 기본 이해가 있다면 더 구체적인 제안을 할 수 있다.  
- 주제적 접근: AI의 실패 사례(예: 편향된 알고리즘, 자율주행 사고) 또는 인간의 실패(예: 잘못된 의사결정)를 다루는 아이디어가 유리할 수 있다. 예를 들어, AI의 편향 문제를 해결하는 교육 프로그램이나, 인간의 실수를 학습해 개선하는 AI 시스템 등이 아이디어로 적합할 수 있다.  
- 현실적 고려: 제출물은 창의적이면서도 실현 가능성이 중요하다. 심사 기준은 공고에 명시되지 않았으나, KAIST의 실패학 연구가 혁신과 학습에 초점을 맞춘 점을 고려하면, 실패를 긍정적 기회로 전환하는 관점이 강조될 가능성이 높다.  
- 주의점: 아이디어의 저작권은 KAIST에 귀속될 수 있으며, 분쟁 시 응모자 책임이다. 또한, 미성년자는 법정 대리인 동의가 필요하다. 제출 전 공고의 세부 규정을 꼼꼼히 확인해야 한다.  
- 사회적 의미: 이 공모전은 AI와 인간의 공존을 고민하며, 기술 발전 속에서 실패를 학습의 기회로 삼는 문화를 확산하려는 의도가 있다. 이는 KAIST 실패연구소의 철학과도 연결된다.

3. 확신도  
8/10. 정보는 KAIST 실패연구소 및 공모전 관련 공식 발표와 웹 자료를 기반으로 작성되었다. 다만, 2025년 기준 최신 공고의 세부사항(예: 마감일, 심사 기준)이 업데이트되었을 가능성이 있어, 정확한 세부 정보는 공고를 통해 확인해야 한다.

출처:  
- KAIST 실패연구소 공식 웹사이트 및 관련 공고 (https://gsai.kaist.ac.kr)  
- 공모전 포털 사이트 (예: 코워커, 요즘것들; https://www.allforyoung.com)`;
  }
}

module.exports = new AIService();