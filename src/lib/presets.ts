
import { CSSProperties } from "react";

export const framePresets: { [key: string]: CSSProperties } = {
    default: {
      backgroundColor: 'hsl(var(--card))',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'hsl(var(--border))',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      borderRadius: 0,
    },
    
    Glow: {
      boxShadow: '0 0 5px hsl(var(--primary) / 0.8), 0 0 10px hsl(var(--primary) / 0.5)',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'hsl(var(--primary))',
    },
    Neon: {
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'hsl(var(--accent))',
      boxShadow: '0 0 5px hsl(var(--accent)), 0 0 10px hsl(var(--accent) / 0.7)',
    },
    'Neon Kırmızı': {
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: '#ff0000',
        boxShadow: '0 0 5px #ff0000, 0 0 10px #ff0000, 0 0 15px #ff0000',
      },
    'Neon Turuncu': {
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: '#ff7f00',
        boxShadow: '0 0 5px #ff7f00, 0 0 10px #ff7f00, 0 0 15px #ff7f00',
    },
    'Neon Mor': {
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: '#8a2be2',
        boxShadow: '0 0 5px #8a2be2, 0 0 10px #8a2be2, 0 0 15px #8a2be2',
    },
    'Neon Yeşil': {
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: '#00ff00',
        boxShadow: '0 0 5px #00ff00, 0 0 10px #00ff00, 0 0 15px #00ff00',
    },
    TR: {
      borderWidth: '2px',
      borderStyle: 'solid',
      borderImageSlice: 1,
      borderImageSource: 'linear-gradient(to right, #E30A17, #FFFFFF)',
    },
  
    FB: {
        borderWidth: '2px',
        borderStyle: 'solid',
        borderImageSlice: 1,
        borderImageSource: 'linear-gradient(to right, #FBB034, #001C58)',
    },
    GS: {
      borderWidth: '2px',
      borderStyle: 'solid',
      borderImageSlice: 1,
      borderImageSource: 'linear-gradient(to right, #FDB913, #DA0000)',
  },
    BJK: {
        borderWidth: '2px',
        borderStyle: 'solid',
        borderImageSlice: 1,
        borderImageSource: 'linear-gradient(to right, #000000, #FFFFFF)',
    },
    TS: {
        borderWidth: '2px',
        borderStyle: 'solid',
        borderImageSlice: 1,
        borderImageSource: 'linear-gradient(to right, #800000, #00B2EE)',
    },
    Rainbow: {
      borderWidth: '2px',
      borderStyle: 'solid',
      borderImageSlice: 1,
      borderImageSource: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f)',
    },
};

export const animationPresets: { [key: string]: CSSProperties } = {
  'Döngü': {
    animation: 'spin 8s linear infinite',
  },
  'Sallan': {
    animation: 'wobble 1s ease-in-out infinite',
  },
  'Sıçra (Yavaş)': {
    animation: 'bounceSlow 2s ease-in-out infinite',
  },
  'Sıçra (Normal)': {
    animation: 'bounce 2s ease-in-out infinite',
  },
  'Sıçra (Hızlı)': {
    animation: 'bounceFast 1s ease-in-out infinite',
  },
  'Vurgu': {
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  'Salın': {
    animation: 'float 3s ease-in-out infinite',
  },
  'Belirerek Gir': {
    animation: 'fadeIn 1s ease-in',
  },
  'Dalgalan': {
    animationName: 'wave-bounce',
    animationDuration: '1.5s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  }
}
