import React, { useState, useEffect, useMemo } from 'react';
import { 
  Upload, 
  ArrowRight, 
  ArrowLeft, 
  Trophy, 
  ExternalLink, 
  Shirt, 
  Footprints, 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  Briefcase, 
  Gem, 
  Check, 
  Ruler,
  Info,
  MessageCircle,
  Layers,
  Box,
  ShoppingCart,
  Sparkles,
  Loader2,
  Dribbble,
  Monitor,
  Hash,
  User
} from 'lucide-react';

// Firebase imports diretos
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, Firestore } from 'firebase/firestore';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const WHATSAPP_NUMBER = "5516991679072"; 
const WHATSAPP_MESSAGE = "Olá! Acabei de gerar meu orçamento no simulador D'sportivo uniformes e estou entrando em contato para enviar o PDF e finalizar meu pedido.";

const PRICES = {
  monaco: { camisa: 42.90, calcao: 32.00, conjunto: 74.90 },
  equador: { camisa: 44.90, calcao: 35.00, conjunto: 79.90 },
  vanilha: { camisa: 74.90, calcao: 49.90, conjunto: 124.80 },
  corporativa: { camisa: 49.90, calcao: 35.00, conjunto: 84.90 },
  basquete: { camisa: 55.00, calcao: 45.00, conjunto: 95.00 },
};

const EMBROIDERY_PRICE = 5.00;

const ADICIONAIS_PRICES: Record<string, number> = {
  colete: 25.00,
  jaqueta: 98.00,
  calca: 75.00,
  regata: 39.90
};

// Labels simplificadas para Diversos
const ADICIONAIS_LABELS: Record<string, string> = {
  colete: 'Colete',
  jaqueta: 'Jaqueta',
  calca: 'Calça Tactel',
  regata: 'Regata Dry'
};

const SOCK_COLORS = [
  'Branco', 'Preto', 'Azul Royal', 'Azul Marinho', 'Vermelho', 
  'Amarelo', 'Verde', 'Laranja', 'Cinza', 'Bordô', 'Celeste'
];

const SIZE_TABLES = {
  standard: {
    masculina: {
      title: 'Masculina Padrão',
      headerColor: 'bg-blue-600',
      headers: ['Tam', 'Largura', 'Altura'],
      keys: ['tam', 'largura', 'altura'],
      data: [
        { tam: 'P', largura: '50cm', altura: '69cm' },
        { tam: 'M', largura: '52cm', altura: '71cm' },
        { tam: 'G', largura: '54cm', altura: '73cm' },
        { tam: 'GG', largura: '57cm', altura: '76cm' },
        { tam: 'XG', largura: '61cm', altura: '79cm' },
      ]
    },
    feminina: {
      title: 'Baby Look Padrão',
      headerColor: 'bg-pink-600',
      headers: ['Tam', 'Largura', 'Altura'],
      keys: ['tam', 'largura', 'altura'],
      data: [
        { tam: 'P BL', largura: '40cm', altura: '58cm' },
        { tam: 'M BL', largura: '43cm', altura: '61cm' },
        { tam: 'G BL', largura: '46cm', altura: '64cm' },
      ]
    },
    infantil: {
      title: 'Infantil Padrão',
      headerColor: 'bg-green-600',
      headers: ['Tam', 'Largura', 'Altura'],
      keys: ['tam', 'largura', 'altura'],
      data: [
        { tam: '6', largura: '35cm', altura: '47cm' },
        { tam: '8', largura: '37cm', altura: '50cm' },
        { tam: '10', largura: '39cm', altura: '53cm' },
        { tam: '12', largura: '41cm', altura: '56cm' },
        { tam: '14', largura: '43cm', altura: '59cm' },
      ]
    }
  },
  diamond: {
    masculina: {
      title: 'Masculina Slim (Vanilha)',
      headerColor: 'bg-indigo-900',
      headers: ['Tam', 'Largura', 'Altura'],
      keys: ['tam', 'largura', 'altura'],
      data: [
        { tam: 'P', largura: '48cm', altura: '68cm' },
        { tam: 'M', largura: '50cm', altura: '70cm' },
        { tam: 'G', largura: '52cm', altura: '72cm' },
      ]
    },
    feminina: {
      title: 'Baby Look Slim (Vanilha)',
      headerColor: 'bg-purple-900',
      headers: ['Tam', 'Largura', 'Altura'],
      keys: ['tam', 'largura', 'altura'],
      data: [
        { tam: 'P BL', largura: '39cm', altura: '57cm' },
        { tam: 'M BL', largura: '42cm', altura: '60cm' },
      ]
    },
    infantil: {
      title: 'Infantil Slim (Vanilha)',
      headerColor: 'bg-teal-900',
      headers: ['Tam', 'Largura', 'Altura'],
      keys: ['tam', 'largura', 'altura'],
      data: [
        { tam: '12', largura: '40cm', altura: '55cm' },
        { tam: '14', largura: '42cm', altura: '58cm' },
      ]
    }
  }
};

