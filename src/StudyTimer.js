import React, { useState, useEffect, useRef } from 'react';
import './StudyTimer.css';

const MODES = {
  POMODORO: { label: 'pomodoro', time: 25 * 60 },
  SHORT_BREAK: { label: 'short break', time: 5 * 60 },
  LONG_BREAK: { label: 'long break', time: 15 * 60 },
};

const StudyTimer = () => {
  const [mode, setMode] = useState('POMODORO');
  const [timeLeft, setTimeLeft] = useState(MODES.POMODORO.time);
  const [isActive, setIsActive] = useState(false);
  const [isBinauralActive, setIsBinauralActive] = useState(false);
  const audioCtxRef = useRef(null);
  const oscillatorsRef = useRef([]);

  const toggleBinaural = () => {
    if (!isBinauralActive) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const baseFreq = 200;
      const beatFreq = 40; // 40Hz Gamma

      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.1; // Lower volume

      const oscLeft = ctx.createOscillator();
      const panLeft = ctx.createStereoPanner();
      oscLeft.type = 'sine';
      oscLeft.frequency.value = baseFreq;
      panLeft.pan.value = -1;
      oscLeft.connect(panLeft);
      panLeft.connect(gainNode);
      oscLeft.start();

      const oscRight = ctx.createOscillator();
      const panRight = ctx.createStereoPanner();
      oscRight.type = 'sine';
      oscRight.frequency.value = baseFreq + beatFreq;
      panRight.pan.value = 1;
      oscRight.connect(panRight);
      panRight.connect(gainNode);
      oscRight.start();

      gainNode.connect(ctx.destination);

      oscillatorsRef.current = [oscLeft, oscRight];
      setIsBinauralActive(true);
    } else {
      oscillatorsRef.current.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch(e) {}
      });
      oscillatorsRef.current = [];
      setIsBinauralActive(false);
    }
  };

  useEffect(() => {
    return () => {
      oscillatorsRef.current.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch(e) {}
      });
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Handle Spacebar toggle to start/pause timer
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Trigger only if pressing Spacebar and not focused inside a typing input
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault(); // Prevents the window from scrolling down
        setIsActive((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Timer Countdown logic
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
      setIsActive(false);
      // Auto-switch modes based on completion
      if (mode === 'POMODORO') {
        switchMode('SHORT_BREAK');
      } else {
        switchMode('POMODORO');
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(MODES[newMode].time);
    setIsActive(false);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODES[mode].time);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="study-timer-container">
      <div className="timer-content">
        <div className="mode-selector">
          {Object.keys(MODES).map((modeKey) => (
            <button
               key={modeKey}
               className={`mode-btn ${mode === modeKey ? 'active' : ''}`}
               onClick={() => switchMode(modeKey)}
            >
              {MODES[modeKey].label}
            </button>
          ))}
        </div>

        <div className="time-display">
          {formatTime(timeLeft)}
        </div>

        <div className="controls">
          <button className="primary-btn" onClick={toggleTimer}>
            {isActive ? 'pause' : 'start'}
          </button>
          <button className="icon-btn" onClick={resetTimer} aria-label="Reset Timer">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
               <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
               <path d="M3 3v5h5"></path>
             </svg>
          </button>
          <button 
            className={`icon-btn ${isBinauralActive ? 'active' : ''}`} 
            onClick={toggleBinaural} 
            title="Toggle 40Hz Gamma Binaural Beats"
            aria-label="Toggle Binaural Beats"
          >
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
               <path d="M2 12h4l2-9 5 18 4-10 3 4h2"></path>
             </svg>
          </button>
          <button className="icon-btn" aria-label="Settings">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
               <circle cx="12" cy="12" r="3"></circle>
               <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
             </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudyTimer;
