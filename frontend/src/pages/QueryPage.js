import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import BackgroundLayout from '../components/BackgroundLayout';
import QueryInput from '../components/QueryInput';
import AIResponseCards from '../components/AIResponseCards';
import LoadingAnimation from '../components/LoadingAnimation';
import './QueryPage.css';

function QueryPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [responses, setResponses] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);

  const handleSubmitQuery = async (queryText) => {
    if (!queryText.trim()) return;
    
    setQuery(queryText);
    setIsLoading(true);
    setHasQueried(true);
    
    try {
      const response = await fetch('http://localhost:5001/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: queryText }),
      });
      
      const data = await response.json();
      
      // Delay for response simulation
      setTimeout(() => {
        setResponses(data);
        setIsLoading(false);
      }, 2000);
      
    } catch (error) {
      console.error('Query error:', error);
      console.error('Error details:', error.message);
      setIsLoading(false);
      
      // Display actual error message
      setResponses({
        success: false,
        error: `Network error: ${error.message}. Please check if the backend server (port 5001) is running.`,
        data: generateDemoData(queryText)
      });
    }
  };

  const generateDemoData = (queryText) => ({
    query: queryText,
    responses: [
      {
        model: 'chatgpt',
        modelName: 'ChatGPT',
        response: 'This is ChatGPT\'s response. This is demo data.',
        confidence: 0.85,
        status: 'success'
      },
      {
        model: 'claude',
        modelName: 'Claude',
        response: 'This is Claude\'s response. This is demo data.',
        confidence: 0.92,
        status: 'success'
      },
      {
        model: 'gemini',
        modelName: 'Gemini',
        response: 'This is Gemini\'s response. Currently showing demo data due to API connection failure.',
        confidence: 0.78,
        status: 'error'
      }
    ],
    crossCheck: {
      agreements: [
        { models: ['ChatGPT', 'Claude'], similarity: 0.8, topic: 'General Consensus' }
      ],
      disagreements: [],
      consensus: { level: 'high', confidence: 0.87 }
    },
    finalResult: {
      answer: 'This is the synthesized answer.',
      confidenceScore: 0.87,
      reliability: 'high',
      sources: ['ChatGPT', 'Claude'],
      warnings: ['Some AI model connection failed']
    }
  });

  return (
    <BackgroundLayout className="query-page">
      <button 
        onClick={() => navigate('/')}
        className="home-button-fixed"
      >
        ← {t('home')}
      </button>
      
      <div className="query-page-container">
        <header className="query-header">
          <h1 className="query-title">{t('queryTitle')}</h1>
          <p className="query-subtitle">
            {t('querySubtitle')}
          </p>
        </header>

        <div className="query-main">
          <QueryInput 
            onSubmit={handleSubmitQuery}
            disabled={isLoading}
          />

          {hasQueried && (
            <div className="results-section">
              {isLoading ? (
                <LoadingAnimation />
              ) : responses ? (
                <AIResponseCards 
                  query={query}
                  responses={responses}
                />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </BackgroundLayout>
  );
}

export default QueryPage;