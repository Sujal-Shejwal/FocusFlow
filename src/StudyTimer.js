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

  // Task & Quote State
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState('');
  const [quote, setQuote] = useState("What's your focus today?");

  const getQuoteForTask = (taskText) => {
    const text = taskText.toLowerCase();
    if (text.includes('study') || text.includes('read') || text.includes('book') || text.includes('learn') || text.includes('exam')) {
      const studyQuotes = [
        "Education is the most powerful weapon which you can use to change the world.",
        "The beautiful thing about learning is that no one can take it away from you.",
        "Study now, be proud later.",
        "There are no shortcuts to any place worth going."
      ];
      return studyQuotes[Math.floor(Math.random() * studyQuotes.length)];
    } else if (text.includes('code') || text.includes('program') || text.includes('dev') || text.includes('bug')) {
      const codeQuotes = [
        "Talk is cheap. Show me the code.",
        "First, solve the problem. Then, write the code.",
        "Code is like humor. When you have to explain it, it's bad.",
        "Make it work, make it right, make it fast."
      ];
      return codeQuotes[Math.floor(Math.random() * codeQuotes.length)];
    } else if (text.includes('workout') || text.includes('gym') || text.includes('exercise') || text.includes('fit')) {
      const fitnessQuotes = [
        "The only bad workout is the one that didn't happen.",
        "What seems impossible today will one day become your warm-up.",
        "Sweat is just fat crying.",
        "Train hard, stay focused."
      ];
      return fitnessQuotes[Math.floor(Math.random() * fitnessQuotes.length)];
    } else {
      const generalQuotes = [
        "Focus on being productive instead of busy.",
        "Don't stop until you're proud.",
        "Success is what happens after you have survived all of your mistakes.",
        "Do something today that your future self will thank you for."
      ];
      return generalQuotes[Math.floor(Math.random() * generalQuotes.length)];
    }
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: taskInput, completed: false }]);
    setQuote(getQuoteForTask(taskInput));
    setTaskInput('');
  };

  const toggleTaskCompletion = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

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

    if (currentMusic === 'none' || currentMusic === 'lofi' || currentMusic === 'instrumental' || currentMusic === 'rain') {
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
    else if (currentMusic === 'brown_noise') {
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
      filter.frequency.value = 300; 

      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.8;

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
      {currentMusic === 'rain' && (
        <iframe 
          style={{ display: 'none' }}
          src="https://www.youtube.com/embed/69QdAw3ApNk?autoplay=1&start=1214" 
          frameBorder="0" 
          allow="autoplay" 
          title="Rain Storm Radio"
        />
      )}
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
          src="https://www.youtube.com/embed/n61ULEU7CO0?autoplay=1" 
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

        {/* Task / To-Do Section */}
        <div className="task-section">
          <div className="quote-display">
            <p>"{quote}"</p>
          </div>
          <form className="task-form" onSubmit={handleAddTask}>
            <input 
              type="text" 
              placeholder="What are you working on?" 
              value={taskInput} 
              onChange={e => setTaskInput(e.target.value)}
            />
            <button type="submit" className="add-task-btn">+</button>
          </form>
          <div className="task-list">
            {tasks.map(task => (
              <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                <div className="task-checkbox" onClick={() => toggleTaskCompletion(task.id)}>
                   {task.completed && <span>✓</span>}
                </div>
                <span className="task-text" onClick={() => toggleTaskCompletion(task.id)}>
                  {task.text}
                </span>
                <button className="delete-task-btn" onClick={() => removeTask(task.id)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyTimer;
