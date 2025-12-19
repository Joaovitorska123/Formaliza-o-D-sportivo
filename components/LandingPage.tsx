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
  Box
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  Firestore 
} from 'firebase/firestore';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Global Declarations ---
declare const __app_id: string;
declare const __firebase_config: string;

const WHATSAPP_NUMBER = "5516991679072"; 
const WHATSAPP_MESSAGE = "Olá! Acabei de gerar meu orçamento no simulador D'sportivo uniformes e estou entrando em contato para enviar o PDF e finalizar meu pedido.";

const PRICES = {
  prata: { camisa: 42.90, calcao: 32.00, conjunto: 74.90, meiao: 20.00 },
  ouro: { camisa: 44.90, calcao: 35.00, conjunto: 79.90, meiao: 25.00 },
  diamante: { camisa: 74.90, calcao: 49.90, conjunto: 124.80, meiao: 30.00 },
  empresarial: { camisa: 49.90, calcao: 35.00, conjunto: 84.90, meiao: 20.00 },
};

const EMBROIDERY_PRICE_PRATA = 5.00;

const PRICES_DIVERSOS: Record<string, number> = {
  colete: 25.00,
  basquete: 55.00,
  jaqueta: 98.00,
  calca: 75.00,
  regata: 39.90
};

const DIVERSOS_LABELS: Record<string, string> = {
  colete: 'Colete',
  basquete: 'Regata Basquete',
  jaqueta: 'Jaqueta',
  calca: 'Calça',
  regata: 'Regata'
};

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
        { t: 'M', h: '61cm', w: '50cm' },
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
    priceDesc: '', // Removida escrita suspensa
    desc: 'Excelente custo-benefício. Ideal para quem busca economia.', 
    fullDesc: 'A Linha Prata (Monaco) é focada em times amadores e interclasses. Bordado é opcional com acréscimo de R$ 5,00 nas camisas.',
    features: ['Tecido Dry Leve', 'Modelagem Padrão', 'Bordado Opcional (+R$ 5)', 'Proteção UV Básica'],
    color: 'bg-gray-400',
    textColor: 'text-gray-600',
    icon: Trophy
  },
  ouro: { 
    name: 'Ouro', 
    priceDesc: '', // Removida escrita suspensa
    desc: 'Tecido premium com acabamento superior.', 
    fullDesc: 'A Linha Ouro (Bélgica) oferece tecido Dry Tech de maior gramatura with bordado já incluso na camisa.',
    features: ['Tecido Premium', 'Costura Dupla', 'Bordado Incluso', 'Alta Durabilidade'],
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    icon: Trophy
  },
  diamante: { 
    name: 'Diamante', 
    priceDesc: '', // Removida escrita suspensa
    desc: 'Modelagem profissional e exclusiva.', 
    fullDesc: 'A Linha Diamante (Vanilha/Polo) é o topo de linha para atletas exigentes. Inclui bordado de alta definição.',
    features: ['Slim Fit Profissional', 'Tecido Aero', 'Bordado Incluso', 'Golas Especiais'],
    color: 'bg-cyan-500',
    textColor: 'text-cyan-600',
    icon: Gem
  },
  empresarial: { 
    name: 'Empresarial / Eventos', 
    priceDesc: '', // Removida escrita suspensa
    desc: 'Solução ideal para uniformização de equipes e eventos.', 
    fullDesc: 'Desenvolvida para empresas e eventos corporativos. Linha focada em praticidade, não trabalha com bordado.',
    features: ['Unissex Versátil', 'Tecido Antipilling', 'Fácil Lavagem', 'Sem Bordado'],
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
  staff: 'Staff / Eventos'
};

const SOCK_COLORS = ['Preto', 'Branco', 'Azul Marinho', 'Azul Royal', 'Verde Bandeira', 'Vermelho', 'Amarelo Ouro'];
const SIZES_INFANTIL = ['2', '4', '6', '8', '10', '12', '14', '16'];
const SIZES_ADULTO = ['P', 'M', 'G', 'GG', 'XG', 'ESP', 'G3'];
const SIZES_FEMININO = ['P BL', 'M BL', 'G BL', 'GG BL', 'XG BL', 'ESP BL'];
const ALL_SIZES = [...SIZES_INFANTIL, ...SIZES_ADULTO, ...SIZES_FEMININO];

type LineType = 'prata' | 'ouro' | 'diamante' | 'empresarial';
type ProductType = 'conjunto' | 'camisa' | 'calcao';

