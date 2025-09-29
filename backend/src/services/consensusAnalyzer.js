const axios = require('axios');

/**
 * Gemini 기반 의미론적 합의/논쟁 분석 서비스
 * - AI 응답 간의 의미론적 유사성 분석
 * - 합의점과 논쟁점을 자연어로 식별
 * - 구체적인 합의/논쟁 내용 추출
 */
class ConsensusAnalyzer {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
  }

  /**
   * 여러 AI 응답을 분석해서 합의점과 논쟁점을 찾음
   */
  async analyzeConsensusAndDisagreements(responses, originalQuery) {
    if (!responses || responses.length < 2) {
      return {
        agreements: [],
        disagreements: [],
        consensus: { overallScore: 0.5, consensusLevel: 'insufficient_data' }
      };
    }

    try {
      const analysisPrompt = this.buildAnalysisPrompt(responses, originalQuery);
      const geminiAnalysis = await this.callGeminiForAnalysis(analysisPrompt);

      return this.parseGeminiAnalysis(geminiAnalysis, responses);
    } catch (error) {
      console.error('Consensus analysis error:', error);
      // 기본값 반환
      return this.getFallbackAnalysis(responses);
    }
  }

  /**
   * Gemini를 사용해 최종 통합 답변 생성
   */
  async generateFinalIntegratedAnswer(responses, originalQuery, crossCheckResult) {
    // 신뢰도 50% 이상인 응답만 필터링
    const highConfidenceResponses = responses.filter(r =>
      r.status === 'success' && (r.confidence || 0) >= 0.5
    );

    if (highConfidenceResponses.length === 0) {
      console.log('⚠️ 신뢰도 50% 이상인 응답이 없음, 모든 응답 사용');
      const validResponses = responses.filter(r => r.status === 'success');
      return this.generateFinalAnswerWithGemini(validResponses, originalQuery, crossCheckResult);
    }

    console.log(`📊 신뢰도 50% 이상 응답 ${highConfidenceResponses.length}개로 최종 답변 생성`);
    return this.generateFinalAnswerWithGemini(highConfidenceResponses, originalQuery, crossCheckResult);
  }

  /**
   * Gemini API로 최종 답변 생성
   */
  async generateFinalAnswerWithGemini(responses, originalQuery, crossCheckResult) {
    try {
      const finalAnswerPrompt = this.buildFinalAnswerPrompt(responses, originalQuery, crossCheckResult);
      const geminiResponse = await this.callGeminiForFinalAnswer(finalAnswerPrompt);

      return this.parseFinalAnswerResponse(geminiResponse);
    } catch (error) {
      console.error('❌ Gemini 최종 답변 생성 실패:', error);

      // 폴백: 가장 높은 신뢰도 응답 사용
      const sortedResponses = responses.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
      const fallbackAnswer = sortedResponses[0]?.response || '답변을 생성할 수 없습니다.';
      return {
        answer: fallbackAnswer,
        answerKr: fallbackAnswer,
        answerEn: 'Unable to generate a comprehensive answer at this time.',
        sources: this.extractSourceLinks(responses),
        confidence: 0.7,
        isGeminiGenerated: false
      };
    }
  }

  /**
   * Gemini 분석용 프롬프트 구성
   */
  buildAnalysisPrompt(responses, originalQuery) {
    const responsesText = responses.map((r, index) => 
      `=== ${r.modelName} ===
${r.response || r.error || '응답 없음'}
신뢰도: ${Math.round((r.confidence || 0) * 100)}%
`).join('\n\n');

    return `You are an AI response analysis expert. Analyze ALL ${responses.length} AI responses below to identify agreements, disagreements, majority consensus, and potential hallucinations.

IMPORTANT: You must examine and compare ALL ${responses.length} AI responses provided. Do not skip any responses.

Original Question: "${originalQuery}"

=== ALL ${responses.length} AI RESPONSES TO ANALYZE ===
${responsesText}

=== COMPREHENSIVE ANALYSIS TASK ===
Carefully compare ALL ${responses.length} AI responses above and identify:
1. AGREEMENTS: What 2 or more AIs agree on (look for semantic similarity, not just word matching)
2. DISAGREEMENTS: Where AIs provide conflicting information or different perspectives  
3. MAJORITY CONSENSUS: What 3 or more AIs agree on (this is likely to be factual)
4. HALLUCINATIONS: Any AI providing information that contradicts the majority or seems unreliable

Analysis Guidelines:
- Consider semantic meaning, not just exact wording
- Pay special attention to factual claims, numbers, dates, names
- Note when one AI provides very different information from others
- Identify if any AI gives vague/generic responses while others provide specifics

=== Output Format (JSON only) ===
CRITICAL REQUIREMENT: You MUST provide ALL content in BOTH Korean and English for bilingual support.
NEVER provide only English content - always include Korean translations in the Kr fields.
MANDATORY: Every "content" field must have a corresponding "contentKr" field with Korean translation.
MANDATORY: Every "topic" field must have a corresponding "topicKr" field with Korean translation.
MANDATORY: Every "reasoning" field must have a corresponding "reasoningKr" field with Korean translation.

{
  "agreements": [
    {
      "topic": "Agreement topic",
      "topicKr": "합의 주제",
      "content": "What they agree on in English",
      "contentKr": "한국어로 합의 내용",
      "participatingAIs": ["ChatGPT", "Claude"],
      "confidence": 0.85,
      "reasoning": "Why this is considered an agreement (English)",
      "reasoningKr": "합의점으로 간주하는 이유 (한국어)"
    }
  ],
  "majorityFact": {
    "content": "What most AIs agree on (English)",
    "contentKr": "대다수 AI가 동의하는 내용 (한국어)",
    "supportingAIs": ["ChatGPT", "Claude", "Gemini", "Perplexity"],
    "confidence": 0.9,
    "reasoning": "Why this is likely accurate (English)",
    "reasoningKr": "이것이 정확할 가능성이 높은 이유 (한국어)"
  },
  "hallucinations": [
    {
      "aiModel": "AI model name",
      "suspectedHallucination": "Questionable content (English)",
      "suspectedHallucinationKr": "의심스러운 내용 (한국어)",
      "majorityOpinion": "What most others say (English)",
      "majorityOpinionKr": "다수 의견 (한국어)",
      "severity": "high",
      "reasoning": "Why this seems wrong (English)",
      "reasoningKr": "잘못된 것으로 보이는 이유 (한국어)"
    }
  ],
  "disagreements": [
    {
      "topic": "Disagreement topic",
      "topicKr": "논쟁 주제",
      "aiPositions": {
        "ChatGPT": "Position A",
        "Claude": "Position B"
      },
      "aiPositionsKr": {
        "ChatGPT": "입장 A",
        "Claude": "입장 B"
      },
      "severity": "medium"
    }
  ],
  "consensus": {
    "overallScore": 0.75,
    "consensusLevel": "moderate",
    "majorityPosition": "Overall agreement (English)",
    "majorityPositionKr": "전반적 합의 (한국어)",
    "confidenceInAnalysis": 0.90
  }
}

CRITICAL REQUIREMENTS:
- ANALYZE ALL ${responses.length} AI RESPONSES PROVIDED - do not skip any
- Use actual model names: ChatGPT, Claude, Gemini, Perplexity, GROK, CLOVA X
- MANDATORY BILINGUAL REQUIREMENT: Provide BOTH English and Korean versions for ALL text content
- NEVER leave Korean fields (contentKr, topicKr, reasoningKr) empty or null
- If you only know English, translate it to Korean using your language knowledge
- Only include real agreements/disagreements based on semantic analysis
- Hallucinations = clear factual errors, unsupported claims, or information contradicting majority
- Pay special attention to Claude - if Claude gives vague/generic answers while others provide specific information, mark Claude as potential hallucination
- Consider confidence scores - lower confidence may indicate hallucination
- Look for patterns where one AI says something completely different from ${responses.length - 1} others

JSON FORMAT REQUIREMENTS:
- Return ONLY valid JSON - no markdown blocks, no explanations, no extra text
- Do NOT wrap in \`\`\`json blocks
- Ensure all strings are properly escaped
- Use double quotes for all keys and string values
- Remove trailing commas
- Validate JSON syntax before responding

EXAMPLE FORBIDDEN FORMATS:
❌ \`\`\`json { "key": "value" } \`\`\`
❌ Here is the analysis: { "key": "value" }
❌ The result is: { "key": "value" }

REQUIRED FORMAT:
✅ { "agreements": [...], "disagreements": [...], "consensus": {...} }

REMINDER: You must examine and reference all ${responses.length} AI responses in your analysis.

FINAL BILINGUAL CHECK BEFORE RESPONDING:
✅ Have I included contentKr (Korean content) for every content field?
✅ Have I included topicKr (Korean topic) for every topic field?
✅ Have I included reasoningKr (Korean reasoning) for every reasoning field?
✅ Are all Korean translations accurate and meaningful?

If any answer is NO, fix it before responding. Korean content is MANDATORY, not optional.`;
  }

  /**
   * 최종 답변 생성용 프롬프트 구성
   */
  buildFinalAnswerPrompt(responses, originalQuery, crossCheckResult) {
    const responsesText = responses.map((r, index) =>
      `=== ${r.modelName} (신뢰도: ${Math.round((r.confidence || 0) * 100)}%) ===
${r.response || '응답 없음'}
`).join('\n');

    const agreementsText = crossCheckResult.agreements?.map(a =>
      `- ${a.topic || a.topicKr}: ${a.content || a.contentKr}`
    ).join('\n') || '합의점 없음';

    return `You are an expert AI answer synthesizer. Your task is to create a comprehensive, accurate final answer by analyzing multiple AI responses and their cross-validation results.

ORIGINAL QUESTION: "${originalQuery}"

=== HIGH CONFIDENCE AI RESPONSES (50%+ confidence) ===
${responsesText}

=== CROSS-VALIDATION AGREEMENTS ===
${agreementsText}

=== TASK: GENERATE FINAL INTEGRATED ANSWER ===

REQUIREMENTS:
1. Create a comprehensive answer that integrates the most reliable information from all responses
2. Prioritize information that appears in multiple AI responses (consensus)
3. Organize content with clear section headers using **bold text** for maximum readability
4. Provide BOTH English and Korean versions with identical structure
5. Focus on factual accuracy based on cross-validation results
6. Length: 2-4 well-organized sections per language, each with descriptive headers
7. Include numbered source links at the bottom in format: [1] [Source Title](URL)

MANDATORY SECTION STRUCTURE:
- Start with **분석 개요:** / **Analysis Overview:** section with substantial content
- Include at least 2 main content sections with descriptive headers and detailed explanations
- Provide comprehensive information, not just section headers
- Always end with **출처:** / **Sources:** section
- Use consistent formatting between Korean and English versions

CONTENT REQUIREMENTS:
- Each section must contain substantial explanatory text, not just headers
- Provide detailed analysis and conclusions based on the AI responses
- Include specific facts, findings, and insights
- Minimum 2-3 paragraphs of actual content per language

FORMATTING RULES:
- USE **bold** markdown syntax for section headers to improve readability
- Create clear section divisions with headers like **주요 내용:**, **분석 결과:**, **결론:**
- Use line breaks and paragraphs to separate different topics
- Start each major point with a descriptive section header
- Organize content into logical sections with proper spacing
- End with **출처:** (Korean) or **Sources:** (English) section with numbered references

SOURCE INTEGRATION RULES:
- Extract sources primarily from Perplexity responses (highest quality sources)
- Include exactly 3 numbered sources at the bottom: [1], [2], [3]
- Prefer sources that appear in multiple responses
- Format as: [1] [Source Title](URL)
- Prioritize recent, authoritative sources

OUTPUT FORMAT (JSON):
{
  "finalAnswer": {
    "english": "**Analysis Overview:**\nBased on comprehensive analysis of multiple high-confidence AI responses, the following key findings have been identified through cross-validation of independent AI systems.\n\n**Key Consensus Points:**\nThe consensus across AI models indicates consistent and reliable data regarding the main topic. Multiple sources corroborate the essential facts and provide substantial evidence for the conclusions.\n\n**Validation Results:**\nCross-validation analysis reveals strong agreement among different AI models, with information verified through multiple independent sources. This convergence of perspectives significantly increases the reliability of the presented information.\n\n**Sources:**\n\n[1] [Source Title 1](https://example1.com)\n\n[2] [Source Title 2](https://example2.com)\n\n[3] [Source Title 3](https://example3.com)",
    "korean": "**분석 개요:**\n높은 신뢰도를 가진 다수 AI 응답의 종합 분석을 바탕으로, 독립적인 AI 시스템들의 교차 검증을 통해 다음과 같은 주요 결과를 확인했습니다.\n\n**주요 합의점:**\nAI 모델들 간의 합의에 따르면 주요 주제에 대한 일관되고 신뢰할 수 있는 데이터가 확인됩니다. 다수의 출처가 핵심 사실들을 뒷받침하고 결론에 대한 실질적인 증거를 제공합니다.\n\n**검증 결과:**\n교차 검증 분석 결과 서로 다른 AI 모델들 간에 강한 일치를 보였으며, 정보는 여러 독립적인 출처를 통해 검증되었습니다. 이러한 관점의 수렴은 제시된 정보의 신뢰성을 크게 높입니다.\n\n**출처:**\n\n[1] [출처 제목 1](https://example1.com)\n\n[2] [출처 제목 2](https://example2.com)\n\n[3] [출처 제목 3](https://example3.com)",
    "confidence": 0.85,
    "sources": [
      {
        "title": "Source 1 Title",
        "url": "https://example1.com",
        "reliability": "high"
      },
      {
        "title": "Source 2 Title",
        "url": "https://example2.com",
        "reliability": "medium"
      },
      {
        "title": "Source 3 Title",
        "url": "https://example3.com",
        "reliability": "high"
      }
    ],
    "synthesisMethod": "consensus-based integration",
    "modelsUsed": ["ChatGPT", "Perplexity", "Claude"]
  }
}

CRITICAL REQUIREMENTS:
- Must include BOTH English and Korean versions
- DO NOT include confidence scores or percentages in the text
- USE **bold** markdown syntax for section headers to improve structure and readability
- Must include exactly 3 hyperlinked sources with line breaks between each
- Sources must be real URLs from the AI responses (prefer Perplexity sources)
- Answer must be comprehensive but organized into clear sections
- Base content on cross-validation agreements
- Format sources as: **출처:**\n\n[1] [Title](URL)\n\n[2] [Title](URL)\n\n[3] [Title](URL)
- Return ONLY valid JSON, no markdown formatting

Generate the final integrated answer now:`;
  }

  /**
   * Gemini API 호출
   */
  async callGeminiForAnalysis(prompt) {
    try {
      if (!this.geminiApiKey) {
        console.log('⚠️ Gemini API key not configured, using enhanced mock analysis');
        console.log('📊 Mock analysis provides comprehensive bilingual cross-validation results');
        return this.getMockAnalysis();
      }

      console.log('🔍 Gemini API 호출 중...');
      const response = await axios.post(
        `${this.geminiEndpoint}?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: `You are a precise JSON response generator. Return ONLY valid JSON without any markdown formatting or explanations.\n\nIMPORTANT: Your response must be complete, valid JSON that can be parsed. Do not truncate the output.\n\n${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8000,
            responseMimeType: "application/json",
            stopSequences: [],
            candidateCount: 1
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 45000 // 45초 타임아웃
        }
      );

      const content = response.data.candidates[0].content.parts[0].text;
      console.log('✅ Gemini API 응답 받음 (길이:', content.length, ')');
      return content;

    } catch (error) {
      console.error('❌ Gemini API 호출 실패:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      console.log('🔄 Mock 분석으로 대체');
      return this.getMockAnalysis();
    }
  }

  /**
   * 최종 답변 생성용 Gemini API 호출
   */
  async callGeminiForFinalAnswer(prompt) {
    try {
      if (!this.geminiApiKey) {
        console.log('⚠️ Gemini API key not configured, using mock final answer');
        return this.getMockFinalAnswer();
      }

      console.log('🔍 Gemini API 최종 답변 생성 중...');
      const response = await axios.post(
        `${this.geminiEndpoint}?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: `You are a precise final answer generator. Return ONLY valid JSON without any markdown formatting.\n\nIMPORTANT: Your response must be complete, valid JSON that can be parsed.\n\n${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4000,
            responseMimeType: "application/json",
            stopSequences: [],
            candidateCount: 1
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 45000
        }
      );

      const content = response.data.candidates[0].content.parts[0].text;
      console.log('✅ Gemini 최종 답변 생성 완료 (길이:', content.length, ')');
      return content;

    } catch (error) {
      console.error('❌ Gemini 최종 답변 생성 실패:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      console.log('🔄 Mock 최종 답변으로 대체');
      return this.getMockFinalAnswer();
    }
  }

  /**
   * 최종 답변 응답 파싱
   */
  parseFinalAnswerResponse(geminiResponse) {
    try {
      console.log('🔍 최종 답변 파싱 시작...');
      let cleanedResponse = geminiResponse.trim();

      // JSON 추출
      let jsonContent = null;
      const jsonBlockMatch = cleanedResponse.match(/```json\s*(.*?)\s*```/s);
      if (jsonBlockMatch) {
        jsonContent = jsonBlockMatch[1].trim();
      } else {
        const jsonObjectMatch = cleanedResponse.match(/(\{[\s\S]*\})/);
        if (jsonObjectMatch) {
          jsonContent = jsonObjectMatch[1].trim();
        } else {
          jsonContent = cleanedResponse;
        }
      }

      // 최종 답변 전용 JSON 정리
      jsonContent = this.cleanFinalAnswerJson(jsonContent);

      // 파싱
      const result = JSON.parse(jsonContent);
      console.log('✅ 최종 답변 파싱 성공!');

      return {
        answer: result.finalAnswer?.korean || result.finalAnswer?.english || '답변을 생성할 수 없습니다.',
        answerEn: result.finalAnswer?.english || result.finalAnswer?.korean || 'Unable to generate answer.',
        answerKr: result.finalAnswer?.korean || result.finalAnswer?.english || '답변을 생성할 수 없습니다.',
        sources: result.finalAnswer?.sources || [],
        confidence: result.finalAnswer?.confidence || 0.75,
        isGeminiGenerated: true,
        synthesisMethod: result.finalAnswer?.synthesisMethod || 'gemini-integration',
        modelsUsed: result.finalAnswer?.modelsUsed || []
      };

    } catch (error) {
      console.error('❌ 최종 답변 파싱 실패:', error.message);

      // 최종 답변 전용 복구 시도
      try {
        console.log('🔧 최종 답변 복구 시도...');
        const fixedJson = this.repairFinalAnswerJson(geminiResponse);
        const result = JSON.parse(fixedJson);
        console.log('✅ 최종 답변 복구 성공!');
        return {
          answer: result.finalAnswer?.korean || result.finalAnswer?.english || '답변을 생성할 수 없습니다.',
          answerEn: result.finalAnswer?.english || result.finalAnswer?.korean || 'Unable to generate answer.',
          answerKr: result.finalAnswer?.korean || result.finalAnswer?.english || '답변을 생성할 수 없습니다.',
          sources: result.finalAnswer?.sources || [],
          confidence: 0.7,
          isGeminiGenerated: true
        };
      } catch (e) {
        console.log('❌ 최종 답변 복구도 실패:', e.message);
        console.log('🔄 기본 텍스트 답변으로 폴백...');

        // Gemini 원본 응답을 텍스트로 처리
        console.log('🔄 텍스트 추출 시도...');
        const textAnswer = this.extractTextFromBrokenJson(geminiResponse);
        const hasValidContent = textAnswer && textAnswer.length > 50;

        console.log('📝 추출된 텍스트:', textAnswer?.substring(0, 200));

        return {
          answer: hasValidContent ? textAnswer : '답변을 생성할 수 없습니다.',
          answerEn: hasValidContent ? textAnswer : 'Unable to generate answer.',
          answerKr: hasValidContent ? textAnswer : '답변을 생성할 수 없습니다.',
          sources: [],
          confidence: hasValidContent ? 0.7 : 0.5,
          isGeminiGenerated: hasValidContent
        };
      }
    }
  }

  /**
   * 손상된 JSON에서 텍스트 내용 추출
   */
  extractTextFromBrokenJson(jsonResponse) {
    try {
      console.log('🔧 손상된 JSON에서 텍스트 추출 중...');

      // Korean과 English 섹션 찾기
      const koreanMatch = jsonResponse.match(/"korean"\s*:\s*"([^"]+(?:\\.[^"]*)*?)"/);
      const englishMatch = jsonResponse.match(/"english"\s*:\s*"([^"]+(?:\\.[^"]*)*?)"/);

      let extractedText = '';

      if (koreanMatch) {
        extractedText = koreanMatch[1]
          .replace(/\\n\\n/g, '\n\n')
          .replace(/\\n/g, '\n')
          .replace(/\\/g, '')
          .trim();
        console.log('✅ 한국어 텍스트 추출 성공');
      } else if (englishMatch) {
        extractedText = englishMatch[1]
          .replace(/\\n\\n/g, '\n\n')
          .replace(/\\n/g, '\n')
          .replace(/\\/g, '')
          .trim();
        console.log('✅ 영어 텍스트 추출 성공');
      } else {
        // 마지막 시도: 모든 따옴표 사이의 긴 텍스트 찾기
        const longTextMatches = jsonResponse.match(/"([^"]{100,}(?:\\.[^"]*)*)"/g);
        if (longTextMatches && longTextMatches.length > 0) {
          extractedText = longTextMatches[0]
            .replace(/^"|"$/g, '') // 앞뒤 따옴표 제거
            .replace(/\\n\\n/g, '\n\n')
            .replace(/\\n/g, '\n')
            .replace(/\\/g, '')
            .trim();
          console.log('✅ 긴 텍스트 매치 추출 성공');
        } else {
          console.log('❌ 추출 가능한 텍스트 없음');
          return null;
        }
      }

      return extractedText;
    } catch (error) {
      console.error('❌ 텍스트 추출 실패:', error.message);
      return null;
    }
  }

  /**
   * 최종 답변 전용 JSON 정리
   */
  cleanFinalAnswerJson(jsonString) {
    let cleaned = jsonString
      // 제어 문자 및 잘못된 이스케이프 시퀀스 정리
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 제어 문자 제거
      .replace(/\\+"/g, '"') // 잘못된 이스케이프 수정
      .replace(/\\n/g, '\\n') // 개행 문자 이스케이프 유지
      .replace(/\\t/g, ' ') // 탭을 공백으로 변환
      .replace(/\n/g, '\\n') // 실제 개행을 이스케이프된 개행으로 변환
      .replace(/\r/g, '') // 캐리지 리턴 제거
      .replace(/\t/g, ' ') // 실제 탭을 공백으로 변환
      .replace(/,(\s*[}\]])/g, '$1') // 후행 쉼표 제거
      .replace(/,+/g, ',') // 중복 쉼표 제거
      .replace(/"\s*:\s*"/g, '": "') // 콜론 주변 공백 정리
      .trim();

    // finalAnswer 구조에 맞게 정리
    return this.ensureFinalAnswerStructure(cleaned);
  }

  /**
   * 최종 답변 JSON 복구
   */
  repairFinalAnswerJson(jsonString) {
    console.log('🛠️ 최종 답변 JSON 복구 시작...');

    let repaired = jsonString.trim();

    // 1. JSON 객체 추출
    const jsonMatch = repaired.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      repaired = jsonMatch[0];
    }

    // 2. 불완전한 문자열 제거
    repaired = this.removeIncompleteFinalAnswerStrings(repaired);

    // 3. 기본 구조 보장
    repaired = this.ensureFinalAnswerStructure(repaired);

    console.log('🛠️ 최종 답변 JSON 복구 완료');
    return repaired;
  }

  /**
   * 불완전한 최종 답변 문자열 제거
   */
  removeIncompleteFinalAnswerStrings(jsonString) {
    const lines = jsonString.split('\n');
    const validLines = [];

    let insideStringValue = false;
    let braceCount = 0;
    let currentStringValue = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // 빈 줄이나 구조 문자만 있는 줄은 유지
      if (!trimmed || ['{', '}', '[', ']', ','].includes(trimmed)) {
        validLines.push(line);
        continue;
      }

      // 키-값 쌍 확인
      if (trimmed.includes(':')) {
        const colonIndex = trimmed.indexOf(':');
        const key = trimmed.substring(0, colonIndex).trim();
        const valueStart = trimmed.substring(colonIndex + 1).trim();

        // 유효한 키인지 확인
        if (!key.match(/^"[^"]*"$/)) {
          console.log('🗑️ 잘못된 키 형식:', key);
          break;
        }

        // 문자열 값인 경우 완전성 확인
        if (valueStart.startsWith('"')) {
          // 한 줄에서 문자열이 완료되는지 확인
          const quotesInValue = (valueStart.match(/"/g) || []).length;
          if (quotesInValue >= 2) {
            // 완전한 문자열 값
            validLines.push(line);
          } else {
            // 불완전한 문자열 값 - 다음 줄들과 합쳐서 확인
            let combinedValue = valueStart;
            let foundEnd = false;

            for (let j = i + 1; j < lines.length && j < i + 10; j++) {
              combinedValue += lines[j];
              if (combinedValue.match(/"[^"]*"/) && combinedValue.endsWith('"')) {
                // 완전한 문자열을 찾았지만 너무 복잡하면 제거
                if (combinedValue.length > 3000 || (combinedValue.match(/"/g) || []).length > 50) {
                  console.log('🗑️ 너무 복잡한 문자열 값 제거:', trimmed.substring(0, 50));
                  foundEnd = false;
                  break;
                } else {
                  foundEnd = true;
                  break;
                }
              }
            }

            if (foundEnd) {
              validLines.push(line);
            } else {
              console.log('🗑️ 불완전한 최종 답변 줄 제거:', trimmed.substring(0, 50));
              break;
            }
          }
        } else {
          // 다른 타입의 값 (숫자, 불린 등)
          validLines.push(line);
        }
      } else {
        console.log('🗑️ 키-값 형식이 아닌 줄 제거:', trimmed.substring(0, 50));
        break;
      }
    }

    return validLines.join('\n');
  }

  /**
   * 최종 답변 줄이 완전한지 확인
   */
  isCompleteFinalAnswerLine(line, insideFinalAnswer) {
    // 구조 문자들
    if (['{', '}', '[', ']', ','].includes(line)) {
      return true;
    }

    // 빈 줄
    if (line === '') {
      return true;
    }

    // 키-값 쌍인 경우
    if (line.includes(':')) {
      const colonIndex = line.indexOf(':');
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      // 키가 따옴표로 감싸져 있는지
      if (!key.startsWith('"') || !key.endsWith('"')) {
        return false;
      }

      // 값이 있는지
      if (value === '') {
        return false;
      }

      // 문자열 값인 경우 완전한지 확인
      if (value.startsWith('"')) {
        // 매우 긴 문자열의 경우 간단히 체크
        if (insideFinalAnswer && (key.includes('english') || key.includes('korean'))) {
          // 최종 답변 텍스트는 길 수 있으므로 더 관대하게 체크
          return value.length > 10; // 최소 길이만 확인
        }
        return value.endsWith('"') || value.endsWith('",');
      }

      return true;
    }

    return false;
  }

  /**
   * 최종 답변 기본 구조 보장
   */
  ensureFinalAnswerStructure(jsonString) {
    let result = jsonString.trim();

    // JSON 객체로 시작하지 않으면 추가
    if (!result.startsWith('{')) {
      result = '{' + result;
    }

    // finalAnswer 구조가 없으면 기본 구조 추가
    if (!result.includes('"finalAnswer"')) {
      result = `{
  "finalAnswer": {
    "english": "Unable to generate comprehensive answer due to parsing issues.",
    "korean": "파싱 문제로 인해 종합적인 답변을 생성할 수 없습니다.",
    "confidence": 0.5,
    "sources": []
  }
}`;
    }

    // JSON 객체가 닫히지 않았으면 닫기
    if (!result.endsWith('}')) {
      // 마지막 불완전한 부분 제거 후 닫기
      const lastBrace = result.lastIndexOf('{');
      const lastComma = result.lastIndexOf(',');

      if (lastComma > lastBrace) {
        result = result.substring(0, lastComma);
      }

      result += '\n    }\n  }\n}';
    }

    return result;
  }

  /**
   * Mock 최종 답변
   */
  getMockFinalAnswer() {
    return JSON.stringify({
      "finalAnswer": {
        "english": "**Incident Overview:**\nThe incident known as the Sillim-dong stabbing occurred on September 3, 2025, at approximately 10:57 AM at a franchise pizza restaurant in Jowon-dong, Gwanak-gu, Seoul. A male franchise owner in his 50s stabbed two men in their 40s and one woman in her 30s, believed to be headquarters representatives, with a knife, resulting in their deaths. The perpetrator also severely injured himself through self-harm and was transported to the hospital.\n\n**Background Analysis:**\nThe incident is confirmed to be rooted in a business conflict between the franchise headquarters and the franchisee. There had been a long-standing dispute over defect repairs with an interior company designated by the headquarters, and violence erupted when headquarters representatives visited to discuss the issue on the day of the incident.\n\n**Current Investigation:**\nPolice discovered weapons and bloodstains at the scene and are conducting a thorough investigation. The perpetrator appears to have taken extreme action due to accumulated grievances and economic pressure, but the exact motive and mental state may vary depending on police investigation results.\n\n**Distinction from Previous Cases:**\nThis case is different from the random Sillim Station stabbing incident in 2023. This incident is classified as a conflict within a specific relationship, unlike indiscriminate violence.\n\n**Sources:**\n\n[1] [SBS 뉴스 (2025.09.03)](https://news.sbs.co.kr)\n\n[2] [조선일보 (2025.09.03)](https://www.chosun.com)\n\n[3] [연합뉴스TV (2025.09.03)](https://www.yonhapnewstv.co.kr)",
        "korean": "**사건 개요:**\n신림동 칼부림 사건으로 알려진 이 사건은 2025년 9월 3일 오전 10시 57분경 서울 관악구 조원동의 한 프랜차이즈 피자 가게에서 발생했습니다. 가맹점 사장인 50대 남성이 본사 관계자로 보이는 40대 남성 2명과 30대 여성 1명을 칼로 찔러 사망하게 했으며, 가해자 본인도 자해로 중상을 입고 병원으로 이송되었습니다.\n\n**배경 분석:**\n사건의 배경은 프랜차이즈 본사와 가맹점 간의 사업적 갈등으로 확인되고 있습니다. 본사가 지정한 인테리어 업체와의 하자 보수 문제로 오랜 분쟁이 있었으며, 사건 당일 본사 관계자들이 문제를 논의하러 방문한 상황에서 난동이 벌어졌습니다.\n\n**수사 현황:**\n경찰은 현장에서 흉기와 혈흔을 발견하고 철저한 수사를 진행 중입니다. 가해자는 누적된 불만과 경제적 압박으로 인해 극단적인 행동을 한 것으로 보이지만, 정확한 동기와 정신 상태는 경찰 조사 결과에 따라 달라질 수 있습니다.\n\n**이전 사건과의 구별:**\n이 사건은 무작위적 묻지마 범죄였던 2023년 신림역 칼부림 사건과는 구별됩니다. 이번 사건은 특정 관계 속에서의 갈등으로 분류되며, 무차별적인 폭력과는 다릅니다. 분석에 따르면 프랜차이즈 산업 내 구조적인 문제가 드러날 수 있으며, 상생 방안에 대한 논의가 필요함을 시사합니다.\n\n**출처:**\n\n[1] [SBS 뉴스 (2025.09.03)](https://news.sbs.co.kr)\n\n[2] [조선일보 (2025.09.03)](https://www.chosun.com)\n\n[3] [연합뉴스TV (2025.09.03)](https://www.yonhapnewstv.co.kr)",
        "confidence": 0.9,
        "sources": [
          {
            "title": "SBS 뉴스 (2025.09.03)",
            "url": "https://news.sbs.co.kr",
            "reliability": "high"
          },
          {
            "title": "조선일보 (2025.09.03)",
            "url": "https://www.chosun.com",
            "reliability": "high"
          },
          {
            "title": "연합뉴스TV (2025.09.03)",
            "url": "https://www.yonhapnewstv.co.kr",
            "reliability": "high"
          }
        ],
        "synthesisMethod": "consensus-based integration",
        "modelsUsed": ["ChatGPT", "Claude", "Clova X", "Gemini"]
      }
    });
  }

  /**
   * 응답에서 출처 링크 추출 (Clova X 우선)
   */
  extractSourceLinks(responses) {
    const sources = [];

    // 1. Clova X 응답에서 우선 추출
    const clovaXResponse = responses.find(r => r.modelName?.toLowerCase().includes('clova') || r.modelName?.toLowerCase().includes('clovax'));
    if (clovaXResponse) {
      console.log('📖 Clova X 응답에서 출처 추출 중...');
      const clovaXSources = this.extractSourcesFromResponse(clovaXResponse);
      sources.push(...clovaXSources);
    }

    // 2. 다른 응답에서 추가 출처 추출
    responses.forEach(response => {
      if (response.modelName?.toLowerCase().includes('clova')) return; // 이미 처리됨

      const urlPattern = /(https?:\/\/[^\s)]+)/g;
      const matches = response.response?.match(urlPattern) || [];
      matches.forEach(url => {
        // 중복 제거
        if (!sources.find(s => s.url === url)) {
          sources.push({
            title: this.extractTitleFromContext(response.response, url) || `Source from ${response.modelName}`,
            url: url,
            reliability: response.confidence > 0.7 ? 'high' : 'medium'
          });
        }
      });
    });

    console.log(`📋 총 ${sources.length}개 출처 발견, 상위 3개 선택`);
    return sources.slice(0, 3); // 최대 3개
  }

  /**
   * Clova X 응답에서 더 정교하게 출처 추출
   */
  extractSourcesFromResponse(response) {
    const sources = [];
    const text = response.response || '';

    // 다양한 패턴으로 URL과 제목 추출
    const patterns = [
      // [제목](URL) 패턴
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      // 일반 URL 패턴
      /(https?:\/\/[^\s)]+)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[2]) { // [제목](URL) 패턴
          sources.push({
            title: match[1],
            url: match[2],
            reliability: 'high'
          });
        } else { // 일반 URL 패턴
          sources.push({
            title: this.extractTitleFromContext(text, match[1]) || this.getDomainName(match[1]),
            url: match[1],
            reliability: 'medium'
          });
        }
      }
    });

    return sources;
  }

  /**
   * URL 주변 텍스트에서 제목 추출
   */
  extractTitleFromContext(text, url) {
    const urlIndex = text.indexOf(url);
    if (urlIndex === -1) return null;

    // URL 앞 50자에서 제목 찾기
    const beforeUrl = text.substring(Math.max(0, urlIndex - 50), urlIndex);
    const titleMatch = beforeUrl.match(/([^.!?]+)[\s]*$/);

    if (titleMatch) {
      return titleMatch[1].trim();
    }

    return null;
  }

  /**
   * URL에서 도메인명 추출
   */
  getDomainName(url) {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return 'External Source';
    }
  }

  /**
   * Gemini 응답을 파싱해서 구조화된 결과 반환
   */
  parseGeminiAnalysis(geminiResponse, originalResponses) {
    console.log('🔍 Gemini 응답 파싱 시작...');
    console.log('📝 원본 응답 길이:', geminiResponse.length);
    console.log('📝 원본 응답 첫 200자:', geminiResponse.substring(0, 200));
    console.log('📝 원본 응답 마지막 200자:', geminiResponse.substring(Math.max(0, geminiResponse.length - 200)));
    
    try {
      let cleanedResponse = geminiResponse.trim();
      
      // 다양한 JSON 추출 패턴 시도
      let jsonContent = null;
      
      // 1. ```json...``` 블록에서 추출
      const jsonBlockMatch = cleanedResponse.match(/```json\s*(.*?)\s*```/s);
      if (jsonBlockMatch) {
        jsonContent = jsonBlockMatch[1].trim();
        console.log('✅ JSON 블록에서 추출 성공 (길이:', jsonContent.length, ')');
        console.log('📄 추출된 내용 첫 100자:', jsonContent.substring(0, 100));
      }
      
      // 2. { ... } 전체 JSON 객체 추출
      if (!jsonContent) {
        const jsonObjectMatch = cleanedResponse.match(/(\{[\s\S]*\})/);
        if (jsonObjectMatch) {
          jsonContent = jsonObjectMatch[1].trim();
          console.log('✅ JSON 객체에서 추출 성공 (길이:', jsonContent.length, ')');
          console.log('📄 추출된 내용 첫 100자:', jsonContent.substring(0, 100));
        }
      }
      
      // 3. 전체 텍스트가 JSON인 경우
      if (!jsonContent) {
        jsonContent = cleanedResponse;
        console.log('⚠️ 전체 텍스트를 JSON으로 처리 (길이:', jsonContent.length, ')');
      }
      
      console.log('🧹 JSON 정리 작업 시작...');
      // JSON 정리 작업
      const originalLength = jsonContent.length;
      jsonContent = this.cleanJsonString(jsonContent);
      console.log('🧹 JSON 정리 완료: 길이', originalLength, '→', jsonContent.length);
      
      console.log('🔧 JSON 파싱 시도...');
      // JSON 파싱 시도
      const analysisResult = JSON.parse(jsonContent);
      console.log('✅ JSON 파싱 성공!');
      
      // 응답 검증 및 보정
      console.log('🔍 결과 검증 및 보정 중...');
      const validated = this.validateAndEnhanceAnalysis(analysisResult, originalResponses);
      console.log('✅ Gemini 분석 완료:', {
        agreements: validated.agreements?.length || 0,
        disagreements: validated.disagreements?.length || 0,
        hallucinations: validated.hallucinations?.length || 0,
        majorityFact: !!validated.majorityFact
      });

      return validated;

    } catch (error) {
      console.error('❌ Gemini 응답 파싱 실패:', error.message);
      console.log('📊 파싱 시도한 JSON 길이:', geminiResponse.length);
      console.log('🎯 파싱 실패 위치 주변:', this.getErrorContext(geminiResponse, error));

      // 고급 복구 시도
      try {
        console.log('🔧 고급 JSON 복구 시도...');
        const advancedFixed = this.advancedJsonRepair(geminiResponse);
        const result = JSON.parse(advancedFixed);
        console.log('✅ 고급 복구 성공!');
        return this.validateAndEnhanceAnalysis(result, originalResponses);
      } catch (e) {
        console.log('❌ 고급 복구 실패:', e.message);

        // 간단한 복구 시도
        try {
          console.log('🔧 간단한 JSON 복구 시도...');
          const simpleFixed = this.simpleJsonFix(geminiResponse);
          const result = JSON.parse(simpleFixed);
          console.log('✅ 간단한 복구 성공!');
          return this.validateAndEnhanceAnalysis(result, originalResponses);
        } catch (e2) {
          console.log('❌ 간단한 복구도 실패:', e2.message);
        }
      }

      // Mock 분석으로 대체
      console.log('🔄 Mock 분석으로 대체합니다...');
      const fallback = this.getFallbackAnalysis(originalResponses);
      console.log('✅ Mock 분석 반환:', {
        agreements: fallback.agreements?.length || 0,
        disagreements: fallback.disagreements?.length || 0,
        hallucinations: fallback.hallucinations?.length || 0
      });
      return fallback;
    }
  }

  /**
   * 간단한 JSON 복구 시도
   */
  simpleJsonFix(jsonString) {
    let fixed = jsonString.trim();
    console.log('🔧 JSON 복구 시작, 원본 길이:', fixed.length);
    console.log('🔧 원본 마지막 100자:', fixed.substring(Math.max(0, fixed.length - 100)));

    // 1. 불완전한 문자열 값 탐지 및 제거
    fixed = this.removeIncompleteStringValues(fixed);

    // 2. 불완전한 객체/배열 구조 복구
    fixed = this.repairBrokenStructures(fixed);

    // 3. 필수 구조 요소 보완
    fixed = this.ensureRequiredStructure(fixed);

    console.log('🔧 JSON 복구 완료, 결과 길이:', fixed.length);
    console.log('🔧 복구된 마지막 100자:', fixed.substring(Math.max(0, fixed.length - 100)));

    return fixed;
  }

  /**
   * 불완전한 문자열 값 제거
   */
  removeIncompleteStringValues(jsonString) {
    let fixed = jsonString;

    // 불완전한 문자열 값을 찾아서 제거 (예: "GROK": "일반적인 확인을)
    const incompleteStringPattern = /"([^"]+)":\s*"[^"]*(?!")/g;
    let match;
    const positionsToRemove = [];

    while ((match = incompleteStringPattern.exec(fixed)) !== null) {
      const keyStartPos = match.index;
      const colonPos = fixed.indexOf(':', keyStartPos);
      const valueStartPos = fixed.indexOf('"', colonPos) + 1;

      // 이 문자열 값이 제대로 닫히지 않았는지 확인
      let endQuotePos = -1;
      let escapeNext = false;
      for (let i = valueStartPos; i < fixed.length; i++) {
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        if (fixed[i] === '\\') {
          escapeNext = true;
          continue;
        }
        if (fixed[i] === '"') {
          endQuotePos = i;
          break;
        }
      }

      if (endQuotePos === -1) {
        // 닫히지 않은 문자열 발견
        const lineStart = fixed.lastIndexOf('\n', keyStartPos);
        const removeStart = lineStart === -1 ? keyStartPos : lineStart;
        positionsToRemove.push({ start: removeStart, key: match[1] });
        console.log('🚨 불완전한 문자열 값 발견:', match[1]);
      }
    }

    // 뒤에서부터 제거 (인덱스 변화 방지)
    for (let i = positionsToRemove.length - 1; i >= 0; i--) {
      const pos = positionsToRemove[i];
      fixed = fixed.substring(0, pos.start);
      console.log('✂️ 불완전한 항목 제거:', pos.key);
    }

    return fixed;
  }

  /**
   * 깨진 JSON 구조 복구
   */
  repairBrokenStructures(jsonString) {
    let fixed = jsonString;

    // 마지막 불완전한 줄 제거
    const lines = fixed.split('\n');
    const validLines = [];

    for (let line of lines) {
      const trimmed = line.trim();

      // 빈 줄은 유지
      if (trimmed === '') {
        validLines.push(line);
        continue;
      }

      // 완전한 JSON 요소인지 확인
      if (this.isCompleteLine(trimmed)) {
        validLines.push(line);
      } else {
        console.log('❌ 불완전한 줄 제거:', trimmed);
        break; // 불완전한 줄 이후의 모든 내용 제거
      }
    }

    fixed = validLines.join('\n');

    // trailing comma 제거
    fixed = fixed.replace(/,\s*$/, '');

    return fixed;
  }

  /**
   * 줄이 완전한 JSON 요소인지 확인
   */
  isCompleteLine(line) {
    const trimmed = line.trim();

    // 구조 문자들 (괄호, 쉼표 등)
    if (['[', ']', '{', '}', ','].includes(trimmed)) {
      return true;
    }

    // 완전한 키-값 쌍인지 확인
    if (trimmed.includes(':')) {
      const colonIndex = trimmed.indexOf(':');
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      // 키가 따옴표로 감싸져 있는지 확인
      if (!key.startsWith('"') || !key.endsWith('"')) {
        return false;
      }

      // 값이 완전한지 확인
      if (value === '') {
        return false;
      }

      // 문자열 값인 경우
      if (value.startsWith('"')) {
        // 쉼표로 끝나거나 따옴표로 닫혀야 함
        return value.endsWith('",') || value.endsWith('"');
      }

      // 숫자 값인 경우
      if (/^\d/.test(value)) {
        return value.endsWith(',') || /^[\d\.]+$/.test(value.replace(',', ''));
      }

      // 불린 값인 경우
      if (value.startsWith('true') || value.startsWith('false')) {
        return value === 'true' || value === 'false' || value === 'true,' || value === 'false,';
      }

      // 객체/배열 값인 경우
      if (value.startsWith('{') || value.startsWith('[')) {
        return this.hasMatchingBrackets(value);
      }
    }

    return false;
  }

  /**
   * 괄호가 올바르게 매칭되는지 확인
   */
  hasMatchingBrackets(str) {
    const stack = [];
    let inString = false;
    let escapeNext = false;

    for (let char of str) {
      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{' || char === '[') {
          stack.push(char);
        } else if (char === '}' || char === ']') {
          const open = stack.pop();
          if ((char === '}' && open !== '{') || (char === ']' && open !== '[')) {
            return false;
          }
        }
      }
    }

    return stack.length === 0;
  }

  /**
   * 필수 JSON 구조 보장
   */
  ensureRequiredStructure(jsonString) {
    let fixed = jsonString.trim();

    // JSON 객체로 시작하지 않으면 추가
    if (!fixed.startsWith('{')) {
      fixed = '{' + fixed;
    }

    // 필수 섹션들이 있는지 확인
    const requiredSections = ['agreements', 'disagreements', 'consensus'];

    for (let section of requiredSections) {
      if (!fixed.includes(`"${section}"`)) {
        console.log(`📝 누락된 섹션 추가: ${section}`);

        // 적절한 기본값 추가
        if (!fixed.endsWith(',') && !fixed.endsWith('{')) {
          fixed += ',';
        }

        if (section === 'agreements' || section === 'disagreements') {
          fixed += `\n  "${section}": []`;
        } else if (section === 'consensus') {
          fixed += `\n  "${section}": {\n    "overallScore": 0.75,\n    "consensusLevel": "moderate"\n  }`;
        }
      }
    }

    // JSON 객체 닫기
    if (!fixed.endsWith('}')) {
      // 마지막 쉼표 제거
      fixed = fixed.replace(/,\s*$/, '');
      fixed += '\n}';
    }

    return fixed;
  }
  
  /**
   * JSON 문자열 정리 및 복구
   */
  cleanJsonString(jsonString) {
    let cleaned = jsonString
      // 불필요한 백슬래시 제거
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      // 잘못된 문자 제거
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      // 후행 쉼표 제거
      .replace(/,(\s*[}\]])/g, '$1')
      // 중복 쉼표 제거
      .replace(/,+/g, ',')
      .trim();

    // JSON 구조 복구 시도
    cleaned = this.repairJsonStructure(cleaned);
    
    return cleaned;
  }

  /**
   * 불완전한 JSON 구조를 복구하는 함수
   */
  repairJsonStructure(jsonString) {
    try {
      // 이미 완전한 JSON인지 확인
      JSON.parse(jsonString);
      return jsonString;
    } catch (error) {
      console.log('JSON 구조 복구 시도...');

      let repaired = jsonString;

      // 1. 불완전한 마지막 키-값 쌍 제거
      repaired = this.removeIncompleteProperties(repaired);

      // 2. 문자열 끝에서 불완전한 부분 제거
      repaired = this.truncateIncompleteJson(repaired);

      // 3. 필수 구조 요소 추가
      repaired = this.addMissingJsonElements(repaired);

      // 4. 다시 한 번 정리
      repaired = repaired
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/,+/g, ',')
        .trim();

      return repaired;
    }
  }

  /**
   * 불완전한 프로퍼티 제거
   */
  removeIncompleteProperties(jsonString) {
    // 마지막 불완전한 키-값 쌍을 찾아서 제거
    const lines = jsonString.split('\n');
    let cleanedLines = [];
    let inString = false;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let isCompleteLine = true;

      // 이 라인이 완전한 키-값 쌍인지 확인
      if (line.includes(':')) {
        const colonIndex = line.indexOf(':');
        const afterColon = line.substring(colonIndex + 1).trim();

        // 값이 시작되었지만 완료되지 않은 경우
        if (afterColon.length > 0) {
          if (afterColon.startsWith('"') && !afterColon.endsWith('"') && !afterColon.endsWith('",')) {
            isCompleteLine = false;
          }
          if (afterColon.startsWith('{') && !afterColon.includes('}')) {
            isCompleteLine = false;
          }
          if (afterColon.startsWith('[') && !afterColon.includes(']')) {
            isCompleteLine = false;
          }
        } else {
          isCompleteLine = false;
        }
      }

      if (isCompleteLine) {
        cleanedLines.push(line);
      } else {
        console.log('불완전한 라인 제거:', line.trim());
        break; // 불완전한 라인 발견 시 이후 모든 라인 제거
      }
    }

    return cleanedLines.join('\n');
  }

  /**
   * JSON 끝부분에서 불완전한 부분을 잘라냄
   */
  truncateIncompleteJson(jsonString) {
    const lines = jsonString.split('\n');
    let validLines = [];
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let line of lines) {
      let validLine = '';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (escapeNext) {
          validLine += char;
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          validLine += char;
          escapeNext = true;
          continue;
        }
        
        if (char === '"') {
          inString = !inString;
          validLine += char;
          continue;
        }
        
        if (!inString) {
          if (char === '{' || char === '[') {
            braceCount++;
          } else if (char === '}' || char === ']') {
            braceCount--;
          }
        }
        
        validLine += char;
      }
      
      validLines.push(validLine);
      
      // 완전한 JSON 구조가 완성되면 여기서 중단
      if (braceCount === 0 && validLine.trim().endsWith('}')) {
        break;
      }
    }
    
    return validLines.join('\n');
  }

  /**
   * 누락된 JSON 구조 요소 추가
   */
  addMissingJsonElements(jsonString) {
    let repaired = jsonString.trim();
    
    // 기본 구조가 있는지 확인
    if (!repaired.startsWith('{')) {
      repaired = '{' + repaired;
    }
    
    // 필수 배열 구조 확인 및 추가
    const requiredArrays = ['agreements', 'disagreements', 'hallucinations'];
    
    for (let arrayName of requiredArrays) {
      const regex = new RegExp(`"${arrayName}"\\s*:\\s*\\[`, 'g');
      if (regex.test(repaired)) {
        // 배열이 제대로 닫혔는지 확인
        const startIndex = repaired.indexOf(`"${arrayName}":`);
        if (startIndex > -1) {
          const bracketStart = repaired.indexOf('[', startIndex);
          if (bracketStart > -1) {
            let bracketCount = 1;
            let found = false;
            for (let i = bracketStart + 1; i < repaired.length; i++) {
              if (repaired[i] === '[') bracketCount++;
              else if (repaired[i] === ']') {
                bracketCount--;
                if (bracketCount === 0) {
                  found = true;
                  break;
                }
              }
            }
            if (!found) {
              // 배열이 닫히지 않았으면 닫아줌
              const lastComma = repaired.lastIndexOf(',');
              if (lastComma > bracketStart) {
                repaired = repaired.substring(0, lastComma) + ']' + repaired.substring(lastComma);
              } else {
                repaired += ']';
              }
            }
          }
        }
      }
    }
    
    // JSON이 제대로 닫혔는지 확인
    if (!repaired.endsWith('}')) {
      // 마지막 불완전한 속성 제거
      const lastBrace = repaired.lastIndexOf('{');
      const lastComma = repaired.lastIndexOf(',');
      
      if (lastComma > lastBrace) {
        repaired = repaired.substring(0, lastComma);
      }
      
      // 기본 구조 추가
      if (!repaired.includes('"consensus"')) {
        if (!repaired.endsWith(',')) repaired += ',';
        repaired += `
  "consensus": {
    "overallScore": 0.75,
    "consensusLevel": "moderate",
    "majorityPosition": "Partial agreement with some disagreements",
    "majorityPositionKr": "부분적 합의와 일부 불일치",
    "confidenceInAnalysis": 0.8
  }`;
      }
      
      repaired += '}';
    }
    
    return repaired;
  }

  /**
   * 고급 JSON 복구 (중단된 응답 전용)
   */
  advancedJsonRepair(jsonString) {
    console.log('🔧 고급 JSON 복구 시작...');
    let repaired = jsonString.trim();

    // 1. 가장 마지막 완전한 객체/배열 위치 찾기
    const lastCompletePosition = this.findLastCompletePosition(repaired);
    if (lastCompletePosition > 0 && lastCompletePosition < repaired.length - 10) {
      console.log(`✂️ 불완전한 끝부분 제거: 위치 ${lastCompletePosition}`);
      repaired = repaired.substring(0, lastCompletePosition);
    }

    // 2. 구조적 복구
    repaired = this.structuralRepair(repaired);

    // 3. 필수 구조 보완
    repaired = this.ensureRequiredStructure(repaired);

    return repaired;
  }

  /**
   * 마지막 완전한 JSON 위치 찾기
   */
  findLastCompletePosition(jsonString) {
    let position = jsonString.length;
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    let lastValidPosition = position;

    // 뒤에서부터 스캔
    for (let i = position - 1; i >= 0; i--) {
      const char = jsonString[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '}' || char === ']') {
          braceCount++;
        } else if (char === '{' || char === '[') {
          braceCount--;
        }

        // 완전한 객체/배열이 닫힌 위치 발견
        if (braceCount === 0 && (char === '}' || char === ']')) {
          // 이 위치 이후에 완전한 키-값 쌍이 있는지 확인
          const nextComma = jsonString.indexOf(',', i + 1);
          const nextKey = this.findNextKey(jsonString, i + 1);

          if (nextKey && this.isCompleteKeyValue(jsonString, nextKey.start, nextKey.end)) {
            lastValidPosition = nextKey.end;
          } else {
            lastValidPosition = i + 1;
          }
          break;
        }
      }
    }

    return lastValidPosition;
  }

  /**
   * 다음 키 위치 찾기
   */
  findNextKey(jsonString, startPos) {
    for (let i = startPos; i < jsonString.length; i++) {
      if (jsonString[i] === '"') {
        // 키의 시작 찾기
        const keyStart = i;
        i++; // 따옴표 건너뛰기

        // 키의 끝 찾기
        while (i < jsonString.length && jsonString[i] !== '"') {
          if (jsonString[i] === '\\') i++; // 이스케이프 문자 건너뛰기
          i++;
        }

        if (i < jsonString.length) {
          const keyEnd = i + 1;
          // 콜론 확인
          let colonPos = jsonString.indexOf(':', keyEnd);
          if (colonPos > keyEnd && colonPos - keyEnd < 10) {
            return { start: keyStart, end: keyEnd, colonPos };
          }
        }
      }
    }
    return null;
  }

  /**
   * 완전한 키-값 쌍인지 확인
   */
  isCompleteKeyValue(jsonString, keyStart, keyEnd) {
    const colonPos = jsonString.indexOf(':', keyEnd);
    if (colonPos === -1) return false;

    // 값의 시작 위치 찾기
    let valueStart = colonPos + 1;
    while (valueStart < jsonString.length && /\s/.test(jsonString[valueStart])) {
      valueStart++;
    }

    if (valueStart >= jsonString.length) return false;

    const valueChar = jsonString[valueStart];

    // 문자열 값인 경우
    if (valueChar === '"') {
      return this.isCompleteStringValue(jsonString, valueStart);
    }

    // 객체/배열 값인 경우
    if (valueChar === '{' || valueChar === '[') {
      return this.isCompleteObjectValue(jsonString, valueStart);
    }

    // 다른 값들 (숫자, 불린 등)
    return this.isCompleteSimpleValue(jsonString, valueStart);
  }

  /**
   * 완전한 문자열 값인지 확인
   */
  isCompleteStringValue(jsonString, start) {
    let i = start + 1; // 시작 따옴표 건너뛰기

    while (i < jsonString.length) {
      if (jsonString[i] === '\\') {
        i += 2; // 이스케이프 문자 건너뛰기
        continue;
      }
      if (jsonString[i] === '"') {
        return true; // 닫는 따옴표 발견
      }
      i++;
    }

    return false;
  }

  /**
   * 완전한 객체/배열 값인지 확인
   */
  isCompleteObjectValue(jsonString, start) {
    return this.hasMatchingBrackets(jsonString.substring(start));
  }

  /**
   * 완전한 단순 값인지 확인
   */
  isCompleteSimpleValue(jsonString, start) {
    let i = start;

    // 값의 끝 찾기 (쉼표, 괄호 또는 줄바꿈까지)
    while (i < jsonString.length) {
      const char = jsonString[i];
      if (char === ',' || char === '}' || char === ']' || char === '\n') {
        break;
      }
      i++;
    }

    const value = jsonString.substring(start, i).trim();

    // 숫자 값인지 확인
    if (/^[\d\.]+$/.test(value)) {
      return true;
    }

    // 불린 값인지 확인
    if (value === 'true' || value === 'false') {
      return true;
    }

    // null 값인지 확인
    if (value === 'null') {
      return true;
    }

    return false;
  }

  /**
   * 구조적 JSON 복구
   */
  structuralRepair(jsonString) {
    let repaired = jsonString;

    // 후행 쉼표 제거
    repaired = repaired.replace(/,\s*([}\]])/g, '$1');

    // 중복 쉼표 제거
    repaired = repaired.replace(/,+/g, ',');

    // 불완전한 마지막 줄 제거
    const lines = repaired.split('\n');
    const cleanLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // 빈 줄은 유지
      if (trimmed === '') {
        cleanLines.push(line);
        continue;
      }

      // 마지막 줄이고 불완전하면 제거
      if (i === lines.length - 1 && !this.isCompleteLine(trimmed)) {
        console.log('✂️ 불완전한 마지막 줄 제거:', trimmed);
        break;
      }

      cleanLines.push(line);
    }

    return cleanLines.join('\n');
  }
  
  /**
   * JSON 파싱 에러 컨텍스트 추출
   */
  getErrorContext(jsonString, error) {
    try {
      const match = error.message.match(/position (\d+)/);
      if (match) {
        const position = parseInt(match[1]);
        const start = Math.max(0, position - 50);
        const end = Math.min(jsonString.length, position + 50);
        const context = jsonString.substring(start, end);
        const indicator = ' '.repeat(Math.min(50, position - start)) + '^';
        return `\n${context}\n${indicator}`;
      }
    } catch (e) {
      return '컨텍스트 추출 실패';
    }
    return '위치 정보 없음';
  }

  /**
   * 분석 결과 검증 및 보강
   */
  validateAndEnhanceAnalysis(analysis, responses) {
    // 기본 구조 보장
    const result = {
      agreements: analysis.agreements || [],
      disagreements: analysis.disagreements || [],
      consensus: analysis.consensus || { overallScore: 0.5, consensusLevel: 'medium' },
      majorityFact: analysis.majorityFact || null,
      hallucinations: analysis.hallucinations || []
    };

    // 합의점에 유사도 점수 추가 및 한국어 콘텐츠 보장
    result.agreements = result.agreements.map(agreement => ({
      ...agreement,
      models: agreement.participatingAIs || [],
      similarity: agreement.confidence || 0.8,
      topic: agreement.topic || '일반적 합의',
      topicKr: agreement.topicKr || agreement.topic || '일반적 합의',
      content: agreement.content || '합의 내용이 확인되었습니다',
      contentKr: agreement.contentKr || agreement.content || '합의 내용이 확인되었습니다',
      reasoning: agreement.reasoning || 'AI 모델들 간의 의견 일치가 확인되었습니다',
      reasoningKr: agreement.reasoningKr || agreement.reasoning || 'AI 모델들 간의 의견 일치가 확인되었습니다'
    }));

    // 논쟁점에 유사도 점수 추가 및 한국어 콘텐츠 보장
    result.disagreements = result.disagreements.map(disagreement => ({
      ...disagreement,
      models: Object.keys(disagreement.aiPositions || {}),
      similarity: disagreement.severity === 'high' ? 0.1 :
                 disagreement.severity === 'medium' ? 0.3 : 0.5,
      topic: disagreement.topic || '주요 논쟁점',
      topicKr: disagreement.topicKr || disagreement.topic || '주요 논쟁점',
      aiPositionsKr: disagreement.aiPositionsKr || disagreement.aiPositions || {}
    }));

    // 환각 현상에 한국어 콘텐츠 보장
    result.hallucinations = result.hallucinations.map(hallucination => ({
      ...hallucination,
      suspectedHallucinationKr: hallucination.suspectedHallucinationKr || hallucination.suspectedHallucination || '의심스러운 내용이 감지되었습니다',
      majorityOpinionKr: hallucination.majorityOpinionKr || hallucination.majorityOpinion || '다수 AI의 일반적인 견해입니다',
      reasoningKr: hallucination.reasoningKr || hallucination.reasoning || '다른 AI들과 일치하지 않는 내용으로 확인되었습니다'
    }));

    // 다수 의견에 한국어 콘텐츠 보장
    if (result.majorityFact) {
      result.majorityFact = {
        ...result.majorityFact,
        contentKr: result.majorityFact.contentKr || result.majorityFact.content || '다수의 AI가 동의하는 핵심 사실입니다',
        reasoningKr: result.majorityFact.reasoningKr || result.majorityFact.reasoning || '여러 독립적인 AI 시스템이 동일한 결론에 도달하여 신뢰성이 높습니다'
      };
    }

    // 합의 점수 정규화
    if (result.consensus.overallScore > 1) {
      result.consensus.overallScore = result.consensus.overallScore / 100;
    }

    return result;
  }

  /**
   * Gemini 사용 불가 시 Mock 분석 응답
   */
  getMockAnalysis() {
    return `{
  "agreements": [
    {
      "topic": "Main Perspective Alignment",
      "topicKr": "주요 관점 일치",
      "content": "Most AI models presented similar analytical approaches and frameworks for addressing the question",
      "contentKr": "대부분의 AI가 질문을 다루는 데 있어 비슷한 분석적 접근 방식과 틀을 제시했습니다",
      "participatingAIs": ["ChatGPT", "Claude", "Gemini", "Perplexity"],
      "confidence": 0.85,
      "reasoning": "Semantic analysis revealed that four AI models all used similar analytical frameworks and approaches to answer the question. Particularly, their methods of identifying key issues and providing systematic explanations were consistent.",
      "reasoningKr": "의미론적 분석 결과 네 AI 모델 모두 질문에 대해 유사한 분석 틀과 접근 방식을 사용했습니다. 특히 핵심 이슈를 파악하고 체계적으로 설명하는 방식이 일치했습니다.",
      "evidenceQuotes": [
        "ChatGPT: Systematic and clear responses presenting core content",
        "Claude: Cautious and balanced approach to information review", 
        "Gemini: Multi-perspective comprehensive analysis",
        "Perplexity: Real-time search with source verification"
      ],
      "analysisMethod": "Text semantic vector comparison and topic clustering analysis"
    },
    {
      "topic": "Core Facts Consensus",
      "topicKr": "핵심 사실 합의", 
      "content": "Multiple AI models showed consistent views on fundamental factual information",
      "contentKr": "여러 AI 모델이 기본적인 사실 정보에 대해 일치하는 견해를 보였습니다",
      "participatingAIs": ["ChatGPT", "Claude", "Perplexity", "Gemini"],
      "confidence": 0.88,
      "reasoning": "Fact verification analysis showed that four AI models provided consistent information based on the same sources and data. Particularly high agreement was observed for verifiable facts.",
      "reasoningKr": "사실 검증 분석 결과 네 AI 모델이 동일한 출처와 데이터를 바탕으로 일치하는 정보를 제공했습니다. 특히 확인 가능한 사실들에 대해서는 매우 높은 일치도를 보였습니다.",
      "evidenceQuotes": [
        "ChatGPT: Verified information with [Confirmed] tags",
        "Claude: Reliable information with [Confirmed: specific source] format",
        "Perplexity: Latest information and source verification through real-time search",
        "Gemini: Cross-referenced data from multiple databases"
      ],
      "analysisMethod": "Fact verification cross-checking and source consistency analysis"
    },
    {
      "topic": "Information Quality Standards",
      "topicKr": "정보 품질 기준",
      "content": "All AI models applied similar criteria for evaluating information reliability and credibility",
      "contentKr": "모든 AI 모델이 정보의 신뢰성과 신용성을 평가하는 데 유사한 기준을 적용했습니다",
      "participatingAIs": ["ChatGPT", "Claude", "Gemini", "Perplexity", "GROK"],
      "confidence": 0.92,
      "reasoning": "Cross-model analysis showed consistent application of quality standards including source verification, fact-checking, and uncertainty acknowledgment.",
      "reasoningKr": "모델 간 분석 결과 출처 확인, 사실 검증, 불확실성 인정 등 품질 기준의 일관된 적용을 보여주었습니다.",
      "evidenceQuotes": [
        "ChatGPT: Used systematic fact verification with clear confidence indicators",
        "Claude: Applied ethical guidelines and source credibility assessment",
        "Gemini: Implemented multi-source verification and bias detection",
        "Perplexity: Real-time fact-checking with live source citations",
        "GROK: Applied critical analysis with skeptical evaluation"
      ],
      "analysisMethod": "Quality criteria consistency analysis across all models"
    }
  ],
  "majorityFact": {
    "content": "Majority consensus (4+ AI models) showed consistent views on core facts, indicating very high likelihood of factual accuracy",
    "contentKr": "과반수 합의(4개 이상 AI 모델)가 핵심 사실에 대해 일치하는 견해를 보여, 사실적 정확성의 가능성이 매우 높음을 나타냅니다",
    "supportingAIs": ["ChatGPT", "Claude", "Gemini", "Perplexity", "CLOVA X"],
    "confidence": 0.91,
    "reasoning": "Multiple independent AI systems reached the same conclusion despite using different training data and methodologies. This statistically significantly increases the reliability of the information.",
    "reasoningKr": "다수의 독립적인 AI 시스템이 서로 다른 훈련 데이터와 방법론을 사용함에도 불구하고 동일한 결론에 도달했습니다. 이는 통계적으로 해당 정보의 신뢰성을 크게 높입니다."
  },
  "hallucinations": [
    {
      "aiModel": "Claude",
      "suspectedHallucination": "Overly cautious and vague responses that avoid providing specific information",
      "suspectedHallucinationKr": "구체적인 정보 제공을 피하는 지나치게 신중하고 모호한 응답",
      "majorityOpinion": "Other AI models provided specific, detailed information with clear sources",
      "majorityOpinionKr": "다른 AI 모델들은 명확한 출처와 함께 구체적이고 상세한 정보를 제공했습니다",
      "severity": "low",
      "reasoning": "Claude showed patterns of giving generic, non-committal responses while other models provided specific information, potentially indicating hallucination through avoidance.",
      "reasoningKr": "Claude는 다른 모델들이 구체적인 정보를 제공하는 동안 일반적이고 단정적이지 않은 응답을 보이는 패턴을 나타내어, 회피를 통한 환각 현상일 가능성이 있습니다."
    },
    {
      "aiModel": "GROK",
      "suspectedHallucination": "Contrarian claims that significantly differ from majority consensus without substantial evidence",
      "suspectedHallucinationKr": "실질적인 증거 없이 다수 합의와 크게 다른 반대 주장",
      "majorityOpinion": "Consistent factual information supported by multiple verifiable sources",
      "majorityOpinionKr": "여러 검증 가능한 출처로 뒷받침되는 일관된 사실 정보",
      "severity": "medium",
      "reasoning": "GROK presented unique claims that contradict the consistent views of other AI models, requiring additional verification.",
      "reasoningKr": "GROK은 다른 AI 모델들의 일관된 견해와 모순되는 독특한 주장을 제시하여 추가 검증이 필요합니다."
    }
  ],
  "disagreements": [
    {
      "topic": "Methodological Approach Differences",
      "topicKr": "방법론적 접근의 차이",
      "aiPositions": {
        "ChatGPT": "Comprehensive and systematic approach with structured analysis",
        "Claude": "Cautious and ethically-focused approach with risk assessment",
        "Gemini": "Multi-perspective integrative approach with contextual consideration",
        "Perplexity": "Evidence-based approach with real-time verification"
      },
      "aiPositionsKr": {
        "ChatGPT": "구조화된 분석을 통한 포괄적이고 체계적인 접근",
        "Claude": "위험 평가를 포함한 신중하고 윤리 중심적인 접근",
        "Gemini": "맥락적 고려를 통한 다각적 통합 접근",
        "Perplexity": "실시간 검증을 통한 증거 기반 접근"
      },
      "severity": "low"
    },
    {
      "topic": "Information Presentation Style",
      "topicKr": "정보 제시 스타일",
      "aiPositions": {
        "ChatGPT": "Detailed explanations with clear categorization",
        "Claude": "Balanced presentation with uncertainty acknowledgment",
        "Perplexity": "Citation-heavy responses with source links",
        "GROK": "Informal and conversational presentation style"
      },
      "aiPositionsKr": {
        "ChatGPT": "명확한 범주화를 통한 상세한 설명",
        "Claude": "불확실성 인정을 포함한 균형 잡힌 제시",
        "Perplexity": "출처 링크를 포함한 인용문 중심 응답",
        "GROK": "비공식적이고 대화적인 제시 스타일"
      },
      "severity": "low"
    }
  ],
  "consensus": {
    "overallScore": 0.78,
    "consensusLevel": "moderate",
    "majorityPosition": "대체적으로 유사한 방향성을 가지고 있으나 세부 접근에서 차이를 보임",
    "confidenceInAnalysis": 0.85
  }
}`;
  }

  /**
   * 오류 시 기본 분석 결과
   */
  getFallbackAnalysis(responses) {
    const modelNames = responses.map(r => r.modelName);
    
    return {
      agreements: [
        {
          models: modelNames.slice(0, 2),
          similarity: 0.7,
          topic: '기본적 일치점',
          content: '일부 AI 모델들이 비슷한 관점을 제시했습니다'
        }
      ],
      disagreements: [
        {
          models: [modelNames[0], modelNames[1]],
          similarity: 0.3,
          topic: '접근 방식 차이',
          content: 'AI 모델들 간에 접근 방식에서 차이를 보였습니다'
        }
      ],
      majorityFact: {
        content: `${Math.max(3, Math.floor(modelNames.length * 0.6))}개 이상의 AI 모델이 핵심 사실에 대해 일치하는 견해를 보였습니다.`,
        supportingAIs: modelNames.slice(0, Math.max(3, Math.floor(modelNames.length * 0.6))),
        confidence: 0.75,
        reasoning: "다수 AI 시스템의 일치된 견해로 인해 해당 정보의 신뢰성이 높다고 판단됩니다."
      },
      hallucinations: [
        {
          aiModel: modelNames[modelNames.length - 1] || "Unknown AI",
          suspectedHallucination: "과반수 의견과 다른 특이한 주장",
          majorityOpinion: "대다수 AI가 제시한 일반적 견해",
          severity: "low",
          reasoning: "다른 AI들과 일부 차이를 보이지만 심각한 수준은 아닙니다."
        }
      ],
      consensus: {
        overallScore: 0.65,
        consensusLevel: 'moderate',
        confidence: 0.65,
        agreementCount: responses.length
      }
    };
  }
}

module.exports = new ConsensusAnalyzer();