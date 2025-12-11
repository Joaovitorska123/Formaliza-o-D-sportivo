import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Upload, 
  Send, 
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
  AlertTriangle
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

// --- Global Declarations for External Variables ---
declare const __app_id: string;
declare const __firebase_config: string;
declare const __initial_auth_token: string;

// --- Constantes de Preços (Estimativa) ---
const PRICES = {
  bronze: { camisa: 45, calcao: 25, conjunto: 65, meiao: 15 },
  prata: { camisa: 65, calcao: 35, conjunto: 90, meiao: 20 },
  ouro: { camisa: 85, calcao: 45, conjunto: 120, meiao: 25 },
};

const LINE_DETAILS = {
  bronze: { name: 'Linha Bronze', desc: 'Tecido Dry Basic, acabamento padrão. Ideal para treinos e jogos casuais.', color: 'bg-amber-600' },
  prata: { name: 'Linha Prata', desc: 'Tecido Dry Fit Pro, costura reforçada. Excelente custo-benefício para campeonatos.', color: 'bg-gray-400' },
  ouro: { name: 'Linha Ouro', desc: 'Tecnologia Aero, Elastano e acabamento premium. Conforto e performance de elite.', color: 'bg-yellow-500' },
};

// CATEGORIAS DE KITS SOLICITADAS
const KIT_TYPES: Record<string, string> = {
  linha: 'Linha',
  goleiro: 'Goleiro',
  comissao: 'Comissão Técnica',
  atleta: 'Atleta', // Uniforme extra
  torcida: 'Torcida',
};

const SOCK_COLORS = [
  'Preto', 'Branco', 'Azul Marinho', 'Azul Royal', 
  'Verde Bandeira', 'Vermelho', 'Amarelo Ouro'
];

// NOVOS TAMANHOS SOLICITADOS
const MASC_SIZES = ['2', '4', '6', '8', '10', '12', '14', '16', 'P', 'M', 'G', 'GG', 'XG', 'ESP', 'G3'];
const FEM_SIZES = ['P BL', 'M BL', 'G BL', 'GG BL', 'XG BL', 'ESP BL'];
const ALL_SIZES = [...MASC_SIZES, ...FEM_SIZES];


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

interface Config {
  line: 'bronze' | 'prata' | 'ouro';
  kitQuantities: Record<keyof typeof KIT_TYPES, number>;
  socks: SockItem[];
  nextSockId: number;
  customerInfo: CustomerInfo; // Novo campo
}

// Valores iniciais
const INITIAL_CONFIG: Config = {
    line: 'prata',
    kitQuantities: { linha: 10, atleta: 0, goleiro: 0, comissao: 0, torcida: 0 },
    socks: [],
    nextSockId: 1,
    customerInfo: { customerName: '', customerPhone: '' },
};

// SVG do Logo D'Sportivo (Corrigido para evitar chaves duplicadas no objeto style)
const DsPortivoLogo = () => (
    <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="text-indigo-600"
    >
        {/* A forma Z cortada do logo, com cores definidas (Mais simples e eficaz) */}
        <g transform="translate(0, 0)">
            {/* Parte superior/esquerda escura */}
            <path d="M 1 0 L 23 0 L 23 10 L 15 10 L 9 16 L 1 16 Z" 
                  fill="currentColor" 
                  className="text-gray-900" 
                  style={{ transform: 'translateY(-2px)' }}
            />
            {/* Parte inferior/direita colorida */}
            <path d="M 1 8 L 9 8 L 15 14 L 23 14 L 23 24 L 1 24 Z" 
                  fill="currentColor" 
                  className="text-indigo-600" 
                  style={{ transform: 'translateY(2px)' }}
            />
            {/* Corte central branco/claro */}
            <path d="M 10 10 H 14 V 14 H 10 Z" 
                  fill="white" 
                  className="text-white" 
                  style={{ transform: 'translateY(0px)' }}
            />
        </g>
    </svg>
);


