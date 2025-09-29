import React from 'react';
import './ResponseModal.css';

function ResponseModal({ response, isOpen, onClose }) {
  if (!isOpen || !response) return null;

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

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#00ff88';
    if (confidence >= 0.6) return '#ffaa00';
    return '#ff4444';
  };

  const extractSources = (text) => {
    const sources = [];
    
    // URL 패턴 (더 포괄적) - 실제 클릭 가능한 링크로 처리
    const urls = text.match(/https?:\/\/[^\s\)\]\}]+/g) || [];
    sources.push(...urls.map(url => ({ 
      type: 'url', 
      content: url, 
      displayText: url,
      isClickable: true 
    })));
    
    // [확인됨], [출처], [추정] 태그 (더 다양한 패턴)
    const citationPatterns = [
      /\[(확인됨|출처|추정|검증됨|confirmed|source|estimated|verified)[^\]]*\]/g,
      /\[Source:\s*[^\]]+\]/g,
      /Source:\s*[^\n\r.]+/g,
      /Reference:\s*[^\n\r.]+/g,
      /참고:\s*[^\n\r.]+/g,
      /출처:\s*[^\n\r.]+/g,
      /\([^)]*\d{4}[^)]*\)/g  // (저자명, 2024) 형식
    ];
    
    citationPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(cite => {
        let type = 'source';
        if (cite.includes('확인됨') || cite.includes('confirmed') || cite.includes('verified')) type = 'confirmed';
        else if (cite.includes('추정') || cite.includes('estimated')) type = 'estimated';
        else if (cite.includes('출처') || cite.includes('source') || cite.includes('참고') || cite.includes('reference')) type = 'source';
        
        sources.push({ 
          type, 
          content: cite,
          displayText: cite,
          isClickable: false
        });
      });
    });
    
    // Perplexity 특화 패턴 - 숫자 인덱스 [1], [2] 등과 하단 참고자료 매칭
    const perplexityIndexes = text.match(/\[\d+\]/g) || [];
    if (perplexityIndexes.length > 0) {
      console.log('Perplexity indexes found:', perplexityIndexes);
      
      // 참고자료 섹션 찾기 (한영 모두 지원)
      const referenceSectionMatch = text.split(/참고\s*자료:|Reference materials:|References:|출처:/i);
      console.log('Reference section split:', referenceSectionMatch.length > 1 ? 'Found' : 'Not found');
      
      if (referenceSectionMatch.length > 1) {
        const referenceSection = referenceSectionMatch[1];
        console.log('Reference section content:', referenceSection.substring(0, 200));
        
        // 각 줄에서 [숫자] 로 시작하는 참고자료 추출
        const lines = referenceSection.split('\n');
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine.match(/^\[\d+\]/)) {
            console.log('Found reference line:', trimmedLine);
            
            // URL이 포함된 경우 분리해서 처리
            const urlMatch = trimmedLine.match(/(https?:\/\/[^\s]+)/);
            if (urlMatch) {
              const beforeUrl = trimmedLine.substring(0, trimmedLine.indexOf(urlMatch[1])).trim();
              sources.push({ 
                type: 'reference', 
                content: trimmedLine,
                displayText: beforeUrl,
                url: urlMatch[1],
                isClickable: true
              });
            } else {
              sources.push({ 
                type: 'reference', 
                content: trimmedLine,
                displayText: trimmedLine,
                isClickable: false
              });
            }
          }
        });
      } else {
        // 참고자료 섹션이 없으면 인덱스만 표시
        console.log('No reference section found, showing index placeholders');
        perplexityIndexes.forEach(index => {
          sources.push({ 
            type: 'index', 
            content: `Source ${index}`,
            displayText: `Source ${index} (Details not available)`,
            isClickable: false
          });
        });
      }
    }
    
    // Research/report/statistics mention patterns
    const studyPatterns = [
      /(연구|논문|보고서|조사|설문|research|study|report|survey)에?\s*(따르면|의하면|에서|according to|based on)/g,
      /(통계청|정부|기관|대학|statistics office|government|institution|university)\s*[^.]{1,50}에?\s*(따르면|발표|according to|published)/g,
      /\d{4}년?\s*(연구|조사|보고서|research|study|report)/g
    ];
    
    studyPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        sources.push({ 
          type: 'study', 
          content: match,
          displayText: match,
          isClickable: false
        });
      });
    });
    
    return sources;
  };

  const getSourceIcon = (type) => {
    switch(type) {
      case 'url': return '🔗';
      case 'confirmed': return '✅';
      case 'source': return '📚';
      case 'estimated': return '❓';
      case 'reference': return '📋';
      case 'index': return '🔢';
      case 'study': return '🔬';
      default: return '📄';
    }
  };

  const sources = extractSources(response.response || '');
  
  // 신뢰도 상세 분석 (만약 있다면)
  const confidenceDetails = response.confidenceDetails || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ '--model-color': getModelColor(response.model) }}>
          <div className="modal-title">
            <div className="model-icon-large">
              {getModelIcon(response.model) ? (
                <img 
                  src={getModelIcon(response.model)} 
                  alt={response.modelName}
                  className="model-logo-large"
                />
              ) : (
                <div className="model-letter-large" style={{ background: getModelColor(response.model) }}>
                  {response.modelName?.charAt(0) || 'A'}
                </div>
              )}
            </div>
            <div className="model-info">
              <h2>{response.modelName} Detailed Response</h2>
              <div className="model-specialty">
                {getModelSpecialty(response.model)}
              </div>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* 신뢰도 상세 분석 */}
          <div className="confidence-analysis">
            <div className="confidence-header">
              <h3>Confidence Analysis</h3>
              <div className="overall-confidence">
                <div className="confidence-circle-large">
                  <div 
                    className="confidence-fill-large"
                    style={{ 
                      background: `conic-gradient(${getConfidenceColor(response.confidence)} ${response.confidence * 360}deg, #2a2a2a ${response.confidence * 360}deg)`
                    }}
                  >
                    <div className="confidence-inner">
                      <span className="confidence-percent">{Math.round(response.confidence * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {confidenceDetails.breakdown && (
              <div className="confidence-breakdown">
                <h4>Detailed Confidence Analysis</h4>
                <div className="breakdown-items">
                  {confidenceDetails.breakdown.contentQuality && (
                    <div className="breakdown-item">
                      <span className="item-label">Content Quality</span>
                      <div className="item-bar">
                        <div 
                          className="item-fill"
                          style={{ width: `${confidenceDetails.breakdown.contentQuality.score * 100}%` }}
                        ></div>
                      </div>
                      <span className="item-score">{Math.round(confidenceDetails.breakdown.contentQuality.score * 100)}%</span>
                    </div>
                  )}
                  
                  {confidenceDetails.breakdown.sourceReliability && (
                    <div className="breakdown-item">
                      <span className="item-label">Source Reliability</span>
                      <div className="item-bar">
                        <div 
                          className="item-fill"
                          style={{ width: `${confidenceDetails.breakdown.sourceReliability.score * 100}%` }}
                        ></div>
                      </div>
                      <span className="item-score">{Math.round(confidenceDetails.breakdown.sourceReliability.score * 100)}%</span>
                    </div>
                  )}
                  
                  {confidenceDetails.breakdown.factualAccuracy && (
                    <div className="breakdown-item">
                      <span className="item-label">Factual Accuracy</span>
                      <div className="item-bar">
                        <div 
                          className="item-fill"
                          style={{ width: `${confidenceDetails.breakdown.factualAccuracy.score * 100}%` }}
                        ></div>
                      </div>
                      <span className="item-score">{Math.round(confidenceDetails.breakdown.factualAccuracy.score * 100)}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 전체 응답 텍스트 */}
          <div className="response-content">
            <h3>Response Content</h3>
            <div className="response-text-full">
              {response.status === 'error' ? (
                <div className="error-content">
                  <div className="error-icon-large">❌</div>
                  <h4>Response Generation Failed</h4>
                  <p>{response.error}</p>
                </div>
              ) : (
                <div className="response-paragraphs">
                  {response.response.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="response-paragraph">
                      {paragraph.trim()}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 출처 및 인용 */}
          {sources.length > 0 && (
            <div className="sources-section">
              <h3>Sources and Citations</h3>
              <div className="sources-list">
                {sources.map((source, index) => (
                  <div key={index} className={`source-item ${source.type}`}>
                    <div className="source-icon">{getSourceIcon(source.type)}</div>
                    <div className="source-content">
                      {source.isClickable ? (
                        <div className="source-clickable">
                          {source.url ? (
                            // Perplexity 스타일의 참고자료 (제목 + URL)
                            <>
                              <div className="source-title">{source.displayText}</div>
                              <a 
                                href={source.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="source-link"
                              >
                                🔗 {source.url}
                              </a>
                            </>
                          ) : (
                            // 일반 URL
                            <a 
                              href={source.content} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="source-link"
                            >
                              {source.displayText}
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="source-text">
                          <span className="source-display">{source.displayText}</span>
                          {source.type === 'confirmed' && (
                            <span className="reliability-badge confirmed">Verified</span>
                          )}
                          {source.type === 'estimated' && (
                            <span className="reliability-badge estimated">Estimated</span>
                          )}
                          {source.type === 'study' && (
                            <span className="reliability-badge study">Research</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 메타데이터 */}
          <div className="response-metadata">
            <div className="metadata-grid">
              <div className="metadata-item">
                <span className="metadata-label">Generation Time</span>
                <span className="metadata-value">
                  {new Date(response.timestamp).toLocaleString('ko-KR')}
                </span>
              </div>
              
              <div className="metadata-item">
                <span className="metadata-label">Status</span>
                <span className={`metadata-value status-${response.status}`}>
                  {response.status === 'success' ? '✓ Success' : '✗ Failed'}
                </span>
              </div>
              
              {confidenceDetails.confidenceLevel && (
                <div className="metadata-item">
                  <span className="metadata-label">Confidence Level</span>
                  <span className={`metadata-value confidence-level-${confidenceDetails.confidenceLevel}`}>
                    {getConfidenceLevelText(confidenceDetails.confidenceLevel)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 경고사항 */}
          {confidenceDetails.warnings && confidenceDetails.warnings.length > 0 && (
            <div className="warnings-section">
              <h3>⚠️ Warnings</h3>
              <ul className="warnings-list">
                {confidenceDetails.warnings.map((warning, index) => (
                  <li key={index} className="warning-item">{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getModelSpecialty(modelId) {
  const specialties = {
    chatgpt: 'General knowledge and reasoning expert',
    claude: 'Ethical judgment and safety review expert',
    gemini: 'Multimodal information integration expert',
    perplexity: 'Real-time information search and source verification expert'
  };
  return specialties[modelId] || 'AI Assistant';
}

function getConfidenceLevelText(level) {
  const levels = {
    'very_high': 'Very High',
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low',
    'very_low': 'Very Low',
    'none': 'None'
  };
  return levels[level] || level;
}

export default ResponseModal;