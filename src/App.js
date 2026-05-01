import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import './App.css';
import StudyTimer from './StudyTimer';

import animeCyberpunk from './assets/anime_cyberpunk_1776498694212.png';
import animeFuji from './assets/anime_fuji_1776498674967.png';
import animeShrine from './assets/anime_shrine_1776498709222.png';
import animeTrain from './assets/anime_train_1776498727900.png';

// Retro Toons
import retroShinchan from './assets/retro_shinchan_1776502235370.png';
import retroDoraemon from './assets/retro_doraemon_1776502250517.png';
import retroKiteretsu from './assets/retro_kiteretsu_1776502265854.png';
import retroNinjaHattori from './assets/retro_ninja_hattori_1776502281981.png';
import retroHagemaru from './assets/retro_hagemaru_1776502299061.png';

const BACKGROUNDS = [
  animeCyberpunk,
  retroShinchan,
  animeFuji,
  retroDoraemon,
  animeShrine,
  retroKiteretsu,
  animeTrain,
  retroNinjaHattori,
  retroHagemaru
];

const SOLID_COLORS = [
  '#0f172a', // Slate 900
  '#1e1b4b', // Indigo 950
  '#171717', // Neutral 900
  '#2e1065', // Violet 900
  '#022c22', // Emerald 950
  '#450a0a', // Red 950
  '#082f49', // Sky 900
  '#27272a', // Zinc 800
];

const RANKS = [
  { name: 'Novice', threshold: 0 },
  { name: 'Apprentice', threshold: 100 },
  { name: 'Scholar', threshold: 300 },
  { name: 'Adept', threshold: 600 },
  { name: 'Expert', threshold: 1000 },
  { name: 'Master', threshold: 1500 },
  { name: 'Grandmaster', threshold: 2500 },
];

const getCurrentRank = (xp) => {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].threshold) {
      const nextRank = RANKS[i + 1] || null;
      return { 
        current: RANKS[i], 
        next: nextRank, 
        level: i + 1,
        progress: nextRank ? ((xp - RANKS[i].threshold) / (nextRank.threshold - RANKS[i].threshold)) * 100 : 100,
      };
    }
  }
  return { current: RANKS[0], next: RANKS[1], level: 1, progress: 0 };
};

const generateLastNDays = (n) => {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toDateString());
  }
  return days;
};