export default function LandingPage() {
  // --- Estados Firebase e Autenticação ---
  const [db, setDb] = useState<Firestore | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Estados do Aplicativo ---
  const [step, setStep] = useState(1);
  const [modalOpen, setModalOpen] = useState<'bronze' | 'prata' | 'ouro' | null>(null);
  const [config, setConfig] = useState<Config>(INITIAL_CONFIG);
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const [designFiles, setDesignFiles] = useState<Record<keyof typeof KIT_TYPES, string | null>>({
    linha: null, goleiro: null, comissao: null, atleta: null, torcida: null,
  });

  // --- Firebase Init e Auth ---
  useEffect(() => {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

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
          loadProgress(newDb, user.uid, appId);
        } else {
          // Tenta signInWithCustomToken ou Anônimo
          if (typeof __initial_auth_token !== 'undefined') {
            await signInWithCustomToken(newAuth, __initial_auth_token);
          } else {
            const anonUser = await signInAnonymously(newAuth);
            setUserId(anonUser.user.uid);
            loadProgress(newDb, anonUser.user.uid, appId);
          }
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Erro ao inicializar Firebase:", e);
      setIsLoading(false);
    }
  }, []);

  // --- Funções de Persistência ---
  const getDocRef = useCallback((db: Firestore | null, uid: string | null, appId: string) => {
    if (!db || !uid) return null;
    // Caminho privado: /artifacts/{appId}/users/{userId}/orcamento
    return doc(db, `artifacts/${appId}/users/${uid}/orcamento`, 'draft');
  }, []);

  const saveProgress = async () => {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
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
        console.error("Erro ao salvar progresso:", e);
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
        if (data.config) setConfig(data.config);
        if (data.roster) setRoster(data.roster);
        if (data.designFiles) setDesignFiles(data.designFiles);
        console.log("Progresso carregado com sucesso.");
      }
    } catch (e) {
      console.warn("Nenhum rascunho encontrado ou erro ao carregar:", e);
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
    const prices = PRICES[config.line];
    
    // 1. Soma itens da lista (Peças/Kits)
    const rosterTotal = roster.reduce((acc, item) => {
      const itemType = item.type as 'camisa' | 'calcao' | 'conjunto';
      const itemPrice = prices[itemType] || prices.conjunto;
      return acc + itemPrice;
    }, 0);

    // 2. Soma os meiões
    const socksTotal = totalSocks * prices.meiao;

    return rosterTotal + socksTotal;
  };

  // --- Efeitos ---

  // Atualiza a lista de atletas (roster) quando as quantidades mudam
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
      reader.onloadend = () => setDesignFiles(prev => ({ ...prev, [kitType]: reader.result as string }));
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
          ? { ...sock, [field]: field === 'quantity' ? Math.max(0, parseInt(value as string) || 0) : value } 
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

  // --- Funções de Exportação ---
  const generateOrderText = () => {
    const total = calculateTotal();
    
    // 1. Cabeçalho e Dados do Cliente
    let text = `
------------------------------------------------
         FORMALIZAÇÃO DE PEDIDO D'SPORTIVO
------------------------------------------------
*DADOS DO CLIENTE:*
Nome Completo: ${config.customerInfo.customerName || 'NÃO INFORMADO'}
Telefone/WhatsApp: ${config.customerInfo.customerPhone || 'NÃO INFORMADO'}
Data/Hora: ${new Date().toLocaleString('pt-BR')}
------------------------------------------------
    
*1. CONFIGURAÇÃO GERAL E ORÇAMENTO*
------------------------------------------------
- Linha de Qualidade: ${LINE_DETAILS[config.line].name}
- Valor Estimado: R$ ${total.toFixed(2).replace('.', ',')}
- Total de Peças Principais: ${totalKits} Kits
(O valor final será confirmado após análise das artes.)
%0A
*2. DISTRIBUIÇÃO DE PEÇAS PRINCIPAIS*
------------------------------------------------
`;
    
    // 2. Detalhe das Quantidades
    (Object.keys(KIT_TYPES) as Array<keyof typeof KIT_TYPES>).forEach(key => {
      if (config.kitQuantities[key] > 0) {
        text += `- ${KIT_TYPES[key]}: ${config.kitQuantities[key]} peças\n`;
      }
    });

    // 3. Detalhe dos Meiões
    text += `
*3. MEIÕES EXTRAS (${totalSocks} Pares)*
------------------------------------------------
`;
    if (config.socks.length === 0 || totalSocks === 0) {
      text += '- NENHUM meião extra solicitado.\n';
    } else {
      config.socks.forEach(sock => {
        if (sock.quantity > 0) {
          text += `- ${sock.color}: ${sock.quantity} pares\n`;
        }
      });
    }

    // 4. Lista de Atletas (Roster)
    text += `
*4. LISTA DE PERSONALIZAÇÃO (DETALHADA)*
------------------------------------------------
`;
    let currentKitType: keyof typeof KIT_TYPES | null = null;
    let groupIndex = 0;
    
    roster.forEach(p => {
        if (p.kitType !== currentKitType) {
            currentKitType = p.kitType;
            groupIndex = 1;
            text += `\n- CATEGORIA: ${KIT_TYPES[p.kitType]} -\n`;
        }
        text += `${groupIndex}. NOME: ${p.name || '(Vazio)'} | NÚMERO: ${p.number || '(Vazio)'} | TAMANHO: ${p.size} | ITEM: ${p.type.toUpperCase()}\n`;
        groupIndex++;
    });

    text += `
------------------------------------------------
*INSTRUÇÃO DE ENVIO:*
Por favor, envie esta mensagem e ANEXE os prints/artes de cada modelo (Linha, Goleiro, etc.) para darmos seguimento à produção da arte final.
`;
    
    return text.trim();
  };

  const generateWhatsAppLink = () => {
    const numeroUniSport = '5516991679072'; // Número fornecido pelo usuário para teste
    const text = generateOrderText();
    return `https://wa.me/${numeroUniSport}?text=${encodeURIComponent(text.replace(/\n/g, '%0A'))}`;
  };

  const handleDownload = () => {
    const textContent = generateOrderText();
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PedidoDSportivo_${config.customerInfo.customerName.replace(/ /g, '_') || 'Draft'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  // --- Componentes ---

  const ModalDetalhesLinha = ({ lineKey }: { lineKey: keyof typeof LINE_DETAILS }) => {
    const details = LINE_DETAILS[lineKey];
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(null)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-start">
            <h3 className={`text-2xl font-bold ${details.color.replace('bg-', 'text-')}`}>{details.name}</h3>
            <button onClick={() => setModalOpen(null)} className="text-gray-400 hover:text-gray-800"><X size={24} /></button>
          </div>
          <p className="text-gray-700">{details.desc}</p>
          
          <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-center h-48">
            <div className="text-center text-gray-500">
              <Shirt size={32} className="mx-auto mb-2" />
              
            </div>
          </div>

          <p className="text-sm text-gray-500 pt-2">
            *O valor desta linha é uma estimativa baseada no seu nível de qualidade.
          </p>
        </div>
      </div>
    );
  };
  
  // Componente de Input de Quantidade (Reutilizável)
  const QuantityInput = ({ kitType }: { kitType: keyof typeof KIT_TYPES }) => (
    <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 flex flex-col justify-center">
        <label className="block text-sm font-bold text-indigo-900 mb-2">{KIT_TYPES[kitType]}</label>
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setConfig(prev => ({ 
                ...prev, 
                kitQuantities: { ...prev.kitQuantities, [kitType]: Math.max(0, prev.kitQuantities[kitType] - 1) } 
                }))}
                className="w-10 h-10 rounded-lg bg-white text-indigo-600 font-bold border border-indigo-200 hover:bg-indigo-100 text-lg"
            >-</button>
            <input 
                type="number" 
                min="0"
                value={config.kitQuantities[kitType]}
                onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                kitQuantities: { ...prev.kitQuantities, [kitType]: Math.max(0, parseInt(e.target.value) || 0) } 
                }))}
                className="w-20 text-center text-2xl font-bold bg-transparent border-b-2 border-indigo-300 focus:outline-none text-indigo-900"
            />
            <button 
                onClick={() => setConfig(prev => ({ 
                ...prev, 
                kitQuantities: { ...prev.kitQuantities, [kitType]: prev.kitQuantities[kitType] + 1 } 
                }))}
                className="w-10 h-10 rounded-lg bg-white text-indigo-600 font-bold border border-indigo-200 hover:bg-indigo-100 text-lg"
            >+</button>
        </div>
    </div>
  );


  // --- Steps ---

  const renderStep1 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Escolha sua Linha Ideal!</h2>
        <p className="text-gray-500">Defina o padrão de tecido e acabamento para seu pedido.</p>
      </div>

      {/* Seleção de Linha */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(LINE_DETAILS) as Array<keyof typeof LINE_DETAILS>).map((key) => (
          <div key={key} className="relative">
            <button
              onClick={() => setModalOpen(key)}
              className="absolute top-3 right-3 text-gray-400 hover:text-indigo-600 z-10 p-1 rounded-full bg-white/70 backdrop-blur-sm transition-colors"
              title="Ver detalhes da Linha"
            >
              <Maximize2 size={16} />
            </button>
            <button
              onClick={() => setConfig({ ...config, line: key, socks: config.socks.map(s => ({...s, quantity: 0})) })}
              className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-xl hover:scale-[1.02] ${
                config.line === key 
                  ? `border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-200` 
                  : 'border-gray-200 bg-gray-50 hover:bg-white'
              }`}
            >
              <div className={`w-12 h-12 rounded-full ${LINE_DETAILS[key].color} text-white flex items-center justify-center mb-4 shadow-md`}>
                <Trophy size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{LINE_DETAILS[key].name}</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-2">{LINE_DETAILS[key].desc}</p>
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-8">
        <button 
          onClick={() => setStep(2)}
          className={`px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all shadow-lg bg-gray-900 text-white hover:bg-gray-800 hover:scale-105`}
        >
          Próximo: Quantidades <ArrowRight size={20} />
        </button>
      </div>
      {modalOpen && <ModalDetalhesLinha lineKey={modalOpen} />}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Escolha a quantidade que deseja de cada Item</h2>
        <p className="text-gray-500">Distribua o pedido entre as categorias e defina a necessidade de meiões.</p>
      </div>

      {/* Quantidades Detalhadas (Agrupadas) */}
      <div className="space-y-6">
        {/* Grupo 1: Linha / Goleiro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuantityInput kitType="linha" />
            <QuantityInput kitType="goleiro" />
        </div>
        
        {/* Grupo 2: Comissão Técnica / Atleta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuantityInput kitType="comissao" />
            <QuantityInput kitType="atleta" />
        </div>

        {/* Grupo 3: Torcida */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuantityInput kitType="torcida" />
            <div className="bg-gray-100 rounded-2xl p-4 flex items-center justify-center border border-gray-200">
                <span className="text-gray-500 italic text-sm">Espaço reservado para futuras categorias</span>
            </div>
        </div>
      </div>
      
      <div className="bg-gray-100 rounded-2xl p-4 text-center border border-gray-200">
          <p className="text-xl font-bold text-gray-800">Total de Kits/Peças Principais: {totalKits}</p>
          {!minOrderMet && (
            <p className="text-red-500 text-sm mt-1 font-medium flex items-center justify-center gap-1">
                <AlertTriangle size={16} /> Pedido mínimo: 10 peças. Faltam {10 - totalKits} peças.
            </p>
          )}
      </div>

      {/* Configuração de Meiões Flexível */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 space-y-4">
          <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2 mb-4"><Footprints size={20} /> Meiões a Parte (Múltiplas Cores)</h3>
          
          <div className="space-y-3">
            {config.socks.map(sock => (
              <div key={sock.id} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                
                {/* Seleção de Cor */}
                <div className="flex-1">
                  <select 
                    value={sock.color}
                    onChange={(e) => updateSockEntry(sock.id, 'color', e.target.value)}
                    className="w-full h-10 rounded-lg bg-gray-50 border border-gray-300 text-gray-700 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="w-8 h-8 rounded-md bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 text-base"
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
                    className="w-8 h-8 rounded-md bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 text-base"
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
              
              <h3 className="text-lg font-bold text-gray-800 mb-4">{KIT_TYPES[key]} ({config.kitQuantities[key]} peças)</h3>

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

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                />
                <input 
                    type="tel" 
                    placeholder="Número de Telefone (Ex: 16 99123-4567)"
                    value={config.customerInfo.customerPhone}
                    onChange={(e) => handleCustomerInfoChange('customerPhone', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
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
                    sectionHeader = (
                      <tr className="bg-indigo-100/70 border-b border-indigo-200">
                        <td colSpan={5} className="px-4 py-2 font-bold text-indigo-900 text-left text-sm">
                          {KIT_TYPES[player.kitType]} ({config.kitQuantities[player.kitType]} Peças)
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
                            className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none py-1 placeholder-gray-300"
                            value={player.name}
                            onChange={(e) => handleRosterChange(index, 'name', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input 
                            type="text" 
                            placeholder={player.kitType === 'comissao' ? 'TÉC' : '10'}
                            className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none py-1 text-center placeholder-gray-300"
                            value={player.number}
                            onChange={(e) => handleRosterChange(index, 'number', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select 
                            className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none py-1 text-gray-700"
                            value={player.size}
                            onChange={(e) => handleRosterChange(index, 'size', e.target.value)}
                          >
                            {ALL_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <select 
                            className="w-full bg-indigo-50/50 border-none rounded text-indigo-900 font-medium py-1 px-2 text-xs focus:ring-2 focus:ring-indigo-200"
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
                <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Total Estimado do Orçamento ({LINE_DETAILS[config.line].name})</span>
                <div className="text-3xl font-bold text-green-400">
                R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-xs text-gray-500 italic">*O valor final será confirmado após análise da arte.</span>
            </div>

            {/* Ações */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
                
                {/* 1. Download/PDF */}
                <button 
                    onClick={handleDownload}
                    disabled={!requiredFieldsFilled}
                    className={`flex-1 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg text-white ${
                        requiredFieldsFilled 
                        ? 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 shadow-indigo-300/50' 
                        : 'bg-indigo-400 cursor-not-allowed'
                    }`}
                >
                    <Download size={20} /> Baixar Orçamento (Arquivo de Texto)
                </button>

                {/* 2. Enviar WhatsApp */}
                <a 
                    href={generateWhatsAppLink()}
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => { if (!requiredFieldsFilled) e.preventDefault(); }}
                    className={`flex-1 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                        requiredFieldsFilled 
                        ? 'bg-[#25D366] hover:bg-[#20bd5a] text-white hover:scale-105 shadow-green-200/50'
                        : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    }`}
                >
                    <Send size={20} /> Enviar via WhatsApp
                </a>
            </div>

            {!requiredFieldsFilled && (
                <p className="text-red-300 text-sm mt-2 text-center font-medium">
                    Preencha Nome Completo e Telefone para enviar o pedido.
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
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-indigo-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 flex items-center justify-center">
              {/* Logo D'Sportivo */}
              <DsPortivoLogo />
            </div>
            <span className="text-xl font-bold tracking-tight">D'Sportivo</span>
          </div>
          <div className="text-xs font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full hidden sm:block">
            Simulador de Orçamento v3.3
          </div>
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

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 md:p-10 min-h-[600px]">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
      </main>
    </div>
  );
}