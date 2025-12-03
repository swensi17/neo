// Haptic feedback utility for mobile devices

export const haptic = {
  // Light tap - for buttons, toggles
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  
  // Medium tap - for important actions (new chat, send message)
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
  },
  
  // Success - for completed actions
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([15, 50, 15]);
    }
  },
  
  // Error - for errors
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30, 50, 30]);
    }
  }
};
