import { useState, useEffect } from 'react';
import './LoadingProgress.css';

interface LoadingProgressProps {
  title?: string;
  steps?: string[];
  autoProgress?: boolean;
  duration?: number;
  onComplete?: () => void;
}

const LoadingProgress: React.FC<LoadingProgressProps> = ({
  title = 'データを読み込み中...',
  steps = [
    'ユーザー情報を取得中',
    '権限を確認中', 
    '部署情報を取得中',
    '画面を準備中'
  ],
  autoProgress = true,
  duration = 3000,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!autoProgress) return;

    const stepDuration = duration / steps.length;
    const progressInterval = stepDuration / 100; // 各ステップを100段階で進行

    let progressValue = 0;
    let stepIndex = 0;

    const timer = setInterval(() => {
      progressValue += 1;
      
      // 現在のステップを計算
      const newStepIndex = Math.floor((progressValue / 100) * steps.length);
      if (newStepIndex !== stepIndex && newStepIndex < steps.length) {
        stepIndex = newStepIndex;
        setCurrentStep(stepIndex);
      }

      // プログレス値を更新
      const totalProgress = (progressValue / (steps.length * 100)) * 100;
      setProgress(Math.min(totalProgress, 100));

      // 完了チェック
      if (progressValue >= steps.length * 100) {
        clearInterval(timer);
        if (onComplete) {
          setTimeout(onComplete, 200);
        }
      }
    }, progressInterval);

    return () => clearInterval(timer);
  }, [autoProgress, duration, steps.length, onComplete]);

  return (
    <div className="loading-progress-container">
      <div className="loading-progress-content">
        <div className="loading-icon">
          📊
        </div>
        
        <h3 className="loading-title">{title}</h3>
        
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-percentage">
            {Math.round(progress)}%
          </div>
        </div>

        <div className="loading-steps">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`step-item ${index <= currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            >
              <div className="step-indicator">
                {index < currentStep ? '✓' : index === currentStep ? '⟳' : '○'}
              </div>
              <div className="step-text">{step}</div>
            </div>
          ))}
        </div>
        
        <div className="loading-details">
          <p>しばらくお待ちください...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingProgress;
