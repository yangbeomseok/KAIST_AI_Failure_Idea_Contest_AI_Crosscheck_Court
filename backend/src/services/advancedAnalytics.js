const crypto = require('crypto');

/**
 * 고급 AI 응답 분석 및 신뢰도 계산 시스템
 * - 의미론적 분석
 * - 사실 검증 
 * - 출처 품질 평가
 * - 논쟁점 차이도 계산
 */
class AdvancedAnalytics {
  constructor() {
    // 신뢰도 가중치 설정 (출처 품질 우선)
    this.weights = {
      sourceReliability: 0.35,   // 출처 신뢰도 (가장 중요)
      factualAccuracy: 0.25,     // 사실 정확성
      contentQuality: 0.2,       // 내용 품질
      logicalCoherence: 0.12,    // 논리적 일관성
      uncertaintyHandling: 0.08  // 불확실성 처리
    };

    // 논쟁 심각도 임계값
    this.controversyThresholds = {
      factual: 0.8,     // 사실 관련 논쟁
      opinion: 0.6,     // 의견 관련 논쟁  
      methodology: 0.7, // 방법론 관련 논쟁
      ethical: 0.9      // 윤리적 논쟁
    };

    // 출처 신뢰도 데이터베이스
    this.sourceReliability = {
      'academic': 0.9,
      'government': 0.85,
      'news_tier1': 0.8,
      'news_tier2': 0.7,
      'wiki': 0.65,
      'blog': 0.4,
      'social': 0.3,
      'unknown': 0.5
    };
  }

  /**
   * 고급 신뢰도 계산 (기존 단순 계산 대체)
   * @param {string} response - AI 응답 텍스트
   * @param {string} modelId - AI 모델 식별자
   * @param {Object} context - 추가 컨텍스트 정보
   * @returns {Object} 상세 신뢰도 분석 결과
   */
  calculateAdvancedConfidence(response, modelId, context = {}) {
    if (!response) return this.getZeroConfidenceResult();

    const analysis = {
      contentQuality: this.analyzeContentQuality(response),
      sourceReliability: this.analyzeSourceReliability(response),
      factualAccuracy: this.analyzeFacetualAccuracy(response, context),
      logicalCoherence: this.analyzeLogicalCoherence(response),
      uncertaintyHandling: this.analyzeUncertaintyHandling(response),
      modelSpecificFactors: this.getModelSpecificFactors(modelId)
    };

    const weightedScore = this.calculateWeightedScore(analysis);
    const adjustedScore = this.applyModelSpecificAdjustments(weightedScore, analysis.modelSpecificFactors);

    return {
      overallScore: adjustedScore,
      breakdown: analysis,
      confidenceLevel: this.getConfidenceLevel(adjustedScore),
      detailedMetrics: this.generateDetailedMetrics(analysis),
      warnings: this.generateConfidenceWarnings(analysis)
    };
  }

  /**
   * 내용 품질 분석
   * - 구체성, 명확성, 완성도 평가
   */
  analyzeContentQuality(response) {
    const metrics = {
      specificity: this.calculateSpecificity(response),
      clarity: this.calculateClarity(response),
      completeness: this.calculateCompleteness(response),
      coherence: this.calculateTextCoherence(response)
    };

    const qualityScore = (metrics.specificity * 0.3 + 
                         metrics.clarity * 0.3 + 
                         metrics.completeness * 0.2 + 
                         metrics.coherence * 0.2);

    return {
      score: qualityScore,
      metrics: metrics,
      indicators: this.getQualityIndicators(response)
    };
  }

