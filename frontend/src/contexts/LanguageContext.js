import React, { createContext, useContext, useState, useEffect } from 'react';

// 번역 데이터
const translations = {
  en: {
    // 메인 페이지
    welcome: 'WELCOME TO',
    appName: 'AI CROSSCHECK COURT!',
    mainTitle: 'Revolutionary Platform for Detecting AI Hallucinations',
    mainDescription: 'Watch multiple AI models debate, verify facts, and reach consensus in real-time. Transparently detect AI hallucinations and errors while deriving reliable conclusions.',
    getStarted: 'Get Started Now',
    termsOfUse: 'Terms of Use',
    experimentalProject: 'Experimental Project',
    experimentalDescription: 'An educational website exploring AI failures and coexistence.',
    transparentDisclosure: 'All discussion processes and results are transparently disclosed to help users understand AI limitations.',

    // 쿼리 페이지
    queryTitle: 'AI Hallucination Crosscheck Engine',
    querySubtitle: 'Type your query and watch multiple AI agents detect and debate hallucinations in real-time.',
    home: 'Home',
    queryPlaceholder: 'Enter your question here...',
    submitButton: 'Ask Question',
    loadingTitle: 'AI Models are Analyzing Your Query',
    loadingDescription: 'AIs are analyzing...',
    analyzingText: 'Multiple AI systems are processing your request and cross-validating responses...',

    // AI 응답 카드
    responses: 'AI Responses',
    analysis: 'Analysis', 
    finalResult: 'Final Result',
    confidence: 'CONFIDENCE',
    modelResponses: 'Model Responses',
    crossValidation: 'Cross Validation',
    consensus: 'Consensus',
    agreements: 'Agreements',
    disagreements: 'Disagreements',
    majorityFact: 'Majority Fact',
    hallucinations: 'Detected Hallucinations',
    reliabilityHigh: 'HIGH RELIABILITY',
    reliabilityMedium: 'MEDIUM RELIABILITY', 
    reliabilityLow: 'LOW RELIABILITY',
    sources: 'Sources',
    warnings: 'Warnings',
    participatingModels: 'Participating Models',
    
    // 추가 번역
    clickToReadMore: 'Click to read more',
    detailedResponse: 'Detailed Response',
    expertDescription: 'Ethical judgment and safety review expert',
    confidenceAnalysis: 'Confidence Analysis',
    detailedConfidenceAnalysis: 'Detailed Confidence Analysis',
    contentQuality: 'Content Quality',
    sourceReliability: 'Source Reliability',
    factualAccuracy: 'Factual Accuracy',
    responseContent: 'Response Content',
    sourcesAndCitations: 'Sources and Citations',
    generationTime: 'GENERATION TIME',
    status: 'STATUS',
    confidenceLevel: 'CONFIDENCE LEVEL',
    consensusLevel: 'Consensus Level',
    moderate: 'moderate',
    
    // 교차검증 섹션
    participatingAIs: 'Participating AIs',
    clickForDetails: 'Click for details',
    majorityConsensus: 'Majority Consensus (Likely Fact)',
    aiModelsAgree: 'AI Models Agree',
    supportingModels: 'Supporting Models',
    analysis: 'Analysis',
    potentialHallucinations: 'Potential Hallucinations',
    suspectedIssue: 'Suspected Issue:',
    majorityOpinion: 'Majority Opinion:',
    geminiAnalysis: 'Gemini\'s Analysis:',
    geminiAnalysisTitle: 'Gemini Analysis',
    agreementAnalysis: 'Agreement Analysis',
    agreementContent: 'Agreement Content',
    confidenceLevel: 'Confidence Level',
    participatingAiModels: 'Participating AI Models',
    geminiAnalysisReasoning: 'Gemini Analysis Reasoning',
    analysisMethod: 'Analysis Method',
    evidenceQuotes: 'Evidence Quotes',
    analysisModel: 'Analysis Model',
    agreementType: 'Agreement Type',
    semanticConsensus: 'Semantic Consensus',
    analysisMetadata: 'Analysis Metadata',
    confidenceAnalysisReason: 'Confidence Analysis: Why {score}% was determined',
    confidenceBoostingFactors: 'Factors that boosted confidence',
    considerations: 'Considerations',
    technicalDetails: 'Technical Details',
    baseConfidence: 'Base Confidence',
    consensusBonus: 'Consensus Bonus',
    totalModels: 'Total Models',
    agreementCount: 'Agreement Points',
    disagreementCount: 'Disagreement Points',
    geminiConfidenceDescription: 'Gemini\'s confidence in this agreement analysis',
    defaultMajorityAnalysis: 'Multiple independent AI systems have reached the same conclusion, which statistically significantly increases the reliability of the information.',
    finalIntegratedAnswer: 'Final Integrated Answer',
    sourcesByModel: 'Sources by Model',
    noAnswerGenerated: 'Could not generate an answer.',
    sourceCount: 'sources',
    defaultMajorityFactContent: '4 or more AI models showed consistent views on core facts. This means that the information is very likely to be true.',

    // 교차 검증 안내 메시지
    noAgreementsFound: 'Gemini performed semantic analysis but could not find clear points of agreement.',
    noAgreementsDetail: 'There may be differences in AIs\' approaches or perspectives.',
    noDisagreementsFound: 'According to Gemini\'s analysis, no major points of disagreement were found among the AIs.',
    noDisagreementsDetail: 'Most AIs provided responses in similar directions.',

    // 새 번역 키
    geminiAnalysis: 'Gemini Analysis',
    geminiGenerated: 'Generated by Gemini',
    generalConsensus: 'General Consensus',
    majorDisagreement: 'Major Disagreement',
    analysisReasoning: 'Analysis Reasoning',
    aiModelPositions: 'AI Model Positions',

    // 상세 분석 키
    agreementSummary: 'Agreement Summary',
    evidenceQuotes: 'Evidence Quotes',
    consensusFact: 'Consensus Fact',
    agreeingModels: 'Agreeing Models',
    consensusRate: 'Consensus Rate',
    whyTrusted: 'Why This Information is Trusted',
    statisticalSignificance: 'Statistical Significance',
    independentVerification: 'Independent Verification',
    highConfidence: 'High Confidence Level',
    suspectedHallucination: 'Suspected Hallucination',
    problematicResponse: 'Problematic Response',
    highRisk: 'High Risk',
    mediumRisk: 'Medium Risk',
    lowRisk: 'Low Risk',
    geminiAnalysisTitle: 'Gemini Analysis',
    conflictingViewpoints: 'Conflicting AI Viewpoints',
    highConflict: 'High Conflict',
    moderateConflict: 'Moderate Conflict',
    minorDifference: 'Minor Difference',
    differentPositions: 'Different Positions',

    // 에러 메시지
    errorTitle: 'Connection Error',
    errorMessage: 'Please check if the backend server (port 5001) is running.',
    apiConnectionFailed: 'Some AI model connection failed',

    // 로딩 애니메이션
    loadingHeader: 'AI Cross-Validation in Progress',
    loadingAnalyzing: 'Multiple AI models are analyzing your question...',
    analyzingStatus: 'Analyzing...',
    loadingTip: 'AIs analyze responses from different perspectives to provide more reliable results.',
    
    // 로딩 단계
    steps: {
      questionAnalysis: 'Question Analysis',
      responseGeneration: 'AI Response Generation', 
      crossValidation: 'Cross Validation',
      resultIntegration: 'Result Integration'
    }
  },
  kr: {
    // 메인 페이지  
    welcome: '환영합니다',
    appName: 'AI 크로스체크 코트!',
    mainTitle: 'AI 환각 현상 탐지를 위한 혁신적인 플랫폼',
    mainDescription: '여러 AI 모델이 실시간으로 토론하고, 사실을 검증하며, 합의에 도달하는 과정을 지켜보세요.\nAI 환각 현상과 오류를 투명하게 탐지하여 신뢰할 수 있는 결론을 도출합니다.',
    getStarted: '지금 시작하기',
    termsOfUse: '이용약관',
    experimentalProject: '실험적 프로젝트',
    experimentalDescription: 'AI의 실패와 공존을 탐구하는 교육용 웹사이트입니다.',
    transparentDisclosure: '모든 토론 과정과 결과는 투명하게 공개되어 사용자가 AI의 한계를 이해할 수 있도록 돕습니다.',

    // 쿼리 페이지
    queryTitle: 'AI 환각 현상 크로스체크 엔진',
    querySubtitle: '질문을 입력하고 여러 AI 에이전트가 실시간으로 환각 현상을 탐지하고 토론하는 모습을 지켜보세요.',
    home: '홈',
    queryPlaceholder: '여기에 질문을 입력하세요...',
    submitButton: '질문하기',
    loadingTitle: 'AI 모델들이 질문을 분석하고 있습니다',
    loadingDescription: 'AI가 분석 중입니다...',
    analyzingText: '여러 AI 시스템이 요청을 처리하고 응답을 교차 검증하고 있습니다...',

    // AI 응답 카드
    responses: 'AI 응답',
    analysis: '분석',
    finalResult: '최종 결과', 
    confidence: '신뢰도',
    modelResponses: '모델 응답',
    crossValidation: '교차 검증',
    consensus: '합의',
    agreements: '일치점',
    disagreements: '불일치점',
    majorityFact: '다수 의견',
    hallucinations: '탐지된 환각 현상',
    reliabilityHigh: '높은 신뢰도',
    reliabilityMedium: '중간 신뢰도',
    reliabilityLow: '낮은 신뢰도', 
    sources: '출처',
    warnings: '주의사항',
    participatingModels: '참여 모델',
    
    // 추가 번역
    clickToReadMore: '자세히 보기',
    detailedResponse: '상세 응답',
    expertDescription: '윤리적 판단 및 안전성 검토 전문가',
    confidenceAnalysis: '신뢰도 분석',
    detailedConfidenceAnalysis: '상세 신뢰도 분석',
    contentQuality: '콘텐츠 품질',
    sourceReliability: '출처 신뢰성',
    factualAccuracy: '사실 정확성',
    responseContent: '응답 내용',
    sourcesAndCitations: '출처 및 인용',
    generationTime: '생성 시간',
    status: '상태',
    confidenceLevel: '신뢰도 수준',
    consensusLevel: '합의 수준',
    moderate: '보통',
    
    // 교차검증 섹션
    participatingAIs: '참여 AI',
    clickForDetails: '자세히 보기',
    majorityConsensus: '다수 합의 (사실일 가능성)',
    aiModelsAgree: 'AI 모델 일치',
    supportingModels: '지지 모델',
    analysis: '분석',
    potentialHallucinations: '잠재적 환각 현상',
    suspectedIssue: '의심 사항:',
    majorityOpinion: '다수 의견:',
    geminiAnalysis: 'Gemini 분석:',
    geminiAnalysisTitle: 'Gemini 분석',
    agreementAnalysis: '합의점 분석',
    agreementContent: '합의 내용',
    confidenceLevel: '신뢰도',
    participatingAiModels: '참여 AI 모델',
    geminiAnalysisReasoning: 'Gemini 분석 근거',
    analysisMethod: '분석 방법',
    evidenceQuotes: '증거 인용문',
    analysisModel: '분석 모델',
    agreementType: '합의 유형',
    semanticConsensus: '의미적 합의',
    analysisMetadata: '분석 메타데이터',
    confidenceAnalysisReason: '신뢰도 분석: {score}% 점수가 결정된 이유',
    confidenceBoostingFactors: '신뢰도를 높인 요인들',
    considerations: '고려사항',
    technicalDetails: '기술적 세부사항',
    baseConfidence: '기본 신뢰도',
    consensusBonus: '합의도 보너스',
    totalModels: '참여 모델 수',
    agreementCount: '합의점',
    disagreementCount: '논쟁점',
    geminiConfidenceDescription: '이 합의 분석에 대한 Gemini의 신뢰도',
    defaultMajorityAnalysis: '다수의 독립적인 AI 시스템이 동일한 결론에 도달했으며, 이는 통계적으로 해당 정보의 신뢰성을 크게 높입니다.',
    finalIntegratedAnswer: '최종 통합 답변',
    sourcesByModel: '모델별 출처 정보',
    noAnswerGenerated: '답변을 생성할 수 없습니다.',
    sourceCount: '개 출처',
    defaultMajorityFactContent: '4개 이상의 AI 모델이 핵심 사실에 대해 일치하는 견해를 보였습니다. 이는 해당 정보가 사실일 가능성이 매우 높음을 의미합니다.',

    // 교차 검증 안내 메시지
    noAgreementsFound: 'Gemini가 의미적 분석을 수행했지만 명확한 합의점을 찾을 수 없었습니다.',
    noAgreementsDetail: 'AI들의 접근 방식이나 관점에 차이가 있을 수 있습니다.',
    noDisagreementsFound: 'Gemini의 분석에 따르면 AI들 간에 주요 불일치점이 발견되지 않았습니다.',
    noDisagreementsDetail: '대부분의 AI가 비슷한 방향의 응답을 제공했습니다.',

    // 새 번역 키
    geminiAnalysis: 'Gemini 분석',
    geminiGenerated: 'Gemini 생성',
    generalConsensus: '일반적 합의',
    majorDisagreement: '주요 불일치',
    analysisReasoning: '분석 근거',
    aiModelPositions: 'AI 모델별 입장',

    // 상세 분석 키
    agreementSummary: '합의 요약',
    evidenceQuotes: '근거 인용문',
    consensusFact: '합의된 사실',
    agreeingModels: '동의 모델 수',
    consensusRate: '합의율',
    whyTrusted: '신뢰할 수 있는 이유',
    statisticalSignificance: '통계적 유의성',
    independentVerification: '독립적 검증',
    highConfidence: '높은 신뢰도',
    suspectedHallucination: '의심되는 환각',
    problematicResponse: '문제가 있는 응답',
    highRisk: '높은 위험도',
    mediumRisk: '중간 위험도',
    lowRisk: '낮은 위험도',
    geminiAnalysisTitle: 'Gemini 분석',
    conflictingViewpoints: '충돌하는 AI 관점',
    highConflict: '높은 갈등',
    moderateConflict: '중간 갈등',
    minorDifference: '약간의 차이',
    differentPositions: '개의 서로 다른 입장',

    // 에러 메시지
    errorTitle: '연결 오류',
    errorMessage: '백엔드 서버(포트 5001)가 실행 중인지 확인해주세요.',
    apiConnectionFailed: '일부 AI 모델 연결에 실패했습니다',

    // 로딩 애니메이션
    loadingHeader: 'AI 교차 검증 진행 중',
    loadingAnalyzing: '여러 AI 모델이 질문을 분석하고 있습니다...',
    analyzingStatus: '분석 중...',
    loadingTip: 'AI들이 서로 다른 관점에서 응답을 분석하여 더 신뢰할 수 있는 결과를 제공합니다.',
    
    // 로딩 단계
    steps: {
      questionAnalysis: '질문 분석',
      responseGeneration: 'AI 응답 생성', 
      crossValidation: '교차 검증',
      resultIntegration: '결과 통합'
    }
  }
};

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('kr'); // 기본값은 한글

  // 로컬 스토리지에서 언어 설정 불러오기
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'kr')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // 언어 변경 시 로컬 스토리지에 저장
  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  // 번역 함수
  const t = (key) => {
    const keys = key.split('.');
    let translation = translations[language];
    
    for (const k of keys) {
      translation = translation?.[k];
    }
    
    return translation || key; // 번역이 없으면 키 자체 반환
  };

  const value = {
    language,
    changeLanguage,
    t,
    isKorean: language === 'kr',
    isEnglish: language === 'en'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};