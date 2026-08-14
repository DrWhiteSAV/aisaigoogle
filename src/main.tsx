import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silence benign dev-server WebSocket HMR errors resulting from sandboxed reverse proxy setup
if (typeof window !== 'undefined') {
  const isBenignWSError = (err: any): boolean => {
    if (!err) return false;
    const msg = String(err.message || err.reason || err);
    return (
      msg.includes('WebSocket') || 
      msg.includes('websocket') || 
      msg.includes('vite') || 
      msg.includes('HMR') || 
      msg.includes('closed without opened')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isBenignWSError(event.reason)) {
      console.warn('[HMR Safety Patch] Ignored benign sandbox WebSocket rejection:', event.reason);
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    if (isBenignWSError(event.error) || isBenignWSError(event.message)) {
      console.warn('[HMR Safety Patch] Ignored benign sandbox WebSocket error:', event.message || event.error);
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

// Safety patch to prevent React unmounting crashes inside DOM-manipulating libraries (like HTMLFlipBook)
if (typeof window !== 'undefined' && typeof Node !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child && child.parentNode === this) {
      return originalRemoveChild.call(this, child) as T;
    } else if (child && child.parentNode) {
      return originalRemoveChild.call(child.parentNode, child) as T;
    }
    return child;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, child: Node | null): T {
    if (child && child.parentNode !== this) {
      return this.appendChild(node);
    }
    return originalInsertBefore.call(this, node, child) as T;
  };
}

createRoot(document.getElementById('root')!).render(
  <App />
);