const LINE_DETAILS = {
  monaco: { 
    name: 'Linha Mônaco', 
    desc: 'Excelente custo-benefício. Ideal para quem busca economia.', 
    fullDesc: 'A Linha Mônaco é focada em times amadores e interclasses. Tecido Dry Leve com proteção UV básica.',
    features: ['Tecido Dry Leve', 'Modelagem Padrão', 'Bordado Opcional (+R$ 5)', 'Proteção UV Básica'],
    color: 'bg-gray-400',
    icon: Trophy
  },
  equador: { 
    name: 'Linha Equador', 
    desc: 'Tecido premium com acabamento superior e bordado incluso.', 
    fullDesc: 'A Linha Equador oferece tecido Dry Tech de maior gramatura com bordado já incluso na camisa.',
    features: ['Tecido Premium', 'Costura Dupla', 'Bordado Incluso', 'Alta Durabilidade'],
    color: 'bg-yellow-500',
    icon: Trophy
  },
  vanilha: { 
    name: 'Linha Vanilha', 
    desc: 'Modelagem profissional slim fit e exclusiva.', 
    fullDesc: 'A Linha Vanilha é o topo de linha para atletas exigentes. Inclui bordado de alta definição e tecidos tecnológicos.',
    features: ['Slim Fit Profissional', 'Tecido Aero', 'Bordado Incluso', 'Golas Especiais'],
    color: 'bg-cyan-500',
    icon: Gem
  },
  basquete: { 
    name: 'Linha Basquete', 
    desc: 'Modelagem exclusiva para basquete com tecidos Aero.', 
    fullDesc: 'Desenvolvida especificamente para atletas de basquete. Corte regata tradicional e bermudas leves.',
    features: ['Corte Regata', 'Tecido Aero Mesh', 'Alta Performance', 'Design Customizado'],
    color: 'bg-orange-500',
    icon: Dribbble
  },
  corporativa: { 
    name: 'Linha Corporativa', 
    desc: 'Solução ideal para uniformização de equipes e eventos.', 
    fullDesc: 'Desenvolvida para empresas e eventos corporativos. Focada em praticidade e durabilidade.',
    features: ['Unissex Versátil', 'Tecido Antipilling', 'Fácil Lavagem', 'Sem Bordado'],
    color: 'bg-slate-800',
    icon: Briefcase
  },
  adicionais: {
    name: 'Diversos / Adicionais',
    desc: 'Coletes, jaquetas, calças e regatas dry avulsas.',
    fullDesc: 'Produtos complementares para treinos, viagens e comissão técnica.',
    features: ['Qualidade Esportiva', 'Personalizado', 'Diversas Cores', 'Durabilidade'],
    color: 'bg-blue-800',
    icon: Layers
  }
};

// Categorias atualizadas conforme pedido pelo usuário
const KIT_TYPES: Record<string, string> = {
  linha: 'Linha',
  goleiro: 'Goleiro',
  atleta: 'Atleta',
  torcida: 'Torcida',
  comissao: 'Comissão técnica'
};

const PRODUCT_LABELS: Record<string, string> = {
  conjunto: 'Só Conjunto',
  camisa: 'Só Camisa',
  calcao: 'Só Calção'
};

const ALL_SIZES = ['2', '4', '6', '8', '10', '12', '14', '16', 'P', 'M', 'G', 'GG', 'XG', 'ESP', 'G3', 'P BL', 'M BL', 'G BL', 'GG BL', 'XG BL', 'ESP BL'];

type LineType = keyof typeof LINE_DETAILS;

interface UnifiedItem {
  id: number;
  line: LineType;
  category: string;
  productKey: string;
  quantity: number;
  hasEmbroidery: boolean;
}

interface SockItem { id: number; color: string; quantity: number; }
interface RosterItem { 
  name: string; 
  number: string;
  size: string; 
  itemId: number;
  productLabel: string;
}

interface Config { 
  items: UnifiedItem[];
  socks: SockItem[]; 
  nextItemId: number;
  nextSockId: number; 
  customerInfo: { customerName: string; customerPhone: string; };
}

const INITIAL_CONFIG: Config = {
    items: [{ id: 1, line: 'monaco', category: 'linha', productKey: 'conjunto', quantity: 10, hasEmbroidery: false }],
    socks: [],
    nextItemId: 2,
    nextSockId: 1,
    customerInfo: { customerName: '', customerPhone: '' }
};

