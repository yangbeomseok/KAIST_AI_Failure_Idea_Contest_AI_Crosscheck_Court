import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import LanguageToggle from './components/LanguageToggle';
import LandingPage from './pages/LandingPage';
import QueryPage from './pages/QueryPage';
import './App.css';

function AppContent() {
  const { language } = useLanguage();

  useEffect(() => {
    // body에 언어별 클래스 적용
    document.body.className = language === 'en' ? 'english-text' : 'korean-text';
  }, [language]);

  return (
    <Router>
      <div className="App">
        <LanguageToggle />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/query" element={<QueryPage />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;