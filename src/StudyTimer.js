import React, { useState, useEffect, useRef } from 'react';
import './StudyTimer.css';

const MUSIC_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'binaural', label: '40Hz Gamma Binaural Beats' },
  { id: 'rain', label: 'Ambient + Rain Sounds' },
  { id: 'lofi', label: 'Lo-Fi Beats (Radio)' },
  { id: 'instrumental', label: 'Instrumental (Radio)' },
  { id: 'brown_noise', label: 'White / Brown Noise' }
];

const StudyTimer = () => {
  // Settings State
  const [settings, setSettings] = useState({
    POMODORO: 25,
    SHORT_BREAK: 5,
    LONG_BREAK: 15
  });
  
  const MODES = {
    POMODORO: { label: 'pomodoro', time: settings.POMODORO * 60 },
    SHORT_BREAK: { label: 'short break', time: settings.SHORT_BREAK * 60 },
    LONG_BREAK: { label: 'long break', time: settings.LONG_BREAK * 60 },
  };

  const [mode, setMode] = useState('POMODORO');
  const [timeLeft, setTimeLeft] = useState(MODES.POMODORO.time);
  const [isActive, setIsActive] = useState(false);
  const [isTickingActive, setIsTickingActive] = useState(false);
  
  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);
  const [showMusicMenu, setShowMusicMenu] = useState(false);
  const [currentMusic, setCurrentMusic] = useState('none');

  // Audio Contexts
  const audioCtxRef = useRef(null);
  const oscillatorsRef = useRef([]);
  const noiseSourceRef = useRef(null);
  const tickTockRef = useRef(true);

  const handleSaveSettings = () => {
    setSettings(tempSettings);
    setShowSettings(false);
    if (!isActive) {
      setTimeLeft(tempSettings[mode] * 60);
    }
  };

  const playTick = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    const isTick = tickTockRef.current;
    tickTockRef.current = !isTick; 

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isTick ? 1200 : 800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.03);

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.03);
  };

  const playAlarm = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const freqs = [800, 1200, 1600];
    freqs.forEach(freq => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.5);
    });
  };

  // Music System
  useEffect(() => {
    // Stop all current sounds
    if (oscillatorsRef.current) {
      oscillatorsRef.current.forEach(osc => { try { osc.stop(); osc.disconnect(); } catch(e){} });
      oscillatorsRef.current = [];
    }
    if (noiseSourceRef.current) {
       try { noiseSourceRef.current.stop(); noiseSourceRef.current.disconnect(); } catch(e){}
       noiseSourceRef.current = null;
    }

    if (currentMusic === 'none' || currentMusic === 'lofi' || currentMusic === 'instrumental') {
      return; 
    }

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    if (currentMusic === 'binaural') {
      const baseFreq = 150; 
      const beatFreq = 40; 
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.05; 

      const oscLeft = ctx.createOscillator();
      const panLeft = ctx.createStereoPanner();
      oscLeft.type = 'sine';
      oscLeft.frequency.value = baseFreq;
      panLeft.pan.value = -1;
      oscLeft.connect(panLeft).connect(gainNode);
      oscLeft.start();

      const oscRight = ctx.createOscillator();
      const panRight = ctx.createStereoPanner();
      oscRight.type = 'sine';
      oscRight.frequency.value = baseFreq + beatFreq;
      panRight.pan.value = 1;
      oscRight.connect(panRight).connect(gainNode);
      oscRight.start();

      gainNode.connect(ctx.destination);
      oscillatorsRef.current = [oscLeft, oscRight];
    } 
    else if (currentMusic === 'brown_noise' || currentMusic === 'rain') {
      // Deep brown noise logic
      const bufferSize = ctx.sampleRate * 2; 
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; 
      }
      
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = currentMusic === 'rain' ? 800 : 300; 

      const gainNode = ctx.createGain();
      gainNode.gain.value = currentMusic === 'rain' ? 0.4 : 0.8;

      if (currentMusic === 'rain') {
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1; 
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 400;
        lfo.connect(lfoGain).connect(filter.frequency);
        lfo.start();
        oscillatorsRef.current.push(lfo); 
      }

      noiseSource.connect(filter).connect(gainNode).connect(ctx.destination);
      noiseSource.start();
      noiseSourceRef.current = noiseSource;
    }
  }, [currentMusic]);

  useEffect(() => {
    return () => {
      oscillatorsRef.current.forEach(osc => { try { osc.stop(); osc.disconnect(); } catch(e){} });
      if (noiseSourceRef.current) { try { noiseSourceRef.current.stop(); noiseSourceRef.current.disconnect(); } catch(e){} }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Handle Spacebar toggle to start/pause timer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault(); 
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
        if (isTickingActive) {
          playTick();
        }
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      clearInterval(interval);
      setIsActive(false);
      playAlarm(); 
      if (mode === 'POMODORO') {
        switchMode('SHORT_BREAK');
      } else {
        switchMode('POMODORO');
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, isTickingActive]);

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
      {/* Invisible YouTube Iframes */}
      {currentMusic === 'lofi' && (
        <iframe 
          style={{ display: 'none' }}
          src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1" 
          frameBorder="0" 
          allow="autoplay" 
          title="Lo-Fi Radio"
        />
      )}
      {currentMusic === 'instrumental' && (
        <iframe 
          style={{ display: 'none' }}
          src="https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1" 
          frameBorder="0" 
          allow="autoplay" 
          title="Instrumental Radio"
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content settings-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowSettings(false)}>✕</button>
            <h2>Timer Settings (Minutes)</h2>
            <div className="setting-row">
              <label>Pomodoro</label>
              <input type="number" min="1" max="90" value={tempSettings.POMODORO} onChange={e => setTempSettings({...tempSettings, POMODORO: Number(e.target.value)})} />
            </div>
            <div className="setting-row">
              <label>Short Break</label>
              <input type="number" min="1" max="30" value={tempSettings.SHORT_BREAK} onChange={e => setTempSettings({...tempSettings, SHORT_BREAK: Number(e.target.value)})} />
            </div>
            <div className="setting-row">
              <label>Long Break</label>
              <input type="number" min="1" max="60" value={tempSettings.LONG_BREAK} onChange={e => setTempSettings({...tempSettings, LONG_BREAK: Number(e.target.value)})} />
            </div>
            <button className="primary-btn save-btn" onClick={handleSaveSettings}>Save</button>
          </div>
        </div>
      )}

      {/* Music Menu Modal */}
      {showMusicMenu && (
        <div className="modal-overlay" onClick={() => setShowMusicMenu(false)}>
          <div className="modal-content music-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowMusicMenu(false)}>✕</button>
            <h2>Background Audio</h2>
            <div className="music-options">
              {MUSIC_OPTIONS.map(opt => (
                <button 
                  key={opt.id} 
                  className={`music-btn ${currentMusic === opt.id ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentMusic(opt.id);
                    setShowMusicMenu(false);
                    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
                      audioCtxRef.current.resume();
                    }
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
            className={`icon-btn ${currentMusic !== 'none' ? 'active' : ''}`} 
            onClick={() => setShowMusicMenu(true)} 
            title="Select Music"
            aria-label="Music Selection"
          >
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
               <path d="M9 18V5l12-2v13"></path>
               <circle cx="6" cy="18" r="3"></circle>
               <circle cx="18" cy="16" r="3"></circle>
             </svg>
          </button>
          <button 
            className={`icon-btn ${isTickingActive ? 'active' : ''}`} 
            onClick={() => setIsTickingActive(!isTickingActive)} 
            title="Toggle Traditional Ticking Sound"
            aria-label="Toggle Ticking Sound"
          >
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
               <circle cx="12" cy="12" r="10"></circle>
               <polyline points="12 6 12 12 16 14"></polyline>
             </svg>
          </button>
          <button className="icon-btn" aria-label="Settings" onClick={() => { setTempSettings(settings); setShowSettings(true); }}>
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
