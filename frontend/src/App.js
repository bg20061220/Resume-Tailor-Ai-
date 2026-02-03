import React, { useState } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ExperienceManager } from './components/ExperienceManager';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function MainApp() {
  const [activeTab, setActiveTab] = useState('generate');
  const [jobDescription, setJobDescription] = useState('');
  const [matchedExperiences, setMatchedExperiences] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bullets, setBullets] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const { user, signOut, getAccessToken } = useAuth();

  // Helper to make authenticated API calls
  const authFetch = async (url, options = {}) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      await signOut();
      throw new Error('Session expired. Please sign in again.');
    }

    return response;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get similarity label and class
  const getSimilarityInfo = (similarity) => {
    if (similarity >= 0.75) {
      return { label: 'Strong Match', className: 'match-strong' };
    } else if (similarity >= 0.5) {
      return { label: 'Good Match', className: 'match-good' };
    }
    return { label: 'Weak Match', className: 'match-weak' };
  };

  const searchExperiences = async () => {
    setSearchLoading(true);
    setBullets([]);
    setSelectedIds(new Set());

    try {
      const response = await authFetch(`${API_URL}/api/search`, {
        method: 'POST',
        body: JSON.stringify({
          query: jobDescription,
          limit: 10
        })
      });
      const data = await response.json();
      const results = data.results || [];
      setMatchedExperiences(results);

      // Auto-select strong matches (>= 0.75)
      const strongMatches = results
        .filter(exp => exp.similarity >= 0.75)
        .map(exp => exp.id);
      setSelectedIds(new Set(strongMatches));

      if (data.message) {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'Failed to search experiences');
    }
    setSearchLoading(false);
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(matchedExperiences.map(exp => exp.id)));
  };

  const selectNone = () => {
    setSelectedIds(new Set());
  };

  const generateBullets = async () => {
    if (selectedIds.size === 0) {
      alert('Please select at least one experience');
      return;
    }

    setGenerateLoading(true);

    try {
      const response = await authFetch(`${API_URL}/api/generate`, {
        method: 'POST',
        body: JSON.stringify({
          job_description: jobDescription,
          experience_ids: Array.from(selectedIds),
          num_bullets: Math.min(selectedIds.size * 2, 6)
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to generate bullets');
      }

      const data = await response.json();
      setBullets(data.bullets || []);
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'Failed to generate bullets');
    }
    setGenerateLoading(false);
  };

  const copyBullet = async (bullet, index) => {
    try {
      await navigator.clipboard.writeText(bullet);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyAllBullets = async () => {
    try {
      await navigator.clipboard.writeText(bullets.map(b => `• ${b}`).join('\n'));
      setCopiedIndex('all');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Resume Tailor</h1>
        <p>AI-powered resume customization</p>
        <div className="user-info">
          <span>{user?.email}</span>
          <button onClick={handleSignOut} className="sign-out-btn">
            Sign Out
          </button>
        </div>
      </header>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          Generate Bullets
        </button>
        <button
          className={`tab ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          Manage Experiences
        </button>
      </div>

      <div className="container">
        {activeTab === 'generate' ? (
          <>
            <div className="input-section">
              <h2>Step 1: Paste Job Description</h2>
              <textarea
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={8}
              />
              <button
                onClick={searchExperiences}
                disabled={searchLoading || !jobDescription.trim()}
              >
                {searchLoading ? 'Finding Matches...' : 'Find Matching Experiences'}
              </button>
            </div>

            {matchedExperiences.length > 0 && (
              <div className="matches-section">
                <div className="matches-header">
                  <h2>Step 2: Select Experiences</h2>
                  <div className="selection-actions">
                    <button onClick={selectAll} className="link-btn">Select All</button>
                    <span className="separator">|</span>
                    <button onClick={selectNone} className="link-btn">Select None</button>
                  </div>
                </div>
                <p className="matches-hint">
                  {selectedIds.size} of {matchedExperiences.length} selected.
                  Strong matches are pre-selected.
                </p>

                <div className="matches-list">
                  {matchedExperiences.map((exp) => {
                    const { label, className } = getSimilarityInfo(exp.similarity);
                    const isSelected = selectedIds.has(exp.id);

                    return (
                      <label
                        key={exp.id}
                        className={`match-card ${isSelected ? 'selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(exp.id)}
                        />
                        <div className="match-content">
                          <div className="match-header">
                            <h3>{exp.title}</h3>
                            <span className={`match-badge ${className}`}>
                              {label} ({(exp.similarity * 100).toFixed(0)}%)
                            </span>
                          </div>
                          <p className="match-meta">
                            {exp.type} {exp.date_range && `• ${exp.date_range}`}
                          </p>
                          {exp.skills && exp.skills.length > 0 && (
                            <div className="match-skills">
                              {exp.skills.slice(0, 5).map((skill) => (
                                <span key={skill} className="skill-tag-sm">{skill}</span>
                              ))}
                              {exp.skills.length > 5 && (
                                <span className="skill-tag-sm more">+{exp.skills.length - 5}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                <button
                  onClick={generateBullets}
                  disabled={generateLoading || selectedIds.size === 0}
                  className="generate-btn"
                >
                  {generateLoading
                    ? 'Generating...'
                    : `Generate Bullets from ${selectedIds.size} Experience${selectedIds.size !== 1 ? 's' : ''}`
                  }
                </button>
              </div>
            )}

            {bullets.length > 0 && (
              <div className="results-section">
                <div className="results-header">
                  <h2>Step 3: Your Tailored Bullets</h2>
                  <button onClick={copyAllBullets} className="copy-all-btn">
                    {copiedIndex === 'all' ? 'Copied!' : 'Copy All'}
                  </button>
                </div>
                <ul className="bullets-list">
                  {bullets.map((bullet, i) => (
                    <li key={i} className="bullet-item">
                      <span className="bullet-text">{bullet}</span>
                      <button
                        onClick={() => copyBullet(bullet, i)}
                        className="copy-btn"
                        title="Copy to clipboard"
                      >
                        {copiedIndex === i ? 'Copied!' : 'Copy'}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <ExperienceManager authFetch={authFetch} apiUrl={API_URL} />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <MainApp />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;