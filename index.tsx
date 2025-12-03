
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// iOS viewport height fix - prevents header from disappearing
const setViewportHeight = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
};

// Set on load and resize
setViewportHeight();
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', () => {
  setTimeout(setViewportHeight, 100);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Prevent multiple roots (Fix for Minified React error #311)
let root: ReactDOM.Root;
// @ts-ignore - Check if root already exists on the DOM node (internal React prop)
if (!rootElement._reactRootContainer) {
    root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
}
