import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Upload, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Trophy, 
  ExternalLink, 
  Shirt, 
  Footprints, 
  Maximize2, 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  AlertTriangle, 
  Briefcase, 
  Gem, 
  Check, 
  Image as ImageIcon, 
  Ruler,
  ChevronDown,
  Info,
  Share2,
  Eye,
  MessageCircle
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Firestore 
} from 'firebase/firestore';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Global Declarations for External Variables ---
declare const __app_id: string;
declare const __firebase_config: string;
declare const __initial_auth_token: string;

// --- Configurações de Contato ---
const WHATSAPP_NUMBER = "5516991679072"; 
const WHATSAPP_MESSAGE = "Olá! Acabei de gerar meu orçamento no simulador D'sportivo uniformes e estou entrando em contato para enviar o PDF e finalizar meu pedido.";

// --- Constantes de Preços ---
const PRICES = {
  prata: { camisa: 42.90, calcao: 32.00, conjunto: 74.90, meiao: 20.00 },
  ouro: { camisa: 44.90, calcao: 35.00, conjunto: 79.90, meiao: 25.00 },
  diamante: { camisa: 74.90, calcao: 49.90, conjunto: 124.80, meiao: 30.00 },
  empresarial: { camisa: 49.90, calcao: 35.00, conjunto: 84.90, meiao: 20.00 },
};

// --- Dados da Tabela de Medidas ---
const SIZE_TABLES = {
  standard: {
    masculina: {
      title: "Medidas Masculina (Padrão)",
      headerColor: "bg-blue-600",
      headers: ["TAMANHO", "LARGURA", "ALTURA"],
      keys: ["t", "w", "h"],
      data: [
        { t: 'ESP', w: '65cm', h: '81,5cm' },
        { t: 'XG', w: '61cm', h: '75,5cm' },
        { t: 'GG', w: '58,5cm', h: '75cm' },
        { t: 'G', w: '56,5cm', h: '73cm' },
        { t: 'M', w: '52cm', h: '69,5cm' },
        { t: 'P', w: '48cm', h: '67cm' },
      ]
    },
    feminina: {
      title: "Medidas Feminina (Baby Look Padrão)",
      headerColor: "bg-blue-600",
      headers: ["TAMANHO", "LARGURA", "ALTURA"],
      keys: ["t", "w", "h"],
      data: [
        { t: 'XG', w: '55,5cm', h: '72cm' },
        { t: 'GG', w: '51cm', h: '66,5cm' },
        { t: 'G', h: '66cm', w: '46,5cm' },
        { t: 'M', h: '62,5cm', w: '46cm' },
        { t: 'P', h: '60cm', w: '46cm' },
      ]
    },
    infantil: {
      title: "Medidas Infantis (Padrão)",
      headerColor: "bg-blue-600",
      headers: ["TAMANHO", "ALTURA", "LARGURA"],
      keys: ["t", "h", "w"],
      data: [
        { t: 'T.12', h: '56cm', w: '46cm' },
        { t: 'T.10', h: '54cm', w: '44cm' },
        { t: 'T.8', h: '51cm', w: '42cm' },
        { t: 'T.6', h: '49cm', w: '40cm' },
        { t: 'T.4', h: '46cm', w: '38cm' },
      ]
    }
  },
  diamond: {
    masculina: {
      title: "Medidas Masculina (Diamante/Slim)",
      headerColor: "bg-indigo-900",
      headers: ["TAMANHO", "ALTURA", "LARGURA"],
      keys: ["t", "h", "w"],
      data: [
        { t: 'G3', h: '89cm', w: '80cm' },
        { t: 'ESP', h: '84cm', w: '70cm' },
        { t: 'XG', h: '73cm', w: '60cm' },
        { t: 'GG', h: '73cm', w: '56cm' },
        { t: 'G', h: '70cm', w: '53cm' },
        { t: 'M', h: '70cm', w: '51cm' },
        { t: 'P', h: '67cm', w: '49cm' },
      ]
    },
    feminina: {
      title: "Medidas Feminina (Diamante Baby Look)",
      headerColor: "bg-fuchsia-800",
      headers: ["TAMANHO", "ALTURA", "LARGURA"],
      keys: ["t", "h", "w"],
      data: [
        { t: 'XG', h: '65cm', w: '58cm' },
        { t: 'GG', h: '63cm', w: '56cm' },
        { t: 'G', h: '63cm', w: '53cm' },
        { t: 'M', h: '50cm', w: '61cm' },
        { t: 'P', h: '57cm', w: '48cm' },
      ]
    },
    infantil: {
      title: "Medidas Infantis (Diamante)",
      headerColor: "bg-indigo-900",
      headers: ["TAMANHO", "ALTURA", "LARGURA"],
      keys: ["t", "h", "w"],
      data: [
        { t: 'T.16', h: '61cm', w: '50cm' },
        { t: 'T.14', h: '59cm', w: '48cm' },
        { t: 'T.12', h: '56cm', w: '46cm' },
        { t: 'T.10', h: '54cm', w: '44cm' },
        { t: 'T.8', h: '51cm', w: '42cm' },
        { t: 'T.6', h: '49cm', w: '40cm' },
        { t: 'T.4', h: '46cm', w: '38cm' },
        { t: 'T.2', h: '43cm', w: '36cm' },
      ]
    }
  }
};

