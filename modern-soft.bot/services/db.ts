
import { KBItem, ChatLog, Feedback, LandingConfig, KnowledgeSnippet, Customer, AppSettings, SystemType, DocChunk, TroubleshootFlow } from '../types';
import { app } from './firebase';
import {
    getFirestore,
    collection,
    getDocs as getFsDocs,
    addDoc,
    setDoc,
    doc,
    getDoc,
    query,
    orderBy,
    limit,
    deleteDoc,
    where
} from 'firebase/firestore';

const dbInstance = app ? getFirestore(app) : null;

// Helper: Cosine Similarity for Vector Search
function cosineSimilarity(a: number[], b: number[]) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

const KEYS = {
    KB: 'mosaad_kb',
    DOCS: 'mosaad_docs',
    LOGS: 'mosaad_logs',
    FEEDBACK: 'mosaad_feedback',
    LANDING: 'mosaad_landing',
    SNIPPETS: 'mosaad_snippets',
    CUSTOMERS: 'mosaad_customers',
    APP_SETTINGS: 'mosaad_app_settings',
    ADMIN_PASS: 'mosaad_admin_pass',
    LICENSE: 'mosaad_license',
    FLOWS: 'mosaad_flows'
};

const INITIAL_KB: KBItem[] = [];

const INITIAL_LANDING_CONFIG: LandingConfig = {
    heroTitle: 'المساعد الذكي لشركة Modern Soft',
    heroSubtitle: 'حلول برمجية ذكية لدعم عملائنا في كل وقت',
    heroButtonText: 'ابدأ المحادثة الآن',
    featuresTitle: 'مميزات النظام',
    featuresSubtitle: 'نقدم لك أفضل تجربة دعم فني باستخدام الذكاء الاصطناعي',
    features: [
        { title: 'دعم 24/7', desc: 'البوت متاح للرد على استفساراتك في أي وقت بدون انتظار.', icon: '⚡' },
        { title: 'أمان البيانات', desc: 'نضمن سرية وخصوصية بيانات عملائنا بأعلى معايير التشفير.', icon: '🔒' },
        { title: 'تكامل تام', desc: 'ربط مباشر مع قواعد بيانات e-stock لضمان دقة المعلومة.', icon: '🔄' }
    ],
    aboutCompanyText: 'شركة Modern Soft هي الرائدة في حلول البرمجيات الطبية والتجارية في مصر.',
    contactEmail: 'support@modernsoft.com',
    contactPhone: '0123456789',
    footerText: '© 2024 جميع الحقوق محفوظة لشركة Modern Soft',
    productsTitle: 'أنظمتنا الذكية',
    productsSubtitle: 'اختر النظام المناسب لمجال عملك',
    whatsappNumber: '20123456789',
    products: [
      { id: 'pharma', name: 'e-Stock Pharmacy', description: 'النظام الأقوى لإدارة الصيدليات.', image: 'https://placehold.co/400x300?text=Pharmacy' },
      { id: 'retail', name: 'e-Stock Retail', description: 'إدارة مخازن ومحلات البيع بالتجزئة.', image: 'https://placehold.co/400x300?text=Retail' },
      { id: 'store', name: 'Pharma Store', description: 'نظام إدارة مخازن الأدوية والسلاسل.', image: 'https://placehold.co/400x300?text=Store' }
    ],
    aboutPageTitle: 'عن Modern Soft',
    aboutPageContent: 'نحن نؤمن بأن التكنولوجيا هي المفتاح لتطوير الأعمال...',
    aboutPageImage: 'https://placehold.co/800x400?text=About+Our+Company',
    contactPageTitle: 'اتصل بنا',
    contactAddress: 'القاهرة، مصر',
    contactMapUrl: 'https://maps.google.com'
};

const SCREEN_IMAGES: Record<string, string> = {
    sales: 'https://placehold.co/600x400/png?text=Sales+POS',
    purchases: 'https://placehold.co/600x400/png?text=Purchases',
    inventory: 'https://placehold.co/600x400/png?text=Inventory'
};

const CORE_DOCS = `== الدليل المعتمد لنظام Modern Soft ==`;

