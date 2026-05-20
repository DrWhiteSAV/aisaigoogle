import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

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