const LINE_DETAILS = {
  prata: { 
    name: 'Prata', 
    priceDesc: 'Camisa R$ 42,90 (Bordado Opcional) | Calção R$ 32,00',
    desc: 'Excelente custo-benefício. Ideal para quem busca economia.', 
    fullDesc: 'A Linha Prata (Monaco) é focada em times amadores e interclasses. Bordado é opcional nesta categoria.',
    features: ['Tecido Dry Leve', 'Modelagem Padrão', 'Bordado Opcional', 'Proteção UV Básica'],
    color: 'bg-gray-400',
    textColor: 'text-gray-600',
    icon: Trophy
  },
  ouro: { 
    name: 'Ouro', 
    priceDesc: 'Camisa R$ 44,90 (Bordado Incluso) | Calção R$ 35,00',
    desc: 'Tecido premium com acabamento superior.', 
    fullDesc: 'A Linha Ouro (Bélgica) oferece tecido Dry Tech de maior gramatura with bordado já incluso no valor.',
    features: ['Tecido Premium', 'Costura Dupla', 'Bordado Incluso', 'Alta Durabilidade'],
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    icon: Trophy
  },
  diamante: { 
    name: 'Diamante', 
    priceDesc: 'Camisa R$ 74,90 (Bordado Incluso) | Calção R$ 49,90',
    desc: 'Modelagem profissional e exclusiva.', 
    fullDesc: 'A Linha Diamante (Vanilha/Polo) é o topo de linha para atletas exigentes. Inclui bordado de alta definição.',
    features: ['Slim Fit Profissional', 'Tecido Aero', 'Bordado Incluso', 'Golas Especiais'],
    color: 'bg-cyan-500',
    textColor: 'text-cyan-600',
    icon: Gem
  },
  empresarial: { 
    name: 'Empresarial / Eventos', 
    priceDesc: 'Camisa R$ 49,90',
    desc: 'Solução ideal para uniformização de equipes e eventos.', 
    fullDesc: 'Desenvolvida para empresas, eventos corporativos e atléticas.',
    features: ['Unissex Versátil', 'Tecido Antipilling', 'Fácil Lavagem'],
    color: 'bg-slate-800',
    textColor: 'text-slate-700',
    icon: Briefcase
  },
};

const KIT_TYPES: Record<string, string> = {
  linha: 'Linha',
  goleiro: 'Goleiro',
  comissao: 'Comissão Técnica',
  atleta: 'Atleta',
  torcida: 'Torcida',
  staff: 'Staff / Eventos',
};

const SOCK_COLORS = ['Preto', 'Branco', 'Azul Marinho', 'Azul Royal', 'Verde Bandeira', 'Vermelho', 'Amarelo Ouro'];
const SIZES_INFANTIL = ['2', '4', '6', '8', '10', '12', '14', '16'];
const SIZES_ADULTO = ['P', 'M', 'G', 'GG', 'XG', 'ESP', 'G3'];
const SIZES_FEMININO = ['P BL', 'M BL', 'G BL', 'GG BL', 'XG BL', 'ESP BL'];
const ALL_SIZES = [...SIZES_INFANTIL, ...SIZES_ADULTO, ...SIZES_FEMININO];

interface SockItem { id: number; color: string; quantity: number; }
interface RosterItem { name: string; number: string; size: string; type: 'conjunto' | 'camisa' | 'calcao'; kitType: keyof typeof KIT_TYPES; }
interface CustomerInfo { customerName: string; customerPhone: string; }
type LineType = 'prata' | 'ouro' | 'diamante' | 'empresarial';