  /**
   * 출처 신뢰도 분석
   * - 인용문 추출 및 평가
   */
  analyzeSourceReliability(response) {
    const sources = this.extractSources(response);
    const citations = this.extractCitations(response);
    
    let totalReliability = 0;
    let sourceCount = 0;
    let bonusScore = 0;

    sources.forEach(source => {
      const reliability = this.getSourceReliability(source);
      totalReliability += reliability;
      sourceCount++;
    });

    // 출처 개수에 따른 보너스 점수 (많을수록 신뢰도 증가)
    if (sourceCount >= 5) bonusScore += 0.15;
    else if (sourceCount >= 3) bonusScore += 0.1;
    else if (sourceCount >= 1) bonusScore += 0.05;

    // URL이 있으면 추가 점수
    const urlCount = sources.filter(s => s.startsWith('http')).length;
    if (urlCount > 0) bonusScore += urlCount * 0.05;

    // 연구/통계 언급이 있으면 추가 점수  
    const studyMentions = sources.filter(s => 
      /(연구|논문|보고서|통계|조사)/.test(s)
    ).length;
    if (studyMentions > 0) bonusScore += studyMentions * 0.03;

    const avgReliability = sourceCount > 0 ? totalReliability / sourceCount : this.sourceReliability.unknown;
    const finalScore = Math.min(1, avgReliability + bonusScore);
    
    return {
      score: finalScore,
      sourcesFound: sources,
      citationsFound: citations,
      sourceCount: sourceCount,
      urlCount: urlCount,
      bonusScore: bonusScore,
      reliabilityBreakdown: sources.map(s => ({
        source: s,
        type: this.classifySourceType(s),
        reliability: this.getSourceReliability(s)
      }))
    };
  }

  /**
   * 사실 정확성 분석
   * - 검증 가능한 주장 식별
   * - 모순 탐지
   */
  analyzeFacetualAccuracy(response, context) {
    const factualClaims = this.extractFactualClaims(response);
    const contradictions = this.detectContradictions(response);
    const verifiability = this.assessVerifiability(factualClaims);

    const accuracyScore = Math.max(0, 1 - (contradictions.length * 0.2) - (1 - verifiability));

    return {
      score: accuracyScore,
      factualClaims: factualClaims,
      contradictions: contradictions,
      verifiability: verifiability,
      riskFactors: this.identifyFactualRiskFactors(response)
    };
  }

  /**
   * 논리적 일관성 분석
   */
  analyzeLogicalCoherence(response) {
    const logicalFlow = this.analyzeLogicalFlow(response);
    const argumentStructure = this.analyzeArgumentStructure(response);
    const consistency = this.checkInternalConsistency(response);

    const coherenceScore = (logicalFlow * 0.4 + argumentStructure * 0.3 + consistency * 0.3);

    return {
      score: coherenceScore,
      logicalFlow: logicalFlow,
      argumentStructure: argumentStructure,
      consistency: consistency
    };
  }

  /**
   * 불확실성 처리 분석
   */
  analyzeUncertaintyHandling(response) {
    const uncertaintyMarkers = this.findUncertaintyMarkers(response);
    const confidenceExpressions = this.findConfidenceExpressions(response);
    const hedging = this.analyzeHedging(response);

    // 불확실성을 적절히 표현하면 높은 점수
    const uncertaintyScore = this.evaluateUncertaintyHandling(uncertaintyMarkers, confidenceExpressions, hedging);

    return {
      score: uncertaintyScore,
      uncertaintyMarkers: uncertaintyMarkers,
      confidenceExpressions: confidenceExpressions,
      hedgingLevel: hedging,
      appropriateness: uncertaintyScore > 0.7 ? 'appropriate' : 'needs_improvement'
    };
  }

  /**
   * 다차원 합의 알고리즘
   * 기존 단순 유사도 비교를 다차원 분석으로 대체
   */
  calculateMultiDimensionalConsensus(responses) {
    const dimensions = {
      factual: this.analyzeFactualConsensus(responses),
      methodological: this.analyzeMethodologicalConsensus(responses), 
      ethical: this.analyzeEthicalConsensus(responses),
      confidence: this.analyzeConfidenceConsensus(responses),
      sources: this.analyzeSourceConsensus(responses)
    };

    const overallConsensus = this.calculateOverallConsensus(dimensions);
    const controversialAreas = this.identifyControversialAreas(dimensions);

    return {
      overallScore: overallConsensus,
      dimensionalBreakdown: dimensions,
      controversialAreas: controversialAreas,
      consensusLevel: this.getConsensusLevel(overallConsensus),
      agreementMatrix: this.generateAgreementMatrix(responses),
      disagementDetails: this.analyzeDisagreements(responses)
    };
  }

