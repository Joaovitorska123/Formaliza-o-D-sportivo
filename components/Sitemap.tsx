import React from 'react';
import { Link } from 'react-router-dom';
import { Map, ExternalLink, AlertTriangle } from 'lucide-react';

const Sitemap: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-full">
            <Map className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Mapa do Site (Dev)</h1>
        </div>

        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm rounded-r flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>
            Você foi redirecionado para cá porque detectamos um <strong>Ambiente de Preview</strong>.
            O roteamento foi ajustado para <code>HashRouter</code> para evitar erros de proxy.
          </p>
        </div>

        <nav className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Páginas Disponíveis</p>
          
          <Link 
            to="/lp-video" 
            className="flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg transition-all group"
          >
            <span className="font-medium text-gray-700 group-hover:text-blue-700">Simulador (Landing Page)</span>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
          </Link>
        </nav>

        <div className="mt-8 text-center border-t pt-4">
          <p className="text-xs text-gray-400">
            Ambiente detectado: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-600">{window.location.hostname}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sitemap;