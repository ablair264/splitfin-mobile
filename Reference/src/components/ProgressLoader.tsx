// src/components/ProgressLoader.tsx
import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import loaderAnimation from '../loader.json';
import './ProgressLoader.css';

interface ProgressLoaderProps {
  progress: number; // 0-100
  message?: string;
  messages?: string[];
  submessage?: string;
  size?: number;
}

export const ProgressLoader: React.FC<ProgressLoaderProps> = ({ 
  progress, 
  message = 'Loading...', 
  messages,
  submessage,
  size = 100 
}) => {
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (!messages || messages.length <= 1) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % messages.length);
        setFade(true);
      }, 300); // fade out duration
    }, 1200);
    return () => clearInterval(interval);
  }, [messages]);

  const displayMessage = messages && messages.length > 0 ? messages[msgIndex] : message;

  return (
    <div className="progress-loader-container">
      <div className="progress-loader-content">
        <Lottie 
          animationData={loaderAnimation}
          loop={true}
          autoplay={true}
          style={{ width: size, height: size }}
        />
        <div className="progress-info">
          <h3 className={`progress-message progress-fade${fade ? ' in' : ' out'}`}>{displayMessage}</h3>
          {submessage && <p className="progress-submessage">{submessage}</p>}
        </div>
        <div className="progress-loader-bar-container">
          <div className="progress-loader-bar">
            <div 
              className="progress-bar-fill"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <span className="progress-percentage">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};