export const db = {
    getKB: async (): Promise<KBItem[]> => {
        if (dbInstance) {
            try {
                const q = query(collection(dbInstance, "kb"));
                const querySnapshot = await getFsDocs(q);
                if (!querySnapshot.empty) {
                    const items = querySnapshot.docs.map(d => d.data() as KBItem);
                    localStorage.setItem(KEYS.KB, JSON.stringify(items)); // تحديث المحلي
                    return items;
                }
            } catch (e) { console.error("Firestore getKB error", e); }
        }
        const data = localStorage.getItem(KEYS.KB);
        return data ? JSON.parse(data) : INITIAL_KB;
    },
    saveKB: async (items: KBItem[]) => {
        if (dbInstance) {
            try {
                for (const item of items) {
                    await setDoc(doc(dbInstance, "kb", item.question.replace(/\//g, '_')), item);
                }
            } catch (e) { console.error("Firestore saveKB error", e); }
        }
        localStorage.setItem(KEYS.KB, JSON.stringify(items));
    },
    searchKB: async (query: string): Promise<string | null> => {
        const items = await db.getKB();
        const q = query.toLowerCase();
        const match = items.find(item => item.question.includes(q));
        return match ? match.answer : null;
    },
    getCoreDocs: (): string => {
        return CORE_DOCS;
    },
    getDocs: async (systemType: SystemType = 'e-Stock Pharmacy'): Promise<string> => {
        const safeId = `manual_${systemType.replace(/\s+/g, '_')}`;
        if (dbInstance) {
            try {
                const docRef = doc(dbInstance, "settings", safeId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const content = docSnap.data().content || "";
                    localStorage.setItem(`${KEYS.DOCS}_${systemType}`, content); // تحديث المحلي
                    return content;
                }
            } catch (e) { }
        }
        return localStorage.getItem(`${KEYS.DOCS}_${systemType}`) || "";
    },
    saveDocs: async (text: string, systemType: SystemType = 'e-Stock Pharmacy') => {
        const safeId = `manual_${systemType.replace(/\s+/g, '_')}`;
        if (dbInstance) {
            try { await setDoc(doc(dbInstance, "settings", safeId), { content: text, timestamp: Date.now() }); } catch (e) { }
        }
        localStorage.setItem(`${KEYS.DOCS}_${systemType}`, text);
    },
    getMenus: async (systemType: SystemType = 'e-Stock Pharmacy'): Promise<string> => {
        const safeId = `menus_${systemType.replace(/\s+/g, '_')}`;
        if (dbInstance) {
            try {
                const docRef = doc(dbInstance, "settings", safeId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) return docSnap.data().content || "";
            } catch (e) { }
        }
        return localStorage.getItem(`${KEYS.DOCS}_menus_${systemType}`) || "";
    },
    saveMenus: async (text: string, systemType: SystemType = 'e-Stock Pharmacy') => {
        const safeId = `menus_${systemType.replace(/\s+/g, '_')}`;
        if (dbInstance) {
            try { await setDoc(doc(dbInstance, "settings", safeId), { content: text, timestamp: Date.now() }); } catch (e) { }
        }
        localStorage.setItem(`${KEYS.DOCS}_menus_${systemType}`, text);
    },
    getDocChunks: async (systemType: SystemType = 'e-Stock Pharmacy'): Promise<DocChunk[]> => {
        const safeId = `chunks_${systemType.replace(/\s+/g, '_')}`;
        if (dbInstance) {
            try {
                const docRef = doc(dbInstance, "settings", safeId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) return docSnap.data().chunks || [];
            } catch (e) { }
        }
        const data = localStorage.getItem(`${KEYS.DOCS}_chunks_${systemType}`);
        return data ? JSON.parse(data) : [];
    },
    saveDocChunks: async (chunks: DocChunk[], systemType: SystemType = 'e-Stock Pharmacy') => {
        const safeId = `chunks_${systemType.replace(/\s+/g, '_')}`;
        if (dbInstance) {
            try { await setDoc(doc(dbInstance, "settings", safeId), { chunks, timestamp: Date.now() }); } catch (e) { }
        }
        localStorage.setItem(`${KEYS.DOCS}_chunks_${systemType}`, JSON.stringify(chunks));
    },
    searchSimilarChunks: async (queryEmbedding: number[], systemType: SystemType = 'e-Stock Pharmacy', topK = 5): Promise<DocChunk[]> => {
        const chunks = await db.getDocChunks(systemType);
        if (chunks.length === 0) return [];
        const scoredChunks = chunks.map(chunk => ({
            chunk,
            score: cosineSimilarity(queryEmbedding, chunk.embedding)
        }));
        scoredChunks.sort((a, b) => b.score - a.score);
        return scoredChunks.slice(0, topK).map(sc => sc.chunk);
    },
    getDocLength: async (systemType: SystemType = 'e-Stock Pharmacy'): Promise<number> => {
        const chunks = await db.getDocChunks(systemType);
        return chunks.reduce((acc, chunk) => acc + chunk.text.length, 0);
    },
    resetDocs: async (systemType: SystemType = 'e-Stock Pharmacy'): Promise<number> => {
        const safeId = `manual_${systemType.replace(/\s+/g, '_')}`;
        const chunkSafeId = `chunks_${systemType.replace(/\s+/g, '_')}`;
        if (dbInstance) {
            try {
                await setDoc(doc(dbInstance, "settings", safeId), { content: "" });
                await setDoc(doc(dbInstance, "settings", chunkSafeId), { chunks: [] });
            } catch (e) { }
        }
        localStorage.setItem(`${KEYS.DOCS}_${systemType}`, "");
        localStorage.setItem(`${KEYS.DOCS}_chunks_${systemType}`, "[]");
        return 0;
    },
    restoreDefaults: async (systemType: SystemType = 'e-Stock Pharmacy'): Promise<number> => {
        await db.saveDocs(CORE_DOCS, systemType);
        return CORE_DOCS.length;
    },
    getSnippets: async (systemType?: SystemType): Promise<KnowledgeSnippet[]> => {
        let snippets: KnowledgeSnippet[] = [];
        if (dbInstance) {
            try {
                const q = query(collection(dbInstance, "snippets"), orderBy("timestamp", "desc"));
                const querySnapshot = await getFsDocs(q);
                snippets = querySnapshot.docs.map(d => d.data() as KnowledgeSnippet);
                localStorage.setItem(KEYS.SNIPPETS, JSON.stringify(snippets)); // تحديث المحلي
            } catch (e) { 
                const data = localStorage.getItem(KEYS.SNIPPETS);
                snippets = data ? JSON.parse(data) : [];
            }
        } else {
            const data = localStorage.getItem(KEYS.SNIPPETS);
            snippets = data ? JSON.parse(data) : [];
        }
        if (systemType) snippets = snippets.filter(s => s.systemType === systemType || s.systemType === 'All');
        return snippets;
    },
    addSnippet: async (snippet: KnowledgeSnippet) => {
        if (dbInstance) {
            try { await setDoc(doc(dbInstance, "snippets", snippet.id), snippet); } catch (e) { }
        }
        const data = localStorage.getItem(KEYS.SNIPPETS);
        const localSnippets = data ? JSON.parse(data) : [];
        localSnippets.unshift(snippet);
        localStorage.setItem(KEYS.SNIPPETS, JSON.stringify(localSnippets));
    },
    deleteSnippet: async (id: string) => {
        if (dbInstance) {
            try { await deleteDoc(doc(dbInstance, "snippets", id)); } catch (e) { }
        }
        const data = localStorage.getItem(KEYS.SNIPPETS);
        if (data) {
            const snips = JSON.parse(data) as KnowledgeSnippet[];
            localStorage.setItem(KEYS.SNIPPETS, JSON.stringify(snips.filter(s => s.id !== id)));
        }
    },
    getTroubleshootFlows: async (systemType?: SystemType): Promise<TroubleshootFlow[]> => {
        let flows: TroubleshootFlow[] = [];
        if (dbInstance) {
            try {
                const q = query(collection(dbInstance, "flows"));
                const querySnapshot = await getFsDocs(q);
                flows = querySnapshot.docs.map(d => d.data() as TroubleshootFlow);
            } catch (e) { }
        } else {
            const data = localStorage.getItem(KEYS.FLOWS);
            flows = data ? JSON.parse(data) : [];
        }
        if (systemType) return flows.filter(f => f.systemType === systemType || f.systemType === 'All');
        return flows;
    },
    saveTroubleshootFlow: async (flow: TroubleshootFlow) => {
        if (dbInstance) {
            try { await setDoc(doc(dbInstance, "flows", flow.id), flow); } catch (e) { }
        }
        const current = await db.getTroubleshootFlows();
        const idx = current.findIndex(f => f.id === flow.id);
        if (idx >= 0) current[idx] = flow; else current.push(flow);
        localStorage.setItem(KEYS.FLOWS, JSON.stringify(current));
    },
    deleteTroubleshootFlow: async (id: string) => {
        if (dbInstance) {
            try { await deleteDoc(doc(dbInstance, "flows", id)); } catch (e) { }
        }
        const current = await db.getTroubleshootFlows();
        localStorage.setItem(KEYS.FLOWS, JSON.stringify(current.filter(f => f.id !== id)));
    },
    getLogs: async (): Promise<ChatLog[]> => {
        if (dbInstance) {
            try {
                const q = query(collection(dbInstance, "logs"), orderBy("timestamp", "desc"), limit(100));
                const querySnapshot = await getFsDocs(q);
                return querySnapshot.docs.map(d => d.data() as ChatLog);
            } catch (e) { }
        }
        const data = localStorage.getItem(KEYS.LOGS);
        return data ? JSON.parse(data) : [];
    },
    addLog: async (log: ChatLog) => {
        if (dbInstance) {
            try { await setDoc(doc(dbInstance, "logs", log.id), log); } catch (e) { }
        }
        const data = localStorage.getItem(KEYS.LOGS);
        const logs = data ? JSON.parse(data) : [];
        logs.unshift(log);
        localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
    },
    getFeedback: async (): Promise<Feedback[]> => {
        if (dbInstance) {
            try {
                const q = query(collection(dbInstance, "feedback"), orderBy("timestamp", "desc"), limit(100));
                const querySnapshot = await getFsDocs(q);
                return querySnapshot.docs.map(d => d.data() as Feedback);
            } catch (e) { }
        }
        const data = localStorage.getItem(KEYS.FEEDBACK);
        return data ? JSON.parse(data) : [];
    },
    addFeedback: async (feedback: Feedback) => {
        if (dbInstance) {
            try { await addDoc(collection(dbInstance, "feedback"), feedback); } catch (e) { }
        }
        const data = localStorage.getItem(KEYS.FEEDBACK);
        const items = data ? JSON.parse(data) : [];
        items.unshift(feedback);
        localStorage.setItem(KEYS.FEEDBACK, JSON.stringify(items));
    },
    getCustomers: async (): Promise<Customer[]> => {
        if (dbInstance) {
            try {
                const q = query(collection(dbInstance, "customers"), orderBy("name"));
                const querySnapshot = await getFsDocs(q);
                const cloudCustomers = querySnapshot.docs.map(d => d.data() as Customer);
                localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(cloudCustomers)); // تحديث المحلي ببيانات السحابة
                return cloudCustomers;
            } catch (e: any) { 
                console.error("Firestore getCustomers error:", e);
                if (e.code === 'permission-denied') {
                    console.warn("Firebase rules are blocking read access.");
                }
            }
        }
        const data = localStorage.getItem(KEYS.CUSTOMERS);
        return data ? JSON.parse(data) : [];
    },
    saveCustomer: async (customer: Customer) => {
        if (customer.contractNumber === '4998' || customer.contractNumber === '213204') customer.isActive = true;
        if (dbInstance) {
            try { 
                await setDoc(doc(dbInstance, "customers", customer.id), customer); 
            } catch (e: any) { 
                console.error("Cloud Save Fail:", e); 
                if (e.code === 'permission-denied') {
                    alert("فشل الحفظ في السحابة: صلاحيات Firebase Rules تمنع الإضافة.");
                }
            }
        }
        const data = localStorage.getItem(KEYS.CUSTOMERS);
        const custs = data ? JSON.parse(data) as Customer[] : [];
        const idx = custs.findIndex(c => c.id === customer.id);
        if (idx >= 0) custs[idx] = customer; else custs.push(customer);
        localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(custs));
    },
    authenticateCustomer: async (name: string, contractNumber: string): Promise<Customer | null> => {
        if (name.trim().toLowerCase() === 'hatem' && contractNumber.trim() === '4998') {
             return { id: 'protected_4998', name: 'hatem', contractNumber: '4998', isActive: true, createdAt: Date.now(), systemType: 'e-Stock Pharmacy' };
        }
        if (name.trim().toLowerCase() === 'amir' && contractNumber.trim() === '213204') {
             return { id: 'protected_213204', name: 'amir', contractNumber: '213204', isActive: true, createdAt: Date.now(), systemType: 'e-Stock Pharmacy' };
        }
        const customers = await db.getCustomers();
        const found = customers.find(c => c.name.trim() === name.trim() && c.contractNumber.trim() === contractNumber.trim());
        return (found && found.isActive) ? found : null;
    },
    bulkAddCustomers: async (newCustomers: Customer[]) => {
        const current = await db.getCustomers();
        const uniqueNew = newCustomers.filter(nc => !current.some(c => c.contractNumber === nc.contractNumber));
        for (const c of uniqueNew) {
            await db.saveCustomer(c);
        }
        return uniqueNew.length;
    },
    deleteCustomer: async (id: string) => {
        if (dbInstance) {
            try { await deleteDoc(doc(dbInstance, "customers", id)); } catch (e) { }
        }
        const data = localStorage.getItem(KEYS.CUSTOMERS);
        if (data) {
            const custs = JSON.parse(data) as Customer[];
            localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(custs.filter(c => c.id !== id)));
        }
    },
    getAppSettings: async (): Promise<AppSettings> => {
        if (dbInstance) {
            try {
                const docSnap = await getDoc(doc(dbInstance, "settings", "app_config"));
                if (docSnap.exists()) return docSnap.data() as AppSettings;
            } catch (e) { }
        }
        const data = localStorage.getItem(KEYS.APP_SETTINGS);
        return data ? JSON.parse(data) : { sessionTimeoutMinutes: 15 };
    },
    saveAppSettings: async (settings: AppSettings) => {
        if (dbInstance) {
            try { await setDoc(doc(dbInstance, "settings", "app_config"), settings); } catch (e) { }
        }
        localStorage.setItem(KEYS.APP_SETTINGS, JSON.stringify(settings));
    },
    getGlobalCategories: async (systemType: SystemType): Promise<string[]> => {
        const safeId = `cats_${systemType.replace(/\s+/g, '_')}`;
        if (dbInstance) {
            try {
                const docSnap = await getDoc(doc(dbInstance, "settings", safeId));
                if (docSnap.exists()) return docSnap.data().categories || ['عام'];
            } catch (e) { }
        }
        const data = localStorage.getItem(`cats_${systemType}`);
        return data ? JSON.parse(data) : ['عام'];
    },
    saveGlobalCategories: async (categories: string[], systemType: SystemType) => {
        const safeId = `cats_${systemType.replace(/\s+/g, '_')}`;
        if (dbInstance) {
            try { await setDoc(doc(dbInstance, "settings", safeId), { categories, timestamp: Date.now() }); } catch (e) { }
        }
        localStorage.setItem(`cats_${systemType}`, JSON.stringify(categories));
    },
    getAdminPassword: async () => {
        if (dbInstance) {
            try {
                const docSnap = await getDoc(doc(dbInstance, "settings", "admin_creds"));
                if (docSnap.exists() && docSnap.data().password) return docSnap.data().password;
            } catch (e) { }
        }
        const local = localStorage.getItem(KEYS.ADMIN_PASS);
        return local || 'support';
    },
    saveAdminPassword: async (pass: string) => {
        if (dbInstance) {
            try { await setDoc(doc(dbInstance, "settings", "admin_creds"), { password: pass }); } catch (e) { }
        }
        localStorage.setItem(KEYS.ADMIN_PASS, pass);
    },
    getLandingConfig: async (): Promise<LandingConfig> => {
        if (dbInstance) {
            try {
                const docSnap = await getDoc(doc(dbInstance, "settings", "landing"));
                if (docSnap.exists()) return { ...INITIAL_LANDING_CONFIG, ...docSnap.data() };
            } catch (e) { }
        }
        const local = localStorage.getItem(KEYS.LANDING);
        return local ? JSON.parse(local) : INITIAL_LANDING_CONFIG;
    },
    saveLandingConfig: async (config: LandingConfig) => {
        if (dbInstance) {
            try { await setDoc(doc(dbInstance, "settings", "landing"), config); } catch (e) { }
        }
        localStorage.setItem(KEYS.LANDING, JSON.stringify(config));
    },
    getScreenImage: (name: string) => SCREEN_IMAGES[name?.toLowerCase()] || null,
    getLicense: () => localStorage.getItem(KEYS.LICENSE),
    activateLicense: (key: string) => {
        if (key.startsWith('ESTOCK-')) { localStorage.setItem(KEYS.LICENSE, key); return true; }
        return false;
    },
    clearAllTrainingData: async () => {
        const systems: SystemType[] = ['e-Stock Pharmacy', 'e-Stock Retail', 'Pharma Store'];
        for (const sys of systems) {
            await db.resetDocs(sys);
            await db.saveMenus("", sys);
        }
        if (dbInstance) {
            try {
                const q = query(collection(dbInstance, "snippets"));
                const querySnapshot = await getFsDocs(q);
                for (const d of querySnapshot.docs) await deleteDoc(doc(dbInstance, "snippets", d.id));
            } catch (e) { }
        }
        localStorage.setItem(KEYS.SNIPPETS, "[]");
        localStorage.setItem(KEYS.KB, "[]");
    },
    testCloudConnection: async (): Promise<{ success: boolean; error?: string }> => {
        if (!dbInstance) return { success: false, error: "Firebase index not initialized" };
        try {
            const testRef = doc(dbInstance, "settings", "connection_test");
            await setDoc(testRef, { lastTest: Date.now() }, { merge: true });
            return { success: true };
        } catch (e: any) {
            console.error("Cloud Connection Test Failed:", e);
            return { success: false, error: e.code || e.message };
        }
    }
};
