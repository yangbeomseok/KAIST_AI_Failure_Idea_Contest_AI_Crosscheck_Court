import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ResponseModal from './ResponseModal';
import AgreementDetailModal from './AgreementDetailModal';
import './AIResponseCards.css';

function AIResponseCards({ query, responses }) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('responses');
  const [animatedCards, setAnimatedCards] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);

  useEffect(() => {
    // Sequential display for card animation
    if (responses?.data?.responses) {
      responses.data.responses.forEach((_, index) => {
        setTimeout(() => {
          setAnimatedCards(prev => [...prev, index]);
        }, index * 200);
      });
    }
  }, [responses]);

  if (!responses) return null;

  const { data } = responses;
  const hasError = !responses.success;

  const getConfidenceLevel = (confidence) => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  };

  const getModelColor = (modelId) => {
    const colors = {
      chatgpt: '#10a37f',
      claude: '#ff6b35',
      gemini: '#4285f4',
      perplexity: '#20b2aa',
      grok: '#000000',
      clovax: '#03c75a'
    };
    return colors[modelId] || '#00ffff';
  };

  const getModelId = (modelName) => {
    const nameToId = {
      'ChatGPT': 'chatgpt',
      'Claude': 'claude', 
      'Gemini': 'gemini',
      'Perplexity': 'perplexity',
      'GROK': 'grok',
      'CLOVA X': 'clovax'
    };
    return nameToId[modelName] || modelName.toLowerCase();
  };

  const getModelIcon = (modelId) => {
    const icons = {
      'chatgpt': '/chatgpt-icon.png',
      'claude': '/claude-ai-icon.png',
      'gemini': '/google-gemini-icon.png',
      'perplexity': '/perplexity-ai-icon.png',
      'grok': '/grok-icon.png',
      'clovax': '/naver-clova-icon.png'
    };
    return icons[modelId] || null;
  };

  const renderSourceContent = (source, modelName) => {
    // URL links
    if (source.startsWith('http')) {
      return (
        <a href={source} target="_blank" rel="noopener noreferrer" className="source-link">
          🔗 {source}
        </a>
      );
    }
    
    // Perplexity references - detailed info starting with [number] format
    if (modelName === 'Perplexity' && source.match(/^\[\d+\]/)) {
      const parts = source.split(/\s+/);
      const indexPart = parts[0]; // [1], [2] etc.
      const contentParts = parts.slice(1);
      const content = contentParts.join(' ');
      
      // If URL is included
      const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        const beforeUrl = content.substring(0, content.indexOf(urlMatch[1])).trim();
        const url = urlMatch[1];
        
        return (
          <div className="perplexity-source-detailed">
            <span className="source-index">{indexPart}</span>
            <div className="source-details">
              {beforeUrl && <div className="source-title">{beforeUrl}</div>}
              <a href={url} target="_blank" rel="noopener noreferrer" className="source-link">
                🔗 {url}
              </a>
            </div>
          </div>
        );
      } else {
        // Reference without URL
        return (
          <div className="perplexity-source-detailed">
            <span className="source-index">{indexPart}</span>
            <div className="source-details">
              <div className="source-title">{content}</div>
            </div>
          </div>
        );
      }
    }
    
    // Existing classification
    if (source.includes('[confirmed')) {
      return <span className="source-confirmed">✅ {source}</span>;
    } else if (source.includes('[estimated')) {
      return <span className="source-estimated">❓ {source}</span>;
    } else if (source.match(/\[\d+\]/)) {
      return <span className="source-reference">📋 {source}</span>;
    } else {
      return <span className="source-general">📄 {source}</span>;
    }
  };

  const handleCardClick = (response) => {
    setSelectedResponse(response);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedResponse(null);
  };

  const handleAgreementClick = (agreement) => {
    setSelectedAgreement(agreement);
    setIsAgreementModalOpen(true);
  };

  const handleCloseAgreementModal = () => {
    setIsAgreementModalOpen(false);
    setSelectedAgreement(null);
  };

  // URL을 클릭 가능한 링크로 변환하는 함수
  const renderTextWithLinks = (text) => {
    if (!text) return text;
    
    // 검증도와 출처를 분리하여 처리
    const verificationMatch = text.match(/검증도:\s*(\d+\/\d+)\s*출처:/);
    if (verificationMatch) {
      const beforeVerification = text.substring(0, text.indexOf('검증도:'));
      
      // 검증도 부분 추출
      const verificationText = verificationMatch[0].replace('출처:', '').trim();
      
      // 출처 부분 추출 및 처리
      const sourcesText = text.substring(text.indexOf('출처:') + 3).trim();
      
      // 출처를 개별 항목으로 분리 (번호 기준)
      const sourceItems = sourcesText.split(/(\[\d+\])/).filter(item => item.trim());
      const formattedSources = [];
      
      for (let i = 0; i < sourceItems.length; i += 2) {
        if (sourceItems[i] && sourceItems[i + 1]) {
          const sourceNumber = sourceItems[i].trim();
          const sourceContent = sourceItems[i + 1].trim();
          formattedSources.push(`${sourceNumber} ${sourceContent}`);
        }
      }
      
      return (
        <div>
          <div>{renderSimpleTextWithLinks(beforeVerification)}</div>
          <br />
          <div>{verificationText}</div>
          <br />
          <div>출처:</div>
          {formattedSources.map((source, index) => (
            <div key={index}>
              {renderSimpleTextWithLinks(source)}
            </div>
          ))}
        </div>
      );
    }
    
    return renderSimpleTextWithLinks(text);
  };

  const renderSimpleTextWithLinks = (text) => {
    if (!text) return text;

    // 패턴들 정의
    const markdownLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const boldPattern = /\*\*(.*?)\*\*/g;
    const urlPattern = /(https?:\/\/[^\s)]+|www\.[^\s)]+)/g;

    let processedText = text;

    // Step 1: [Title](URL) 마크다운 링크를 임시 마커로 변환
    const linkMatches = [];
    processedText = processedText.replace(markdownLinkPattern, (match, title, url) => {
      linkMatches.push({ title, url });
      return `___LINK_${linkMatches.length - 1}___`;
    });

    // Step 2: **bold** 텍스트를 임시 마커로 변환
    processedText = processedText.replace(boldPattern, '___BOLD_START___$1___BOLD_END___');

    // Step 3: 남은 일반 URL 패턴으로 분할
    const parts = processedText.split(urlPattern);

    const elements = [];

    parts.forEach((part, index) => {
      // 마크다운 링크 마커 확인
      const linkMatch = part.match(/___LINK_(\d+)___/);
      if (linkMatch) {
        const linkIndex = parseInt(linkMatch[1]);
        const { title, url } = linkMatches[linkIndex];
        elements.push(
          <a
            key={`link-${index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-link"
          >
            {title}
          </a>
        );
        return;
      }

      // 일반 URL인지 확인
      if (urlPattern.test(part)) {
        const href = part.startsWith('www.') ? `https://${part}` : part;
        elements.push(
          <a
            key={`url-${index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-link"
          >
            {part}
          </a>
        );
        return;
      }

      // Bold 마커가 있는지 확인하고 처리
      if (part.includes('___BOLD_START___')) {
        const boldParts = part.split(/___BOLD_START___|___BOLD_END___/);
        boldParts.forEach((boldPart, boldIndex) => {
          if (boldIndex % 2 === 1) {
            // 홀수 인덱스는 bold 텍스트
            elements.push(<strong key={`bold-${index}-${boldIndex}`}>{boldPart}</strong>);
          } else if (boldPart) {
            // 일반 텍스트
            elements.push(boldPart);
          }
        });
        return;
      }

      // 일반 텍스트
      if (part) {
        elements.push(part);
      }
    });

    return <span>{elements}</span>;
  };

  return (
    <>
      <ResponseModal
        response={selectedResponse}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      <AgreementDetailModal
        agreement={selectedAgreement}
        isOpen={isAgreementModalOpen}
        onClose={handleCloseAgreementModal}
      />
      <div className="ai-responses-container">
      <div className="query-display">
        <h3>{t('queryTitle')}</h3>
        <p>"{query}"</p>
      </div>

      {hasError && (
        <div className="error-banner">
          <div className="error-icon">⚠️</div>
          <div className="error-message">
            <strong>{t('errorTitle')}</strong>
            <p>{responses.error}</p>
          </div>
        </div>
      )}

      <div className="results-tabs">
        <div className="tab-buttons">
          <button 
            className={`tab-button ${activeTab === 'responses' ? 'active' : ''}`}
            onClick={() => setActiveTab('responses')}
          >
            <span className="tab-icon">🤖</span>
            {t('responses')}
          </button>
          <button 
            className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            <span className="tab-icon">🔍</span>
            {t('crossValidation')}
          </button>
          <button 
            className={`tab-button ${activeTab === 'final' ? 'active' : ''}`}
            onClick={() => setActiveTab('final')}
          >
            <span className="tab-icon">✨</span>
            {t('finalResult')}
          </button>
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'responses' && (
          <div className="responses-grid">
            {data?.responses?.map((response, index) => (
              <div 
                key={response.model}
                className={`response-card ${animatedCards.includes(index) ? 'animated' : ''} ${response.status === 'error' ? 'error' : ''} clickable`}
                style={{ 
                  '--delay': `${index * 0.1}s`,
                  '--model-color': getModelColor(response.model)
                }}
                onClick={() => handleCardClick(response)}
              >
                <div className="card-header">
                  <div className="model-badge">
                    <div className="model-icon">
                      {getModelIcon(response.model) ? (
                        <img 
                          src={getModelIcon(response.model)} 
                          alt={response.modelName}
                          className="model-logo"
                        />
                      ) : (
                        <div className="model-letter" style={{ background: getModelColor(response.model) }}>
                          {response.modelName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="model-name">{response.modelName}</span>
                  </div>
                  
                  <div className="confidence-meter">
                    <div className="confidence-label">{t('confidence')}</div>
                    <div className="ai-card-confidence-bar">
                      <div
                        className={`ai-card-confidence-fill confidence-${getConfidenceLevel(response.confidence || 0)}`}
                        style={{
                          width: `${(response.confidence || 0) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="confidence-value">
                      {Math.round((response.confidence || 0) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="card-content">
                  {response.status === 'error' ? (
                    <div className="error-response">
                      <div className="error-icon">❌</div>
                      <p>{t('apiConnectionFailed')}</p>
                      <small>{response.error}</small>
                    </div>
                  ) : (
                    <div className="response-text-container">
                      <p className="response-text">
                        {response.response.length > 200 
                          ? `${response.response.substring(0, 200)}...` 
                          : response.response}
                      </p>
                      {response.response.length > 200 && (
                        <div className="read-more-indicator">
                          <span>{t('clickToReadMore')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <div className="timestamp">
                    {new Date(response.timestamp).toLocaleTimeString('ko-KR')}
                  </div>
                  <div className={`status-badge ${response.status}`}>
                    {response.status === 'success' ? '✓' : '✗'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-section">
            <div className="consensus-overview">
              <h4>{t('consensusLevel')}</h4>
              <div className="consensus-meter">
                <div className="consensus-circle">
                  <div className="consensus-value">
                    {data?.crossCheck?.consensus ? 
                      Math.round((data.crossCheck.consensus.overallScore || data.crossCheck.consensus.confidence || 0) * 100) : 0}%
                  </div>
                  <div className="consensus-label">
                    {data?.crossCheck?.consensus?.consensusLevel || data?.crossCheck?.consensus?.level || 'unknown'}
                  </div>
                </div>
              </div>
            </div>
            

            <div className="agreements-section">
              <h4>🤝 {t('agreements')} <span className="analysis-badge">{t('geminiAnalysis')}</span></h4>
              {data?.crossCheck?.agreements?.length > 0 ? (
                <div className="agreement-cards">
                  {data.crossCheck.agreements.map((agreement, index) => (
                    <div 
                      key={index} 
                      className="agreement-card enhanced clickable"
                      onClick={() => handleAgreementClick(agreement)}
                    >
                      <div className="agreement-header">
                        <div className="agreement-topic">
                          <strong>{language === 'kr' ? (agreement.topicKr || agreement.topic || t('generalConsensus')) : (agreement.topic || agreement.topicKr || t('generalConsensus'))}</strong>
                        </div>
                        <div className="agreement-actions">
                          <div className="agreement-confidence">
                            {t('confidence')}: {Math.round((agreement.confidence || agreement.similarity || 0.8) * 100)}%
                          </div>
                          <div className="click-indicator">
                            <span>{t('clickForDetails')}</span>
                            <span className="arrow">→</span>
                          </div>
                        </div>
                      </div>
                      
                      {(agreement.content || agreement.contentKr) && (
                        <div className="agreement-content">
                          {(() => {
                            // 상세 디버깅 로그
                            console.log('🔍 Agreement 데이터:', {
                              language,
                              hasContent: !!agreement.content,
                              hasContentKr: !!agreement.contentKr,
                              content: agreement.content,
                              contentKr: agreement.contentKr,
                              fullAgreement: agreement
                            });

                            const result = language === 'kr'
                              ? (agreement.contentKr || agreement.content || t('generalConsensus'))
                              : (agreement.content || agreement.contentKr || t('generalConsensus'));

                            console.log('📝 표시될 텍스트:', result);
                            return result;
                          })()}
                        </div>
                      )}

                      <div className="agreement-models">
                        <span className="models-label">{t('participatingAIs')}:</span>
                        {(agreement.participatingAIs || agreement.models || []).map((model, idx) => (
                          <span key={idx} className="model-tag">{model}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data-enhanced">
                  <div className="no-data-icon">🔍</div>
                  <p>{t('noAgreementsFound')}</p>
                  <small>{t('noAgreementsDetail')}</small>
                </div>
              )}
            </div>

            {/* 과반수 사실 섹션 */}
            {data?.crossCheck?.majorityFact && (
              <div className="majority-fact-section">
                <h4>✅ {t('majorityConsensus')} <span className="analysis-badge">{t('geminiAnalysis')}</span></h4>
                <div className="majority-fact-card">
                  <div className="fact-header">
                    <div className="fact-confidence">
                      <span className="confidence-badge high">
                        {t('confidence')}: {Math.round((data.crossCheck.majorityFact.confidence || 0.9) * 100)}%
                      </span>
                      <div className="supporting-ais">
                        <span className="supporting-count">
                          {data.crossCheck.majorityFact.supportingAIs?.length || 0} {t('aiModelsAgree')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="fact-content">
                    <p>
                      {language === 'kr'
                        ? (data?.crossCheck?.majorityFact?.contentKr || data?.crossCheck?.majorityFact?.content || t('defaultMajorityFactContent'))
                        : (data?.crossCheck?.majorityFact?.content || data?.crossCheck?.majorityFact?.contentKr || t('defaultMajorityFactContent'))
                      }
                    </p>
                  </div>
                  <div className="supporting-models">
                    <span className="models-label">{t('supportingModels')}:</span>
                    {(data?.crossCheck?.majorityFact?.supportingAIs || ["ChatGPT", "Claude", "Gemini", "Perplexity"]).map((model, idx) => (
                      <span key={idx} className="model-tag consensus">{model}</span>
                    ))}
                  </div>
                  <div className="fact-reasoning">
                    <strong>{t('analysisReasoning')}:</strong>
                    <p>
                      {language === 'kr'
                        ? (data?.crossCheck?.majorityFact?.reasoningKr || data?.crossCheck?.majorityFact?.reasoning || t('defaultMajorityAnalysis'))
                        : (data?.crossCheck?.majorityFact?.reasoning || data?.crossCheck?.majorityFact?.reasoningKr || t('defaultMajorityAnalysis'))
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 환각 현상 섹션 */}
            {data?.crossCheck?.hallucinations?.length > 0 && (
              <div className="hallucinations-section">
                <h4>🚨 {t('potentialHallucinations')} <span className="analysis-badge">{t('geminiAnalysis')}</span></h4>
                <div className="hallucination-cards">
                  {data.crossCheck.hallucinations.map((hallucination, index) => (
                    <div key={index} className="hallucination-card">
                      <div className="hallucination-header">
                        <div className="ai-model-info">
                          <span className="model-name">{hallucination.aiModel}</span>
                          <span className={`severity-badge ${hallucination.severity || 'medium'}`}>
                            {hallucination.severity === 'high' ? 'High Risk' :
                             hallucination.severity === 'low' ? 'Low Risk' : 'Medium Risk'}
                          </span>
                        </div>
                      </div>
                      <div className="hallucination-content">
                        <div className="suspected-content">
                          <strong>{t('suspectedIssue')}</strong>
                          <p>
                            {language === 'kr'
                              ? (hallucination.suspectedHallucinationKr || hallucination.suspectedHallucination)
                              : (hallucination.suspectedHallucination || hallucination.suspectedHallucinationKr)
                            }
                          </p>
                        </div>
                        <div className="majority-vs">
                          <strong>{t('majorityOpinion')}</strong>
                          <p>
                            {language === 'kr'
                              ? (hallucination.majorityOpinionKr || hallucination.majorityOpinion)
                              : (hallucination.majorityOpinion || hallucination.majorityOpinionKr)
                            }
                          </p>
                        </div>
                      </div>
                      {(hallucination.reasoning || hallucination.reasoningKr) && (
                        <div className="hallucination-reasoning">
                          <strong>{t('geminiAnalysis')}</strong>
                          <p>
                            {language === 'kr'
                              ? (hallucination.reasoningKr || hallucination.reasoning)
                              : (hallucination.reasoning || hallucination.reasoningKr)
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="disagreements-section">
              <h4>⚡ {t('disagreements')} <span className="analysis-badge">{t('geminiAnalysis')}</span></h4>
              {data?.crossCheck?.disagreements?.length > 0 ? (
                <div className="disagreement-cards">
                  {data.crossCheck.disagreements.map((disagreement, index) => (
                    <div key={index} className="disagreement-card enhanced">
                      <div className="disagreement-header">
                        <div className="disagreement-topic">
                          <strong>
                            {language === 'kr'
                              ? (disagreement.topicKr || disagreement.topic || t('majorDisagreement'))
                              : (disagreement.topic || disagreement.topicKr || t('majorDisagreement'))
                            }
                          </strong>
                        </div>
                        <div className={`severity-badge ${disagreement.severity || 'medium'}`}>
                          {disagreement.severity === 'high' ? 'High' :
                           disagreement.severity === 'low' ? 'Low' : 'Medium'}
                        </div>
                      </div>

                      {(disagreement.aiPositions || disagreement.aiPositionsKr) && (
                        <div className="ai-positions">
                          <h6>{t('aiModelPositions')}</h6>
                          {Object.entries(
                            language === 'kr'
                              ? (disagreement.aiPositionsKr || disagreement.aiPositions || {})
                              : (disagreement.aiPositions || disagreement.aiPositionsKr || {})
                          ).map(([ai, position], idx) => (
                            <div key={idx} className="position-item">
                              <div className="ai-name">{ai}:</div>
                              <div className="ai-position">{position}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {disagreement.models && !disagreement.aiPositions && (
                        <div className="disagreement-models">
                          <span className="models-label">{t('participatingAIs')}:</span>
                          {disagreement.models.map((model, idx) => (
                            <span key={idx} className="model-tag disagreement">{model}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data-enhanced">
                  <div className="no-data-icon">✅</div>
                  <p>{t('noDisagreementsFound')}</p>
                  <small>{t('noDisagreementsDetail')}</small>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'final' && (
          <div className="final-result-section">
            <div className="result-header">
              <div className="reliability-badge" data-level={data?.finalResult?.reliability}>
                {data?.finalResult?.reliability?.toUpperCase()}
              </div>
              <div className="confidence-score">
                {Math.round((data?.finalResult?.confidenceScore || 0) * 100)}% Confidence
              </div>
            </div>

            <div className="final-answer">
              <h4>{t('finalIntegratedAnswer')}</h4>
              <div className="answer-content">
                {(data?.finalResult?.answer || data?.finalResult?.answerKr || data?.finalResult?.answerEn) ? (
                  <div className="answer-paragraphs">
                    {(() => {
                      // 언어별 답변 선택
                      let finalAnswer = language === 'kr'
                        ? (data.finalResult.answerKr || data.finalResult.answer || data.finalResult.answerEn)
                        : (data.finalResult.answerEn || data.finalResult.answer || data.finalResult.answerKr);

                      // JSON.stringify로 인해 escape된 개행 문자들을 실제 개행 문자로 변환
                      finalAnswer = finalAnswer.replace(/\\n\\n/g, '\n\n').replace(/\\n/g, '\n');

                      // Gemini 생성 여부 표시
                      // 디버깅을 위한 상세 로그
                      console.log('🔍 최종 답변 디버깅:', {
                        language,
                        finalAnswer: finalAnswer,
                        hasDoubleNewlines: finalAnswer?.includes('\n\n'),
                        hasSingleNewlines: finalAnswer?.includes('\n'),
                        answerLength: finalAnswer?.length,
                        firstChars: finalAnswer?.substring(0, 200)
                      });

                      if (data.finalResult.isGeminiGenerated) {
                        console.log('🎯 Gemini 생성 최종 답변 표시:', { language, finalAnswer: finalAnswer?.substring(0, 100) });
                      }

                      // 단락 분리 및 렌더링
                      const paragraphs = finalAnswer.includes('\n\n')
                        ? finalAnswer.split('\n\n')
                        : [finalAnswer]; // 개행이 없으면 전체를 하나의 단락으로 처리

                      console.log('📝 분리된 단락들:', paragraphs);

                      return paragraphs.map((paragraph, index) => (
                        <div key={index} className="answer-paragraph">
                          {paragraph.trim().split('\n').map((line, lineIndex) => (
                            <React.Fragment key={lineIndex}>
                              {lineIndex > 0 && <br />}
                              {renderSimpleTextWithLinks(line.trim())}
                            </React.Fragment>
                          ))}
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <p>{t('noAnswerGenerated')}</p>
                )}

                {/* Gemini 생성 배지 표시 */}
                {data?.finalResult?.isGeminiGenerated && (
                  <div className="gemini-generated-badge">
                    <span className="analysis-badge">{t('geminiGenerated')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Confidence Reasoning Section */}
            {data?.finalResult?.confidenceReasoning && (
              <div className="confidence-reasoning-section">
                <h4>🧠 {t('confidenceAnalysisReason').replace('{score}', data.finalResult.confidenceReasoning.finalScore)}</h4>
                
                <div className="confidence-explanation">
                  <div className="score-summary">
                    <p>{data.finalResult.confidenceReasoning.scoreExplanation}</p>
                  </div>
                  
                  {data.finalResult.confidenceReasoning.positiveFactors.length > 0 && (
                    <div className="positive-factors">
                      <h5>✅ {t('confidenceBoostingFactors')}</h5>
                      <ul>
                        {data.finalResult.confidenceReasoning.positiveFactors.map((factor, index) => (
                          <li key={index}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {data.finalResult.confidenceReasoning.considerations.length > 0 && (
                    <div className="considerations">
                      <h5>⚠️ {t('considerations')}</h5>
                      <ul>
                        {data.finalResult.confidenceReasoning.considerations.map((consideration, index) => (
                          <li key={index}>{consideration}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="technical-breakdown">
                    <h5>📊 {t('technicalDetails')}</h5>
                    <div className="technical-grid">
                      <div className="tech-item">
                        <span className="tech-label">{t('baseConfidence')}</span>
                        <span className="tech-value">{data.finalResult.confidenceReasoning.technicalDetails.baseConfidence}%</span>
                      </div>
                      <div className="tech-item">
                        <span className="tech-label">{t('consensusBonus')}</span>
                        <span className="tech-value">+{data.finalResult.confidenceReasoning.technicalDetails.consensusBonus}%</span>
                      </div>
                      <div className="tech-item">
                        <span className="tech-label">{t('totalModels')}</span>
                        <span className="tech-value">{data.finalResult.confidenceReasoning.technicalDetails.totalModels}</span>
                      </div>
                      <div className="tech-item">
                        <span className="tech-label">{t('agreementCount')}</span>
                        <span className="tech-value">{data.finalResult.confidenceReasoning.technicalDetails.agreementCount}</span>
                      </div>
                      <div className="tech-item">
                        <span className="tech-label">{t('disagreementCount')}</span>
                        <span className="tech-value">{data.finalResult.confidenceReasoning.technicalDetails.disagreementCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}


            <div className="result-metadata">

              {data?.finalResult?.sourcesByModel && Object.keys(data.finalResult.sourcesByModel).length > 0 && (
                <div className="sources-by-model">
                  <h5>📚 {t('sourcesByModel')}</h5>
                  <div className="model-sources-list">
                    {Object.entries(data.finalResult.sourcesByModel).map(([modelName, sources], index) => (
                      <div key={index} className="model-source-group">
                        <div className="model-name-header">
                          <strong>{modelName}</strong>
                          <span className="source-count">({sources.length} {t('sourceCount')})</span>
                        </div>
                        <div className="model-sources">
                          {sources.map((source, sourceIndex) => (
                            <div key={sourceIndex} className="source-item-inline">
                              {renderSourceContent(source, modelName)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data?.finalResult?.warnings?.length > 0 && (
                <div className="warnings">
                  <h5>⚠️ {t('warnings')}</h5>
                  <ul>
                    {data.finalResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}

export default AIResponseCards;