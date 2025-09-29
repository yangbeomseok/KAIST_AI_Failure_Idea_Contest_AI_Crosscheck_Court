import React, { useState, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './QueryInput.css';

function QueryInput({ onSubmit, disabled }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !disabled) {
      onSubmit(query.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(Math.min(textarea.scrollHeight, 500), 200) + 'px';
    }
  };

  return (
    <div className="query-input-container">
      <form onSubmit={handleSubmit} className="query-form">
        <div className={`query-input-wrapper ${isFocused ? 'focused' : ''} ${disabled ? 'disabled' : ''}`}>
          <div className="input-glow"></div>
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              adjustTextareaHeight();
            }}
            onFocus={() => {
              setIsFocused(true);
              // 포커스 시에는 높이 조정 안 함
            }}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={t('queryPlaceholder')}
            className="query-textarea"
            disabled={disabled}
            rows={4}
          />
          <div className="input-border"></div>
        </div>
        
        <div className="query-actions">
          <button
            type="submit"
            disabled={!query.trim() || disabled}
            className={`submit-button ${disabled ? 'loading' : ''}`}
          >
            {disabled ? (
              <>
                <div className="loading-spinner"></div>
                <span>{t('loadingDescription')}</span>
              </>
            ) : (
              <>
                <span>{t('submitButton')}</span>
                <div className="submit-arrow">→</div>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default QueryInput;