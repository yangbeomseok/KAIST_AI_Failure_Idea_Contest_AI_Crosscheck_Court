import React from 'react';
import LightRays from './LightRays';
import './BackgroundLayout.css';

const BackgroundLayout = ({ children, className = '' }) => {
  return (
    <div className={`background-layout ${className}`}>
      <LightRays
        raysOrigin="top-center"
        raysColor="#00ffff"
        raysSpeed={1.5}
        lightSpread={0.8}
        rayLength={1.2}
        followMouse={true}
        mouseInfluence={0.1}
        noiseAmount={0.1}
        distortion={0.05}
        className="background-rays"
      />
      <div className="content-wrapper">
        {children}
      </div>
    </div>
  );
};

export default BackgroundLayout;