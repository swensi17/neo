
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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
