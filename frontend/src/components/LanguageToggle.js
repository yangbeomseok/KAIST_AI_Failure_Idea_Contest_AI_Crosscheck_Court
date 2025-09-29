import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './LanguageToggle.css';

function LanguageToggle() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="language-toggle">
      <button
        className={`lang-button ${language === 'en' ? 'active' : ''}`}
        onClick={() => changeLanguage('en')}
      >
        EN
      </button>
      <button
        className={`lang-button ${language === 'kr' ? 'active' : ''}`}
        onClick={() => changeLanguage('kr')}
      >
        KR
      </button>
    </div>
  );
}

export default LanguageToggle;