const BrandLogo = () => (
  <div className="flex items-center select-none">
    <div className="flex flex-col leading-none">
        <span className="text-3xl font-black italic tracking-tighter text-black" style={{ transform: 'skewX(-10deg)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            D'sportivo
        </span>
        <span className="text-[12px] font-bold lowercase tracking-[0.1em] text-black text-right mr-0.5" style={{ transform: 'skewX(-10deg)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            uniformes
        </span>
    </div>
  </div>
);

const SizeTable = ({ title, headerColor, headers, keys, data }: any) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm h-fit">
      <div className={`${headerColor} text-white font-bold py-2 px-3 text-center uppercase text-sm`}>{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[200px]">
          <thead className="bg-gray-100 font-bold text-gray-700 text-xs">
            <tr>{headers.map((h: any, i: any) => (<th key={i} className="py-2 px-2 border-b border-gray-200 text-center whitespace-nowrap">{h}</th>))}</tr>
          </thead>
          <tbody>
            {data.map((row: any, idx: any) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                {keys.map((key: any, kIdx: any) => (
                  <td key={kIdx} className={`py-2 px-2 text-center border-gray-100 ${kIdx === 0 ? 'font-bold text-gray-900 border-r' : 'text-gray-600'}`}>
                    {row[key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
);

export default function LandingPage() {
  const [db, setDb] = useState<Firestore | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [modalOpen, setModalOpen] = useState<LineType | null>(null);
  const [config, setConfig] = useState<Config>(INITIAL_CONFIG);
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [activeSizeTab, setActiveSizeTab] = useState<'standard' | 'diamond'>('standard');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [designFiles, setDesignFiles] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const firebaseConfigGlobal = (window as any).__firebase_config;
    const firebaseConfigStr = typeof firebaseConfigGlobal !== 'undefined' ? String(firebaseConfigGlobal) : '{}';
    let firebaseConfig = {};
    try { firebaseConfig = JSON.parse(firebaseConfigStr); } catch (e) { }

    if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) { 
      setIsLoading(false); 
      return; 
    }
    
    try {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const dbInstance = getFirestore(app);
      setDb(dbInstance);
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUserId(user.uid);
          loadProgress(dbInstance, user.uid);
        } else {
          const anonUser = await signInAnonymously(auth);
          setUserId(anonUser.user.uid);
          loadProgress(dbInstance, anonUser.user.uid);
        }
      });
    } catch (e) { 
      console.error("Firebase init failed:", e);
      setIsLoading(false); 
    }
  }, []);

  const loadProgress = async (dbInstance: Firestore, uid: string) => {
    const appIdGlobal = (window as any).__app_id;
    const appId = typeof appIdGlobal !== 'undefined' ? String(appIdGlobal) : 'default-app-id';
    try {
      const docSnap = await getDoc(doc(dbInstance, `artifacts/${appId}/users/${uid}/orcamento`, 'draft'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.config) setConfig(data.config);
        if (data.roster) setRoster(data.roster);
        if (data.designFiles) setDesignFiles(data.designFiles);
      }
    } catch (e) { } finally { setIsLoading(false); }
  };

  const saveProgress = async () => {
    const appIdGlobal = (window as any).__app_id;
    const appId = typeof appIdGlobal !== 'undefined' ? String(appIdGlobal) : 'default-app-id';
    if (!db || !userId) return;
    setSaveStatus('saving');
    try {
        await setDoc(doc(db, `artifacts/${appId}/users/${userId}/orcamento`, 'draft'), {
            config, roster, designFiles, lastUpdated: new Date().toISOString()
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) { setSaveStatus('error'); }
  };

  const totalItemsCount = useMemo(() => config.items.reduce((sum, item) => sum + item.quantity, 0), [config.items]);
  const minOrderMet = totalItemsCount >= 10;
  
  const calculateTotal = () => {
    const itemsTotal = config.items.reduce((acc, item) => {
      let unitPrice = 0;
      if (item.line === 'adicionais') {
        unitPrice = ADICIONAIS_PRICES[item.productKey] || 0;
      } else {
        const linePrices = (PRICES as any)[item.line];
        unitPrice = linePrices[item.productKey] || 0;
        if (item.line === 'monaco' && item.hasEmbroidery && item.productKey !== 'calcao') {
          unitPrice += EMBROIDERY_PRICE;
        }
      }
      return acc + (unitPrice * item.quantity);
    }, 0);
    const socksTotal = config.socks.reduce((sum, sock) => sum + sock.quantity, 0) * 20.00; 
    return itemsTotal + socksTotal;
  };

  const addNewItemRow = () => {
    setConfig(prev => ({
      ...prev,
      items: [...prev.items, { id: prev.nextItemId, line: 'monaco', category: 'linha', productKey: 'conjunto', quantity: 1, hasEmbroidery: false }],
      nextItemId: prev.nextItemId + 1
    }));
  };

  const updateItemRow = (id: number, field: keyof UnifiedItem, value: any) => {
    setConfig(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== id) return item;
        const newItem = { ...item, [field]: value };
        if (field === 'line') {
          if (value === 'adicionais') {
            newItem.productKey = 'colete';
            newItem.hasEmbroidery = false;
          } else {
            newItem.productKey = 'conjunto';
            if (value === 'equador' || value === 'vanilha') newItem.hasEmbroidery = true;
            else newItem.hasEmbroidery = false;
          }
        }
        return newItem;
      })
    }));
  };

  const removeItemRow = (id: number) => {
    setConfig(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
  };

  // Propagar a escolha da linha do Passo 1
  const selectInitialLine = (line: LineType) => {
    setConfig(prev => ({
      ...prev,
      items: prev.items.map((item, idx) => idx === 0 ? { 
        ...item, 
        line: line,
        productKey: line === 'adicionais' ? 'colete' : 'conjunto',
        hasEmbroidery: (line === 'equador' || line === 'vanilha')
      } : item)
    }));
    setStep(2);
    setModalOpen(null);
  };

  useEffect(() => {
    setRoster(prev => {
      const newRoster: RosterItem[] = [];
      config.items.forEach(item => {
        const existing = prev.filter(p => p.itemId === item.id);
        const prodLabel = item.line === 'adicionais' ? ADICIONAIS_LABELS[item.productKey] : PRODUCT_LABELS[item.productKey];
        const lineName = LINE_DETAILS[item.line].name;
        const label = `${lineName} - ${KIT_TYPES[item.category]} (${prodLabel})`;
        for (let i = 0; i < item.quantity; i++) {
          newRoster.push(existing[i] || { name: '', number: item.category === 'comissao' ? 'TÉC' : '', size: 'G', itemId: item.id, productLabel: label });
        }
      });
      return newRoster;
    });
  }, [config.items]);

  const handleRosterChange = (index: number, field: string, value: string) => {
    const newRoster = [...roster];
    newRoster[index] = { ...newRoster[index], [field]: value };
    setRoster(newRoster);
  };

  const addSockEntry = () => {
    const availableColor = SOCK_COLORS.find(c => !config.socks.some(s => s.color === c));
    if (availableColor) {
      setConfig(prev => ({
        ...prev,
        socks: [...prev.socks, { id: prev.nextSockId, color: availableColor, quantity: 1 }],
        nextSockId: prev.nextSockId + 1,
      }));
    }
  };

  const updateSockEntry = (id: number, field: 'color' | 'quantity', value: string | number) => {
    setConfig(prev => ({
      ...prev,
      socks: prev.socks.map(sock => sock.id === id ? { ...sock, [field]: value } : sock),
    }));
  };

  const removeSockEntry = (id: number) => {
    setConfig(prev => ({ ...prev, socks: prev.socks.filter(sock => sock.id !== id) }));
  };

  const handleDesignUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setDesignFiles(prev => ({ ...prev, [key]: String(reader.result) }));
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text("D'sportivo uniformes", 14, 20);
    doc.line(14, 25, pageWidth - 14, 25);
    
    const tableBody: any[] = [];
    config.items.forEach(item => {
      const prodLabel = item.line === 'adicionais' ? ADICIONAIS_LABELS[item.productKey] : PRODUCT_LABELS[item.productKey];
      tableBody.push([
        KIT_TYPES[item.category],
        `${LINE_DETAILS[item.line].name} (${prodLabel})`,
        `${item.quantity} un`,
        `R$ ${calculateTotal().toLocaleString('pt-BR')}`
      ]);
    });

    autoTable(doc, { startY: 35, head: [['Categoria', 'Linha / Produto', 'Quantidade', 'Total']], body: tableBody });
    doc.save(`Orcamento_Dsportivo.pdf`);
  };

  const handleWhatsAppContact = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    window.open(url, '_blank');
  };

  const renderStep1 = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-4 pt-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight italic">Excelência em <span className="text-indigo-600">Uniformes</span></h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">Selecione a linha que melhor atende às necessidades do seu time.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
        {(Object.keys(LINE_DETAILS) as Array<LineType>).map((key) => (
          <div key={key} className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden hover:shadow-xl transition-all p-6 flex flex-col group relative">
              <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl ${LINE_DETAILS[key].color} text-white flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6`}>
                    {React.createElement(LINE_DETAILS[key].icon, { size: 28 })}
                  </div>
                  <div><h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic">{LINE_DETAILS[key].name}</h3></div>
              </div>
              <p className="text-gray-600 text-sm mb-6 flex-1 font-medium">{LINE_DETAILS[key].desc}</p>
              <button onClick={() => setModalOpen(key)} className="w-full py-4 rounded-2xl bg-gray-50 text-gray-700 font-black border border-gray-200 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest shadow-sm">
                <Info size={16} /> Ver Detalhes
              </button>
          </div>
        ))}
      </div>
      <div className="flex justify-center pt-8 pb-4">
        <button onClick={() => setStep(2)} className="px-12 py-6 rounded-[2.5rem] font-black text-lg flex items-center gap-4 bg-gray-900 text-white hover:bg-indigo-600 shadow-2xl transition-all active:scale-95 uppercase tracking-widest">
            INICIAR CONFIGURAÇÃO <ArrowRight size={24} />
        </button>
      </div>
      {modalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(null)}>
              <div className="bg-white max-w-lg w-full rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className={`absolute top-0 left-0 right-0 h-2 ${LINE_DETAILS[modalOpen].color}`}></div>
                  <div className="flex justify-between items-start mb-8">
                      <div>
                        <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">{LINE_DETAILS[modalOpen].name}</h3>
                        <p className="text-indigo-600 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">D'sportivo Profissional</p>
                      </div>
                      <button onClick={() => setModalOpen(null)} className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-400"><X size={28} /></button>
                  </div>
                  <p className="text-gray-600 mb-8 leading-relaxed font-medium">{LINE_DETAILS[modalOpen].fullDesc}</p>
                  <ul className="space-y-4 mb-10">
                      {LINE_DETAILS[modalOpen].features.map((f, i) => (<li key={i} className="flex items-center gap-3 font-black text-gray-700 uppercase text-xs tracking-wide"><Check size={20} className="text-green-500 shrink-0" /> {f}</li>))}
                  </ul>
                  <button onClick={() => selectInitialLine(modalOpen)} className="w-full py-6 bg-gray-900 text-white font-black rounded-3xl shadow-xl hover:bg-indigo-600 transition-all uppercase tracking-widest text-sm">
                    ESCOLHER ESTA LINHA
                  </button>
              </div>
          </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">Personalize seu Pedido</h2>
        <p className="text-sm text-gray-500 font-medium">Configure cada item do seu time de forma individual.</p>
      </div>

      <div className="space-y-6">
        {config.items.map((item) => {
          let unitPrice = 0;
          if (item.line === 'adicionais') {
            unitPrice = ADICIONAIS_PRICES[item.productKey] || 0;
          } else {
            const linePrices = (PRICES as any)[item.line];
            unitPrice = linePrices[item.productKey] || 0;
            if (item.line === 'monaco' && item.hasEmbroidery && item.productKey !== 'calcao') {
              unitPrice += EMBROIDERY_PRICE;
            }
          }
          
          return (
            <div key={item.id} className="bg-white rounded-[2.5rem] p-6 border border-indigo-50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${LINE_DETAILS[item.line].color}`}></div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                    <div className="md:col-span-3">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Linha / Grupo</label>
                        <select value={item.line} onChange={(e) => updateItemRow(item.id, 'line', e.target.value)} className="w-full h-12 rounded-2xl bg-gray-50 border border-gray-100 text-gray-900 px-5 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                            {Object.keys(LINE_DETAILS).map(k => <option key={k} value={k}>{LINE_DETAILS[k as LineType].name}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-3">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Produto</label>
                        <select value={item.productKey} onChange={(e) => updateItemRow(item.id, 'productKey', e.target.value)} className="w-full h-12 rounded-2xl bg-gray-50 border border-gray-100 text-gray-900 px-5 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                            {item.line === 'adicionais' ? (
                                Object.keys(ADICIONAIS_LABELS).map(k => <option key={k} value={k}>{ADICIONAIS_LABELS[k]}</option>)
                            ) : (
                                Object.keys(PRODUCT_LABELS).map(k => <option key={k} value={k}>{PRODUCT_LABELS[k]}</option>)
                            )}
                        </select>
                    </div>
                    <div className="md:col-span-3">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Para quem?</label>
                        <select value={item.category} onChange={(e) => updateItemRow(item.id, 'category', e.target.value)} className="w-full h-12 rounded-2xl bg-gray-50 border border-gray-100 text-gray-900 px-5 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                            {Object.keys(KIT_TYPES).map(k => <option key={k} value={k}>{KIT_TYPES[k]}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Quantidade</label>
                        <div className="flex items-center gap-3 h-12 bg-gray-50 rounded-2xl px-4 border border-gray-100">
                            <button onClick={() => updateItemRow(item.id, 'quantity', Math.max(0, item.quantity - 1))} className="text-gray-400 hover:text-indigo-600 font-black">-</button>
                            <input type="number" value={item.quantity} onChange={(e) => updateItemRow(item.id, 'quantity', parseInt(e.target.value) || 0)} className="w-full text-center bg-transparent font-black text-sm focus:outline-none" />
                            <button onClick={() => updateItemRow(item.id, 'quantity', item.quantity + 1)} className="text-gray-400 hover:text-indigo-600 font-black">+</button>
                        </div>
                    </div>
                    <div className="md:col-span-1 flex justify-center pb-2">
                        <button onClick={() => removeItemRow(item.id)} className="p-3 text-red-200 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                    </div>
                </div>
                
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-50">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Valor Unitário</span>
                            <span className="text-lg font-black text-indigo-900">R$ {unitPrice.toFixed(2)}</span>
                        </div>
                        {item.line === 'monaco' && item.productKey !== 'calcao' && (
                            <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                                <input type="checkbox" id={`emb-${item.id}`} checked={item.hasEmbroidery} onChange={(e) => updateItemRow(item.id, 'hasEmbroidery', e.target.checked)} className="w-4 h-4 accent-indigo-600 rounded cursor-pointer" />
                                <label htmlFor={`emb-${item.id}`} className="text-[10px] font-black text-indigo-900 uppercase cursor-pointer">Adicionar Bordado (+R$ 5,00)</label>
                            </div>
                        )}
                        {(item.line === 'equador' || item.line === 'vanilha') && item.productKey !== 'calcao' && (
                            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                                <Check size={14} className="text-green-600" />
                                <span className="text-[10px] font-black text-green-700 uppercase">Bordado Incluso</span>
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Subtotal</span>
                        <div className="text-2xl font-black text-gray-900 tracking-tighter">R$ {(unitPrice * item.quantity).toFixed(2)}</div>
                    </div>
                </div>
            </div>
          );
        })}
        <button onClick={addNewItemRow} className="w-full py-6 rounded-[2.5rem] border-2 border-dashed border-indigo-100 text-indigo-400 font-black flex items-center justify-center gap-3 hover:bg-indigo-50 hover:border-indigo-200 transition-all uppercase tracking-widest text-xs">
            <Plus size={20} /> Adicionar Item ao Pedido
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-200 space-y-6 shadow-sm">
          <h3 className="text-xl font-black text-gray-700 flex items-center gap-3 uppercase tracking-widest italic">
            <Footprints size={24} className="text-indigo-600" /> Meiões Profissionais (R$ 20,00)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.socks.map(sock => (
              <div key={sock.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                <div className="flex-1">
                  <select value={sock.color} onChange={(e) => updateSockEntry(sock.id, 'color', e.target.value)} className="w-full h-11 rounded-xl bg-white border border-gray-100 text-gray-700 px-4 text-sm font-bold">
                    {SOCK_COLORS.map(color => (<option key={color} value={color} disabled={config.socks.some(s => s.color === color && s.id !== sock.id)}>{color}</option>))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateSockEntry(sock.id, 'quantity', sock.quantity - 1)} className="w-9 h-9 rounded-lg bg-white text-gray-400 font-black border border-gray-200">-</button>
                  <span className="w-6 text-center text-sm font-black">{sock.quantity}</span>
                  <button onClick={() => updateSockEntry(sock.id, 'quantity', sock.quantity + 1)} className="w-9 h-9 rounded-lg bg-white text-gray-400 font-black border border-gray-200">+</button>
                </div>
                <button onClick={() => removeSockEntry(sock.id)} className="p-2 text-red-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
          {SOCK_COLORS.length > config.socks.length && (
            <button onClick={addSockEntry} className="text-indigo-600 flex items-center gap-2 font-black text-[11px] bg-indigo-50 px-8 py-4 rounded-2xl border border-indigo-100 uppercase tracking-widest active:scale-95"><Plus size={16}/> Adicionar Cor de Meião</button>
          )}
      </div>

      <div className={`p-6 rounded-[2rem] text-center border-2 border-dashed transition-all font-black uppercase tracking-tighter text-lg ${minOrderMet ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
        Total de Peças: {totalItemsCount} {minOrderMet ? <Check size={20} className="inline ml-2" /> : <span className="block text-xs mt-1">(Mínimo 10 un. Faltam {10-totalItemsCount})</span>}
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={() => setStep(1)} className="text-gray-400 font-black flex items-center gap-2 uppercase text-xs tracking-widest"><ArrowLeft size={20} /> Voltar</button>
        <button onClick={() => setStep(3)} disabled={!minOrderMet} className={`px-12 py-6 rounded-[2rem] font-black text-white shadow-2xl transition-all active:scale-95 uppercase tracking-widest ${minOrderMet ? 'bg-gray-900 hover:bg-gray-800' : 'bg-gray-300 cursor-not-allowed'}`}>
          Próximo Passo <ArrowRight size={24} className="ml-2" />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="text-center"><h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">Referências Visuais</h2><p className="text-sm text-gray-500 font-medium">Use nosso simulador para criar sua arte e anexe o design abaixo.</p></div>
      
      {/* Seção do Simulador - Substituindo IA */}
      <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-[3rem] p-10 space-y-8 shadow-sm flex flex-col items-center text-center">
        <div className="p-5 bg-indigo-600 rounded-[2rem] text-white shadow-2xl rotate-3 animate-pulse">
            <Monitor size={48} />
        </div>
        
        <div className="space-y-3 max-w-lg">
            <h3 className="text-3xl font-black text-indigo-900 uppercase italic tracking-tighter leading-none">Simulador D'sportivo</h3>
            <p className="text-sm text-indigo-700 font-bold leading-relaxed">
                Personalize cores, golas, punhos e patrocínios em tempo real. Salve a imagem do seu design e anexe nos campos abaixo para nossa produção.
            </p>
        </div>

        <a 
          href="https://www.dsportivo.com.br/simulador/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-gray-900 text-white px-12 py-6 rounded-[2rem] font-black shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-4 uppercase tracking-[0.1em] group"
        >
          <ExternalLink size={24} className="group-hover:rotate-12 transition-transform" />
          ABRIR SIMULADOR
        </a>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {config.items.map((item) => {
          const key = `item_${item.id}`;
          const file = designFiles[key];
          const prodLabel = item.line === 'adicionais' ? ADICIONAIS_LABELS[item.productKey] : PRODUCT_LABELS[item.productKey];
          return (
            <div key={key} className="border-2 border-dashed border-gray-200 rounded-[3rem] p-10 flex flex-col items-center group relative hover:border-indigo-400 transition-all bg-white shadow-sm hover:shadow-md">
              <input type="file" accept="image/*" onChange={(e) => handleDesignUpload(key, e)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
              <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter mb-1">{KIT_TYPES[item.category]}</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">{LINE_DETAILS[item.line].name} - {prodLabel}</p>
              {file ? (
                <div className="w-full h-60 bg-gray-50 rounded-[2rem] overflow-hidden relative z-10 p-4 border border-gray-100 flex items-center justify-center">
                    <img src={file} className="max-w-full max-h-full object-contain rounded-xl" alt="Preview" />
                    <button onClick={(e) => { e.stopPropagation(); setDesignFiles(prev => ({ ...prev, [key]: null })); }} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={16} />
                    </button>
                </div>
              ) : (
                <div className="flex flex-col items-center py-16 text-gray-400 group-hover:text-indigo-500 transition-colors"><Upload size={48} className="mb-4" /> <span className="text-[10px] font-black uppercase tracking-[0.2em]">Anexar Design do Simulador</span></div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between pt-4"><button onClick={() => setStep(2)} className="text-gray-400 font-black uppercase text-xs tracking-widest"><ArrowLeft size={20} /> Voltar</button><button onClick={() => setStep(4)} className="bg-indigo-600 text-white px-12 py-6 rounded-[2rem] font-black shadow-2xl hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest">Revisar Pedido <ArrowRight size={24} className="ml-2" /></button></div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">Quase Lá!</h2>
          <p className="text-sm text-gray-500 font-medium">Preencha sua grade e dados de contato para o orçamento final.</p>
        </div>
        
        <div className="bg-white border-2 border-indigo-100 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
            <h3 className="font-black text-indigo-900 uppercase text-xs tracking-[0.2em]">Seus Dados</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <input type="text" placeholder="Seu Nome / Nome do Time" value={config.customerInfo.customerName} onChange={(e) => setConfig(prev => ({ ...prev, customerInfo: { ...prev.customerInfo, customerName: e.target.value } }))} className="w-full px-6 py-5 border-2 border-gray-100 rounded-3xl bg-gray-50 text-gray-900 font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" />
                <input type="tel" placeholder="WhatsApp" value={config.customerInfo.customerPhone} onChange={(e) => setConfig(prev => ({ ...prev, customerInfo: { ...prev.customerInfo, customerPhone: e.target.value } }))} className="w-full px-6 py-5 border-2 border-gray-100 rounded-3xl bg-gray-50 text-gray-900 font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" />
            </div>
        </div>

        {/* Grade de Jogadores Redesenhada para Mobile e Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roster.map((player, index) => (
                <div key={index} className="bg-white border-2 border-gray-100 rounded-[2.5rem] p-6 shadow-sm group hover:border-indigo-200 transition-all flex flex-col gap-4 relative overflow-hidden">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white font-black italic shadow-lg shrink-0">#{index + 1}</div>
                        <div className="h-[2px] flex-1 bg-gray-50"></div>
                        <span className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter bg-indigo-50 text-indigo-900 border border-indigo-100 whitespace-nowrap`}>
                            {player.productLabel}
                        </span>
                    </div>

                    <div className="space-y-4">
                        {/* Linha 1: Nome e Número */}
                        <div className="flex gap-4">
                            <div className="flex-[3]">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5 block tracking-widest">Nome na Peça</label>
                                <div className="relative">
                                    <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                    <input 
                                        type="text" 
                                        value={player.name} 
                                        onChange={(e) => handleRosterChange(index, 'name', e.target.value)} 
                                        className="w-full pl-10 pr-4 py-4 bg-gray-50 text-gray-900 border-2 border-transparent rounded-2xl font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all text-sm" 
                                        placeholder="Ex: João Silva" 
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5 block tracking-widest text-center">Nº</label>
                                <div className="relative">
                                    <Hash size={14} className="absolute left-1/2 -translate-x-[200%] top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none hidden" />
                                    <input 
                                        type="text" 
                                        value={player.number} 
                                        onChange={(e) => handleRosterChange(index, 'number', e.target.value)} 
                                        className="w-full text-center py-4 bg-gray-50 text-gray-900 border-2 border-transparent rounded-2xl font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all text-sm" 
                                        placeholder="--" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Linha 2: Tamanho */}
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5 block tracking-widest">Tamanho</label>
                            <div className="relative">
                                <Ruler size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                <select 
                                    value={player.size} 
                                    onChange={(e) => handleRosterChange(index, 'size', e.target.value)} 
                                    className="w-full pl-10 pr-4 py-4 bg-gray-50 text-gray-900 border-2 border-transparent rounded-2xl font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer text-sm"
                                >
                                    {ALL_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <ArrowRight size={14} className="rotate-90" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="bg-gray-900 text-white rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden border-t-8 border-indigo-600 mt-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-gray-500 font-black text-[10px] uppercase tracking-[0.3em] mb-2 block">Total Estimado</span>
                <div className="text-6xl font-black text-green-400 tracking-tighter italic">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex items-start gap-4 transition-all hover:bg-white/10 group">
                <input type="checkbox" checked={hasReviewed} onChange={(e) => setHasReviewed(e.target.checked)} className="w-8 h-8 mt-0.5 cursor-pointer accent-green-500 border-white/20" id="rev" />
                <label htmlFor="rev" className="cursor-pointer text-gray-400 text-sm font-bold leading-snug group-hover:text-gray-200">Confirmo que revisei todos os itens, nomes e tamanhos acima.</label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button onClick={handleDownload} disabled={!hasReviewed || !config.customerInfo.customerName} className={`py-6 rounded-3xl font-black flex items-center justify-center gap-4 transition-all active:scale-95 uppercase text-xs tracking-[0.2em] ${hasReviewed && config.customerInfo.customerName ? 'bg-white text-gray-900 hover:bg-gray-100 shadow-xl' : 'bg-gray-800 text-gray-600 opacity-50 cursor-not-allowed'}`}>
                <Download size={24} /> Gerar PDF do Pedido
              </button>
              <button onClick={handleWhatsAppContact} disabled={!hasReviewed || !config.customerInfo.customerName} className={`py-6 rounded-3xl font-black flex items-center justify-center gap-4 transition-all active:scale-95 uppercase text-xs tracking-[0.2em] ${hasReviewed && config.customerInfo.customerName ? 'bg-green-600 text-white hover:bg-green-500 shadow-xl' : 'bg-gray-800 text-gray-600 opacity-50 cursor-not-allowed'}`}>
                <MessageCircle size={24} /> Chamar no WhatsApp
              </button>
            </div>
        </div>

        <div className="flex justify-between items-center pt-4">
          <button onClick={() => setStep(3)} className="text-gray-400 font-black flex items-center gap-2 uppercase text-xs tracking-widest"><ArrowLeft size={20} /> Voltar</button>
          <button onClick={saveProgress} className={`px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-md transition-all uppercase text-[10px] tracking-widest ${saveStatus==='saved'?'bg-green-500 text-white':'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            <Save size={18} /> {saveStatus==='saving'?'Salvando...':saveStatus==='saved'?'Salvo!':'Salvar Rascunho'}
          </button>
        </div>
    </div>
  );

  if (isLoading) return (<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 space-y-4 font-black"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div><span className="text-gray-400 uppercase text-xs tracking-widest">D'sportivo Uniformes</span></div>);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-indigo-100 relative pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm"><div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between"><BrandLogo /></div></header>
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex justify-center mb-16"><div className="flex items-center gap-4">{[1, 2, 3, 4].map((s) => (<div key={s} className="flex items-center"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all shadow-sm ${step >= s ? 'bg-gray-900 text-white scale-110 rotate-3' : 'bg-white text-gray-300 border border-gray-100'}`}>{s}</div>{s < 4 && <div className={`w-16 h-1 mx-2 rounded-full transition-all ${step > s ? 'bg-gray-900' : 'bg-gray-200'}`}></div>}</div>))}</div></div>
        <div className="bg-white rounded-[3.5rem] shadow-xl border border-gray-100 p-8 md:p-16 min-h-[600px] relative transition-all overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[100px] -mr-32 -mt-32 opacity-50"></div>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
      </main>
      <button onClick={() => setShowSizeChart(true)} className="fixed bottom-8 right-8 z-40 bg-indigo-600 text-white p-5 rounded-2xl shadow-2xl border-4 border-white hover:bg-indigo-700 transition-all active:scale-90 animate-bounce"><Ruler size={24} /></button>
      {showSizeChart && (
        <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowSizeChart(false)}>
            <div className="bg-white p-2 rounded-[2.5rem] max-w-6xl w-full relative shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-8 border-b">
                    <h3 className="text-2xl font-black flex items-center gap-3 text-gray-900 uppercase tracking-tighter italic"><Ruler className="text-indigo-600" size={28}/> Grade de Tamanhos Profissional</h3>
                    <button onClick={() => setShowSizeChart(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"><X size={24} /></button>
                </div>
                <div className="overflow-y-auto p-8 bg-gray-50/50 rounded-b-[2.5rem]">
                    <div className="flex justify-center gap-4 mb-10">
                        <button onClick={() => setActiveSizeTab('standard')} className={`px-8 py-4 rounded-2xl font-black text-xs tracking-widest shadow-sm transition-all uppercase ${activeSizeTab === 'standard' ? 'bg-blue-600 text-white scale-105' : 'bg-white text-gray-500 border hover:bg-gray-50'}`}>Modelagem Padrão</button>
                        <button onClick={() => setActiveSizeTab('diamond')} className={`px-8 py-4 rounded-2xl font-black text-xs tracking-widest shadow-sm transition-all uppercase ${activeSizeTab === 'diamond' ? 'bg-indigo-900 text-white scale-105' : 'bg-white text-gray-500 border hover:bg-gray-50'}`}>Modelagem Slim (Vanilha)</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        <SizeTable title={SIZE_TABLES[activeSizeTab].masculina.title} headerColor={SIZE_TABLES[activeSizeTab].masculina.headerColor} headers={SIZE_TABLES[activeSizeTab].masculina.headers} keys={SIZE_TABLES[activeSizeTab].masculina.keys} data={SIZE_TABLES[activeSizeTab].masculina.data} />
                        <SizeTable title={SIZE_TABLES[activeSizeTab].feminina.title} headerColor={SIZE_TABLES[activeSizeTab].feminina.headerColor} headers={SIZE_TABLES[activeSizeTab].feminina.headers} keys={SIZE_TABLES[activeSizeTab].feminina.keys} data={SIZE_TABLES[activeSizeTab].feminina.data} />
                        <SizeTable title={SIZE_TABLES[activeSizeTab].infantil.title} headerColor={SIZE_TABLES[activeSizeTab].infantil.headerColor} headers={SIZE_TABLES[activeSizeTab].infantil.headers} keys={SIZE_TABLES[activeSizeTab].infantil.keys} data={SIZE_TABLES[activeSizeTab].infantil.data} />
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