interface Config { 
  line: LineType; 
  kitLines: Record<keyof typeof KIT_TYPES, LineType>; 
  kitQuantities: Record<keyof typeof KIT_TYPES, number>; 
  kitEmbroidery: Record<keyof typeof KIT_TYPES, boolean>; 
  socks: SockItem[]; 
  nextSockId: number; 
  customerInfo: CustomerInfo; 
}

const INITIAL_CONFIG: Config = {
    line: 'prata',
    kitLines: { linha: 'prata', goleiro: 'prata', comissao: 'prata', atleta: 'prata', torcida: 'prata', staff: 'prata' },
    kitQuantities: { linha: 10, atleta: 0, goleiro: 0, comissao: 0, torcida: 0, staff: 0 },
    kitEmbroidery: { linha: false, goleiro: false, comissao: false, atleta: false, torcida: false, staff: false },
    socks: [],
    nextSockId: 1,
    customerInfo: { customerName: '', customerPhone: '' },
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
  const [auth, setAuth] = useState<Auth | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [modalOpen, setModalOpen] = useState<LineType | null>(null);
  const [config, setConfig] = useState<Config>(INITIAL_CONFIG);
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [publicGallery, setPublicGallery] = useState<any[]>([]);
  const [sharingStatus, setSharingStatus] = useState<Record<string, 'idle'|'sharing'|'shared'>>({});
  const [selectedInspiration, setSelectedInspiration] = useState<string | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [activeSizeTab, setActiveSizeTab] = useState<'standard' | 'diamond'>('standard');

  const [designFiles, setDesignFiles] = useState<Record<keyof typeof KIT_TYPES, string | null>>({
    linha: null, goleiro: null, comissao: null, atleta: null, torcida: null, staff: null,
  });

  useEffect(() => {
    const appId = typeof __app_id !== 'undefined' ? String(__app_id as any) : 'default-app-id';
    const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? String(__firebase_config as any) : '{}');
    if (Object.keys(firebaseConfig).length === 0) { setIsLoading(false); return; }
    try {
      const app = initializeApp(firebaseConfig);
      const newAuth = getAuth(app);
      const newDb = getFirestore(app);
      setAuth(newAuth);
      setDb(newDb);
      onAuthStateChanged(newAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
          loadProgress(newDb, user.uid, appId);
        } else {
          const anonUser = await signInAnonymously(newAuth);
          setUserId(anonUser.user.uid);
          loadProgress(newDb, anonUser.user.uid, appId);
        }
      });
      fetchPublicGallery(newDb, appId);
    } catch (e) { setIsLoading(false); }
  }, []);

  const fetchPublicGallery = async (dbInstance: Firestore, appId: string) => {
    try {
      const q = query(collection(dbInstance, `artifacts/${appId}/public_gallery`), orderBy('createdAt', 'desc'), limit(12));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => doc.data());
      setPublicGallery(items);
    } catch (e) { console.error("Erro ao buscar galeria:", e); }
  };

  const shareToGallery = async (kitType: string) => {
    const appId = typeof __app_id !== 'undefined' ? String(__app_id as any) : 'default-app-id';
    const image = designFiles[kitType as keyof typeof KIT_TYPES];
    if (!image || !db) return;

    setSharingStatus(prev => ({ ...prev, [kitType]: 'sharing' }));
    try {
      await addDoc(collection(db, `artifacts/${appId}/public_gallery`), {
        image,
        category: KIT_TYPES[kitType],
        line: LINE_DETAILS[config.kitLines[kitType as keyof typeof KIT_TYPES]].name,
        createdAt: serverTimestamp(),
        author: config.customerInfo.customerName || 'Anônimo'
      });
      setSharingStatus(prev => ({ ...prev, [kitType]: 'shared' }));
      fetchPublicGallery(db, appId);
    } catch (e) {
      setSharingStatus(prev => ({ ...prev, [kitType]: 'idle' }));
    }
  };

  const loadProgress = async (dbInstance: Firestore, uid: string, appId: string) => {
    try {
      const docSnap = await getDoc(doc(dbInstance, `artifacts/${appId}/users/${uid}/orcamento`, 'draft'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.config) setConfig(prev => ({...prev, ...data.config}));
        if (data.roster) setRoster(data.roster);
        if (data.designFiles) setDesignFiles(data.designFiles);
      }
    } catch (e) { } finally { setIsLoading(false); }
  };

  const saveProgress = async () => {
    const appId = typeof __app_id !== 'undefined' ? String(__app_id as any) : 'default-app-id';
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

  const totalKits = useMemo(() => (Object.values(config.kitQuantities) as number[]).reduce((sum, q) => sum + q, 0), [config.kitQuantities]);
  const totalSocks = useMemo(() => config.socks.reduce((sum, sock) => sum + sock.quantity, 0), [config.socks]);
  const minOrderMet = totalKits >= 10;
  
  const calculateTotal = () => {
    const rosterTotal = roster.reduce((acc, item) => {
      const categoryLine = config.kitLines[item.kitType] || config.line; 
      const itemPrice = PRICES[categoryLine][item.type as keyof typeof PRICES['prata']] || PRICES[categoryLine].conjunto;
      return acc + itemPrice;
    }, 0);
    return rosterTotal + (totalSocks * PRICES[config.line].meiao);
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
      socks: prev.socks.map(sock => 
        sock.id === id 
          ? { ...sock, [field]: field === 'quantity' ? Math.max(0, parseInt(String(value)) || 0) : value as string } 
          : sock
      ),
    }));
  };

  const removeSockEntry = (id: number) => {
    setConfig(prev => ({
      ...prev,
      socks: prev.socks.filter(sock => sock.id !== id),
    }));
  };

  useEffect(() => {
    setRoster(prev => {
      const newRoster: RosterItem[] = [];
      const quantityMap = config.kitQuantities;
      (Object.keys(KIT_TYPES) as Array<keyof typeof KIT_TYPES>).forEach(key => {
        const count = quantityMap[key];
        const existing = prev.filter(item => item.kitType === key);
        for (let i = 0; i < count; i++) {
          newRoster.push(existing[i] || { name: '', number: key === 'comissao' ? 'TÉC' : '', size: 'G', type: (key==='atleta'||key==='comissao'||key==='torcida') ? 'camisa' : 'conjunto', kitType: key });
        }
      });
      return newRoster;
    });
  }, [config.kitQuantities]);

  const handleRosterChange = (index: number, field: string, value: string) => {
    const newRoster = [...roster];
    newRoster[index] = { ...newRoster[index], [field]: value };
    setRoster(newRoster);
  };

  const updateKitLine = (kitType: keyof typeof KIT_TYPES, lineKey: LineType) => {
    setConfig(prev => ({ ...prev, kitLines: { ...prev.kitLines, [kitType]: lineKey } }));
  };

  const toggleEmbroidery = (kitType: keyof typeof KIT_TYPES) => {
    setConfig(prev => ({
      ...prev,
      kitEmbroidery: { ...prev.kitEmbroidery, [kitType]: !prev.kitEmbroidery[kitType] }
    }));
  };

  const handleDesignUpload = (kitType: keyof typeof KIT_TYPES, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
          setDesignFiles(prev => ({ ...prev, [kitType]: String(reader.result) }));
          setSharingStatus(prev => ({ ...prev, [kitType]: 'idle' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138);
    doc.text("D'sportivo uniformes", 14, 20);
    doc.line(14, 25, pageWidth - 14, 25);
    autoTable(doc, {
        startY: 35,
        head: [['Categoria', 'Linha', 'Quantidade', 'Obs']],
        body: Object.entries(config.kitQuantities)
          .filter(([_, q]) => (q as number) > 0)
          .map(([k, q]) => [
            KIT_TYPES[k], 
            LINE_DETAILS[config.kitLines[k as keyof typeof KIT_TYPES]].name, 
            `${q} un`,
            config.kitLines[k as keyof typeof KIT_TYPES] === 'prata' && config.kitEmbroidery[k as keyof typeof KIT_TYPES] ? 'Com Bordado' : ''
          ])
    });
    doc.save(`Orcamento_Dsportivo.pdf`);
  };

  const handleWhatsAppContact = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    window.open(url, '_blank');
  };

  const CategoryControl = ({ kitType }: { kitType: keyof typeof KIT_TYPES }) => {
      const currentLine = config.kitLines[kitType];
      const quantity = config.kitQuantities[kitType];
      const hasEmbroidery = config.kitEmbroidery[kitType];

      return (
        <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-1 h-full ${LINE_DETAILS[currentLine].color}`}></div>
            <div className="flex justify-between items-start pl-3">
                <label className="block text-lg font-bold text-gray-900">{KIT_TYPES[kitType]}</label>
                <span className="text-lg font-bold text-gray-900">R$ {PRICES[currentLine].conjunto.toFixed(2)}</span>
            </div>
            <div className="pl-3 grid grid-cols-1 gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <select value={currentLine} onChange={(e) => updateKitLine(kitType, e.target.value as LineType)} className="w-full bg-gray-50 border border-gray-300 py-2 px-3 rounded-lg text-sm font-medium">
                      {Object.keys(LINE_DETAILS).map((key) => (<option key={key} value={key}>Linha {LINE_DETAILS[key as LineType].name}</option>))}
                  </select>
                  <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setConfig(prev => ({ ...prev, kitQuantities: { ...prev.kitQuantities, [kitType]: Math.max(0, prev.kitQuantities[kitType] - 1) } }))} className="w-8 h-8 rounded-md bg-gray-100 text-indigo-600 font-bold border border-gray-200">-</button>
                      <input type="number" value={quantity} onChange={(e) => setConfig(prev => ({ ...prev, kitQuantities: { ...prev.kitQuantities, [kitType]: Math.max(0, parseInt(e.target.value) || 0) } }))} className="w-12 text-center text-lg font-bold bg-transparent border-b-2 border-indigo-200 focus:outline-none text-indigo-900" />
                      <button onClick={() => setConfig(prev => ({ ...prev, kitQuantities: { ...prev.kitQuantities, [kitType]: prev.kitQuantities[kitType] + 1 } }))} className="w-8 h-8 rounded-md bg-gray-100 text-indigo-600 font-bold border border-gray-200">+</button>
                  </div>
                </div>

                {/* Opção de Bordado para Linha Prata */}
                {currentLine === 'prata' && quantity > 0 && (
                  <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${hasEmbroidery ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        id={`embroidery-${kitType}`}
                        checked={hasEmbroidery}
                        onChange={() => toggleEmbroidery(kitType)}
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                    <label htmlFor={`embroidery-${kitType}`} className="flex-1 cursor-pointer select-none">
                      <span className="block text-xs font-bold text-indigo-900 uppercase">Bordado no peito</span>
                      <span className="block text-[10px] text-gray-500 font-medium">Localizado no escudo da camisa</span>
                    </label>
                  </div>
                )}
            </div>
        </div>
      );
  };

  const renderStep1 = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-4 pt-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Vista seu time com <span className="text-indigo-600">Excelência</span></h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">Simulador de orçamentos para uniformes esportivos profissionais.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
        {(Object.keys(LINE_DETAILS) as Array<keyof typeof LINE_DETAILS>).map((key) => (
          <div key={key} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all p-6 flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-full ${LINE_DETAILS[key].color} text-white flex items-center justify-center shadow-md`}><Trophy size={24} /></div>
                  <div><h3 className="text-xl font-bold text-gray-900">{LINE_DETAILS[key].name}</h3><p className="text-sm font-medium text-indigo-600">{LINE_DETAILS[key].priceDesc}</p></div>
              </div>
              <p className="text-gray-600 text-sm mb-6 flex-1">{LINE_DETAILS[key].desc}</p>
              <button onClick={() => setModalOpen(key)} className="w-full py-3 rounded-xl bg-gray-50 text-gray-700 font-bold border border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center justify-center gap-2"><Info size={18} /> Ver Detalhes</button>
          </div>
        ))}
      </div>

      {/* GALERIA PÚBLICA */}
      {publicGallery.length > 0 && (
          <div className="pt-8 border-t border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2 px-2">
                  <ImageIcon size={28} className="text-indigo-600" /> Inspirações da Comunidade
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-2">
                  {publicGallery.map((item, idx) => (
                      <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden border border-gray-200 hover:border-indigo-500 cursor-pointer shadow-sm transition-all" onClick={() => setSelectedInspiration(item.image)}>
                          <img src={item.image} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2">
                              <Eye size={24} />
                              <span className="text-[10px] font-bold uppercase mt-1">{item.category}</span>
                              <span className="text-[8px] opacity-80">{item.line}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div className="flex justify-center pt-8 pb-4">
        <button onClick={() => setStep(2)} className="px-10 py-5 rounded-2xl font-black text-lg flex items-center gap-3 bg-gray-900 text-white hover:bg-indigo-600 shadow-xl">INICIAR SIMULAÇÃO <ArrowRight size={24} /></button>
      </div>
      
      {modalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(null)}>
              <div className="bg-white max-w-lg w-full rounded-2xl p-8" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-start mb-6">
                      <h3 className="text-3xl font-bold">Linha {LINE_DETAILS[modalOpen].name}</h3>
                      <button onClick={() => setModalOpen(null)}><X size={24} /></button>
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">{LINE_DETAILS[modalOpen].fullDesc}</p>
                  <ul className="space-y-3 mb-8">
                      {LINE_DETAILS[modalOpen].features.map((f, i) => (<li key={i} className="flex items-center gap-2"><Check size={18} className="text-green-500" /> {f}</li>))}
                  </ul>
                  <button onClick={() => { setConfig(prev => ({ ...prev, line: modalOpen! })); setStep(2); setModalOpen(null); }} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">Escolher Linha {LINE_DETAILS[modalOpen].name}</button>
              </div>
          </div>
      )}

      {selectedInspiration && (
          <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setSelectedInspiration(null)}>
              <div className="relative max-w-4xl w-full max-h-[90vh]">
                  <img src={selectedInspiration} className="w-full h-full object-contain rounded-xl" />
                  <button className="absolute -top-4 -right-4 bg-white rounded-full p-2" onClick={() => setSelectedInspiration(null)}><X size={24} /></button>
              </div>
          </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      <h2 className="text-2xl font-bold text-center">Quantidades por Categoria</h2>
      
      {/* Categorias Principais */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><CategoryControl kitType="linha" /><CategoryControl kitType="goleiro" /></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><CategoryControl kitType="comissao" /><CategoryControl kitType="atleta" /></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><CategoryControl kitType="torcida" /><CategoryControl kitType="staff" /></div>
      </div>

      {/* SEÇÃO DE MEIÕES */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2 mb-4">
            <Footprints size={20} className="text-indigo-600" /> Meiões Avulsos (Múltiplas Cores)
          </h3>
          
          <div className="space-y-3">
            {config.socks.map(sock => (
              <div key={sock.id} className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-sm">
                
                {/* Seleção de Cor */}
                <div className="flex-1">
                  <select 
                    value={sock.color}
                    onChange={(e) => updateSockEntry(sock.id, 'color', e.target.value)}
                    className="w-full h-10 rounded-lg bg-white border border-gray-300 text-gray-700 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                  >
                    {SOCK_COLORS.map(color => (
                      <option 
                        key={color} 
                        value={color}
                        disabled={config.socks.some(s => s.color === color && s.id !== sock.id)}
                      >
                        {color}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contador de Quantidade */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-500 hidden sm:block">Pares:</label>
                  <button 
                    onClick={() => updateSockEntry(sock.id, 'quantity', sock.quantity - 1)}
                    className="w-8 h-8 rounded-md bg-white text-gray-600 font-bold hover:bg-gray-100 border border-gray-200"
                  >-</button>
                  <input 
                      type="number" 
                      min="0"
                      value={sock.quantity}
                      onChange={(e) => updateSockEntry(sock.id, 'quantity', e.target.value)}
                      className="w-10 text-center text-sm font-bold bg-transparent border-b border-gray-300 focus:outline-none text-indigo-900"
                  />
                  <button 
                    onClick={() => updateSockEntry(sock.id, 'quantity', sock.quantity + 1)}
                    className="w-8 h-8 rounded-md bg-white text-gray-600 font-bold hover:bg-gray-100 border border-gray-200"
                  >+</button>
                </div>

                {/* Remover */}
                <button 
                  onClick={() => removeSockEntry(sock.id)}
                  className="p-2 rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          
          {SOCK_COLORS.length > config.socks.length && (
            <button 
              onClick={addSockEntry} 
              className="mt-3 text-indigo-600 flex items-center gap-1 font-bold hover:text-indigo-800 transition-colors text-sm bg-indigo-50 px-4 py-2 rounded-lg"
            >
              <Plus size={16}/> ADICIONAR COR DE MEIÃO
            </button>
          )}

          {totalSocks > 0 && (
            <p className="text-xs font-bold text-gray-500 pt-2 flex items-center gap-1">
              <CheckCircle2 size={14} className="text-green-500" /> Total de Meiões: {totalSocks} pares
            </p>
          )}
      </div>

      <div className="bg-indigo-50 p-4 rounded-xl text-center border border-indigo-100 font-bold text-indigo-900">
        Total Kits Principais: {totalKits} {!minOrderMet && `(Mínimo 10. Faltam ${10-totalKits})`}
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={() => setStep(1)} className="text-gray-500 font-medium flex items-center gap-2">
          <ArrowLeft size={20} /> Voltar
        </button>
        <button onClick={() => setStep(3)} disabled={!minOrderMet} className={`px-8 py-4 rounded-xl font-bold text-white shadow-lg ${minOrderMet ? 'bg-gray-900 hover:bg-gray-800' : 'bg-gray-300 cursor-not-allowed'}`}>
          Próximo <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="text-center"><h2 className="text-2xl font-bold">Anexar Modelo Visual</h2><p className="text-gray-500">Anexe um print ou arte para cada categoria.</p></div>
      <div className="bg-indigo-100 p-4 rounded-xl flex justify-between items-center"><p className="text-indigo-900 font-medium">Use nosso simulador:</p><a href="https://www.dsportivo.com.br/simulador/" target="_blank" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">Abrir Simulador <ExternalLink size={16} /></a></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Object.keys(KIT_TYPES) as Array<keyof typeof KIT_TYPES>).map((key) => {
          if (config.kitQuantities[key] === 0) return null;
          const file = designFiles[key];
          const status = sharingStatus[key] || 'idle';
          return (
            <div key={key} className="border-2 border-dashed border-gray-300 rounded-3xl p-6 flex flex-col items-center group relative">
              <input type="file" accept="image/*" onChange={(e) => handleDesignUpload(key, e)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <h3 className="text-lg font-bold mb-1">{KIT_TYPES[key]} ({config.kitQuantities[key]} un)</h3>
              <p className="text-xs font-bold text-indigo-600 mb-4 bg-indigo-50 px-2 py-1 rounded">Linha: {LINE_DETAILS[config.kitLines[key]].name}</p>
              {file ? (
                <div className="w-full space-y-3 relative z-10 pointer-events-auto">
                    <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden"><img src={file} className="w-full h-full object-contain" /></div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); shareToGallery(key); }}
                        disabled={status !== 'idle'}
                        className={`w-full py-2 rounded-lg font-bold flex items-center justify-center gap-2 text-xs transition-colors ${
                            status === 'shared' ? 'bg-green-100 text-green-700' : 
                            status === 'sharing' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                    >
                        {status === 'shared' ? <><Check size={14} /> Compartilhado!</> : 
                         status === 'sharing' ? 'Compartilhando...' : 
                         <><Share2 size={14} /> Compartilhar na Galeria Pública</>}
                    </button>
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-gray-400"><Upload size={32} className="mb-2" /><span>Anexar Modelo</span></div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between pt-4"><button onClick={() => setStep(2)} className="text-gray-500 font-medium flex items-center gap-2"><ArrowLeft size={20} /> Voltar</button><button onClick={() => setStep(4)} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg">Próximo <ArrowRight size={20} /></button></div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
        <h2 className="text-2xl font-bold">Formalização do Pedido</h2>
        <div className="bg-white border border-indigo-200 rounded-xl p-4 space-y-4 shadow-sm">
            <h3 className="font-bold text-indigo-800">Dados do Cliente</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <input type="text" placeholder="Nome Completo" value={config.customerInfo.customerName} onChange={(e) => setConfig(prev => ({ ...prev, customerInfo: { ...prev.customerInfo, customerName: e.target.value } }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400" />
                <input type="tel" placeholder="Telefone" value={config.customerInfo.customerPhone} onChange={(e) => setConfig(prev => ({ ...prev, customerInfo: { ...prev.customerInfo, customerPhone: e.target.value } }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400" />
            </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-600 text-xs"><tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Nº</th><th className="px-4 py-3">Tam.</th><th className="px-4 py-3">Item</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                    {roster.map((player, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-400">{index+1}</td>
                            <td className="px-4 py-2">
                                <input 
                                  type="text" 
                                  value={player.name} 
                                  onChange={(e) => handleRosterChange(index, 'name', e.target.value)} 
                                  className="w-full px-2 py-1 bg-white text-black border border-gray-200 rounded focus:border-indigo-500 outline-none" 
                                />
                            </td>
                            <td className="px-4 py-2">
                                <input 
                                  type="text" 
                                  value={player.number} 
                                  onChange={(e) => handleRosterChange(index, 'number', e.target.value)} 
                                  className="w-full text-center px-1 py-1 bg-white text-black border border-gray-200 rounded focus:border-indigo-500 outline-none" 
                                />
                            </td>
                            <td className="px-4 py-2">
                                <select 
                                  value={player.size} 
                                  onChange={(e) => handleRosterChange(index, 'size', e.target.value)} 
                                  className="w-full bg-white text-black border border-gray-200 rounded px-1 py-1 focus:border-indigo-500 outline-none"
                                >
                                    {ALL_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </td>
                            <td className="px-4 py-2">
                                <select 
                                  value={player.type} 
                                  onChange={(e) => handleRosterChange(index, 'type', e.target.value)} 
                                  className="w-full text-xs font-bold text-black bg-white border border-gray-200 px-2 py-1 rounded focus:border-indigo-500 outline-none"
                                >
                                    <option value="conjunto">Conjunto</option>
                                    <option value="camisa">Só Camisa</option>
                                    <option value="calcao">Só Calção</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody></table>
            </div>
        </div>
        <div className="bg-gray-900 text-white rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="text-3xl font-bold text-green-400">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div className="bg-amber-50 p-4 rounded-xl flex items-start gap-3 text-amber-900 text-sm">
                <input type="checkbox" checked={hasReviewed} onChange={(e) => setHasReviewed(e.target.checked)} className="w-5 h-5 mt-0.5" id="rev" />
                <label htmlFor="rev" className="cursor-pointer">Revisei todos os dados e assumo a responsabilidade por nomes/números/tamanhos.</label>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={handleDownload} 
                disabled={!hasReviewed || !config.customerInfo.customerName} 
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${hasReviewed && config.customerInfo.customerName ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-95' : 'bg-gray-600 opacity-50 cursor-not-allowed'}`}
              >
                <Download size={20} /> Baixar Orçamento PDF
              </button>

              <button 
                onClick={handleWhatsAppContact} 
                disabled={!hasReviewed || !config.customerInfo.customerName} 
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${hasReviewed && config.customerInfo.customerName ? 'bg-green-600 hover:bg-green-700 active:scale-95' : 'bg-gray-600 opacity-50 cursor-not-allowed'}`}
              >
                <MessageCircle size={20} /> Enviar Orçamento no WhatsApp
              </button>
            </div>
        </div>
        <div className="flex justify-between pt-4"><button onClick={() => setStep(3)} className="text-gray-500 font-medium flex items-center gap-2"><ArrowLeft size={20} /> Voltar</button><button onClick={saveProgress} className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${saveStatus==='saved'?'bg-green-500 text-white':'bg-gray-100'}`}><Save size={16} /> {saveStatus==='saving'?'Salvando...':saveStatus==='saved'?'Salvo!':'Salvar Rascunho'}</button></div>
    </div>
  );

  if (isLoading) return (<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-indigo-100 relative">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50"><div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between"><BrandLogo /></div></header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-center mb-12"><div className="flex items-center gap-4">{[1, 2, 3, 4].map((s) => (<div key={s} className="flex items-center"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</div>{s < 4 && <div className={`w-12 h-1 mx-2 rounded-full ${step > s ? 'bg-gray-900' : 'bg-gray-200'}`}></div>}</div>))}</div></div>
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-10 min-h-[600px] relative">{step === 1 && renderStep1()}{step === 2 && renderStep2()}{step === 3 && renderStep3()}{step === 4 && renderStep4()}</div>
      </main>
      {step === 4 && (<button onClick={() => setShowSizeChart(true)} className="fixed bottom-6 right-6 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-lg border-4 border-indigo-100"><Ruler size={24} /></button>)}
      {showSizeChart && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowSizeChart(false)}>
            <div className="bg-white p-2 rounded-xl max-w-5xl w-full relative shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Ruler className="text-indigo-600"/> TABELA DE MEDIDAS</h3>
                    <button onClick={() => setShowSizeChart(false)}><X size={24} /></button>
                </div>
                <div className="overflow-y-auto p-6 bg-gray-50">
                    <div className="flex justify-center gap-4 mb-8">
                        <button onClick={() => setActiveSizeTab('standard')} className={`px-6 py-3 rounded-lg font-bold text-sm ${activeSizeTab === 'standard' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 border'}`}>PADRÃO</button>
                        <button onClick={() => setActiveSizeTab('diamond')} className={`px-6 py-3 rounded-lg font-bold text-sm ${activeSizeTab === 'diamond' ? 'bg-indigo-900 text-white' : 'bg-white text-gray-500 border'}`}>DIAMANTE (SLIM)</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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