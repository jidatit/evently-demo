import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Music, Camera } from 'lucide-react';
import BookDLogo from './BookDLogo';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [showWordmark, setShowWordmark] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show wordmark after logo bounce starts
    const wordmarkTimer = setTimeout(() => {
      setShowWordmark(true);
    }, 800);

    // Show sparkles after wordmark appears
    const sparklesTimer = setTimeout(() => {
      setShowSparkles(true);
    }, 1500);

    // Start fade out after 2.5 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
      // Complete transition after fade
      setTimeout(onComplete, 500);
    }, 2500);

    return () => {
      clearTimeout(wordmarkTimer);
      clearTimeout(sparklesTimer);
      clearTimeout(fadeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 splash-gradient flex flex-col items-center justify-center text-white z-50 transition-all duration-500 ${fadeOut ? 'opacity-0 transform translate-y-4' : 'opacity-100'}`}>
      {/* Floating celebratory shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="floating-shape w-4 h-4 bg-party-coral/40 top-20 left-[10%] floating-confetti" style={{animationDelay: '0s'}}></div>
        <div className="floating-shape w-3 h-3 bg-party-yellow/40 top-32 left-[20%] floating-confetti" style={{animationDelay: '1s'}}></div>
        <div className="floating-shape w-5 h-5 bg-party-purple/40 top-24 right-[15%] floating-confetti" style={{animationDelay: '2s'}}></div>
        <div className="floating-shape w-4 h-4 bg-party-orange/40 top-40 right-[25%] floating-confetti" style={{animationDelay: '0.5s'}}></div>
        <div className="floating-shape w-3 h-3 bg-party-coral/40 bottom-32 left-[15%] floating-sparkle" style={{animationDelay: '1.5s'}}></div>
        <div className="floating-shape w-6 h-6 bg-party-pink/40 bottom-24 right-[20%] floating-sparkle" style={{animationDelay: '2.5s'}}></div>
      </div>

      {/* Bouncing logo cube */}
      <div className="mb-8 animate-splash-bounce">
        <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-glow">
          <span className="text-white font-bold text-3xl">E</span>
        </div>
      </div>

      {/* Evently wordmark with fade-in effect */}
      <div className={`transition-all duration-700 ${showWordmark ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
        <div className="animate-wordmark-glow">
          <BookDLogo size="xl" showSparkle={false} />
        </div>
      </div>

      {/* Sparkle burst around logo */}
      {showSparkles && (
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className="absolute top-1/3 left-1/3 w-6 h-6 text-party-yellow animate-sparkle-burst" style={{animationDelay: '0s'}} />
          <Heart className="absolute top-2/5 right-1/3 w-5 h-5 text-party-coral animate-sparkle-burst" style={{animationDelay: '0.2s'}} />
          <Music className="absolute top-1/2 left-1/4 w-5 h-5 text-party-purple animate-sparkle-burst" style={{animationDelay: '0.4s'}} />
          <Camera className="absolute top-3/5 right-1/4 w-6 h-6 text-party-orange animate-sparkle-burst" style={{animationDelay: '0.6s'}} />
          <Sparkles className="absolute bottom-1/3 left-2/5 w-4 h-4 text-party-pink animate-sparkle-burst" style={{animationDelay: '0.8s'}} />
        </div>
      )}
    </div>
  );
};

export default SplashScreen;