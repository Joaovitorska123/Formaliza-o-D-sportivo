import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Sitemap from './components/Sitemap';

/**
 * ------------------------------------------------------------------
 * UTILITY: Ambiente Detection
 * ------------------------------------------------------------------
 * Verifica se estamos rodando em um ambiente de Cloud IDE ou Preview
 * que usa proxies complexos (ex: Google IDX, CodeSandbox).
 */
const checkPreviewEnvironment = (): boolean => {
  const indicators = [
    'googleusercontent',
    'webcontainer',
    'shim',
    '.goog',
    'scf.usercontent',
    'stackblitz',
    'codesandbox'
  ];
  
  const hostname = window.location.hostname;
  const href = window.location.href;

  return indicators.some(indicator => 
    hostname.includes(indicator) || href.includes(indicator)
  );
};

const isPreview = checkPreviewEnvironment();

/**
 * ------------------------------------------------------------------
 * COMPONENT: RootRedirect
 * ------------------------------------------------------------------
 * Implementa o Redirecionamento Inteligente baseado no ambiente.
 */
const RootRedirect: React.FC = () => {
  if (isPreview) {
    // Em preview, manda para o Sitemap para facilitar debug
    return <Navigate to="/sitemap" replace />;
  }
  // Em produção, manda para a rota principal da LP
  return <Navigate to="/lp-video" replace />;
};

/**
 * ------------------------------------------------------------------
 * MAIN APP
 * ------------------------------------------------------------------
 * Seleciona o Router agressivamente para evitar quebras de URL.
 */
const App: React.FC = () => {
  // Seleção de Roteador Híbrido
  const Router = isPreview ? HashRouter : BrowserRouter;

  console.log(`[App Config] Environment: ${isPreview ? 'PREVIEW (HashRouter)' : 'PRODUCTION (BrowserRouter)'}`);

  return (
    <Router>
      <Routes>
        {/* Rota Raiz com Redirecionamento Inteligente */}
        <Route path="/" element={<RootRedirect />} />
        
        {/* Rota de Sitemap (útil para dev) */}
        <Route path="/sitemap" element={<Sitemap />} />
        
        {/* Rota Principal da Landing Page */}
        <Route path="/lp-video" element={<LandingPage />} />
        
        {/* Fallback para 404 - Redireciona para raiz para tentar recuperar */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;