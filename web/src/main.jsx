import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import 'mapbox-gl/dist/mapbox-gl.css';
import './styles/tokens.css';
import './styles/components.css';
import './styles/global.css';
import App from './App.jsx';
import { installDevLocation } from './lib/devLocation.js';

installDevLocation();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
