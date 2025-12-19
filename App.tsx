import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Sitemap from './components/Sitemap';

/**
 * App principal utilizando HashRouter para garantir compatibilidade máxima
 * e evitar erros 404 em refresh de página em servidores estáticos.
 */
const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Rota Principal: Carrega o simulador diretamente na raiz */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Rota de Sitemap para desenvolvedores */}
        <Route path="/sitemap" element={<Sitemap />} />
        
        {/* Rota legada para compatibilidade, redireciona para a raiz */}
        <Route path="/lp-video" element={<Navigate to="/" replace />} />
        
        {/* Fallback para qualquer outra rota: volta para a raiz */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;