import React, { useState, useEffect } from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  duration?: number; // ミリ秒
  message?: string;
  subMessage?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  duration = 3000, 
  message = "読み込み中...",
  subMessage = "しばらくお待ちください"
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = 50; // 50ms間隔で更新
    const steps = duration / interval;
    const increment = 100 / steps;
    let currentProgress = 0;

    const timer = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(timer);
      }
      setProgress(currentProgress);
    }, interval);

    return () => clearInterval(timer);
  }, [duration]);

  return (
    <div className="progress-container">
      <div className="progress-content">
        <h3 className="progress-message">{message}</h3>
        <div className="progress-bar-wrapper">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progress}%` }}
          >
            <div className="progress-bar-shine"></div>
          </div>
          <div className="progress-percentage">{Math.round(progress)}%</div>
        </div>
        <p className="progress-sub-message">{subMessage}</p>
      </div>
    </div>
  );
};

interface MiniProgressBarProps {
  progress: number; // 0-100
  className?: string;
}

export const MiniProgressBar: React.FC<MiniProgressBarProps> = ({ 
  progress, 
  className = '' 
}) => {
  return (
    <div className={`mini-progress-wrapper ${className}`}>
      <div 
        className="mini-progress-fill" 
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      >
        <div className="mini-progress-shine"></div>
      </div>
    </div>
  );
};

export default ProgressBar;
