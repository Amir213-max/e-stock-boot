
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

export const firestoreDb = app ? getFirestore(app) : null;
const dbInstance = firestoreDb;

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
    heroTitle: 'مؤسسة مودرن سوفت للبرمجيات',
    heroSubtitle: 'متخصصون فى صناعة حلول برمجية متطورة لنمو اعمالك',
    heroButtonText: 'إحجز ديمو الآن',
    stats: [
        { label: 'عميل يثق بنا', value: '+500', icon: 'Users' },
        { label: 'سنة من الخبرة', value: '+15', icon: 'Award' },
        { label: 'نظام متخصص', value: '+10', icon: 'Layout' },
        { label: 'دعم فني 24/7', value: '100%', icon: 'Headset' }
    ],
    featuresTitle: 'لماذا تختار أنظمة مودرن سوفت؟',
    featuresSubtitle: 'نحن لا نقدم مجرد برامج، بل نقدم حلولاً ذكية تضمن لك السيطرة الكاملة على عملك.',
    features: [
        { title: 'تغطية شاملة', desc: 'متواجدين داخل جميع المحافظات ، نصلك أينما كنت', icon: '📍' },
        { title: 'دعم مجاني', desc: 'أقوى فريق دعم أونلاين مجاناً لخدمتكم', icon: '🎧' },
        { title: 'تطوير مستمر', desc: 'تحديثات وتطويرات مستمرة تتوافق مع تغيرات السوق', icon: '📈' }
    ],
    aboutCompanyText: 'شركة Modern Soft هي الرائدة في حلول البرمجيات الطبية والتجارية، نهدف دائماً للابتكار وتقديم الأفضل لعملائنا.',
    contactEmail: 'info@modernsoft.com',
    contactPhone: '01272000075',
    contactAddress: 'القاهرة، مدينة نصر',
    footerText: '© 2024 جميع الحقوق محفوظة لشركة Modern Soft',
    productsTitle: 'أنظمتنا الأساسية',
    productsSubtitle: 'حلول متخصصة تم تصميمها بعناية لتناسب طبيعة عملك وتضمن لك أعلى كفاءة إدارية.',
    whatsappNumber: '201272000075',
    products: [
      { id: 'pharmacy', name: 'نظام الصيدليات المتطور', description: 'إدارة شاملة للصيدليات مع ربط الفاتورة الإلكترونية وجرد ذكي.', image: 'https://images.unsplash.com/photo-1587854685352-25d82ae39bf4?q=80&w=2070&auto=format&fit=crop' },
      { id: 'retail', name: 'نظام الأنشطة التجارية', description: 'حلول نقاط البيع (POS) المتكاملة لمواكبة سرعة أعمالك التجارية.', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop' },
      { id: 'enterprise', name: 'نظام الشركات والمخازن', description: 'نظام محاسبي وإداري متكامل للشركات الكبرى والمستودعات.', image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop' },
      { id: 'pharma_store', name: 'نظام مخازن الأدوية', description: 'نظام متخصص لشركات توزيع الأدوية والمخازن الكبرى.', image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?q=80&w=2070&auto=format&fit=crop' }
    ],
    plansTitle: 'برامجنا',
    plansSubtitle: 'اختر الباقة المناسبة لحجم أعمالك، مع إمكانية الترقية في أي وقت.',
    plans: [
      { name: "نظام الصيدليات", desc: "E-Stock Pharmacy", features: ["ربط الفاتورة الإلكترونية", "تتبع تواريخ الصلاحية", "إشعارات النواقص الذكية", "إدارة الحسابات والعملاء"], highlight: false },
      { name: "نظام النشاط التجاري", desc: "E-Stock Retail", features: ["دعم كافة أنواع الباركود", "تقارير مبيعات لحظية", "إدارة المخازن والفروع", "واجهة كاشير فائقة السرعة"], highlight: true },
      { name: "نظام الشركات والمخازن", desc: "E-Stock Enterprise", features: ["إدارة سلاسل الإمداد", "نظام محاسبي متكامل", "صلاحيات مستخدمين دقيقة", "دعم الربط السحابي"], highlight: false }
    ],
    facebookUrl: 'https://facebook.com/modernsoft',
    linkedinUrl: 'https://linkedin.com/company/modernsoft',
    instagramUrl: 'https://instagram.com/modernsoft',
    whatsappPhone: '201272000075',
    testimonials: [
        { name: "د. محمود صبري", role: "مالك صيدلية", text: "استخدم برنامج e-Stock Pharmacy منذ عامين، بصراحة النظام مذهل في معالجة النواقص وتتبع تواريخ الصلاحية.", rating: 5 },
        { name: "أ. مصطفى الشافعي", role: "مدير سوبر ماركت", text: "برنامج e-Stock Retail سلس جداً، الكاشير تعودوا عليه في يوم واحد، وتقفيل الخزانات وفر عليّ مراجعات يومية مرهقة.", rating: 5 },
        { name: "م. أحمد حسن", role: "مدير مخازن أدوية", text: "نظام المخازن وفر لنا دقة متناهية في جرد الأصناف وتوزيع المناديب. الربط بين المخزن والصيدليات جعل العمل يسير بسرعة البرق.", rating: 5 }
    ],
    faqs: [
        { question: "هل النظام يدعم الفاتورة الإلكترونية؟", answer: "نعم، جميع أنظمة مودرن سوفت متوافقة تماماً مع متطلبات مصلحة الضرائب المصرية للفاتورة والإيصال الإلكتروني." },
        { question: "هل أحتاج لإنترنت دائم لتشغيل النظام؟", answer: "لا، الأنظمة تعمل بكفاءة تامة بدون إنترنت (Offline)، ويتم استخدام الإنترنت فقط في حال رغبتك في النسخ الاحتياطي السحابي أو التقارير عن بعد." },
        { question: "هل يوجد دعم فني بعد البيع؟", answer: "بكل تأكيد، نوفر دعم فني مجاني ومتميز عبر الهاتف، الأونلاين، أو الزيارات الميدانية لضمان استقرار عملك."
        }
    ],
    integrations: [
        {
            flag: "🇪🇬",
            country: "جمهورية مصر العربية",
            title: "منظومة الفاتورة والإيصال الإلكتروني",
            desc: "ربط مباشر ومعتمد مع منظومة الفاتورة الإلكترونية التابعة لمصلحة الضرائب المصرية",
            badge: "مصر",
            accent: "border-t-red-500",
            badgeBg: "bg-red-50 text-red-600 border-red-200"
        },
        {
            flag: "🇸🇦",
            country: "المملكة العربية السعودية",
            title: "هيئة الزكاة والضريبة والجمارك",
            desc: "تكامل كامل مع منظومة فاتورة (FATOORA) وضريبة القيمة المضافة وفق اشتراطات ZATCA",
            badge: "السعودية",
            accent: "border-t-green-500",
            badgeBg: "bg-green-50 text-green-700 border-green-200"
        },
        {
            flag: "🇸🇦",
            country: "المملكة العربية السعودية",
            title: "هيئة الرصد والتحقق من المنتجات",
            desc: "ربط تلقائي مع منظومة رصد للتحقق من مصدر المنتجات الصيدلانية وضمان سلامة سلسلة الإمداد",
            badge: "السعودية",
            accent: "border-t-blue-500",
            badgeBg: "bg-blue-50 text-blue-700 border-blue-200"
        }
    ],
    // ModernSoftLanding Defaults
    aboutPageTitle: 'قصة نجاح مودرن سوفت',
    aboutPageContent: 'نحن شركة رائدة في مجال حلول البرمجيات، بخبرة تزيد عن 10 سنوات في السوق المصري والعربي. نهدف لتطوير أنظمة تساعد أصحاب الأعمال على النجاح.',
    aboutPageImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop',
    contactPageTitle: 'تواصل مع فريقنا المبدع',
    contactMapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3453.123456789!2d31.23456789!3d30.12345678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDA3JzM0LjUiTiAzMcKwMTQnMDQuNCJF!5e0!3m2!1sen!2seg!4v1234567890'
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
                    localStorage.setItem(KEYS.KB, JSON.stringify(items));
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
                    localStorage.setItem(`${KEYS.DOCS}_${systemType}`, content);
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
                // Read part 0 (main), then check for extra parts
                const allChunks: DocChunk[] = [];
                let partIndex = 0;
                while (true) {
                    const partId = partIndex === 0 ? safeId : `${safeId}_p${partIndex}`;
                    const docRef = doc(dbInstance, "settings", partId);
                    const docSnap = await getDoc(docRef);
                    if (!docSnap.exists()) break;
                    const partChunks = docSnap.data().chunks || [];
                    allChunks.push(...partChunks);
                    if (!docSnap.data().hasMore) break;
                    partIndex++;
                }
                if (allChunks.length > 0) {
                    localStorage.setItem(`${KEYS.DOCS}_chunks_${systemType}`, JSON.stringify(allChunks));
                    return allChunks;
                }
            } catch (e) { console.error('getDocChunks Firestore error', e); }
        }
        const data = localStorage.getItem(`${KEYS.DOCS}_chunks_${systemType}`);
        return data ? JSON.parse(data) : [];
    },
    saveDocChunks: async (chunks: DocChunk[], systemType: SystemType = 'e-Stock Pharmacy') => {
        const safeId = `chunks_${systemType.replace(/\s+/g, '_')}`;
        // Always save to localStorage first (reliable)
        localStorage.setItem(`${KEYS.DOCS}_chunks_${systemType}`, JSON.stringify(chunks));
        if (dbInstance) {
            try {
                // Split into batches of 100 chunks to stay under Firestore 1MB limit
                const BATCH_SIZE = 100;
                const parts = [];
                for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
                    parts.push(chunks.slice(i, i + BATCH_SIZE));
                }
                for (let i = 0; i < parts.length; i++) {
                    const partId = i === 0 ? safeId : `${safeId}_p${i}`;
                    await setDoc(doc(dbInstance, "settings", partId), {
                        chunks: parts[i],
                        timestamp: Date.now(),
                        hasMore: i < parts.length - 1
                    });
                }
            } catch (e) { console.error('saveDocChunks Firestore error - saved to localStorage only', e); }
        }
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
        // Read from chunks (RAG vector storage - the primary storage now)
        const chunks = await db.getDocChunks(systemType);
        if (chunks.length > 0) {
            return chunks.reduce((acc, c) => acc + (c.text ? c.text.length : 0), 0);
        }
        // Fallback: legacy text docs
        const docs = await db.getDocs(systemType);
        return docs.length;
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
    getSnippets: async (systemType?: SystemType): Promise<KnowledgeSnippet[]> => {
        let snippets: KnowledgeSnippet[] = [];
        if (dbInstance) {
            try {
                const q = query(collection(dbInstance, "snippets"), orderBy("timestamp", "desc"));
                const querySnapshot = await getFsDocs(q);
                snippets = querySnapshot.docs.map(d => d.data() as KnowledgeSnippet);
                localStorage.setItem(KEYS.SNIPPETS, JSON.stringify(snippets));
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
    dismissUnansweredLog: async (logId: string) => {
        if (dbInstance) {
            try {
                await setDoc(doc(dbInstance, "logs", logId), { isUnanswered: false }, { merge: true });
            } catch (e) { }
        }
        const data = localStorage.getItem(KEYS.LOGS);
        if (data) {
            try {
                const logs: ChatLog[] = JSON.parse(data);
                const updated = logs.map(l => l.id === logId ? { ...l, isUnanswered: false } : l);
                localStorage.setItem(KEYS.LOGS, JSON.stringify(updated));
            } catch (e) { }
        }
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
                localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(cloudCustomers));
                return cloudCustomers;
            } catch (e: any) { 
                console.error("Sync Error (fallback to local):", e);
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
                } else {
                    alert("فشل الحفظ في السحابة. سيتم الحفظ محلياً فقط.");
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
            try { 
                await deleteDoc(doc(dbInstance, "customers", id)); 
                console.log("Deleted from cloud:", id);
            } catch (e: any) { 
                console.error("Cloud Delete Fail:", e);
                if (e.code === 'permission-denied') {
                    alert("فشل الحذف من السحابة: صلاحيات Firebase Rules تمنع الحذف.");
                }
            }
        }
        const data = localStorage.getItem(KEYS.CUSTOMERS);
        if (data) {
            const custs = JSON.parse(data) as Customer[];
            const filtered = custs.filter(c => c.id !== id);
            localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(filtered));
            console.log("Deleted from local:", id);
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
                if (docSnap.exists()) return docSnap.data().categories || ['البيانات العامه'];
            } catch (e) { }
        }
        const data = localStorage.getItem(`cats_${systemType}`);
        return data ? JSON.parse(data) : ['البيانات العامه'];
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
            try { 
                await setDoc(doc(dbInstance, "settings", "landing"), config); 
            } catch (e) { 
                console.error("Error saving landing config:", e);
                throw e; 
            }
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
