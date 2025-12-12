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
  Info
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
  Firestore 
} from 'firebase/firestore';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Global Declarations for External Variables ---
declare const __app_id: string;
declare const __firebase_config: string;
declare const __initial_auth_token: string;

// --- Constantes de Preços ---
const PRICES = {
  prata: { camisa: 42.90, calcao: 32.00, conjunto: 74.90, meiao: 20.00 },
  ouro: { camisa: 49.90, calcao: 35.00, conjunto: 84.90, meiao: 25.00 },
  diamante: { camisa: 69.90, calcao: 38.00, conjunto: 107.90, meiao: 30.00 },
  empresarial: { camisa: 49.90, calcao: 35.00, conjunto: 84.90, meiao: 20.00 },
};

// --- Dados da Tabela de Medidas (Agrupados por Linha) ---
const SIZE_TABLES = {
  // Dados baseados na imagem "LINHA BRONZE" (Camisa Preta)
  // Prata / Ouro / Empresarial
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
        { t: 'G', w: '46,5cm', h: '66cm' },
        { t: 'M', w: '46cm', h: '62,5cm' },
        { t: 'P', w: '46cm', h: '60cm' },
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
  // Dados baseados na imagem "ECTION DRY" (Camisa Azul)
  // Diamante (Slim)
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

// --- Detalhes Ricos das Linhas (Atualizado com Modelos e Features) ---
const LINE_DETAILS = {
  prata: { 
    name: 'Prata', 
    priceDesc: 'Camisa R$ 42,90 | Calção R$ 32,00',
    desc: 'Uma camisa com excelente custo-benefício. Ideal para quem busca economia sem abrir mão da qualidade.', 
    fullDesc: 'A Linha Prata (Monaco) é a porta de entrada para a qualidade D\'Sportivo. Focada em times amadores, interclasses e treinos, ela oferece um tecido leve com secagem rápida.',
    features: [
      'Tecido Dry Esportivo Leve',
      'Modelagem Padrão Confortável',
      'Proteção UV Básica',
      'Ideal para uso frequente e treinos',
      'Personalização Total (Sublimação)'
    ],
    color: 'bg-gray-400',
    textColor: 'text-gray-600',
    icon: Trophy,
    models: [1, 2, 3, 4] // Placeholders para 4 modelos
  },
  ouro: { 
    name: 'Ouro', 
    priceDesc: 'Camisa R$ 49,90 | Calção R$ 35,00',
    desc: 'Excelente custo-benefício, porém com tecido melhor e acabamento superior.', 
    fullDesc: 'A Linha Ouro (Bélgica) eleva o nível do seu jogo. Com um tecido de gramatura superior e tramas mais fechadas, oferece maior resistência a puxões e durabilidade, mantendo o conforto térmico.',
    features: [
      'Tecido Dry Tech Premium (Maior Gramatura)',
      'Costura Reforçada Dupla',
      'Acabamento de Gola Diferenciado',
      'Alta Durabilidade de Cores',
      'Toque mais macio'
    ],
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    icon: Trophy,
    models: [1, 2, 3, 4]
  },
  diamante: { 
    name: 'Diamante', 
    priceDesc: 'Camisa R$ 69,90 | Calção R$ 38,00',
    desc: 'Muda totalmente a modelagem, deixando o visual muito profissional e exclusivo.', 
    fullDesc: 'A Linha Diamante (Vanilha/Polo) é o topo de linha para atletas exigentes. Modelagem Slim Fit profissional, tecidos tecnológicos com elastano e golas exclusivas que impõem respeito em campo.',
    features: [
      'Modelagem Profissional (Slim/Anatômica)',
      'Tecido com Elastano/Tecnologia Aero',
      'Golas Especiais (Polo, Padre, V Transpassado)',
      'Recortes Laterais Respiráveis',
      'Acabamento de Elite'
    ],
    color: 'bg-cyan-500',
    textColor: 'text-cyan-600',
    icon: Gem,
    models: [1, 2, 3, 4]
  },
  empresarial: { 
    name: 'Empresarial / Eventos', 
    priceDesc: 'Camisa R$ 49,90',
    desc: 'Linha desenvolvida especificamente para atender empresas, eventos e outros grupos.', 
    fullDesc: 'A solução perfeita para uniformização de equipes, eventos corporativos, atléticas universitárias e staffs. Foco na sobriedade, conforto para o dia a dia e representação fiel da identidade visual da marca.',
    features: [
      'Modelagem Unissex Versátil (Redonda ou Polo)',
      'Tecido Antipilling (Não dá bolinha)',
      'Fácil de Lavar e Passar',
      'Opção de Polo sem Recorte',
      'Ideal para grandes quantidades'
    ],
    color: 'bg-slate-800',
    textColor: 'text-slate-700',
    icon: Briefcase,
    models: [1, 2, 3, 4]
  },
};

// CATEGORIAS DE KITS SOLICITADAS
const KIT_TYPES: Record<string, string> = {
  linha: 'Linha',
  goleiro: 'Goleiro',
  comissao: 'Comissão Técnica',
  atleta: 'Atleta', // Uniforme extra
  torcida: 'Torcida',
  staff: 'Staff / Eventos', // Nova Categoria Adicionada
};

const SOCK_COLORS = [
  'Preto', 'Branco', 'Azul Marinho', 'Azul Royal', 
  'Verde Bandeira', 'Vermelho', 'Amarelo Ouro'
];

// NOVOS TAMANHOS SOLICITADOS (AGRUPADOS)
const SIZES_INFANTIL = ['2', '4', '6', '8', '10', '12', '14', '16'];
const SIZES_ADULTO = ['P', 'M', 'G', 'GG', 'XG', 'ESP', 'G3'];
const SIZES_FEMININO = ['P BL', 'M BL', 'G BL', 'GG BL', 'XG BL', 'ESP BL'];
// Mantendo ALL_SIZES para compatibilidade
const ALL_SIZES = [...SIZES_INFANTIL, ...SIZES_ADULTO, ...SIZES_FEMININO];


interface SockItem {
  id: number;
  color: string;
  quantity: number;
}

interface RosterItem {
  name: string;
  number: string;
  size: string;
  type: 'conjunto' | 'camisa' | 'calcao';
  kitType: keyof typeof KIT_TYPES; 
}

interface CustomerInfo {
    customerName: string;
    customerPhone: string;
}

type LineType = 'prata' | 'ouro' | 'diamante' | 'empresarial';

interface Config {
  line: LineType; // Default line selected in step 1
  kitLines: Record<keyof typeof KIT_TYPES, LineType>; // Specific line per kit type
  kitQuantities: Record<keyof typeof KIT_TYPES, number>;
  socks: SockItem[];
  nextSockId: number;
  customerInfo: CustomerInfo;
}

// Valores iniciais
const INITIAL_CONFIG: Config = {
    line: 'prata',
    kitLines: {
        linha: 'prata',
        goleiro: 'prata',
        comissao: 'prata',
        atleta: 'prata',
        torcida: 'prata',
        staff: 'prata', // Default line for staff
    },
    kitQuantities: { linha: 10, atleta: 0, goleiro: 0, comissao: 0, torcida: 0, staff: 0 },
    socks: [],
    nextSockId: 1,
    customerInfo: { customerName: '', customerPhone: '' },
};

// SVG do Logo D'Sportivo (Antigo - Mantido por referência, mas não usado no header)
const DsPortivoLogo = () => (
    <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="text-indigo-600"
    >
        <g transform="translate(0, 0)">
            <path d="M 1 0 L 23 0 L 23 10 L 15 10 L 9 16 L 1 16 Z" 
                  fill="currentColor" 
                  className="text-gray-900" 
                  style={{ transform: 'translateY(-2px)' }}
            />
            <path d="M 1 8 L 9 8 L 15 14 L 23 14 L 23 24 L 1 24 Z" 
                  fill="currentColor" 
                  className="text-indigo-600" 
                  style={{ transform: 'translateY(2px)' }}
            />
            <path d="M 10 10 H 14 V 14 H 10 Z" 
                  fill="white" 
                  className="text-white" 
                  style={{ transform: 'translateY(0px)' }}
            />
        </g>
    </svg>
);

// Novo Componente de Logo da Marca (Apenas Texto)
const BrandLogo = () => (
  <div className="flex items-center select-none">
    {/* Logotipo Texto */}
    <div className="flex flex-col leading-none">
        <span className="text-3xl font-black italic tracking-tighter text-black" style={{ transform: 'skewX(-10deg)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            D'Sportivo
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black text-right mr-0.5" style={{ transform: 'skewX(-10deg)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Uniformes
        </span>
    </div>
  </div>
);

// Componente auxiliar para renderizar uma tabela de tamanhos (Agora Dinâmica)
const SizeTable = ({ title, headerColor, headers, keys, data }: { title: string, headerColor: string, headers: string[], keys: string[], data: any[] }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm h-fit">
      <div className={`${headerColor} text-white font-bold py-2 px-3 text-center uppercase text-sm`}>
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[200px]">
          <thead className="bg-gray-100 font-bold text-gray-700 text-xs">
            <tr>
              {headers.map((header, idx) => (
                <th key={idx} className="py-2 px-2 border-b border-gray-200 text-center whitespace-nowrap">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                {keys.map((key, kIdx) => (
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
  // --- Estados Firebase e Autenticação ---
  const [db, setDb] = useState<Firestore | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Estados do Aplicativo ---
  const [step, setStep] = useState(1);
  const [modalOpen, setModalOpen] = useState<'prata' | 'ouro' | 'diamante' | 'empresarial' | null>(null);
  const [config, setConfig] = useState<Config>(INITIAL_CONFIG);
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasReviewed, setHasReviewed] = useState(false); // Novo estado para controle do checkbox
  const [showSizeChart, setShowSizeChart] = useState(false); // Novo estado para modal de medidas
  const [activeSizeTab, setActiveSizeTab] = useState<'standard' | 'diamond'>('standard'); // Controle das abas de medida

  const [designFiles, setDesignFiles] = useState<Record<keyof typeof KIT_TYPES, string | null>>({
    linha: null, goleiro: null, comissao: null, atleta: null, torcida: null, staff: null,
  });

  // --- Firebase Init e Auth ---
  useEffect(() => {
    const appId = typeof __app_id !== 'undefined' ? String(__app_id as any) : 'default-app-id';
    const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? String(__firebase_config as any) : '{}');

    if (Object.keys(firebaseConfig).length === 0) {
      console.warn("Firebase config is missing. Running in offline mode (some features disabled).");
      setIsLoading(false);
      return;
    }

    try {
      const app = initializeApp(firebaseConfig);
      const newAuth = getAuth(app);
      const newDb = getFirestore(app);
      setAuth(newAuth);
      setDb(newDb);

      const unsubscribe = onAuthStateChanged(newAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
          loadProgress(newDb, String(user.uid), String(appId));
        } else {
          // Tenta signInWithCustomToken ou Anônimo
          if (typeof __initial_auth_token !== 'undefined') {
            await signInWithCustomToken(newAuth, String(__initial_auth_token as any));
          } else {
            const anonUser = await signInAnonymously(newAuth);
            setUserId(anonUser.user.uid);
            loadProgress(newDb, String(anonUser.user.uid), String(appId));
          }
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Erro ao inicializar Firebase:", e as any);
      setIsLoading(false);
    }
  }, []);

  // --- Funções de Persistência ---
  const getDocRef = useCallback((db: Firestore | null, uid: string | null, appId: string) => {
    if (!db || !uid) return null;
    return doc(db, `artifacts/${appId}/users/${uid}/orcamento`, 'draft');
  }, []);

  const saveProgress = async () => {
    const appId = typeof __app_id !== 'undefined' ? String(__app_id as any) : 'default-app-id';
    const docRef = getDocRef(db, userId, appId);

    if (!docRef) {
        setSaveStatus('error');
        return;
    }

    setSaveStatus('saving');
    try {
        const dataToSave = {
            config: config,
            roster: roster,
            designFiles: designFiles,
            lastUpdated: new Date().toISOString(),
        };
        await setDoc(docRef, dataToSave);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
        console.error("Erro ao salvar progresso:", e as any);
        setSaveStatus('error');
    }
  };

  const loadProgress = async (dbInstance: Firestore, uid: string, appId: string) => {
    const docRef = getDocRef(dbInstance, uid, appId);
    if (!docRef) {
        setIsLoading(false);
        return;
    }

    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.config) {
            // Merge for backward compatibility if new fields added
            setConfig(prev => ({...prev, ...data.config, kitLines: data.config.kitLines || prev.kitLines}));
        }
        if (data.roster) setRoster(data.roster);
        if (data.designFiles) setDesignFiles(data.designFiles);
      }
    } catch (e) {
      console.warn("Nenhum rascunho encontrado ou erro ao carregar:", e as any);
    } finally {
      setIsLoading(false);
    }
  };


  // --- Cálculos ---

  const totalKits = useMemo(() => {
    return (Object.values(config.kitQuantities) as number[]).reduce((sum, q) => sum + q, 0);
  }, [config.kitQuantities]);

  const totalSocks = useMemo(() => {
    return config.socks.reduce((sum, sock) => sum + sock.quantity, 0);
  }, [config.socks]);
  
  const minOrderMet = totalKits >= 10;
  
  const calculateTotal = () => {
    // Agora o preço é calculado com base na linha escolhida para cada categoria
    // Se a linha da categoria não estiver definida (ex: dados antigos), usa a global
    const rosterTotal = roster.reduce((acc, item) => {
      const itemType = item.type as 'camisa' | 'calcao' | 'conjunto';
      const categoryLine = config.kitLines[item.kitType] || config.line; 
      const categoryPrices = PRICES[categoryLine];
      const itemPrice = categoryPrices[itemType] || categoryPrices.conjunto;
      return acc + itemPrice;
    }, 0);
    
    // Meião usa preço da linha global (ou poderíamos definir uma lógica de média, mas usarei a base)
    const socksTotal = totalSocks * PRICES[config.line].meiao;
    return rosterTotal + socksTotal;
  };

  // --- Efeitos ---

  useEffect(() => {
    setRoster(prev => {
      const newRoster: RosterItem[] = [];
      const quantityMap = config.kitQuantities;

      const populate = (kitType: keyof typeof KIT_TYPES, count: number) => {
        const existing = prev.filter(item => item.kitType === kitType);
        for (let i = 0; i < count; i++) {
          if (existing[i]) {
            newRoster.push(existing[i]);
          } else {
            let defaultType: 'conjunto' | 'camisa' | 'calcao' = kitType === 'atleta' || kitType === 'comissao' || kitType === 'torcida' ? 'camisa' : 'conjunto';
            
            newRoster.push({
              name: '',
              number: kitType === 'comissao' ? 'TÉC' : '', 
              size: 'G',
              type: defaultType,
              kitType: kitType,
            });
          }
        }
      };

      (Object.keys(KIT_TYPES) as Array<keyof typeof KIT_TYPES>).forEach(key => {
        populate(key, quantityMap[key]);
      });

      return newRoster;
    });
  }, [config.kitQuantities]);

  // --- Handlers ---

  const handleRosterChange = (index: number, field: string, value: string) => {
    const newRoster = [...roster];
    newRoster[index] = { ...newRoster[index], [field]: value };
    setRoster(newRoster);
  };

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    setConfig(prev => ({ 
        ...prev, 
        customerInfo: { ...prev.customerInfo, [field]: value } 
    }));
  };

  const handleDesignUpload = (kitType: keyof typeof KIT_TYPES, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setDesignFiles(prev => ({ ...prev, [kitType]: String(reader.result) }));
      reader.readAsDataURL(file);
    }
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

  const selectLine = (lineKey: LineType) => {
      // Sets the default line AND updates all categories to this line
      const newKitLines = { ...config.kitLines };
      (Object.keys(newKitLines) as Array<keyof typeof KIT_TYPES>).forEach(k => {
          newKitLines[k] = lineKey;
      });

      setConfig({ 
          ...config, 
          line: lineKey, 
          kitLines: newKitLines,
          socks: config.socks.map(s => ({...s, quantity: 0})) 
      });
      setStep(2); // Auto advance when selecting from modal now
  };

  const updateKitLine = (kitType: keyof typeof KIT_TYPES, lineKey: LineType) => {
      setConfig(prev => ({
          ...prev,
          kitLines: {
              ...prev.kitLines,
              [kitType]: lineKey
          }
      }));
  };

  // --- Funções de Exportação (PDF) ---
  const handleDownload = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // --- Header ---
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); // Indigo 900
    doc.text("D'Sportivo Uniformes", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 14, 20, { align: 'right' });
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(14, 25, pageWidth - 14, 25);

    // --- Customer & Order Info ---
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Cliente: ${config.customerInfo.customerName || 'NÃO INFORMADO'}`, 14, 35);
    doc.text(`Telefone: ${config.customerInfo.customerPhone || 'NÃO INFORMADO'}`, 14, 42);
    // Removed specific Line info from header as it varies per category now
    doc.text(`Orçamento Personalizado`, 14, 49);

    let currentY = 55;

    // --- Quantities Summary Table ---
    const summaryData = Object.entries(config.kitQuantities)
      .filter(([_, qty]) => (qty as number) > 0)
      .map(([key, qty]) => {
          const k = key as keyof typeof KIT_TYPES;
          const lineName = LINE_DETAILS[config.kitLines[k]].name;
          return [KIT_TYPES[k], lineName, `${qty} unidades`];
      });

    if (summaryData.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(30, 58, 138);
      doc.text("Resumo de Quantidades e Linhas", 14, currentY);
      
      autoTable(doc, {
        startY: currentY + 3,
        head: [['Categoria', 'Linha Escolhida', 'Quantidade']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138] },
        styles: { fontSize: 10 }
      });
      
      currentY = ((doc as any).lastAutoTable.finalY as number) + 10;
    }

    // --- Socks Table ---
    const activeSocks = config.socks.filter(s => (s.quantity as number) > 0);
    if (activeSocks.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(30, 58, 138);
      doc.text("Meiões Avulsos", 14, currentY);

      const socksData = activeSocks.map(s => [s.color, `${s.quantity} pares`]);
      
      autoTable(doc, {
        startY: currentY + 3,
        head: [['Cor', 'Quantidade']],
        body: socksData,
        theme: 'striped',
        headStyles: { fillColor: [75, 85, 99] }, // Gray 600
        styles: { fontSize: 10 }
      });

      currentY = ((doc as any).lastAutoTable.finalY as number) + 10;
    }

    // --- Roster (Detail) Table ---
    // SORTING LOGIC: Group by Size (as requested)
    const sortedRoster = [...roster].sort((a, b) => {
        const indexA = ALL_SIZES.indexOf(a.size);
        const indexB = ALL_SIZES.indexOf(b.size);
        // Fallback for unknown sizes, although unlikely with dropdown
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text("Grade Completa (Agrupada por Tamanho)", 14, currentY);

    const rosterData = sortedRoster.map((item, index) => {
        let typeLabel = '';
        if (item.type === 'conjunto') typeLabel = 'Conjunto Completo';
        else if (item.type === 'camisa') typeLabel = 'Apenas Camisa';
        else if (item.type === 'calcao') typeLabel = 'Apenas Calção';

        // Add Line info to the row
        const lineName = LINE_DETAILS[config.kitLines[item.kitType]].name;

        return [
            index + 1,
            `${KIT_TYPES[item.kitType]} (${lineName})`,
            item.name || '-',
            item.number || '-',
            item.size,
            typeLabel
        ];
    });

    autoTable(doc, {
        startY: currentY + 3,
        head: [['#', 'Categoria (Linha)', 'Nome', 'Nº', 'Tam.', 'Item']],
        body: rosterData,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138] },
        columnStyles: {
            0: { cellWidth: 10 },
            2: { cellWidth: 40, fontStyle: 'bold' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        },
        styles: { fontSize: 9, cellPadding: 3 }
    });

    // --- Footer & Totals ---
    const finalY = ((doc as any).lastAutoTable.finalY as number) + 10;
    
    // Check if we need a new page for totals
    if (finalY > (doc.internal.pageSize.getHeight() as number) - 40) {
        doc.addPage();
        currentY = 20;
    } else {
        currentY = finalY;
    }

    // Total Box
    doc.setFillColor(243, 244, 246); // gray-100
    doc.rect(pageWidth - 80, currentY, 66, 25, 'F');
    doc.setDrawColor(200);
    doc.rect(pageWidth - 80, currentY, 66, 25, 'S');

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Total Estimado", pageWidth - 75, currentY + 8);
    
    doc.setFontSize(16);
    doc.setTextColor(22, 163, 74); // green-600
    doc.setFont("helvetica", "bold");
    doc.text(`R$ ${calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 75, currentY + 18);

    // Disclaimer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150);
    const disclaimer = "* O valor final pode sofrer alterações após análise da arte. Este documento é uma estimativa de orçamento baseada nos dados fornecidos no simulador.";
    const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - 30);
    doc.text(splitDisclaimer, 14, currentY + 35);

    // --- ATTACHED DESIGN IMAGES (New Feature) ---
    const kitKeys = Object.keys(KIT_TYPES) as Array<keyof typeof KIT_TYPES>;
    
    kitKeys.forEach((key) => {
        const imageData = designFiles[key];
        // Only include if there are items for this category AND an image was uploaded
        if (imageData && (config.kitQuantities[key] as number) > 0) {
            doc.addPage();
            
            // Header for Image Page
            doc.setFontSize(16);
            doc.setTextColor(30, 58, 138); // Indigo 900
            doc.setFont("helvetica", "bold");
            doc.text(`Modelo Visual: ${KIT_TYPES[key]}`, 14, 20);
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.setFont("helvetica", "normal");
            doc.text(`Linha Selecionada: ${LINE_DETAILS[config.kitLines[key]].name}`, 14, 26);
            doc.text(`Anexo referente aos itens da categoria ${KIT_TYPES[key]}`, 14, 32);
            
            // Image Rendering logic
            try {
                // Get page dimensions
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = doc.internal.pageSize.getHeight();
                
                // Margins
                const marginX = 14;
                const marginY = 40;
                const maxW = pdfWidth - (marginX * 2);
                const maxH = pdfHeight - marginY - 20; // Bottom margin
                
                // We add the image with 'auto' width/height calculation essentially by letting jsPDF handle it 
                // or we can calculate aspect ratio if needed. 
                // Simple approach: fit within the box.
                
                const imgProps = doc.getImageProperties(imageData);
                const ratio = imgProps.width / imgProps.height;
                
                let finalW = maxW;
                let finalH = finalW / ratio;
                
                if (finalH > maxH) {
                    finalH = maxH;
                    finalW = finalH * ratio;
                }
                
                // Centering if narrower than page
                const xOffset = marginX + (maxW - finalW) / 2;
                
                doc.addImage(imageData, 'PNG', xOffset, marginY, finalW, finalH);
                
            } catch (err) {
                console.error("Erro ao adicionar imagem ao PDF", err);
                doc.setTextColor(255, 0, 0);
                doc.text("Erro ao renderizar imagem do modelo.", 14, 45);
            }
        }
    });

    // Filename
    const sanitizedName = config.customerInfo.customerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`Orcamento_DSportivo_${sanitizedName || 'novo'}.pdf`);
  };


  // --- Componentes ---

  // Modal Expandido tipo Página
  const ModalDetalhesLinha = ({ lineKey }: { lineKey: keyof typeof LINE_DETAILS }) => {
    const details = LINE_DETAILS[lineKey];
    const Icon = details.icon;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8" onClick={() => setModalOpen(null)}>
        <div 
            className="bg-white w-full max-w-5xl h-[90vh] md:h-auto md:max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300" 
            onClick={e => e.stopPropagation()}
        >
          {/* Header Fixo */}
          <div className={`p-6 border-b flex items-start justify-between bg-gray-50`}>
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full ${details.color} text-white flex items-center justify-center shadow-lg`}>
                    <Icon size={32} />
                </div>
                <div>
                    <h3 className={`text-3xl font-bold ${details.textColor || 'text-gray-900'}`}>{details.name}</h3>
                    <p className="text-lg font-bold text-gray-700">{details.priceDesc}</p>
                </div>
            </div>
            <button onClick={() => setModalOpen(null)} className="text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full p-2 shadow-sm border border-gray-100">
                <X size={24} />
            </button>
          </div>

          {/* Conteúdo Scrollável */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
             
             {/* Descrição e Features */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-3">Sobre a Linha</h4>
                    <p className="text-gray-600 leading-relaxed text-lg text-justify">{details.fullDesc}</p>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <CheckCircle2 size={20} className="text-green-600"/> Destaques da Categoria
                    </h4>
                    <ul className="space-y-3">
                        {details.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <Check size={18} className="text-indigo-600 mt-1 flex-shrink-0" />
                                <span className="text-gray-700 font-medium">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
             </div>

             {/* Galeria de Modelos */}
             <div className="pt-4 border-t border-gray-100">
                <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <ImageIcon size={24} className="text-indigo-600"/> Modelos Disponíveis
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {details.models.map((modelId) => (
                        <div key={modelId} className="group cursor-pointer">
                            <div className="aspect-[3/4] bg-gray-100 rounded-xl border-2 border-gray-100 group-hover:border-indigo-500 transition-all flex flex-col items-center justify-center relative overflow-hidden">
                                {/* Placeholder para Imagem - Substituir src quando tiver as imagens */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 group-hover:text-indigo-400 transition-colors">
                                    <Shirt size={48} strokeWidth={1} />
                                    <span className="text-xs font-medium mt-2">Modelo Exemplo {modelId}</span>
                                    <span className="text-[10px] mt-1 opacity-70">(Imagem em breve)</span>
                                </div>
                                {/* <img src={`/path/to/image-${modelId}.jpg`} className="w-full h-full object-cover" /> */}
                            </div>
                            <p className="text-center mt-3 font-medium text-gray-600 group-hover:text-indigo-600">Ref. {details.name.split(' ')[0]}-{modelId.toString().padStart(2, '0')}</p>
                        </div>
                    ))}
                </div>
             </div>
          </div>

          {/* Footer de Ação */}
          <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
             <button onClick={() => setModalOpen(null)} className="px-6 py-3 font-medium text-gray-600 hover:text-gray-900 transition-colors">
                 Fechar Visualização
             </button>
             <button 
                onClick={() => {
                    selectLine(lineKey);
                    setModalOpen(null);
                }}
                className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${details.color.replace('bg-', 'bg-').replace('-400', '-600').replace('-500', '-600')}`}
             >
                Começar com Linha {details.name}
             </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Componente de Controle de Categoria (Substitui QuantityInput)
  const CategoryControl = ({ kitType }: { kitType: keyof typeof KIT_TYPES }) => {
      const currentLine = config.kitLines[kitType];
      const quantity = config.kitQuantities[kitType];
      // Calcula preço unitário base (conjunto ou camisa para simplificar a visualização rápida)
      // O preço real total considera se é camisa/calção individual no passo 4
      const basePrice = PRICES[currentLine].conjunto; 

      return (
        <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
            {/* Indicador visual da linha */}
            <div className={`absolute top-0 left-0 w-1 h-full ${LINE_DETAILS[currentLine].color}`}></div>
            
            <div className="flex justify-between items-start pl-3">
                <div>
                    <label className="block text-lg font-bold text-gray-900">{KIT_TYPES[kitType]}</label>
                    <span className="text-xs text-gray-500">Configuração individual</span>
                </div>
                <div className="text-right">
                    <span className="block text-xs font-bold text-indigo-600">A partir de</span>
                    <span className="text-lg font-bold text-gray-900">R$ {basePrice.toFixed(2)}</span>
                </div>
            </div>

            <div className="pl-3 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                {/* Seletor de Linha */}
                <div className="relative">
                    <select
                        value={currentLine}
                        onChange={(e) => updateKitLine(kitType, e.target.value as LineType)}
                        className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 text-sm font-medium"
                    >
                        {Object.keys(LINE_DETAILS).map((key) => (
                            <option key={key} value={key}>
                                Linha {LINE_DETAILS[key as LineType].name}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <ChevronDown size={14} />
                    </div>
                </div>

                {/* Controle de Quantidade */}
                <div className="flex items-center justify-end gap-2">
                    <button 
                        onClick={() => setConfig(prev => ({ 
                        ...prev, 
                        kitQuantities: { ...prev.kitQuantities, [kitType]: Math.max(0, prev.kitQuantities[kitType] - 1) } 
                        }))}
                        className="w-8 h-8 rounded-md bg-gray-100 text-indigo-600 font-bold border border-gray-200 hover:bg-gray-200"
                    >-</button>
                    <input 
                        type="number" 
                        min="0"
                        value={quantity}
                        onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        kitQuantities: { ...prev.kitQuantities, [kitType]: Math.max(0, parseInt(e.target.value) || 0) } 
                        }))}
                        className="w-12 text-center text-lg font-bold bg-transparent border-b-2 border-indigo-200 focus:outline-none text-indigo-900"
                    />
                    <button 
                        onClick={() => setConfig(prev => ({ 
                        ...prev, 
                        kitQuantities: { ...prev.kitQuantities, [kitType]: prev.kitQuantities[kitType] + 1 } 
                        }))}
                        className="w-8 h-8 rounded-md bg-gray-100 text-indigo-600 font-bold border border-gray-200 hover:bg-gray-200"
                    >+</button>
                </div>
            </div>
        </div>
      );
  };


  // --- Steps ---

  const renderStep1 = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-4 pt-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
          Vista seu time com <span className="text-indigo-600">Excelência</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Conheça nossas linhas exclusivas de uniformes esportivos. 
          Do custo-benefício ao alto rendimento profissional, temos a opção perfeita para sua equipe brilhar em campo.
        </p>
      </div>

      {/* Grid Informativo das Linhas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
        {(Object.keys(LINE_DETAILS) as Array<keyof typeof LINE_DETAILS>).map((key) => {
          const detail = LINE_DETAILS[key];
          const Icon = detail.icon;
          return (
            <div key={key} className="relative group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className={`h-2 w-full ${detail.color}`}></div>
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-full ${detail.color} text-white flex items-center justify-center shadow-md`}>
                            <Icon size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{detail.name}</h3>
                            <p className="text-sm font-medium text-indigo-600">{detail.priceDesc}</p>
                        </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-1">
                        {detail.desc}
                    </p>

                    <div className="mt-auto">
                        <button
                            onClick={() => setModalOpen(key)}
                            className="w-full py-3 rounded-xl bg-gray-50 text-gray-700 font-bold border border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <Info size={18} /> Ver Detalhes e Modelos
                        </button>
                    </div>
                </div>
            </div>
          );
        })}
      </div>

      {/* CTA Principal */}
      <div className="flex justify-center pt-8 pb-4">
        <button 
          onClick={() => setStep(2)}
          className={`px-10 py-5 rounded-2xl font-black text-lg flex items-center gap-3 transition-all shadow-xl shadow-indigo-200 bg-gray-900 text-white hover:bg-indigo-600 hover:scale-105 active:scale-95`}
        >
          INICIAR SIMULAÇÃO DE ORÇAMENTO <ArrowRight size={24} />
        </button>
      </div>
      
      {modalOpen && <ModalDetalhesLinha lineKey={modalOpen} />}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Personalize Categorias e Quantidades</h2>
        <p className="text-gray-500">Defina a linha e a quantidade para cada grupo. Ex: Linha Prata e Comissão Diamante.</p>
      </div>

      {/* Quantidades Detalhadas (Agrupadas) */}
      <div className="space-y-4">
        {/* Grupo 1: Linha / Goleiro */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CategoryControl kitType="linha" />
            <CategoryControl kitType="goleiro" />
        </div>
        
        {/* Grupo 2: Comissão Técnica / Atleta */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CategoryControl kitType="comissao" />
            <CategoryControl kitType="atleta" />
        </div>

        {/* Grupo 3: Torcida */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CategoryControl kitType="torcida" />
            <CategoryControl kitType="staff" />
        </div>
      </div>
      
      <div className="bg-indigo-50 rounded-2xl p-4 text-center border border-indigo-100 mt-6">
          <p className="text-xl font-bold text-indigo-900">Total de Kits/Peças Principais: {totalKits}</p>
          {!minOrderMet && (
            <p className="text-red-500 text-sm mt-1 font-medium flex items-center justify-center gap-1">
                <AlertTriangle size={16} /> Pedido mínimo: 10 peças. Faltam {10 - totalKits} peças.
            </p>
          )}
      </div>

      {/* Configuração de Meiões Flexível */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2 mb-4"><Footprints size={20} /> Meiões a Parte (Múltiplas Cores)</h3>
          
          <div className="space-y-3">
            {config.socks.map(sock => (
              <div key={sock.id} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-sm">
                
                {/* Seleção de Cor */}
                <div className="flex-1">
                  <select 
                    value={sock.color}
                    onChange={(e) => updateSockEntry(sock.id, 'color', e.target.value)}
                    className="w-full h-10 rounded-lg bg-white border border-gray-300 text-gray-700 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
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
                  <label className="text-sm font-medium text-gray-600 min-w-[70px]">Pares:</label>
                  <button 
                    onClick={() => updateSockEntry(sock.id, 'quantity', sock.quantity - 1)}
                    className="w-8 h-8 rounded-md bg-white text-gray-600 font-bold hover:bg-gray-100 text-base border border-gray-200"
                  >-</button>
                  <input 
                      type="number" 
                      min="0"
                      value={sock.quantity}
                      onChange={(e) => updateSockEntry(sock.id, 'quantity', e.target.value)}
                      className="w-12 text-center text-sm font-bold bg-transparent border-b border-gray-300 focus:outline-none text-gray-700"
                  />
                  <button 
                    onClick={() => updateSockEntry(sock.id, 'quantity', sock.quantity + 1)}
                    className="w-8 h-8 rounded-md bg-white text-gray-600 font-bold hover:bg-gray-100 text-base border border-gray-200"
                  >+</button>
                </div>

                {/* Remover */}
                <button 
                  onClick={() => removeSockEntry(sock.id)}
                  className="p-2 rounded-full text-red-500 hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          
          {SOCK_COLORS.length > config.socks.length && (
            <button 
              onClick={addSockEntry} 
              className="mt-3 text-indigo-600 flex items-center gap-1 font-medium hover:text-indigo-800 transition-colors"
            >
              <Plus size={16}/> Adicionar Cor de Meião
            </button>
          )}

          <p className="text-sm font-bold text-gray-700 pt-2">
            Total de Pares de Meião: {totalSocks}
          </p>
      </div>


      <div className="flex justify-between pt-4">
        <button 
          onClick={() => setStep(1)}
          className="text-gray-500 hover:text-gray-900 font-medium flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Voltar
        </button>
        <button 
          onClick={() => {
            if (minOrderMet) setStep(3);
          }}
          disabled={!minOrderMet}
          className={`px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all shadow-lg ${
            minOrderMet 
              ? 'bg-gray-900 text-white hover:bg-gray-800 hover:scale-105' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Próximo: Modelo Visual <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Anexar Modelo escolhido</h2>
        <p className="text-gray-500">Anexe um print do simulador ou sua arte para cada tipo de kit que foi pedido.</p>
      </div>
      
      <div className="bg-indigo-100 p-4 rounded-xl flex justify-between items-center border border-indigo-200">
         <p className="text-indigo-900 font-medium">Use o simulador externo para criar sua arte:</p>
         <a 
             href="https://www.dsportivo.com.br/simulador/" 
             target="_blank" 
             rel="noopener noreferrer"
             className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
           >
             Abrir Simulador <ExternalLink size={16} />
         </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Object.keys(KIT_TYPES) as Array<keyof typeof KIT_TYPES>).map((key) => {
          if (config.kitQuantities[key] === 0) return null; 
          
          const file = designFiles[key];
          
          return (
            <div key={key} className="border-2 border-dashed border-gray-300 rounded-3xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors relative group">
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => handleDesignUpload(key, e)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <h3 className="text-lg font-bold text-gray-800 mb-1">{KIT_TYPES[key]} ({config.kitQuantities[key]} peças)</h3>
              <p className="text-xs font-bold text-indigo-600 mb-4 bg-indigo-50 px-2 py-1 rounded">Linha: {LINE_DETAILS[config.kitLines[key]].name}</p>

              {file ? (
                <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden mb-2 group-hover:opacity-90 transition-opacity">
                  <img src={file} alt={`Modelo ${KIT_TYPES[key]}`} className="w-full h-full object-contain" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-medium flex items-center gap-2"><Upload size={16}/> Trocar Imagem</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
                    <Upload size={24} />
                  </div>
                  <p className="text-sm text-gray-400">Anexar Print / Arte</p>
                </>
              )}
              
              {file && (
                <p className="text-green-600 font-medium flex items-center gap-1 text-sm mt-2">
                  <CheckCircle2 size={16} /> Imagem carregada
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <button 
          onClick={() => setStep(2)}
          className="text-gray-500 hover:text-gray-900 font-medium flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Voltar
        </button>
        <button 
          onClick={() => setStep(4)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200"
        >
          Próximo: Formalização <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => {
    let currentKitType: keyof typeof KIT_TYPES | null = null;
    
    const requiredFieldsFilled = config.customerInfo.customerName && config.customerInfo.customerPhone;
    const canSubmit = requiredFieldsFilled && hasReviewed;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 relative">
        <div className="flex flex-col md:flex-row justify-between items-end mb-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">4. Formalização do Pedido</h2>
            <p className="text-gray-500">Preencha os dados de personalização de cada peça e envie para finalizar o orçamento.</p>
          </div>
        </div>

        {/* Campos Obrigatórios do Cliente */}
        <div className="bg-white border border-indigo-200 rounded-xl p-4 shadow-md space-y-4">
            <h3 className="text-lg font-bold text-indigo-800">Dados do Cliente (Obrigatório)</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <input 
                    type="text" 
                    placeholder="Nome Completo"
                    value={config.customerInfo.customerName}
                    onChange={(e) => handleCustomerInfoChange('customerName', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400"
                    required
                />
                <input 
                    type="tel" 
                    placeholder="Número de Telefone (Ex: 16 99123-4567)"
                    value={config.customerInfo.customerPhone}
                    onChange={(e) => handleCustomerInfoChange('customerPhone', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400"
                    required
                />
            </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium uppercase text-xs sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-center w-12">#</th>
                  <th className="px-4 py-3">Nome na Camisa</th>
                  <th className="px-4 py-3 w-24">Número</th>
                  <th className="px-4 py-3 w-32">Tamanho</th>
                  <th className="px-4 py-3 w-40">Item</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roster.map((player, index) => {
                  let sectionHeader = null;
                  const isNewSection = player.kitType !== currentKitType;

                  if (isNewSection) {
                    currentKitType = player.kitType;
                    const lineName = LINE_DETAILS[config.kitLines[player.kitType]].name;
                    sectionHeader = (
                      <tr className="bg-indigo-100/70 border-b border-indigo-200">
                        <td colSpan={5} className="px-4 py-2 font-bold text-indigo-900 text-left text-sm flex justify-between items-center">
                          <span>{KIT_TYPES[player.kitType]} ({config.kitQuantities[player.kitType]} Peças)</span>
                          <span className="text-xs bg-white px-2 py-1 rounded border border-indigo-200 text-indigo-600 uppercase tracking-wider">Linha {lineName}</span>
                        </td>
                      </tr>
                    );
                  }
                  
                  const groupIndex = roster.filter((_, i) => i < index && _.kitType === player.kitType).length + 1;
                  
                  return (
                    <React.Fragment key={index}>
                      {sectionHeader}
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-center text-gray-400 font-medium">{groupIndex}</td>
                        <td className="px-4 py-2">
                          <input 
                            type="text" 
                            placeholder="Ex: Ronaldo"
                            className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none py-1 placeholder-gray-400 text-gray-900"
                            value={player.name}
                            onChange={(e) => handleRosterChange(index, 'name', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input 
                            type="text" 
                            placeholder={player.kitType === 'comissao' ? 'TÉC' : '10'}
                            className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none py-1 text-center placeholder-gray-400 text-gray-900"
                            value={player.number}
                            onChange={(e) => handleRosterChange(index, 'number', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select 
                            className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none py-1 text-gray-900"
                            value={player.size}
                            onChange={(e) => handleRosterChange(index, 'size', e.target.value)}
                          >
                             <optgroup label="Infantil / Juvenil">
                                {SIZES_INFANTIL.map(s => <option key={s} value={s}>{s}</option>)}
                             </optgroup>
                             <optgroup label="Adulto">
                                {SIZES_ADULTO.map(s => <option key={s} value={s}>{s}</option>)}
                             </optgroup>
                             <optgroup label="Baby Look (Feminina)">
                                {SIZES_FEMININO.map(s => <option key={s} value={s}>{s}</option>)}
                             </optgroup>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <select 
                            className="w-full bg-indigo-50/50 border-none rounded text-indigo-900 font-bold focus:ring-2 focus:ring-indigo-200 h-14 text-lg md:h-auto md:py-1 md:text-xs md:font-medium px-2 shadow-sm"
                            value={player.type}
                            onChange={(e) => handleRosterChange(index, 'type', e.target.value)}
                          >
                            <option value="conjunto">Conjunto</option>
                            <option value="camisa">Só Camisa</option>
                            <option value="calcao">Só Calção</option>
                          </select>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Opções de Envio e Resumo */}
        <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-xl space-y-4">
            
            {/* Resumo Financeiro */}
            <div className="flex flex-col gap-1">
                <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Total Estimado do Orçamento (Personalizado)</span>
                <div className="text-3xl font-bold text-green-400">
                R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-xs text-gray-500 italic">*O valor final será confirmado após análise da arte.</span>
            </div>

            {/* Aviso de Responsabilidade */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                <div className="pt-0.5">
                    <input
                        type="checkbox"
                        id="review-confirmation"
                        checked={hasReviewed}
                        onChange={(e) => setHasReviewed(e.target.checked)}
                        className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                    />
                </div>
                <label htmlFor="review-confirmation" className="text-sm text-amber-900 cursor-pointer select-none">
                    <span className="font-bold flex items-center gap-1 mb-1"><AlertTriangle size={14} /> ATENÇÃO - REVISE SEU PEDIDO:</span>
                    Declaro que revisei todos os nomes, números e tamanhos listados acima.
                    Estou ciente de que a produção seguirá <strong>exatamente</strong> esta lista e que
                    <strong> erros de digitação ou escolha de tamanho nesta formalização são de minha inteira responsabilidade</strong>.
                </label>
            </div>

            {/* Ações */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
                
                {/* 1. Download/PDF */}
                <button 
                    onClick={handleDownload}
                    disabled={!canSubmit}
                    className={`flex-1 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg text-white ${
                        canSubmit 
                        ? 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 shadow-indigo-300/50' 
                        : 'bg-gray-600 cursor-not-allowed opacity-50'
                    }`}
                >
                    <Download size={20} /> Baixar Orçamento (Arquivo PDF)
                </button>
            </div>

            {!requiredFieldsFilled && (
                <p className="text-red-300 text-sm mt-2 text-center font-medium">
                    Preencha Nome Completo e Telefone para enviar o pedido.
                </p>
            )}

            {requiredFieldsFilled && !hasReviewed && (
                <p className="text-amber-300 text-sm mt-2 text-center font-medium animate-pulse">
                    Você precisa confirmar a revisão dos dados acima para prosseguir.
                </p>
            )}

        </div>

        <div className="flex justify-between pt-4">
          <button 
            onClick={() => setStep(3)}
            className="text-gray-500 hover:text-gray-900 font-medium flex items-center gap-2"
          >
            <ArrowLeft size={20} /> Voltar
          </button>
          
          {/* Botão de Salvar Progresso */}
          <button 
            onClick={saveProgress}
            disabled={saveStatus === 'saving' || isLoading}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all text-sm ${
                saveStatus === 'saving' ? 'bg-yellow-500 text-white' :
                saveStatus === 'saved' ? 'bg-green-500 text-white' :
                saveStatus === 'error' ? 'bg-red-500 text-white' : // Added error state style
                'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Save size={16} /> 
            {saveStatus === 'saving' ? 'Salvando...' : 
             saveStatus === 'saved' ? 'Salvo!' : 
             saveStatus === 'error' ? 'Erro ao Salvar' : 
             'Salvar Rascunho'}
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="ml-4 text-indigo-600 font-medium">Carregando rascunho...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-indigo-100 relative">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <BrandLogo />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'}`}>
                   {s}
                 </div>
                 {s < 4 && <div className={`w-12 h-1 mx-2 rounded-full ${step > s ? 'bg-gray-900' : 'bg-gray-200'}`}></div>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 md:p-10 min-h-[600px] relative">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
      </main>

      {/* Botão Flutuante da Tabela de Medidas (Aparece apenas na etapa 4) */}
      {step === 4 && (
        <button
            onClick={() => setShowSizeChart(true)}
            className="fixed bottom-6 right-6 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center border-4 border-indigo-100"
            title="Ver Tabela de Medidas"
            aria-label="Ver Tabela de Medidas"
        >
            <Ruler size={24} />
        </button>
      )}

      {/* Modal da Tabela de Medidas */}
      {showSizeChart && (
        <div 
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setShowSizeChart(false)}
        >
            <div 
                className="bg-white p-2 rounded-xl max-w-5xl w-full relative shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header do Modal */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Ruler className="text-indigo-600"/> TABELA DE MEDIDAS
                    </h3>
                    <button 
                        onClick={() => setShowSizeChart(false)}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                {/* Conteúdo com Scroll */}
                <div className="w-full overflow-y-auto p-6 md:p-8 bg-gray-50/50">
                    
                    {/* Botões de Seleção de Linha */}
                    <div className="flex justify-center gap-4 mb-8">
                        <button
                            onClick={() => setActiveSizeTab('standard')}
                            className={`px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-sm border-2 ${
                                activeSizeTab === 'standard' 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200 ring-2 ring-blue-100' 
                                : 'bg-white text-gray-500 border-gray-200 hover:border-blue-400 hover:text-blue-500'
                            }`}
                        >
                            LINHA PRATA / OURO / EMPRESARIAL
                        </button>
                        <button
                            onClick={() => setActiveSizeTab('diamond')}
                            className={`px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-sm border-2 ${
                                activeSizeTab === 'diamond' 
                                ? 'bg-indigo-900 text-white border-indigo-900 shadow-indigo-200 ring-2 ring-indigo-100' 
                                : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-400 hover:text-indigo-900'
                            }`}
                        >
                            LINHA DIAMANTE (SLIM)
                        </button>
                    </div>

                    {/* Cabeçalho de Instruções */}
                    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md">1</div>
                            <div>
                                <span className="font-extrabold text-gray-900 block text-lg">LARGURA</span>
                                <span className="text-gray-600 text-sm">Medir de ponta a ponta (axila a axila) usando uma fita métrica ou trena sobre uma peça esticada.</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                             <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md">2</div>
                            <div>
                                <span className="font-extrabold text-gray-900 block text-lg">ALTURA</span>
                                <span className="text-gray-600 text-sm">Medir do ponto mais alto da gola até a barra inferior da camisa.</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-center text-sm text-gray-500 mb-8 space-y-2 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                        <p>• As medidas correspondem à largura e altura de camisas adultas e infantis.</p>
                        <p>• <span className="font-bold">Atenção:</span> As medidas podem variar em média 5% para mais ou para menos devido ao processo manual de costura.</p>
                        <p className="font-black text-gray-800 uppercase tracking-wide">• NA DÚVIDA PEÇA UM TAMANHO A MAIS</p>
                    </div>

                    {/* Grids das Tabelas (Dinâmicas Baseadas na Aba) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start animate-in fade-in slide-in-from-bottom-2 duration-300" key={activeSizeTab}>
                        <SizeTable 
                          title={SIZE_TABLES[activeSizeTab].masculina.title} 
                          headerColor={SIZE_TABLES[activeSizeTab].masculina.headerColor}
                          headers={SIZE_TABLES[activeSizeTab].masculina.headers}
                          keys={SIZE_TABLES[activeSizeTab].masculina.keys}
                          data={SIZE_TABLES[activeSizeTab].masculina.data} 
                        />
                        <SizeTable 
                          title={SIZE_TABLES[activeSizeTab].feminina.title} 
                          headerColor={SIZE_TABLES[activeSizeTab].feminina.headerColor}
                          headers={SIZE_TABLES[activeSizeTab].feminina.headers}
                          keys={SIZE_TABLES[activeSizeTab].feminina.keys}
                          data={SIZE_TABLES[activeSizeTab].feminina.data} 
                        />
                        <SizeTable 
                          title={SIZE_TABLES[activeSizeTab].infantil.title} 
                          headerColor={SIZE_TABLES[activeSizeTab].infantil.headerColor}
                          headers={SIZE_TABLES[activeSizeTab].infantil.headers}
                          keys={SIZE_TABLES[activeSizeTab].infantil.keys}
                          data={SIZE_TABLES[activeSizeTab].infantil.data} 
                        />
                    </div>
                </div>

                {/* Footer Fixo (Mobile friendly) */}
                <div className="p-3 bg-white border-t border-gray-100 text-center text-xs text-gray-400">
                     Clique fora para fechar ou no X no canto superior direito.
                </div>
            </div>
        </div>
      )}
    </div>
  );
}