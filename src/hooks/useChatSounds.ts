import { useCallback, useRef, useEffect, useState } from 'react';

// Base64 encoded notification sounds (short, pleasant tones)
const NOTIFICATION_SOUND_DATA = {
  message: 'data:audio/wav;base64,UklGRl9vAABXQVZFZm10IBAAAAABAAEAiBUAAIgVAAABAAgAZGF0YTtvAACBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7//v39/Pv6+fj39vX08/Lx8O/u7ezr6unp6Ofo5+bm5eTk4+Pi4uHh4ODf39/e3t3d3Nzb29ra2dnZ2NjX19bW1tbV1dTU1NPS0tLS0dHR0NDQ0M/Pz87Ozs7Nzc3MzMzMy8vLy8rKysrJycnJycjIyMjIx8fHx8fGxsbGxsXFxcXFxMTExMTExMPDw8PDw8LCwsLCwsLCwsHBwcHBwcHBwcHAwMDAwMDAwMDAwMDAwL+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v76+vr6+vr6+vr6+vr6+vr6+vr6+vr6+vr6+vr6+vr6+vr6+vr6+vr6+vr6+vr6+vr6+vr6+vr6+v76+vr6+vr6+vr6+vr6+vr6+vr6+vr6+vr6+vr+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/wMDAwMDAwMDAwMDAwMDAwMHBwcHBwcHBwcHBwsLCwsLCwsLCwsPDw8PDw8PExMTExMTExcXFxcXFxsbGxsbGx8fHx8fHyMjIyMjIycnJycnKysrKysrLy8vLy8zMzMzMzc3Nzc3Ozs7Ozs/Pz8/P0NDQ0NDR0dHR0tLS0tPT09PU1NTU1dXV1tbW1tfX19jY2NnZ2dra2tvb29zc3d3d3t7f39/g4OHh4uLi4+Pk5OXl5ubn5+jo6enq6uvr7Ozs7e7u7+/w8PHx8vPz9PT19vb3+Pj5+vr7/Pz9/v7/',
  sent: 'data:audio/wav;base64,UklGRl9vAABXQVZFZm10IBAAAAABAAEAiBUAAIgVAAABAAgAZGF0YTtvAACAgIGBgoKDg4SEhYWGhoeHiIiJiYqKi4uMjI2Njo6Pj5CQkZGSkpOTlJSVlZaWl5eYmJmZmpqbm5ycnZ2enp+foKChoaKio6OkpKWlpqanp6ioqamqqqqrq6ysra2urq+vsLCxsbKys7O0tLW1tra3t7i4ubm6uru7vLy9vb6+v7/AwMHBwsLDw8TExcXGxsfHyMjJycrKy8vMzM3Nzs7Pz9DQ0dHS0tPT1NTV1dbW19fY2NnZ2tra29vc3N3d3t7f3+Dg4eHi4uPj5OTl5ebm5+fo6Onp6urr6+zs7e3u7u/v8PDx8fLy8/P09PX19vb39/j4+fn6+vv7/Pz9/f7+//8='
};

interface UseChatSoundsOptions {
  enabled?: boolean;
  volume?: number;
}

export const useChatSounds = (options: UseChatSoundsOptions = {}) => {
  const { enabled = true, volume = 0.5 } = options;
  const [soundEnabled, setSoundEnabled] = useState(() => {
    // Persist preference in localStorage
    const saved = localStorage.getItem('chat-sound-enabled');
    return saved !== null ? saved === 'true' : enabled;
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<Record<string, AudioBuffer>>({});
  const isInitializedRef = useRef(false);

  // Initialize audio context and preload sounds
  const initAudio = useCallback(async () => {
    if (isInitializedRef.current || typeof window === 'undefined') return;
    
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Preload notification sound
      const response = await fetch(NOTIFICATION_SOUND_DATA.message);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      audioBuffersRef.current.message = audioBuffer;
      
      isInitializedRef.current = true;
    } catch (error) {
      console.warn('Failed to initialize chat sounds:', error);
    }
  }, []);

  // Initialize on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [initAudio]);

  // Play sound using Web Audio API for better control
  const playSound = useCallback((type: 'message' | 'sent' = 'message') => {
    if (!soundEnabled) return;
    
    // Fallback to HTML5 Audio for reliability
    try {
      const audio = new Audio();
      audio.volume = volume;
      
      // Create a simple notification beep using oscillator
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure sound based on type
      if (type === 'message') {
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.05);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
      } else {
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.05);
      }
      
      oscillator.type = 'sine';
      
      // Volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.3, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.15);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
      
      // Clean up
      setTimeout(() => {
        audioContext.close();
      }, 200);
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }, [soundEnabled, volume]);

  // Play message received sound
  const playMessageSound = useCallback(() => {
    playSound('message');
  }, [playSound]);

  // Play message sent sound
  const playSentSound = useCallback(() => {
    playSound('sent');
  }, [playSound]);

  // Toggle sound enabled/disabled
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('chat-sound-enabled', String(newValue));
      return newValue;
    });
  }, []);

  return {
    soundEnabled,
    setSoundEnabled,
    toggleSound,
    playMessageSound,
    playSentSound,
  };
};