function App() {
  const [bgIndex, setBgIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [bgMode, setBgMode] = useState('image'); // 'image' or 'color'
  const [colorIndex, setColorIndex] = useState(0);

  // New Features State
  const [zenMode, setZenMode] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const DAILY_GOAL = 4;

  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('focusStats');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed, activity: parsed.activity || {} };
    }
    return { pomodoros: 0, totalMinutes: 0, currentStreak: 0, lastStudyDate: null, activity: {} };
  });

  useEffect(() => {
    localStorage.setItem('focusStats', JSON.stringify(stats));
  }, [stats]);

  // Handle Pomodoro completion
  const handlePomodoroComplete = (durationMinutes) => {
    const today = new Date().toDateString();
    setStats(prev => {
      let newStreak = prev.currentStreak;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (prev.lastStudyDate !== today) {
        if (prev.lastStudyDate === yesterday.toDateString()) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      } else if (prev.currentStreak === 0) {
          newStreak = 1;
      }

      const newPomodoros = prev.pomodoros + 1;
      const newTotalMinutes = prev.totalMinutes + durationMinutes;
      
      const newActivity = { ...prev.activity };
      newActivity[today] = (newActivity[today] || 0) + durationMinutes;

      // Check Level Up or Daily Goal
      const oldRank = getCurrentRank(prev.totalMinutes);
      const newRank = getCurrentRank(newTotalMinutes);
      
      if (newPomodoros === DAILY_GOAL || newRank.level > oldRank.level) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 8000);
      }

      return {
        ...prev,
        pomodoros: newPomodoros,
        totalMinutes: newTotalMinutes,
        currentStreak: newStreak,
        lastStudyDate: today,
        activity: newActivity
      };
    });
  };

  const rankInfo = getCurrentRank(stats.totalMinutes);

  const toggleZenMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
      setZenMode(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setZenMode(false);
    }
  };

  // Automatically cycle through background images every 8 seconds
  useEffect(() => {
    let interval;
    if (bgMode === 'image') {
      interval = setInterval(() => {
        setBgIndex((prevIndex) => (prevIndex + 1) % BACKGROUNDS.length);
      }, 8000); // 8 seconds
    }
    return () => clearInterval(interval);
  }, [bgMode]);

  return (
    <div className={`App ${zenMode ? 'zen-mode-active' : ''}`} style={{ backgroundColor: bgMode === 'color' ? SOLID_COLORS[colorIndex] : '#000', transition: 'background-color 1s ease' }}>
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} gravity={0.15} />}
      
      {/* Preloads and crossfades background layers */}
      {bgMode === 'image' && BACKGROUNDS.map((url, index) => (
        <div
          key={url}
          className="bg-slider"
          style={{
            backgroundImage: `linear-gradient(rgba(43, 30, 48, 0.25), rgba(20, 25, 35, 0.55)), url('${url}')`,
            opacity: bgIndex === index ? 1 : 0
          }}
        />
      ))}
      
      <div className="top-left-nav">
        <button className="nav-icon-btn" onClick={() => setBgMode(m => m === 'image' ? 'color' : 'image')} title={bgMode === 'image' ? "Switch to Solid Color" : "Switch to Image"}>
          {bgMode === 'image' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
            </svg>
          )}
        </button>
        {bgMode === 'color' && (
          <button className="nav-icon-btn" onClick={() => setColorIndex(i => (i + 1) % SOLID_COLORS.length)} title="Change Color">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
              <path d="M2 12h20"></path>
            </svg>
          </button>
        )}
      </div>
      
      <div className={`level-bar-container ${zenMode ? 'fade-in-zen' : ''}`}>
        <div className="level-info">
          <span className="rank-name">Lv {rankInfo.level}: {rankInfo.current.name}</span>
          <span className="xp-text">{stats.totalMinutes} XP {rankInfo.next ? `/ ${rankInfo.next.threshold} XP` : ''}</span>
        </div>
        <div className="xp-progress-bar">
          <div className="xp-progress-fill" style={{ width: `${rankInfo.progress}%` }}></div>
        </div>
      </div>

      <div className="top-nav fade-in-zen">
        <button className={`nav-icon-btn ${zenMode ? 'active' : ''}`} onClick={toggleZenMode} title="Zen Mode (Fullscreen)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
          </svg>
        </button>
        <button className="nav-icon-btn" onClick={() => setShowAnalytics(true)} title="Analytics">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </button>
        <button className="nav-icon-btn" onClick={() => setShowInfo(true)} title="Information">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </button>
      </div>

      {showAnalytics && (
        <div className="modal-overlay" onClick={() => setShowAnalytics(false)}>
          <div className="modal-content analytics-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowAnalytics(false)}>✕</button>
            <h2>Focus Analytics</h2>
            
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{stats.pomodoros}</h3>
                <p>Pomodoros</p>
              </div>
              <div className="stat-card">
                <h3>{Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m</h3>
                <p>Total Focus Time</p>
              </div>
              <div className="stat-card">
                <h3>{stats.currentStreak} 🔥</h3>
                <p>Day Streak</p>
              </div>
            </div>
            
            <div className="heatmap-section">
              <h3>Focus Heatmap (Last 60 Days)</h3>
              <div className="heatmap-grid">
                {generateLastNDays(60).map(day => {
                  const mins = stats.activity[day] || 0;
                  let intensityClass = 'level-0';
                  if (mins > 0 && mins <= 25) intensityClass = 'level-1';
                  else if (mins > 25 && mins <= 60) intensityClass = 'level-2';
                  else if (mins > 60 && mins <= 120) intensityClass = 'level-3';
                  else if (mins > 120) intensityClass = 'level-4';
                  
                  return <div key={day} className={`heatmap-cell ${intensityClass}`} title={`${day}: ${mins} mins`} />;
                })}
              </div>
            </div>

            <div className="daily-goal-section">
              <h3>Daily Goal ({stats.pomodoros} / {DAILY_GOAL})</h3>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${Math.min((stats.pomodoros / DAILY_GOAL) * 100, 100)}%` }}
                ></div>
              </div>
              {stats.pomodoros >= DAILY_GOAL && (
                <p className="goal-reached-text">🎉 You've reached your daily goal! Amazing work!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showInfo && (
        <div className="modal-overlay" onClick={() => setShowInfo(false)}>
          <div className="modal-content info-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowInfo(false)}>✕</button>
            <h2>About Pomodoro</h2>
            <p>The <strong>Pomodoro Technique</strong> is a time management method developed by <strong>Francesco Cirillo</strong> in the late 1980s in <strong>Italy</strong>.</p>
            <p>It uses a timer to break work into intervals, typically 25 minutes in length, separated by short breaks. Each interval is known as a <em>pomodoro</em>, from the Italian word for tomato, after the tomato-shaped kitchen timer Cirillo used as a university student.</p>
          </div>
        </div>
      )}

      <div className="app-content">
        <StudyTimer onPomodoroComplete={handlePomodoroComplete} zenMode={zenMode} />
      </div>
    </div>
  );
}

export default App;