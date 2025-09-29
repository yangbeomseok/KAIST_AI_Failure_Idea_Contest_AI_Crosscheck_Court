import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './LoadingAnimation.css';

function LoadingAnimation() {
  const { t } = useLanguage();
  const aiModels = [
    { name: 'ChatGPT', color: '#ffffff', delay: '0s', icon: '/chatgpt-icon.png' },
    { name: 'Claude', color: '#ff6b35', delay: '0.2s', icon: '/claude-ai-icon.png' },
    { name: 'Gemini', color: '#4285f4', delay: '0.4s', icon: '/google-gemini-icon.png' },
    { name: 'Perplexity', color: '#20b2aa', delay: '0.6s', icon: '/perplexity-ai-icon.png' },
    { name: 'GROK', color: '#000000', delay: '0.8s', icon: '/grok-icon.png' },
    { name: 'CLOVA X', color: '#03c75a', delay: '1.0s', icon: '/naver-clova-icon.png' }
  ];

  return (
    <div className="loading-animation">
      <div className="loading-header">
        <h3>{t('loadingHeader')}</h3>
        <p>{t('loadingAnalyzing')}</p>
      </div>

      <div className="ai-models-grid">
        {aiModels.map((model, index) => (
          <div 
            key={model.name} 
            className={`ai-model-card ${model.name === 'GROK' ? 'grok-card' : ''} ${model.name === 'CLOVA X' ? 'clova-card' : ''} ${model.name === 'ChatGPT' ? 'chatgpt-card' : ''}`}
            style={{ 
              '--delay': model.delay,
              '--color': model.color 
            }}
          >
            <div className="model-icon">
              <div className="icon-pulse"></div>
              {model.icon ? (
                <img 
                  src={model.icon} 
                  alt={model.name}
                  className="model-logo-loading"
                />
              ) : (
                <span className="model-initial">
                  {model.name.charAt(0)}
                </span>
              )}
            </div>
            <div className="model-info">
              <h4>{model.name}</h4>
              <div className="status-indicator">
                <div className="status-dot"></div>
                <span>{t('analyzingStatus')}</span>
              </div>
            </div>
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="process-steps">
        <div className="step active">
          <div className="step-number">1</div>
          <span>{t('steps.questionAnalysis')}</span>
        </div>
        <div className="step-connector"></div>
        <div className="step active">
          <div className="step-number">2</div>
          <span>{t('steps.responseGeneration')}</span>
        </div>
        <div className="step-connector"></div>
        <div className="step">
          <div className="step-number">3</div>
          <span>{t('steps.crossValidation')}</span>
        </div>
        <div className="step-connector"></div>
        <div className="step">
          <div className="step-number">4</div>
          <span>{t('steps.resultIntegration')}</span>
        </div>
      </div>

      <div className="loading-tips">
        <div className="tip-icon">💡</div>
        <p>{t('loadingTip')}</p>
      </div>
    </div>
  );
}

export default LoadingAnimation;