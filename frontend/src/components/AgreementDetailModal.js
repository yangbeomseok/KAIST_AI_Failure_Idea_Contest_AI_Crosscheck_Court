import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './AgreementDetailModal.css';

function AgreementDetailModal({ agreement, isOpen, onClose }) {
  const { t } = useLanguage();
  
  if (!isOpen || !agreement) return null;

  const getModelIcon = (modelName) => {
    const icons = {
      'ChatGPT': '/chatgpt-icon.png',
      'Claude': '/claude-ai-icon.png',
      'Gemini': '/google-gemini-icon.png',
      'Perplexity': '/perplexity-ai-icon.png',
      'GROK': '/grok-icon.png',
      'CLOVA X': '/naver-clova-icon.png'
    };
    return icons[modelName] || null;
  };

  const getModelColor = (modelName) => {
    const colors = {
      'ChatGPT': '#10a37f',
      'Claude': '#ff6b35',
      'Gemini': '#4285f4',
      'Perplexity': '#20b2aa',
      'GROK': '#000000',
      'CLOVA X': '#03c75a'
    };
    return colors[modelName] || '#00ffff';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#00ff88';
    if (confidence >= 0.6) return '#ffaa00';
    return '#ff4444';
  };

  return (
    <div className="agreement-modal-overlay" onClick={onClose}>
      <div className="agreement-modal-content" onClick={e => e.stopPropagation()}>
        <div className="agreement-modal-header">
          <div className="agreement-title">
            <div className="gemini-icon">
              <img src="/google-gemini-icon.png" alt="Gemini" className="analyzer-logo" />
              <span className="analyzer-label">Gemini 2.5 Flash Lite Analysis</span>
            </div>
            <h2>{agreement.topic || t('agreementAnalysis')}</h2>
          </div>
          <button className="agreement-close-button" onClick={onClose}>×</button>
        </div>

        <div className="agreement-modal-body">
          {/* 합의 내용 카드 */}
          <div className="modal-section-card">
            <div className="agreement-content-section">
              <h3>🤝 {t('agreementContent')}</h3>
              <div className="agreement-content-box">
                {/* 이중 언어 지원 */}
                <div className="bilingual-content">
                  <div className="content-kr">
                    <h4>🇰🇷 한국어</h4>
                    <p>{agreement.contentKr || agreement.content}</p>
                  </div>
                  <div className="content-en">
                    <h4>🇺🇸 English</h4>
                    <p>{agreement.content || agreement.contentKr}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 신뢰도 카드 */}
          <div className="modal-section-card">
            <div className="agreement-confidence-section">
              <h3>📊 {t('confidenceLevel')}</h3>
              <div className="confidence-display">
                <div className="confidence-circle-small">
                  <div 
                    className="confidence-fill-small"
                    style={{ 
                      background: `conic-gradient(${getConfidenceColor(agreement.confidence || agreement.similarity || 0.8)} ${(agreement.confidence || agreement.similarity || 0.8) * 360}deg, #2a2a2a ${(agreement.confidence || agreement.similarity || 0.8) * 360}deg)`
                    }}
                  >
                    <span className="confidence-percent-small">
                      {Math.round((agreement.confidence || agreement.similarity || 0.8) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="confidence-description">
                  <p>{t('geminiConfidenceDescription')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 참여한 AI 모델들 카드 */}
          <div className="modal-section-card">
            <div className="participating-ais-section">
              <h3>🤖 {t('participatingAiModels')}</h3>
              <div className="ai-models-grid">
                {(agreement.participatingAIs || agreement.models || []).map((modelName, index) => (
                  <div key={index} className="ai-model-item">
                    <div className="ai-model-icon">
                      {getModelIcon(modelName) ? (
                        <img 
                          src={getModelIcon(modelName)} 
                          alt={modelName}
                          className="ai-model-logo"
                        />
                      ) : (
                        <div 
                          className="ai-model-letter" 
                          style={{ background: getModelColor(modelName) }}
                        >
                          {modelName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="ai-model-name">{modelName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gemini의 분석 근거 카드 */}
          {(agreement.reasoning || agreement.reasoningKr) && (
            <div className="modal-section-card">
              <div className="analysis-reasoning-section">
                <h3>🧠 {t('geminiAnalysisReasoning')}</h3>
                <div className="reasoning-content">
                  {/* 이중 언어 지원 */}
                  <div className="bilingual-reasoning">
                    <div className="reasoning-kr">
                      <h4>🇰🇷 한국어 분석 근거</h4>
                      <p>{agreement.reasoningKr || agreement.reasoning}</p>
                    </div>
                    <div className="reasoning-en">
                      <h4>🇺🇸 English Analysis Reasoning</h4>
                      <p>{agreement.reasoning || agreement.reasoningKr}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 분석 방법 카드 */}
          {agreement.analysisMethod && (
            <div className="modal-section-card">
              <div className="analysis-method-section">
                <h3>⚙️ {t('analysisMethod')}</h3>
                <div className="method-content">
                  <p>{agreement.analysisMethod}</p>
                </div>
              </div>
            </div>
          )}

          {/* 증거 인용문들 카드 */}
          {agreement.evidenceQuotes && agreement.evidenceQuotes.length > 0 && (
            <div className="modal-section-card">
              <div className="evidence-quotes-section">
                <h3>📝 {t('evidenceQuotes')}</h3>
                <div className="quotes-list">
                  {agreement.evidenceQuotes.map((quote, index) => {
                    const [modelName, content] = quote.split(': ');
                    return (
                      <div key={index} className="quote-item">
                        <div className="quote-header">
                          <div className="quote-model-icon">
                            {getModelIcon(modelName) ? (
                              <img 
                                src={getModelIcon(modelName)} 
                                alt={modelName}
                                className="quote-model-logo"
                              />
                            ) : (
                              <div 
                                className="quote-model-letter" 
                                style={{ background: getModelColor(modelName) }}
                              >
                                {modelName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="quote-model-name">{modelName}</span>
                        </div>
                        <div className="quote-content">
                          <p>"{content}"</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 분석 메타데이터 카드 */}
          <div className="modal-section-card">
            <div className="analysis-metadata">
              <div className="metadata-grid">
                <div className="metadata-item">
                  <span className="metadata-label">{t('analysisModel')}</span>
                  <span className="metadata-value">Gemini 2.5 Flash Lite</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">{t('agreementType')}</span>
                  <span className="metadata-value">{t('semanticConsensus')}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">{t('participatingModels')}</span>
                  <span className="metadata-value">
                    {(agreement.participatingAIs || agreement.models || []).length} {t('participatingModels')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgreementDetailModal;