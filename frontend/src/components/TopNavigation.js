import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageToggle from './LanguageToggle';
import './TopNavigation.css';

function TopNavigation() {
  const { t } = useLanguage();

  return (
    <nav className="top-navigation">
      <div className="nav-container">
        <div className="nav-left">
          <div className="logo-section">
            <div className="logo-icon">⚡</div>
            <div className="service-info">
              <h1 className="service-name">AI CROSSCHECK COURT</h1>
              <span className="service-tagline">{t('mainTitle')}</span>
            </div>
          </div>
        </div>
        
        <div className="nav-right">
          <button className="nav-button" onClick={() => window.open('#', '_blank')}>
            {t('termsOfUse')}
          </button>
          <LanguageToggle />
        </div>
      </div>
    </nav>
  );
}

export default TopNavigation;