interface SockItem { id: number; color: string; quantity: number; }
interface DiversosItem { id: number; type: string; quantity: number; }
interface RosterItem { 
  name: string; 
  number: string; 
  size: string; 
  type: ProductType; 
  kitType: string;
  productName?: string; 
}

interface CategoryQuantities {
  conjunto: number;
  camisa: number;
  calcao: number;
}

interface Config { 
  line: LineType; 
  kitLines: Record<string, LineType>; 
  kitQuantities: Record<string, CategoryQuantities>; 
  kitEmbroidery: Record<string, boolean>; 
  socks: SockItem[]; 
  diversosItems: DiversosItem[];
  nextSockId: number; 
  nextDiversosId: number;
  customerInfo: { customerName: string; customerPhone: string; };
}

const INITIAL_CONFIG: Config = {
    line: 'prata',
    kitLines: { linha: 'prata', goleiro: 'prata', comissao: 'prata', atleta: 'prata', torcida: 'prata', staff: 'prata' },
    kitQuantities: { 
      linha: { conjunto: 10, camisa: 0, calcao: 0 },
      goleiro: { conjunto: 0, camisa: 0, calcao: 0 },
      comissao: { conjunto: 0, camisa: 0, calcao: 0 },
      atleta: { conjunto: 0, camisa: 0, calcao: 0 },
      torcida: { conjunto: 0, camisa: 0, calcao: 0 },
      staff: { conjunto: 0, camisa: 0, calcao: 0 }
    },
    kitEmbroidery: { linha: false, goleiro: false, comissao: false, atleta: false, torcida: false, staff: false },
    socks: [],
    diversosItems: [],
    nextSockId: 1,
    nextDiversosId: 1,
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

  const [designFiles, setDesignFiles] = useState<Record<string, string | null>>({
    linha: null, goleiro: null, comissao: null, atleta: null, torcida: null, staff: null
  });

  useEffect(() => {
    const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? String(__firebase_config as any) : '{}');
    if (Object.keys(firebaseConfig).length === 0) { setIsLoading(false); return; }
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
    } catch (e) { setIsLoading(false); }
  }, []);

  const loadProgress = async (dbInstance: Firestore, uid: string) => {
    const appId = typeof __app_id !== 'undefined' ? String(__app_id as any) : 'default-app-id';
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

  const totalKits = useMemo(() => {
    return (Object.values(config.kitQuantities) as CategoryQuantities[]).reduce((sum, q) => sum + q.conjunto + q.camisa + q.calcao, 0);
  }, [config.kitQuantities]);

  const totalSocks = useMemo(() => config.socks.reduce((sum, sock) => sum + sock.quantity, 0), [config.socks]);
  const minOrderMet = totalKits >= 10;
  
  const calculateTotal = () => {
    const rosterTotal = roster.reduce((acc, item) => {
      if (item.kitType.startsWith('diversos_')) {
        const divItem = config.diversosItems.find(di => `diversos_${di.id}` === item.kitType);
        return acc + (PRICES_DIVERSOS[divItem?.type || ''] || 0);
      }
      
      const categoryLine = config.kitLines[item.kitType] || config.line; 
      const productType = item.type;
      const hasEmbroidery = config.kitEmbroidery[item.kitType];
      
      const basePrice = PRICES[categoryLine][productType];
      
      const isPrata = categoryLine === 'prata';
      const isUpper = (productType === 'camisa' || productType === 'conjunto');
      const embroideryExtra = (isPrata && hasEmbroidery && isUpper) ? EMBROIDERY_PRICE_PRATA : 0;
      
      return acc + basePrice + embroideryExtra;
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

  const addDiversosEntry = () => {
    setConfig(prev => ({
      ...prev,
      diversosItems: [...prev.diversosItems, { id: prev.nextDiversosId, type: 'colete', quantity: 1 }],
      nextDiversosId: prev.nextDiversosId + 1,
    }));
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

  const updateDiversosEntry = (id: number, field: 'type' | 'quantity', value: string | number) => {
    setConfig(prev => ({
      ...prev,
      diversosItems: prev.diversosItems.map(item => 
        item.id === id 
          ? { ...item, [field]: field === 'quantity' ? Math.max(0, parseInt(String(value)) || 0) : value as string } 
          : item
      ),
    }));
  };

  const removeSockEntry = (id: number) => {
    setConfig(prev => ({
      ...prev,
      socks: prev.socks.filter(sock => sock.id !== id),
    }));
  };

  const removeDiversosEntry = (id: number) => {
    setConfig(prev => ({
      ...prev,
      diversosItems: prev.diversosItems.filter(item => item.id !== id),
    }));
  };

  useEffect(() => {
    setRoster(prev => {
      const newRoster: RosterItem[] = [];
      (Object.keys(KIT_TYPES) as Array<string>).forEach(key => {
        const q = config.kitQuantities[key];
        (['conjunto', 'camisa', 'calcao'] as ProductType[]).forEach(pType => {
          const count = q[pType];
          const existingOfThisType = prev.filter(item => item.kitType === key && item.type === pType);
          for (let i = 0; i < count; i++) {
            newRoster.push(existingOfThisType[i] || { 
              name: '', 
              number: key === 'comissao' ? 'TÉC' : '', 
              size: 'G', 
              type: pType, 
              kitType: key 
            });
          }
        });
      });

      config.diversosItems.forEach(item => {
        const key = `diversos_${item.id}`;
        const existing = prev.filter(p => p.kitType === key);
        for (let i = 0; i < item.quantity; i++) {
          newRoster.push(existing[i] || {
            name: '',
            number: '',
            size: 'G',
            type: 'camisa',
            kitType: key,
            productName: DIVERSOS_LABELS[item.type]
          });
        }
      });
      return newRoster;
    });
  }, [config.kitQuantities, config.diversosItems]);

  const handleRosterChange = (index: number, field: string, value: string) => {
    const newRoster = [...roster];
    newRoster[index] = { ...newRoster[index], [field]: value };
    setRoster(newRoster);
  };

  const updateKitLine = (kitType: string, lineKey: LineType) => {
    const isIncluded = ['ouro', 'diamante'].includes(lineKey);
    const shouldDisable = lineKey === 'empresarial';
    
    setConfig(prev => ({ 
      ...prev, 
      kitLines: { ...prev.kitLines, [kitType]: lineKey },
      kitEmbroidery: { 
        ...prev.kitEmbroidery, 
        [kitType]: shouldDisable ? false : (isIncluded ? true : prev.kitEmbroidery[kitType]) 
      }
    }));
  };

  const updateCategoryQuantity = (kitType: string, type: ProductType, value: number) => {
    setConfig(prev => ({
      ...prev,
      kitQuantities: {
        ...prev.kitQuantities,
        [kitType]: {
          ...prev.kitQuantities[kitType],
          [type]: Math.max(0, value)
        }
      }
    }));
  };

  const toggleEmbroidery = (kitType: string) => {
    const currentLine = config.kitLines[kitType];
    if (currentLine !== 'prata') return; 
    setConfig(prev => ({
      ...prev,
      kitEmbroidery: { ...prev.kitEmbroidery, [kitType]: !prev.kitEmbroidery[kitType] }
    }));
  };

  const handleDesignUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
          setDesignFiles(prev => ({ ...prev, [key]: String(reader.result) }));
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
    
    const tableBody: any[] = [];
    (Object.entries(config.kitQuantities) as [string, CategoryQuantities][]).forEach(([k, q]) => {
      const quantities = q;
      (['conjunto', 'camisa', 'calcao'] as ProductType[]).forEach(type => {
        if (quantities[type] > 0) {
          tableBody.push([
            KIT_TYPES[k],
            `${LINE_DETAILS[config.kitLines[k]].name} (${type})`,
            `${quantities[type]} un`,
            config.kitEmbroidery[k] && type !== 'calcao' ? 'Com Bordado' : 'Sem Bordado'
          ]);
        }
      });
    });

    config.diversosItems.forEach(item => {
      tableBody.push(["Adicional", DIVERSOS_LABELS[item.type], `${item.quantity} un`, ""]);
    });

    autoTable(doc, {
        startY: 35,
        head: [['Categoria', 'Linha / Produto', 'Quantidade', 'Obs']],
        body: tableBody
    });
    doc.save(`Orcamento_Dsportivo.pdf`);
  };

  const handleWhatsAppContact = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    window.open(url, '_blank');
  };

  const CategoryControl: React.FC<{ kitType: string }> = ({ kitType }) => {
      const currentLine = config.kitLines[kitType];
      const qs = config.kitQuantities[kitType];
      const hasEmbroidery = config.kitEmbroidery[kitType];
      
      const isAllowedCategory = ['linha', 'goleiro', 'comissao', 'atleta', 'torcida'].includes(kitType);
      const isEmbroideryIncluded = ['ouro', 'diamante'].includes(currentLine);
      const isBusinessLine = currentLine === 'empresarial';

      const showEmbroideryUI = isAllowedCategory && !isBusinessLine && (qs.conjunto > 0 || qs.camisa > 0);

      const renderQtyRow = (type: ProductType, label: string) => {
        const unitPrice = PRICES[currentLine][type];
        const isUpper = type === 'conjunto' || type === 'camisa';
        const finalPrice = unitPrice + (isUpper && currentLine === 'prata' && hasEmbroidery ? EMBROIDERY_PRICE_PRATA : 0);

        return (
          <div className="flex items-center justify-between bg-gray-50/50 p-2 rounded-xl border border-gray-100 mb-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-gray-400 leading-none mb-1">{label}</span>
              <span className="text-xs font-bold text-indigo-600">R$ {finalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={() => updateCategoryQuantity(kitType, type, qs[type] - 1)} className="w-8 h-8 rounded-lg bg-white text-gray-500 font-black border border-gray-200 shadow-sm hover:text-indigo-600 active:scale-90 transition-all">-</button>
                <input type="number" value={qs[type]} onChange={(e) => updateCategoryQuantity(kitType, type, parseInt(e.target.value) || 0)} className="w-8 text-center text-sm font-black bg-transparent focus:outline-none text-indigo-900" />
                <button onClick={() => updateCategoryQuantity(kitType, type, qs[type] + 1)} className="w-8 h-8 rounded-lg bg-white text-gray-500 font-black border border-gray-200 shadow-sm hover:text-indigo-600 active:scale-90 transition-all">+</button>
            </div>
          </div>
        );
      };

      return (
        <div className="bg-white rounded-[2rem] p-5 border border-indigo-50 shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-all">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${LINE_DETAILS[currentLine].color}`}></div>
            <div className="flex justify-between items-start pl-3">
                <div className="flex flex-col">
                  <label className="block text-xl font-black text-gray-900 leading-tight tracking-tighter uppercase italic">{KIT_TYPES[kitType]}</label>
                  <select 
                    value={currentLine} 
                    onChange={(e) => updateKitLine(kitType, e.target.value as LineType)} 
                    className="mt-1 bg-transparent border-none p-0 text-[10px] font-black uppercase text-indigo-600 cursor-pointer focus:ring-0 outline-none"
                  >
                      {Object.keys(LINE_DETAILS).map((key) => (<option key={key} value={key}>Linha {LINE_DETAILS[key as LineType].name}</option>))}
                  </select>
                </div>
                <div className="text-right flex flex-col items-end">
                   <Box size={24} className="text-gray-100 group-hover:text-indigo-100 transition-colors" />
                </div>
            </div>
            <div className="pl-3 space-y-1">
                {renderQtyRow('conjunto', 'Kit Completo')}
                {renderQtyRow('camisa', 'Só Camisa')}
                {renderQtyRow('calcao', 'Só Calção')}
                {showEmbroideryUI && (
                  <div className={`mt-2 flex items-center gap-3 p-3 rounded-2xl border transition-all ${isEmbroideryIncluded || hasEmbroidery ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}>
                    <input 
                      type="checkbox" 
                      id={`embroidery-${kitType}`}
                      disabled={isEmbroideryIncluded}
                      checked={isEmbroideryIncluded || hasEmbroidery}
                      onChange={() => toggleEmbroidery(kitType)}
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                    />
                    <label htmlFor={`embroidery-${kitType}`} className="flex-1 cursor-pointer">
                      <span className="block text-[10px] font-black text-indigo-900 uppercase">Adicionar Bordado (Opcional)</span>
                      <span className="block text-[9px] text-gray-500 font-medium">
                        {isEmbroideryIncluded ? 'Escudo já incluso no valor' : 'Acrescenta R$ 5,00 por Camisa/Kit'}
                      </span>
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
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Qualidade <span className="text-indigo-600">D'sportivo</span></h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">Escolha a linha base para começar sua simulação profissional.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
        {(Object.keys(LINE_DETAILS) as Array<keyof typeof LINE_DETAILS>).map((key) => (
          <div key={key} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all p-6 flex flex-col group">
              <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-full ${LINE_DETAILS[key].color} text-white flex items-center justify-center shadow-md group-hover:rotate-6 transition-transform`}><Trophy size={24} /></div>
                  <div><h3 className="text-xl font-bold text-gray-900">Linha {LINE_DETAILS[key].name}</h3></div>
              </div>
              <p className="text-gray-600 text-sm mb-6 flex-1">{LINE_DETAILS[key].desc}</p>
              <button onClick={() => setModalOpen(key)} className="w-full py-3 rounded-xl bg-gray-50 text-gray-700 font-bold border border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center justify-center gap-2"><Info size={18} /> Ver Detalhes</button>
          </div>
        ))}
      </div>
      <div className="flex justify-center pt-8 pb-4">
        <button onClick={() => setStep(2)} className="px-10 py-5 rounded-2xl font-black text-lg flex items-center gap-3 bg-gray-900 text-white hover:bg-indigo-600 shadow-xl transition-transform active:scale-95 uppercase">INICIAR SIMULAÇÃO <ArrowRight size={24} /></button>
      </div>
      {modalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(null)}>
              <div className="bg-white max-w-lg w-full rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-start mb-6">
                      <h3 className="text-3xl font-bold">Linha {LINE_DETAILS[modalOpen].name}</h3>
                      <button onClick={() => setModalOpen(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">{LINE_DETAILS[modalOpen].fullDesc}</p>
                  <ul className="space-y-3 mb-8">
                      {LINE_DETAILS[modalOpen].features.map((f, i) => (<li key={i} className="flex items-center gap-2 font-medium text-gray-700"><Check size={18} className="text-green-500" /> {f}</li>))}
                  </ul>
                  <button onClick={() => { setConfig(prev => ({ ...prev, line: modalOpen! })); setStep(2); setModalOpen(null); }} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-colors">Escolher Linha {LINE_DETAILS[modalOpen].name}</button>
              </div>
          </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">O Que Seu Time Precisa?</h2>
        <p className="text-sm text-gray-500 font-medium">Defina os produtos e quantidades para cada grupo.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.keys(KIT_TYPES).map(key => <CategoryControl key={key} kitType={key} />)}
      </div>
      <div className="bg-white rounded-[2.5rem] p-8 border border-orange-100 bg-orange-50/10 space-y-6 shadow-sm relative">
          <div className="absolute top-0 right-0 p-6 opacity-10"><Layers size={80} className="text-orange-600" /></div>
          <h3 className="text-xl font-black text-orange-800 flex items-center gap-3 uppercase tracking-widest">
            <Layers size={24} className="text-orange-600" /> Adicionais / Diversos
          </h3>
          <div className="space-y-4">
            {config.diversosItems.map(item => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white p-5 rounded-3xl border border-orange-100 shadow-sm relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-400"></div>
                <div className="flex-1">
                  <select value={item.type} onChange={(e) => updateDiversosEntry(item.id, 'type', e.target.value)} className="w-full h-12 rounded-2xl bg-gray-50 border border-gray-100 text-gray-700 px-5 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500">
                    {Object.entries(DIVERSOS_LABELS).map(([val, label]) => (<option key={val} value={val}>{label}</option>))}
                  </select>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-8">
                  <div className="text-right">
                    <span className="text-xl font-black text-gray-800 block leading-none">R$ {PRICES_DIVERSOS[item.type].toFixed(2)}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Unitário</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => updateDiversosEntry(item.id, 'quantity', item.quantity - 1)} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 font-black border border-gray-100 transition-all active:scale-90">-</button>
                    <input type="number" value={item.quantity} onChange={(e) => updateDiversosEntry(item.id, 'quantity', parseInt(e.target.value) || 0)} className="w-10 text-center text-lg font-black bg-transparent focus:outline-none text-orange-900" />
                    <button onClick={() => updateDiversosEntry(item.id, 'quantity', item.quantity + 1)} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 font-black border border-gray-100 transition-all active:scale-90">+</button>
                  </div>
                  <button onClick={() => removeDiversosEntry(item.id)} className="p-3 rounded-2xl text-red-300 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={20} /></button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={addDiversosEntry} className="w-full sm:w-auto text-orange-700 flex items-center justify-center gap-2 font-black text-[11px] bg-orange-100 px-8 py-4 rounded-2xl border border-orange-200 uppercase tracking-widest active:scale-95 shadow-sm">
            <Plus size={18}/> Adicionar Outro Item
          </button>
      </div>
      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-200 space-y-6 shadow-sm">
          <h3 className="text-xl font-black text-gray-700 flex items-center gap-3 uppercase tracking-widest">
            <Footprints size={24} className="text-indigo-600" /> Meiões Profissionais
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
            <button onClick={addSockEntry} className="text-indigo-600 flex items-center gap-2 font-black text-[11px] bg-indigo-50 px-8 py-4 rounded-2xl border border-indigo-100 uppercase tracking-widest active:scale-95"><Plus size={16}/> Adicionar Cor</button>
          )}
      </div>
      <div className={`p-6 rounded-[2rem] text-center border-2 border-dashed transition-all font-black uppercase tracking-tighter text-lg ${minOrderMet ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
        Total de Peças: {totalKits} {minOrderMet ? <Check size={20} className="inline ml-2" /> : <span className="block text-xs mt-1">(Mínimo 10 un. Faltam {10-totalKits})</span>}
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
      <div className="text-center"><h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">Referências Visuais</h2><p className="text-sm text-gray-500 font-medium">Anexe artes ou prints do design desejado.</p></div>
      <div className="bg-indigo-100 p-6 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6"><p className="text-indigo-900 font-bold text-center md:text-left">Use nosso simulador 3D para criar seu design antes de anexar:</p><a href="https://www.dsportivo.com.br/simulador/" target="_blank" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-lg active:scale-95 uppercase text-[10px] tracking-widest">Acessar Simulador <ExternalLink size={16} /></a></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {(Object.keys(KIT_TYPES) as Array<string>).map((key) => {
          const q = config.kitQuantities[key];
          if (q.conjunto === 0 && q.camisa === 0 && q.calcao === 0) return null;
          const file = designFiles[key];
          return (
            <div key={key} className="border-2 border-dashed border-gray-200 rounded-[3rem] p-10 flex flex-col items-center group relative hover:border-indigo-400 transition-all bg-white shadow-sm hover:shadow-md">
              <input type="file" accept="image/*" onChange={(e) => handleDesignUpload(key, e)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
              <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter mb-4">{KIT_TYPES[key]}</h3>
              {file ? (
                <div className="w-full h-60 bg-gray-50 rounded-[2rem] overflow-hidden relative z-10 p-4 border border-gray-100"><img src={file} className="w-full h-full object-contain" alt="Preview" /></div>
              ) : (
                <div className="flex flex-col items-center py-16 text-gray-400 group-hover:text-indigo-500 transition-colors"><Upload size={48} className="mb-4" /> <span className="text-[10px] font-black uppercase tracking-[0.2em]">Clique para Anexar Arte</span></div>
              )}
            </div>
          );
        })}
        {config.diversosItems.map(item => {
          const key = `diversos_${item.id}`;
          const file = designFiles[key];
          return (
            <div key={key} className="border-2 border-dashed border-orange-200 bg-orange-50/5 rounded-[3rem] p-10 flex flex-col items-center group relative hover:border-orange-400 transition-all">
              <input type="file" accept="image/*" onChange={(e) => handleDesignUpload(key, e)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
              <h3 className="text-xl font-black text-gray-900 uppercase italic mb-4">{DIVERSOS_LABELS[item.type]}</h3>
              {file ? (
                <div className="w-full h-60 bg-white rounded-[2rem] overflow-hidden relative z-10 p-4 border border-orange-100"><img src={file} className="w-full h-full object-contain" alt="Preview" /></div>
              ) : (
                <div className="flex flex-col items-center py-16 text-gray-400 group-hover:text-orange-400 transition-colors"><Upload size={48} className="mb-4" /> <span className="text-[10px] font-black uppercase tracking-[0.2em]">Anexar Modelo</span></div>
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
                <input type="text" placeholder="Responsável pelo Time" value={config.customerInfo.customerName} onChange={(e) => setConfig(prev => ({ ...prev, customerInfo: { ...prev.customerInfo, customerName: e.target.value } }))} className="w-full px-6 py-5 border-2 border-gray-100 rounded-3xl bg-gray-50 text-gray-900 font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" />
                <input type="tel" placeholder="WhatsApp" value={config.customerInfo.customerPhone} onChange={(e) => setConfig(prev => ({ ...prev, customerInfo: { ...prev.customerInfo, customerPhone: e.target.value } }))} className="w-full px-6 py-5 border-2 border-gray-100 rounded-3xl bg-gray-50 text-gray-900 font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" />
            </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
                    <tr><th className="px-8 py-6">#</th><th className="px-8 py-6">Grade do Time</th><th className="px-8 py-6">Nº</th><th className="px-8 py-6">Tamanho</th><th className="px-8 py-6">Peça</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                      {roster.map((player, index) => (
                          <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-8 py-4 text-gray-200 font-black italic">{index+1}</td>
                              <td className="px-8 py-2"><input type="text" value={player.name} onChange={(e) => handleRosterChange(index, 'name', e.target.value)} className="w-full px-5 py-3 bg-white text-gray-900 border-2 border-gray-100 rounded-2xl font-bold focus:border-indigo-500 outline-none shadow-sm" placeholder="Nome na peça..." /></td>
                              <td className="px-8 py-2"><input type="text" value={player.number} onChange={(e) => handleRosterChange(index, 'number', e.target.value)} className="w-full text-center px-1 py-3 bg-white text-gray-900 border-2 border-gray-100 rounded-2xl font-bold focus:border-indigo-500 outline-none shadow-sm" placeholder="--" /></td>
                              <td className="px-8 py-2">
                                  <select value={player.size} onChange={(e) => handleRosterChange(index, 'size', e.target.value)} className="w-full bg-white text-gray-900 border-2 border-gray-100 rounded-2xl px-4 py-3 font-bold focus:border-indigo-500 outline-none cursor-pointer">
                                      {ALL_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                              </td>
                              <td className="px-8 py-2">
                                  <div className="flex flex-col">
                                    <span className={`text-[9px] font-black px-4 py-2 rounded-full inline-block uppercase tracking-widest ${player.kitType.startsWith('diversos_') ? 'bg-orange-100 text-orange-900' : 'bg-indigo-100 text-indigo-900'}`}>
                                        {player.productName || KIT_TYPES[player.kitType]}
                                    </span>
                                    {!player.kitType.startsWith('diversos_') && (
                                      <span className="text-[8px] text-gray-400 font-black uppercase mt-1 ml-2">{player.type}</span>
                                    )}
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
                </table>
            </div>
        </div>

        <div className="bg-gray-900 text-white rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden border-t-8 border-indigo-600">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-gray-500 font-black text-[10px] uppercase tracking-[0.3em] mb-2 block">Total do Orçamento</span>
                <div className="text-6xl font-black text-green-400 tracking-tighter italic">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex items-start gap-4 transition-all hover:bg-white/10 group">
                <input type="checkbox" checked={hasReviewed} onChange={(e) => setHasReviewed(e.target.checked)} className="w-8 h-8 mt-0.5 cursor-pointer accent-green-500 border-white/20" id="rev" />
                <label htmlFor="rev" className="cursor-pointer text-gray-400 text-sm font-bold leading-snug group-hover:text-gray-200">Revisei as quantidades, tamanhos e designs. Estou pronto para enviar o pedido.</label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button onClick={handleDownload} disabled={!hasReviewed || !config.customerInfo.customerName} className={`py-6 rounded-3xl font-black flex items-center justify-center gap-4 transition-all active:scale-95 uppercase text-xs tracking-[0.2em] ${hasReviewed && config.customerInfo.customerName ? 'bg-white text-gray-900 hover:bg-gray-100 shadow-xl' : 'bg-gray-800 text-gray-600 opacity-50 cursor-not-allowed'}`}>
                <Download size={24} /> Baixar PDF
              </button>
              <button onClick={handleWhatsAppContact} disabled={!hasReviewed || !config.customerInfo.customerName} className={`py-6 rounded-3xl font-black flex items-center justify-center gap-4 transition-all active:scale-95 uppercase text-xs tracking-[0.2em] ${hasReviewed && config.customerInfo.customerName ? 'bg-green-600 text-white hover:bg-green-500 shadow-xl' : 'bg-gray-800 text-gray-600 opacity-50 cursor-not-allowed'}`}>
                <MessageCircle size={24} /> Finalizar WhatsApp
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
                        <button onClick={() => setActiveSizeTab('diamond')} className={`px-8 py-4 rounded-2xl font-black text-xs tracking-widest shadow-sm transition-all uppercase ${activeSizeTab === 'diamond' ? 'bg-indigo-900 text-white scale-105' : 'bg-white text-gray-500 border hover:bg-gray-50'}`}>Modelagem Slim (Diamante)</button>
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
