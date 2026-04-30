import React, { useState, useEffect } from 'react';
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

function App() {
  const [bgIndex, setBgIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  // Automatically cycle through background images every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prevIndex) => (prevIndex + 1) % BACKGROUNDS.length);
    }, 8000); // 8 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      {/* Preloads and crossfades background layers */}
      {BACKGROUNDS.map((url, index) => (
        <div
          key={url}
          className="bg-slider"
          style={{
            backgroundImage: `linear-gradient(rgba(43, 30, 48, 0.25), rgba(20, 25, 35, 0.55)), url('${url}')`,
            opacity: bgIndex === index ? 1 : 0
          }}
        />
      ))}
      
      <div className="top-nav">
        <button className="nav-icon-btn" onClick={() => setShowInfo(true)} title="Information">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </button>
      </div>

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
        <StudyTimer />
      </div>
    </div>
  );
}

export default App;