  /**
   * 논쟁점 차이도 계산 시스템
   */
  calculateControversyScore(responses) {
    const controversies = [];
    
    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        const controversy = this.analyzeControversyBetweenResponses(responses[i], responses[j]);
        if (controversy.score > 0.3) {  // 임계값 이상인 경우만 포함
          controversies.push(controversy);
        }
      }
    }

    return {
      overallScore: this.calculateOverallControversyScore(controversies),
      controversyDetails: controversies,
      controversyTypes: this.categorizeControversies(controversies),
      severityDistribution: this.getControversySeverityDistribution(controversies),
      resolutionSuggestions: this.generateResolutionSuggestions(controversies)
    };
  }

  /**
   * 두 응답 간의 논쟁 분석
   */
  analyzeControversyBetweenResponses(response1, response2) {
    const factualDisagreement = this.compareFactualClaims(response1, response2);
    const methodologicalDifference = this.compareMethodologies(response1, response2);
    const ethicalDifference = this.compareEthicalStances(response1, response2);
    const confidenceDifference = Math.abs(response1.confidence - response2.confidence);

    const controversyScore = this.calculateControversyScore({
      factual: factualDisagreement,
      methodological: methodologicalDifference,
      ethical: ethicalDifference,
      confidence: confidenceDifference
    });

    return {
      models: [response1.modelName, response2.modelName],
      score: controversyScore,
      type: this.determineControversyType(factualDisagreement, methodologicalDifference, ethicalDifference),
      severity: this.getControversySeverity(controversyScore),
      specificIssues: this.identifySpecificIssues(response1, response2),
      resolutionComplexity: this.assessResolutionComplexity(controversyScore, factualDisagreement)
    };
  }

  // ===== 보조 메소드들 =====

  calculateSpecificity(response) {
    const specificWords = ['구체적으로', '예를 들어', '정확히', '수치적으로', '통계에 따르면'];
    const specificWordCount = specificWords.filter(word => response.includes(word)).length;
    const numberCount = (response.match(/\d+/g) || []).length;
    
    return Math.min(1, (specificWordCount * 0.1) + (numberCount * 0.05) + 0.5);
  }

  calculateClarity(response) {
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    
    // 적절한 문장 길이 (10-25 단어)가 명확성을 높임
    const clarityScore = avgSentenceLength >= 10 && avgSentenceLength <= 25 ? 0.8 : 0.6;
    
    return clarityScore;
  }

  calculateCompleteness(response) {
    const hasIntroduction = /^.{0,100}(소개|개요|요약|정의)/.test(response);
    const hasConclusion = /(결론|요약|정리|마무리).{0,100}$/.test(response);
    const hasExamples = /(예를 들어|예시|사례|구체적으로)/.test(response);
    
    let completeness = 0.4;
    if (hasIntroduction) completeness += 0.2;
    if (hasConclusion) completeness += 0.2;  
    if (hasExamples) completeness += 0.2;
    
    return completeness;
  }

  extractSources(response) {
    const sources = [];
    
    // URL 패턴 (더 포괄적)
    const urlRegex = /https?:\/\/[^\s\)\]\}]+/g;
    const urls = response.match(urlRegex) || [];
    sources.push(...urls);
    
    // 인용 태그들 (더 다양한 패턴)
    const citationPatterns = [
      /\[(확인됨|출처|검증됨)[^\]]*\]/g,
      /\[출처:\s*[^\]]+\]/g,
      /출처:\s*[^\n\r.]+/g,
      /참고:\s*[^\n\r.]+/g,
      /\([^)]*\d{4}[^)]*\)/g  // (저자명, 2024) 형식
    ];
    
    citationPatterns.forEach(pattern => {
      const matches = response.match(pattern) || [];
      sources.push(...matches);
    });
    
    // Perplexity 특화 패턴 - 숫자 인덱스 [1], [2] 등
    const perplexityIndexes = response.match(/\[\d+\]/g) || [];
    sources.push(...perplexityIndexes);
    
    // 연구/보고서 언급 패턴
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

  extractCitations(response) {
    const citationPatterns = [
      /\[확인됨[^\]]*\]/g,
      /\[출처[^\]]*\]/g,
      /\([^)]*\d{4}[^)]*\)/g  // (저자, 2024) 형식
    ];
    
    let citations = [];
    citationPatterns.forEach(pattern => {
      const matches = response.match(pattern) || [];
      citations = citations.concat(matches);
    });
    
    return citations;
  }

  getSourceReliability(source) {
    if (source.includes('academic') || source.includes('.edu')) return this.sourceReliability.academic;
    if (source.includes('.gov')) return this.sourceReliability.government;
    if (source.includes('wikipedia')) return this.sourceReliability.wiki;
    if (source.includes('blog')) return this.sourceReliability.blog;
    
    return this.sourceReliability.unknown;
  }

  findUncertaintyMarkers(response) {
    const markers = ['아마도', '가능하게', '추정', '불확실', '확실하지 않은', '아마', '글쎄', '아닐까'];
    return markers.filter(marker => response.includes(marker));
  }

  getZeroConfidenceResult() {
    return {
      overallScore: 0,
      breakdown: {},
      confidenceLevel: 'none',
      detailedMetrics: {},
      warnings: ['No response provided']
    };
  }

  calculateWeightedScore(analysis) {
    return (analysis.contentQuality.score * this.weights.contentQuality +
            analysis.sourceReliability.score * this.weights.sourceReliability +
            analysis.factualAccuracy.score * this.weights.factualAccuracy +
            analysis.logicalCoherence.score * this.weights.logicalCoherence +
            analysis.uncertaintyHandling.score * this.weights.uncertaintyHandling);
  }

  getConfidenceLevel(score) {
    if (score >= 0.9) return 'very_high';
    if (score >= 0.7) return 'high'; 
    if (score >= 0.5) return 'medium';
    if (score >= 0.3) return 'low';
    return 'very_low';
  }

  generateDetailedMetrics(analysis) {
    return {
      contentQualityBreakdown: analysis.contentQuality.metrics,
      sourceAnalysis: analysis.sourceReliability.reliabilityBreakdown,
      factualRisks: analysis.factualAccuracy.riskFactors,
      logicalStructure: analysis.logicalCoherence,
      uncertaintyHandling: analysis.uncertaintyHandling.appropriateness
    };
  }

  // ===== 추가 구현 메소드들 =====

  calculateTextCoherence(response) {
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 2) return 0.5;
    
    // 연결어 사용도 체크
    const connectors = ['따라서', '그러므로', '또한', '그러나', '하지만', '즉', '예를 들어'];
    const connectorCount = connectors.filter(conn => response.includes(conn)).length;
    
    return Math.min(1, 0.4 + (connectorCount * 0.1));
  }

  getQualityIndicators(response) {
    return {
      hasNumbers: /\d+/.test(response),
      hasExamples: /예를 들어|사례|구체적으로/.test(response),
      hasStructure: /첫째|둘째|먼저|다음|마지막/.test(response),
      appropriateLength: response.length >= 100 && response.length <= 2000
    };
  }

  classifySourceType(source) {
    if (source.includes('.edu') || source.includes('academic')) return 'academic';
    if (source.includes('.gov')) return 'government';  
    if (source.includes('wikipedia')) return 'wiki';
    if (source.includes('blog')) return 'blog';
    return 'unknown';
  }

  extractFactualClaims(response) {
    // 숫자가 포함된 주장들을 사실적 주장으로 간주
    const numberClaims = response.match(/\d+[%년개월일]/g) || [];
    
    // 확정적 표현이 포함된 문장들
    const definitiveStatements = response.split(/[.!?]/).filter(sentence => 
      /이다|다|입니다|됩니다/.test(sentence) && 
      !/아마도|가능|추정|생각/.test(sentence)
    );
    
    return [...numberClaims, ...definitiveStatements.slice(0, 5)];
  }

  detectContradictions(response) {
    const contradictions = [];
    const sentences = response.split(/[.!?]+/);
    
    // 간단한 모순 탐지 (긍정 vs 부정)
    const positiveStatements = sentences.filter(s => /이다|다|맞다|정확/.test(s));
    const negativeStatements = sentences.filter(s => /아니다|없다|틀렸다|부정확/.test(s));
    
    if (positiveStatements.length > 0 && negativeStatements.length > 0) {
      contradictions.push({
        type: 'positive_negative_conflict',
        severity: 0.6
      });
    }
    
    return contradictions;
  }

  assessVerifiability(claims) {
    if (claims.length === 0) return 0.5;
    
    const verifiableClaims = claims.filter(claim => 
      /\d+|출처|연구|보고서|통계/.test(claim)
    ).length;
    
    return verifiableClaims / claims.length;
  }

  identifyFactualRiskFactors(response) {
    const riskFactors = [];
    
    if (!/출처|근거|연구|보고서/.test(response)) {
      riskFactors.push('no_sources_mentioned');
    }
    
    if (/확실히|반드시|절대/.test(response)) {
      riskFactors.push('overly_confident_language');
    }
    
    return riskFactors;
  }

  analyzeLogicalFlow(response) {
    const hasIntro = response.length > 100 && /^.{0,200}(먼저|우선|시작)/.test(response);
    const hasConclusion = /따라서|결론적으로|마지막으로/.test(response);
    const hasTransitions = /또한|그러나|따라서|즉/.test(response);
    
    let flow = 0.3;
    if (hasIntro) flow += 0.2;
    if (hasConclusion) flow += 0.3;
    if (hasTransitions) flow += 0.2;
    
    return Math.min(1, flow);
  }

  analyzeArgumentStructure(response) {
    const hasClaim = response.length > 50;
    const hasEvidence = /예를 들어|연구|데이터|통계/.test(response);
    const hasReasoning = /왜냐하면|때문에|따라서/.test(response);
    
    let structure = 0.2;
    if (hasClaim) structure += 0.3;
    if (hasEvidence) structure += 0.3; 
    if (hasReasoning) structure += 0.2;
    
    return structure;
  }

  checkInternalConsistency(response) {
    // 간단한 일관성 체크
    const sentences = response.split(/[.!?]+/);
    const tones = sentences.map(s => {
      if (/확실|명확|분명/.test(s)) return 'confident';
      if (/아마|가능|추정/.test(s)) return 'uncertain';
      return 'neutral';
    });
    
    const confidentCount = tones.filter(t => t === 'confident').length;
    const uncertainCount = tones.filter(t => t === 'uncertain').length;
    
    // 너무 확신하거나 너무 불확실하면 일관성 감점
    if (confidentCount > sentences.length * 0.8) return 0.6;
    if (uncertainCount > sentences.length * 0.8) return 0.6;
    
    return 0.8;
  }

  findConfidenceExpressions(response) {
    const expressions = ['확실히', '분명히', '명확히', '확신한다', '단언할 수 있다'];
    return expressions.filter(expr => response.includes(expr));
  }

  analyzeHedging(response) {
    const hedgeWords = ['아마도', '가능하게', '어느 정도', '대체로', '일반적으로'];
    const hedgeCount = hedgeWords.filter(word => response.includes(word)).length;
    
    return Math.min(1, hedgeCount * 0.2);
  }

  evaluateUncertaintyHandling(uncertaintyMarkers, confidenceExpressions, hedging) {
    // 적절한 불확실성 표현이 있으면 높은 점수
    const hasAppropriateUncertainty = uncertaintyMarkers.length > 0 && uncertaintyMarkers.length <= 3;
    const notOverConfident = confidenceExpressions.length <= 2;
    const appropriateHedging = hedging >= 0.1 && hedging <= 0.6;
    
    let score = 0.5;
    if (hasAppropriateUncertainty) score += 0.2;
    if (notOverConfident) score += 0.2;
    if (appropriateHedging) score += 0.1;
    
    return Math.min(1, score);
  }

  getModelSpecificFactors(modelId) {
    const factors = {
      'claude': { ethicalReliability: 0.9, factualAccuracy: 0.7, cautiousness: 0.9, sourceQuality: 0.4 },
      'chatgpt': { generalKnowledge: 0.85, reasoning: 0.8, creativity: 0.9, sourceQuality: 0.5 },
      'gemini': { multimodal: 0.9, integration: 0.8, comprehensiveness: 0.8, sourceQuality: 0.6 },
      'perplexity': { sourceAccess: 0.95, realTimeInfo: 0.95, verification: 0.9, sourceQuality: 0.95 }
    };
    
    return factors[modelId] || { general: 0.7 };
  }

  applyModelSpecificAdjustments(score, factors) {
    // 모델별 특성을 고려한 조정
    const avgFactor = Object.values(factors).reduce((a, b) => a + b, 0) / Object.values(factors).length;
    return Math.min(1, score * (0.8 + avgFactor * 0.2));
  }

  generateConfidenceWarnings(analysis) {
    const warnings = [];
    
    if (analysis.sourceReliability.score < 0.5) {
      warnings.push('출처나 근거가 부족합니다');
    }
    
    if (analysis.factualAccuracy.contradictions.length > 0) {
      warnings.push('내용상 모순이 감지되었습니다');
    }
    
    if (analysis.uncertaintyHandling.score < 0.4) {
      warnings.push('불확실성 처리가 부적절합니다');
    }
    
    return warnings;
  }

  // 다차원 합의 분석 메소드들
  analyzeFactualConsensus(responses) {
    const factualClaims = responses.map(r => this.extractFactualClaims(r.response));
    
    // 공통 사실 주장 찾기
    const commonClaims = this.findCommonElements(factualClaims);
    const totalClaims = factualClaims.flat().length;
    
    return {
      score: totalClaims > 0 ? commonClaims.length / totalClaims : 0.5,
      commonClaims: commonClaims,
      totalClaims: totalClaims
    };
  }

  analyzeMethodologicalConsensus(responses) {
    // 접근 방식의 유사성 분석
    const approaches = responses.map(r => this.identifyApproach(r.response));
    const commonApproaches = this.findCommonElements(approaches);
    
    return {
      score: approaches.length > 0 ? commonApproaches.length / approaches.length : 0.5,
      approaches: approaches,
      commonApproaches: commonApproaches
    };
  }

  analyzeEthicalConsensus(responses) {
    // 윤리적 입장의 일치도 분석
    const ethicalStances = responses.map(r => this.identifyEthicalStance(r.response));
    const consensusScore = this.calculateEthicalAlignment(ethicalStances);
    
    return {
      score: consensusScore,
      stances: ethicalStances
    };
  }

  analyzeConfidenceConsensus(responses) {
    const confidences = responses.map(r => r.confidence);
    const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const variance = confidences.reduce((sum, conf) => sum + Math.pow(conf - mean, 2), 0) / confidences.length;
    
    // 신뢰도가 비슷하면 합의도 높음
    const consensusScore = Math.max(0, 1 - variance);
    
    return {
      score: consensusScore,
      meanConfidence: mean,
      variance: variance
    };
  }

  analyzeSourceConsensus(responses) {
    const allSources = responses.map(r => this.extractSources(r.response)).flat();
    const uniqueSources = [...new Set(allSources)];
    
    // 공통 출처가 많을수록 합의도 높음
    const sharedSources = allSources.length > 0 ? uniqueSources.length / allSources.length : 0.5;
    
    return {
      score: 1 - sharedSources, // 출처가 겹칠수록 높은 점수
      totalSources: allSources.length,
      uniqueSources: uniqueSources.length
    };
  }

  // 보조 메소드들
  findCommonElements(arrays) {
    if (arrays.length === 0) return [];
    
    return arrays[0].filter(element => 
      arrays.every(array => array.includes(element))
    );
  }

  identifyApproach(response) {
    const approaches = [];
    if (/분석|해석|검토/.test(response)) approaches.push('analytical');
    if (/데이터|통계|연구/.test(response)) approaches.push('empirical');
    if (/이론|원리|개념/.test(response)) approaches.push('theoretical');
    
    return approaches;
  }

  identifyEthicalStance(response) {
    if (/윤리|도덕|책임/.test(response)) return 'ethical_conscious';
    if (/위험|주의|조심/.test(response)) return 'cautious';
    if (/혁신|발전|진보/.test(response)) return 'progressive';
    
    return 'neutral';
  }

  calculateEthicalAlignment(stances) {
    const stanceCount = {};
    stances.forEach(stance => {
      stanceCount[stance] = (stanceCount[stance] || 0) + 1;
    });
    
    const maxCount = Math.max(...Object.values(stanceCount));
    return maxCount / stances.length;
  }

  calculateOverallConsensus(dimensions) {
    const weights = {
      factual: 0.3,
      methodological: 0.2,
      ethical: 0.2,
      confidence: 0.15,
      sources: 0.15
    };
    
    return Object.entries(dimensions).reduce((total, [key, analysis]) => {
      return total + (analysis.score * (weights[key] || 0.2));
    }, 0);
  }

  identifyControversialAreas(dimensions) {
    return Object.entries(dimensions)
      .filter(([key, analysis]) => analysis.score < 0.5)
      .map(([key, analysis]) => ({
        area: key,
        severity: 1 - analysis.score,
        details: analysis
      }));
  }

  getConsensusLevel(score) {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'moderate';
    if (score >= 0.4) return 'low';
    return 'very_low';
  }

  generateAgreementMatrix(responses) {
    const matrix = {};
    
    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        const key = `${responses[i].modelName}-${responses[j].modelName}`;
        matrix[key] = this.calculatePairwiseAgreement(responses[i], responses[j]);
      }
    }
    
    return matrix;
  }

  calculatePairwiseAgreement(response1, response2) {
    const factualAgreement = this.compareFactualClaims(response1, response2);
    const confidenceAgreement = 1 - Math.abs(response1.confidence - response2.confidence);
    
    return (factualAgreement + confidenceAgreement) / 2;
  }

  analyzeDisagreements(responses) {
    const disagreements = [];
    
    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        const agreement = this.calculatePairwiseAgreement(responses[i], responses[j]);
        if (agreement < 0.5) {
          disagreements.push({
            models: [responses[i].modelName, responses[j].modelName],
            agreementScore: agreement,
            issues: this.identifySpecificIssues(responses[i], responses[j])
          });
        }
      }
    }
    
    return disagreements;
  }

  compareFactualClaims(response1, response2) {
    const claims1 = this.extractFactualClaims(response1.response || response1);
    const claims2 = this.extractFactualClaims(response2.response || response2);
    
    if (claims1.length === 0 && claims2.length === 0) return 0.8;
    
    const commonClaims = claims1.filter(claim => 
      claims2.some(claim2 => this.claimsAreSimilar(claim, claim2))
    );
    
    const totalClaims = claims1.length + claims2.length;
    return totalClaims > 0 ? (commonClaims.length * 2) / totalClaims : 0.5;
  }

  claimsAreSimilar(claim1, claim2) {
    // 간단한 유사성 검사
    const words1 = claim1.toLowerCase().split(/\s+/);
    const words2 = claim2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length) > 0.5;
  }

  compareMethodologies(response1, response2) {
    const methods1 = this.identifyApproach(response1.response || response1);
    const methods2 = this.identifyApproach(response2.response || response2);
    
    const commonMethods = methods1.filter(method => methods2.includes(method));
    const totalMethods = [...new Set([...methods1, ...methods2])].length;
    
    return totalMethods > 0 ? commonMethods.length / totalMethods : 0.5;
  }

  compareEthicalStances(response1, response2) {
    const stance1 = this.identifyEthicalStance(response1.response || response1);
    const stance2 = this.identifyEthicalStance(response2.response || response2);
    
    return stance1 === stance2 ? 0 : 0.8; // 같으면 논쟁 없음
  }

  calculateControversyScore(factors) {
    const weights = {
      factual: 0.4,
      methodological: 0.2,
      ethical: 0.3,
      confidence: 0.1
    };
    
    return Object.entries(factors).reduce((total, [key, value]) => {
      return total + (value * (weights[key] || 0.25));
    }, 0);
  }

  determineControversyType(factual, methodological, ethical) {
    if (factual > 0.7) return 'factual_dispute';
    if (ethical > 0.7) return 'ethical_disagreement';
    if (methodological > 0.7) return 'methodological_difference';
    return 'general_disagreement';
  }

  getControversySeverity(score) {
    if (score >= 0.8) return 'severe';
    if (score >= 0.6) return 'moderate';
    if (score >= 0.4) return 'mild';
    return 'minimal';
  }

  identifySpecificIssues(response1, response2) {
    const issues = [];
    
    if (Math.abs(response1.confidence - response2.confidence) > 0.5) {
      issues.push('confidence_discrepancy');
    }
    
    const claims1 = this.extractFactualClaims(response1.response);
    const claims2 = this.extractFactualClaims(response2.response);
    
    if (claims1.length > 0 && claims2.length > 0) {
      const agreement = this.compareFactualClaims(response1, response2);
      if (agreement < 0.3) {
        issues.push('factual_contradiction');
      }
    }
    
    return issues;
  }

  assessResolutionComplexity(controversyScore, factualDisagreement) {
    if (factualDisagreement > 0.8) return 'high'; // 사실 관련 논쟁은 해결하기 어려움
    if (controversyScore > 0.7) return 'moderate';
    return 'low';
  }

  calculateOverallControversyScore(controversies) {
    if (controversies.length === 0) return 0;
    
    const totalScore = controversies.reduce((sum, c) => sum + c.score, 0);
    return totalScore / controversies.length;
  }

  categorizeControversies(controversies) {
    const types = {};
    
    controversies.forEach(controversy => {
      const type = controversy.type;
      if (!types[type]) {
        types[type] = [];
      }
      types[type].push(controversy);
    });
    
    return Object.keys(types);
  }

  getControversySeverityDistribution(controversies) {
    const distribution = { severe: 0, moderate: 0, mild: 0, minimal: 0 };
    
    controversies.forEach(controversy => {
      distribution[controversy.severity]++;
    });
    
    return distribution;
  }

  generateResolutionSuggestions(controversies) {
    const suggestions = [];
    
    const severeControversies = controversies.filter(c => c.severity === 'severe');
    if (severeControversies.length > 0) {
      suggestions.push('전문가 의견이나 추가 출처 확인이 필요합니다');
    }
    
    const factualDisputes = controversies.filter(c => c.type === 'factual_dispute');
    if (factualDisputes.length > 0) {
      suggestions.push('사실 확인을 위한 신뢰할 수 있는 출처를 참조하세요');
    }
    
    const ethicalDisagreements = controversies.filter(c => c.type === 'ethical_disagreement');
    if (ethicalDisagreements.length > 0) {
      suggestions.push('윤리적 관점의 다양성을 고려한 균형잡힌 접근이 필요합니다');
    }
    
    return suggestions;
  }
}

module.exports = new AdvancedAnalytics();