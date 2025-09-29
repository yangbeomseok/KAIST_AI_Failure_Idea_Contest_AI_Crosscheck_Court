import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ASCIIText from '../components/ASCIIText';
import LightRays from '../components/LightRays';
import './LandingPage.css';

function LandingPage() {
  const { t } = useLanguage();

  return (
    <div className="landing-page">
      <LightRays
        raysOrigin="top-center"
        raysColor="#00ffff"
        raysSpeed={1.5}
        lightSpread={0.8}
        rayLength={1.2}
        followMouse={true}
        mouseInfluence={0.1}
        noiseAmount={0.1}
        distortion={0.05}
        className="background-rays"
      />
      <div className="hero-section">
        <div className="ascii-container">
          <ASCIIText
            text={`WELCOME TO
AI CROSSCHECK COURT!`}
            asciiFontSize={10}
            textFontSize={280}
            planeBaseHeight={15}
            enableWaves={true}
          />
        </div>
      </div>
      
      <div className="content-section">
        <div className="description">
          <h2>{t('mainTitle')}</h2>
          <p>
            {t('mainDescription')}
          </p>
        </div>

        <div className="action-buttons">
          <button 
            className="primary-button"
            onClick={() => window.location.href = '/query'}
          >
            {t('getStarted')}
          </button>
          <button className="tertiary-button">
            {t('termsOfUse')}
          </button>
        </div>

        <div className="additional-info">
          <p>
            <strong>{t('experimentalProject')}</strong> - {t('experimentalDescription')}
          </p>
          <p>
            {t('transparentDisclosure')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;