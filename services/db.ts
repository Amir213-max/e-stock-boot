
import { KBItem, ChatLog, Feedback, LandingConfig, KnowledgeSnippet, Customer, AppSettings } from '../types';
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

// Initial System Documentation - Exhaustive Mapping from Provided Images
const CORE_DOCS = `
== الدليل المعتمد النهائي لنظام e-stock (Modern Soft) ==

**تعليمات التشغيل للبوت:**
1. أنت المساعد الفني الرسمي لشركة Modern Soft.
2. ممنوع تماماً ذكر أي شاشة أو مسار غير موجود في القوائم أدناه.
3. إذا سأل العميل "ألاقي فين كذا؟" أو "أجيب الشاشة دي منين؟"، التزم بالمسار (القائمة الرئيسية -> الشاشة الفرعية).
4. استخدم اللهجة المصرية المحترمة والودودة.

---
### 🗺️ خريطة شاشات البرنامج (بناءً على قوائم النظام)

#### 1. قائمة [المخازن]
- المخازن الداخلية للفرع.
- تحويل أصناف بين المخازن.
- تقرير تحويلات الأصناف بين المخازن.
- تعديل تكلفة الأصناف الموجودة بالمخزن.
- جرد وضبط كميات الأصناف.
- تقرير بتعديلات كميات أصناف.
- تقرير كميات أصناف المخازن طبقاً لتواريخ الصلاحية.
- **تقرير كميات أصناف مخازن:** (هام جداً) لو عاوز تعرف إجمالي تكلفة الأصناف وعددها وإجمالي بيعها، ادخل الشاشة دي واعمل "بحث" عشان يظهر كل الأصناف، وبعدين اضغط "معاينة طباعة" وروح لآخر صفحة هتلاقي فيها الإجمالي بالظبط.
- تقرير طابعة الجرد للمخزن.
- تقرير أصناف منتهية الصلاحية فى المخزن.
- تقرير حركة صنف فى المخزن.
- الأرصدة الإفتتاحية للمخزن.
- الجرد الدوري.
- تقرير الجرد الدوري.

#### 2. قائمة [الموردين]
- قائمة الموردين (لإضافة أو تعديل مورد).
- تقرير عن الموردين.
- تعديل أسعار مورد.
- تقرير أصناف مورد.
- مقارنة أسعار صنف للموردين.
- الأرصدة الإفتتاحية للموردين.
- كشف حساب مورد.

#### 3. قائمة [المشتريات]
- فاتورة شراء.
- مرتجع شراء من فاتورة.
- مرتجع شراء بدون فاتورة.
- تقرير ملخص فواتير المشتريات.
- تقرير فواتير المشتريات بالأصناف.
- تقرير حركة مشتريات صنف.
- تقرير إجمالى المرتجعات لمورد.
- تقرير إجمالى مشتريات و مرتجعات مورد.
- تقرير مقارنة قيمة المشتريات طبقاً لقيمة المبيعات شهرياً.
- تقرير بونص مشتريات الأصناف.
- تقرير مشتريات الأصناف الضريبية.

#### 4. قائمة [العملاء]
- قائمة العملاء.
- تقرير بالعملاء.
- التعاقدات.
- مناطق العملاء.
- الأرصدة الإفتتاحية للعملاء.
- تقرير عن العملاء بالمنطقة.
- كشف حساب عميل.
- تقرير مبيعات أصناف عميل.

#### 5. قائمة [المبيعات]
- فاتورة المبيعات (Alt+S).
- مرتجع المبيعات من فاتورة.
- إقفال الفواتير المعلقة.
- إستبدال أصناف.
- تقرير فواتير المبيعات عن فترة.
- تقرير مبيعات أصناف عن فترة.
- تقرير مرتجع المبيعات عن فترة.
- تقرير حركة بيع الأصناف.
- تقرير فواتير التوصيل الملغاة عن فترة.
- تقرير حركة مبيعات صنف.
- تقرير كميات أصناف لم تباع.
- تقرير مبيعات الموظفين يومى.
- تقرير مندوبين التوصيل المنزلي.
- الكاشير.
- تقفيل درج الكاشير.
- تقرير تقفيل درج الكاشير.
- مبيعات الفيزا.
- تقرير مبيعات بالشركة المنتجة للأصناف.
- تقرير مبيعات العملاء.
- تقرير قيمة المبيعات باليوم.
- تقرير بقيم أنواع المبيعات شهرى.
- تقرير تكلفة المبيعات ونسبة الربح.
- تقرير فواتير البيع لصاحب التعاقد.
- تقرير إجمالى فواتير البيع لصاحب التعاقد.
- تقرير فواتير البيع بالأصناف لصاحب التعاقد.
- تقرير إجمالى بيع التعاقد.

#### 6. قائمة [الحسابات اليومية]
- النقدية المتاحة.
- صرف نقدية.
- توريد نقدية.
- سحب نقدية من حساب البنك.
- تقرير المصروفات النقدية.
- تقرير توريدات النقدية.
- تقرير تحويلات النقدية.
- إصدار شيك.
- استلام شيك.
- تقفيل الشيكات المستلمة.
- تقفيل الشيكات الصادرة.
- تقرير الشيكات المستلمة.
- تقرير الشيكات الصادرة.
- تقرير شيكات البنك طبقاً لتاريخ الاستحقاق.

#### 7. قائمة [الحسابات العامة]
- شجرة الحسابات.
- إنشاء درج الكاشير.
- إنشاء خزينة.
- إنشاء بنك.
- إنشاء حساب بنكى.
- إنشاء حساب بطاقات الإئتمان.
- أسباب الخصم والإضافة فى الحسابات.
- المساهمين.
- توريد رأس المال.
- تقرير توريدات رأس المال.
- صرف أرباح.
- تقرير صرف الأرباح.
- حسابات الخصم والإضافة.
- تقرير حسابات الخصم والإضافة.
- تقرير أدراج الكاشيرات.
- تقرير الخزائن.
- تقرير الحسابات البنكية.
- تقرير كشف حساب الخزينة أو الدرج.
- حركة الحساب شهرى.
- تقرير حركة الحساب الشهرى تفصيلى.
- تقرير القيود اليومية.
- قائمة الدخل.
- ملخص الموقف المالى للمؤسسة.

#### 8. قائمة [الطلبيات]
- ضبط حد الطلب للأصناف.
- إعداد طلبية.
- كشكول النواقص.
- تقرير أصناف وصلت حد الطلب.

#### 9. قائمة [شئون العاملين]
- الوظائف.
- الموظفين.
- صلاحيات الموظفين.
- الحضور و الإنصراف.
- تقرير الحضور و الانصراف.
- تسجيل الغياب والاجازات.
- تسجيل خصم الغياب للموظفين.
- تقرير خصم الغياب.
- حساب عمولة مندوب البيع.
- تقرير عمولات البيع.
- تسجيل خصم لموظف.
- تقرير الخصومات.
- تسجيل حوافز و بدلات موظف.
- تقرير الحوافز والبدلات.
- صرف سلف عاملين.
- توريد سلف عاملين.
- تقرير سلف العاملين.
- ترحيل كشف المرتبات.
- صرف رواتب الموظفين.
- تقرير المرتبات.
- تقرير تسجيل الدخول للبرنامج.

#### 10. قائمة [رئيسى وفروع]
- فروع المؤسسة.
- تحديث بيانات مخازن الفروع.
- إرسال طلبية لفرع.
- إستلام طلبية من فرع.
- تقرير تحويلات الأصناف بين الفروع.
- طلب شراء.
- كشكول نواقص الفروع.
- تقرير المخزون الزائد عن حاجة الفروع.
- كشكول نواقص الرئيسي بارصدة مجمعة.
- مبيعات أصناف الفروع.
- تقرير حركة بيع الأصناف (للفروع).
- تقرير قيمة المبيعات باليوم (للفروع).
- تقرير بقيم أنواع المبيعات شهرى (للفروع).
- تقرير تكلفة المبيعات ونسبة الربح (للفروع).
- النقدية المتوفرة بالفروع.
- إرسال نقدية لفرع.
- خصم و إضافة على حساب الفرع.
- كشف حساب فرع.

#### 11. قائمة [البيانات العامة]
- بيانات المؤسسة.
- إعدادات التشغيل.
- إعدادات طباعة فاتورة البيع.
- إعدادات طباعة الباركود.
- أخذ نسخة احتياطية.
- نسخ احتياطية دورية.
- حجم قاعدة البيانات.
- طباعة باركود.
- فتح الدرج.
- إصدار فاتورة ورقية للتعاقد.
- Update System.

#### 12. قائمة [الأصناف]
- قائمة الأصناف.
- وحدات الأصناف.
- الشركات المنتجة.
- تقرير أصناف بالشركة المنتجة.
- أماكن الأصناف.
- تحديد أماكن الأصناف.
- تقرير أصناف حسب مكان الصنف.
- مجموعات الأصناف.
- تحديد المجموعة العلمية للأصناف.
- تقرير أصناف حسب المجموعة العلمية.
- الشكل الصيدلى.
- تحديد الشكل الصيدلى للأصناف.
- تقرير أصناف حسب الشكل الصيدلى.
- تقرير تاريخ إضافة الاصناف.
- تقرير أصناف تغيرت أسعارها.
- تقرير أصناف تغيرت معاملات وحداتها.
- تعديل أسعار بيع الأصناف.

#### 13. قائمة [إطار]
- لترتيب النوافذ المفتوحة داخل البرنامج.

---
### 💡 معلومات هامة من دليل التشغيل (PDF):
- **تعريف الباركود:** لازم المقاس يكون 38x25 ملم من Printer Preferences.
- **إيرور التاريخ:** لو الجهاز مطلع إيرور "مراجعة تاريخ الجهاز"، قدّم التاريخ يوم وافتح البرنامج وبعدين رجعه تانى وأنت فاتح البرنامج.
- **الشبكة:** بورت الربط بين السيرفر والفرعي هو 1433 ولازم نتأكد من الـ Firewall.
- **تحديث البرنامج:** بيتم عن طريق ملف PharmacySystemUpdate.exe الموجود في فولدر التسطيب.
`;

const INITIAL_KB: KBItem[] = [
    {
        id: '1',
        question: 'أجيب منين فاتورة المبيعات؟',
        answer: 'من قائمة [المبيعات] واختار "فاتورة المبيعات" أو اضغط على اختصار Alt+S.',
        tags: ['sales', 'pos']
    }
];

const INITIAL_LANDING_CONFIG: LandingConfig = {
    heroTitle: "نبتكر الحلول، \nلتبسيط أعمالك.",
    heroSubtitle: "Modern Soft تقدم أقوى الأنظمة المحاسبية والإدارية. اكتشف نظام e-stock لإدارة الصيدليات بمفهوم جديد من الذكاء والسرعة.",
    heroButtonText: "تحدث مع المساعد الذكي",
    featuresTitle: "لماذا تختار e-stock؟",
    featuresSubtitle: "منظومة متكاملة تغطي كافة احتياجاتك الإدارية",
    features: [
        { title: 'إدارة مخزون ذكية', desc: 'تنبيهات تلقائية للنواقص وتواريخ الصلاحية لضمان عدم الخسارة.', icon: '📦' },
        { title: 'تقارير تفصيلية', desc: 'أكثر من 50 تقرير للمبيعات والأرباح وحركة الأصناف لاتخاذ قرارات دقيقة.', icon: '📊' },
        { title: 'دعم فني فوري', desc: 'مساعد ذكي يعمل بالذكاء الاصطناعي متاح 24 ساعة لحل مشاكلك.', icon: '🤖' }
    ],
    aboutCompanyText: "نقدم حلولاً برمجية مبتكرة لمستقبل أعمالك. شريكك التقني للنجاح.",
    contactEmail: "support@modernsoft.com",
    contactPhone: "01272000075",
    footerText: "© 2025 جميع الحقوق محفوظة لشركة Modern Soft.",
    productsTitle: "حلول برمجية متكاملة",
    productsSubtitle: "نقدم مجموعة من الأنظمة المصممة خصيصاً لتناسب حجم وطبيعة عملك.",
    whatsappNumber: "201223438201",
    products: [
        { id: '1', name: 'e-stock Pharma', description: 'نظام إدارة الصيدليات المتكامل. يدعم الفاتورة الإلكترونية، إدارة المخزون، والربط بين الفروع.', image: 'https://placehold.co/400x300/e6f2ff/0066cc?text=e-stock+Pharma', price: '4000 ج.م' },
        { id: '2', name: 'e-stock Retail', description: 'نظام الكاشير ونقاط البيع للانشطة التجارية. سهولة في الاستخدام ودقة في الحسابات.', image: 'https://placehold.co/400x300/fff0e6/cc6600?text=e-stock+Retail', price: '4500 ج.م' }
    ],
    aboutPageTitle: "من نحن",
    aboutPageContent: "تأسست Modern Soft برؤية واضحة وهي تمكين الشركات والمؤسسات من خلال حلول برمجية ذكية ومبتكرة.",
    aboutPageImage: "https://placehold.co/800x600/f3f4f6/9ca3af?text=Modern+Soft+Team",
    contactPageTitle: "تواصل معنا",
    contactAddress: "برج لؤلؤة الهندسة, بجوار كلية الهندسة_شبين الكوم_المنوفية",
    contactMapUrl: "https://maps.google.com/maps?q=30.558778,31.015796&z=15&output=embed"
};

const KEYS = {
    KB: 'masri_agent_kb',
    LOGS: 'masri_agent_logs',
    FEEDBACK: 'masri_agent_feedback',
    ADMIN_PASS: 'masri_agent_admin_pass',
    LICENSE: 'masri_agent_license',
    DOCS: 'masri_agent_docs',
    LANDING: 'masri_agent_landing_config',
    SNIPPETS: 'masri_agent_snippets',
    CUSTOMERS: 'masri_agent_customers',
    APP_SETTINGS: 'masri_agent_app_settings'
};

const SCREEN_IMAGES: Record<string, string> = {
    sales: 'https://placehold.co/600x400/png?text=Sales+POS',
    purchases: 'https://placehold.co/600x400/png?text=Purchases',
    inventory: 'https://placehold.co/600x400/png?text=Inventory'
};

export const db = {
    getKB: async (): Promise<KBItem[]> => {
        const data = localStorage.getItem(KEYS.KB);
        return data ? JSON.parse(data) : INITIAL_KB;
    },
    saveKB: async (items: KBItem[]) => {
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
    getDocs: async (): Promise<string> => {
        // Strategy: Check for Manual/Custom docs. If they exist, they are the source of truth.
        // If NOT exist, fall back to CORE_DOCS (Default E-stock Manual).

        if (dbInstance) {
            try {
                const docRef = doc(dbInstance, "settings", "manual");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const content = docSnap.data().content;
                    // If content is explicitly empty string, it means user deleted everything.
                    // So we only return CORE_DOCS if document doesn't exist at all.
                    if (content !== undefined) return content;
                }
            } catch (e) { /* fallback to local */ }
        }

        // Check Local Storage
        const localDocs = localStorage.getItem(KEYS.DOCS);
        if (localDocs !== null) {
            return localDocs;
        }

        // Default Fallback
        return CORE_DOCS;
    },
    saveDocs: async (text: string) => {
        if (dbInstance) {
            try {
                await setDoc(doc(dbInstance, "settings", "manual"), { content: text, timestamp: Date.now() });
            } catch (e) {
                console.error("Firestore saveDocs error", e);
            }
        }
        localStorage.setItem(KEYS.DOCS, text);
    },
    getManualOnly: async (): Promise<string> => {
        // Alias for getDocs now, as we merged them into a single source of truth
        return db.getDocs();
    },
    getDocLength: async (): Promise<number> => {
        const docs = await db.getDocs();
        return docs.length;
    },
    resetDocs: async (): Promise<number> => {
        // Defines "Delete" as clearing the content completely
        if (dbInstance) {
            try {
                await setDoc(doc(dbInstance, "settings", "manual"), { content: "" });
            } catch (e) { console.error(e); }
        }
        localStorage.setItem(KEYS.DOCS, "");
        return 0;
    },
    restoreDefaults: async (): Promise<number> => {
        // New function to restore original manual
        if (dbInstance) {
            try {
                await deleteDoc(doc(dbInstance, "settings", "manual"));
            } catch (e) { console.error(e); }
        }
        localStorage.removeItem(KEYS.DOCS);
        return CORE_DOCS.length;
    },
    getSnippets: async (): Promise<KnowledgeSnippet[]> => {
        if (dbInstance) {
            try {
                const q = query(collection(dbInstance, "snippets"), orderBy("timestamp", "desc"));
                const querySnapshot = await getFsDocs(q);
                return querySnapshot.docs.map(d => d.data() as KnowledgeSnippet);
            } catch (e) {
                console.error("Firestore getSnippets error", e);
            }
        }
        const data = localStorage.getItem(KEYS.SNIPPETS);
        return data ? JSON.parse(data) : [];
    },
    addSnippet: async (snippet: KnowledgeSnippet) => {
        if (dbInstance) {
            try {
                await setDoc(doc(dbInstance, "snippets", snippet.id), snippet);
            } catch (e) {
                console.error("Firestore addSnippet error", e);
            }
        }
        const data = localStorage.getItem(KEYS.SNIPPETS);
        const localSnippets = data ? JSON.parse(data) : [];
        localSnippets.unshift(snippet);
        localStorage.setItem(KEYS.SNIPPETS, JSON.stringify(localSnippets));
    },
    deleteSnippet: async (id: string) => {
        if (dbInstance) {
            try {
                await deleteDoc(doc(dbInstance, "snippets", id));
            } catch (e) { console.error(e); }
        }
        const data = localStorage.getItem(KEYS.SNIPPETS);
        if (data) {
            const snippets = JSON.parse(data) as KnowledgeSnippet[];
            const filtered = snippets.filter(s => s.id !== id);
            localStorage.setItem(KEYS.SNIPPETS, JSON.stringify(filtered));
        }
    },
    getLogs: async (): Promise<ChatLog[]> => {
        if (dbInstance) {
            try {
                const q = query(collection(dbInstance, "logs"), orderBy("timestamp", "desc"), limit(100));
                const querySnapshot = await getFsDocs(q);
                return querySnapshot.docs.map(d => d.data() as ChatLog);
            } catch (e) {
                console.error("Firestore getLogs error, falling back to local", e);
            }
        }
        const data = localStorage.getItem(KEYS.LOGS);
        return data ? JSON.parse(data) : [];
    },
    addLog: async (log: ChatLog) => {
        if (dbInstance) {
            try {
                await setDoc(doc(dbInstance, "logs", log.id), log);
            } catch (e) {
                console.error("Firestore addLog error", e);
            }
        }
        const localData = localStorage.getItem(KEYS.LOGS);
        const localLogs = localData ? JSON.parse(localData) : [];
        localLogs.unshift(log);
        localStorage.setItem(KEYS.LOGS, JSON.stringify(localLogs));
    },
    getFeedback: async (): Promise<Feedback[]> => {
        if (dbInstance) {
            try {
                const q = query(collection(dbInstance, "feedback"), orderBy("timestamp", "desc"), limit(100));
                const querySnapshot = await getFsDocs(q);
                return querySnapshot.docs.map(d => d.data() as Feedback);
            } catch (e) {
                console.error("Firestore getFeedback error", e);
            }
        }
        const data = localStorage.getItem(KEYS.FEEDBACK);
        return data ? JSON.parse(data) : [];
    },
    addFeedback: async (feedback: Feedback) => {
        if (dbInstance) {
            try {
                await addDoc(collection(dbInstance, "feedback"), feedback);
            } catch (e) {
                console.error("Firestore addFeedback error", e);
            }
        }
        const data = localStorage.getItem(KEYS.FEEDBACK);
        const items = data ? JSON.parse(data) : [];
        items.unshift(feedback);
        localStorage.setItem(KEYS.FEEDBACK, JSON.stringify(items));
    },
    getAdminPassword: async (): Promise<string> => {
        if (dbInstance) {
            try {
                const docRef = doc(dbInstance, "settings", "admin");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    return docSnap.data().password || 'admin123';
                }
            } catch (e) { /* ignore */ }
        }
        return localStorage.getItem(KEYS.ADMIN_PASS) || 'admin123';
    },
    saveAdminPassword: async (pass: string) => {
        if (dbInstance) {
            try {
                await setDoc(doc(dbInstance, "settings", "admin"), { password: pass });
            } catch (e) { /* ignore */ }
        }
        localStorage.setItem(KEYS.ADMIN_PASS, pass);
    },
    getLicense: (): string | null => {
        return localStorage.getItem(KEYS.LICENSE);
    },
    activateLicense: (key: string): boolean => {
        if (key.trim().toUpperCase().startsWith('ESTOCK-')) {
            localStorage.setItem(KEYS.LICENSE, key.trim());
            return true;
        }
        return false;
    },
    getScreenImage: (screenName: string): string | null => {
        return SCREEN_IMAGES[screenName?.toLowerCase()] || null;
    },
    getLandingConfig: async (): Promise<LandingConfig> => {
        let finalConfig = { ...INITIAL_LANDING_CONFIG };
        if (dbInstance) {
            try {
                const docRef = doc(dbInstance, "settings", "landing");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const remoteData = docSnap.data() as Partial<LandingConfig>;
                    finalConfig = { ...finalConfig, ...remoteData };
                }
            } catch (e) {
                console.error("Firestore getLandingConfig error", e);
            }
        } else {
            const data = localStorage.getItem(KEYS.LANDING);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    finalConfig = { ...finalConfig, ...parsed };
                } catch (e) { /* ignore */ }
            }
        }
        return finalConfig;
    },
    saveLandingConfig: async (config: LandingConfig) => {
        if (dbInstance) {
            try {
                await setDoc(doc(dbInstance, "settings", "landing"), config);
            } catch (e: any) {
                console.error("Firestore saveLandingConfig error (continuing to local save)", e);
            }
        }
        localStorage.setItem(KEYS.LANDING, JSON.stringify(config));
    },
    // --- User Management ---
    getCustomers: async (): Promise<Customer[]> => {
        if (dbInstance) {
            try {
                const q = query(collection(dbInstance, "customers"), orderBy("name"));
                const querySnapshot = await getFsDocs(q);
                return querySnapshot.docs.map(d => d.data() as Customer);
            } catch (e) {
                console.error("Firestore getCustomers error", e);
            }
        }
        const data = localStorage.getItem(KEYS.CUSTOMERS);
        return data ? JSON.parse(data) : [];
    },
    saveCustomer: async (customer: Customer) => {
        // PROTECTION: Prevent modifying 'hatem' (4998) to be inactive
        if (customer.contractNumber === '4998' && !customer.isActive) {
            console.warn("Cannot deactivate protected customer (hatem/4998). Reverting to active.");
            customer.isActive = true;
        }
        // PROTECTION: Prevent modifying 'amir' (213204) to be inactive
        if (customer.contractNumber === '213204' && !customer.isActive) {
            console.warn("Cannot deactivate protected customer (amir/213204). Reverting to active.");
            customer.isActive = true;
        }

        if (dbInstance) {
            try {
                await setDoc(doc(dbInstance, "customers", customer.id), customer);
            } catch (e) { console.error(e); }
        }
        const customers = await db.getCustomers();
        const index = customers.findIndex(c => c.id === customer.id);
        if (index >= 0) {
            customers[index] = customer;
        } else {
            customers.push(customer);
        }
        localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
    },
    deleteCustomer: async (id: string) => {
        // PROTECTION: Fetch customer locally to check contract number before deletion
        const customersCheck = await db.getCustomers();
        const target = customersCheck.find(c => c.id === id);
        if (target && target.contractNumber === '4998') {
            console.warn("Attempt to delete protected customer (hatem/4998) blocked.");
            alert("لا يمكن حذف هذا العميل (محمي).");
            return;
        }
        if (target && target.contractNumber === '213204') {
            console.warn("Attempt to delete protected customer (amir/213204) blocked.");
            alert("لا يمكن حذف هذا العميل (محمي).");
            return;
        }

        if (dbInstance) {
            try { await deleteDoc(doc(dbInstance, "customers", id)); } catch (e) { console.error(e); }
        }
        const customers = await db.getCustomers();
        const filtered = customers.filter(c => c.id !== id);
        localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(filtered));
    },
    authenticateCustomer: async (name: string, contractNumber: string): Promise<Customer | null> => {
        // PROTECTION: Hardcoded access for 'hatem' / '4998'
        if (name.trim().toLowerCase() === 'hatem' && contractNumber.trim() === '4998') {
            const customers = await db.getCustomers();
            let protectedCustomer = customers.find(c => c.contractNumber === '4998');

            if (!protectedCustomer) {
                // Auto-create if not exists
                protectedCustomer = {
                    id: 'protected_hatem_4998',
                    name: 'hatem',
                    contractNumber: '4998',
                    isActive: true,
                    createdAt: Date.now(),
                    lastLogin: Date.now()
                };
                await db.saveCustomer(protectedCustomer);
            } else if (!protectedCustomer.isActive) {
                // Force reactivate if somehow deactivated
                protectedCustomer.isActive = true;
                await db.saveCustomer(protectedCustomer);
            }

            return protectedCustomer;
        }

        // PROTECTION: Hardcoded access for 'amir' / '213204'
        if (name.trim().toLowerCase() === 'amir' && contractNumber.trim() === '213204') {
            const customers = await db.getCustomers();
            let protectedCustomer = customers.find(c => c.contractNumber === '213204');

            if (!protectedCustomer) {
                // Auto-create if not exists
                protectedCustomer = {
                    id: 'protected_amir_213204',
                    name: 'amir',
                    contractNumber: '213204',
                    isActive: true,
                    createdAt: Date.now(),
                    lastLogin: Date.now()
                };
                await db.saveCustomer(protectedCustomer);
            } else if (!protectedCustomer.isActive) {
                // Force reactivate if somehow deactivated
                protectedCustomer.isActive = true;
                await db.saveCustomer(protectedCustomer);
            }

            return protectedCustomer;
        }

        const customers = await db.getCustomers();
        const customer = customers.find(c =>
            c.name.trim() === name.trim() &&
            c.contractNumber.trim() === contractNumber.trim()
        );
        if (customer && customer.isActive) {
            // Update last login
            customer.lastLogin = Date.now();
            await db.saveCustomer(customer);
            return customer;
        }
        return null;
    },
    bulkAddCustomers: async (newCustomers: Customer[]) => {
        // For local storage, it's easy. For Firestore, we might want to batch, but for now loop is fine as it's not massive scale.
        const current = await db.getCustomers();
        const uniqueNew = newCustomers.filter(nc => !current.some(c => c.contractNumber === nc.contractNumber));

        for (const c of uniqueNew) {
            await db.saveCustomer(c);
        }
        return uniqueNew.length;
    },

    // --- App Settings ---
    getAppSettings: async (): Promise<AppSettings> => {
        if (dbInstance) {
            try {
                const docRef = doc(dbInstance, "settings", "app_config");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) return docSnap.data() as AppSettings;
            } catch (e) { /* ignore */ }
        }
        const data = localStorage.getItem(KEYS.APP_SETTINGS);
        return data ? JSON.parse(data) : { sessionTimeoutMinutes: 15 };
    },
    saveAppSettings: async (settings: AppSettings) => {
        if (dbInstance) {
            try {
                await setDoc(doc(dbInstance, "settings", "app_config"), settings);
            } catch (e) { console.error(e); }
        }
        localStorage.setItem(KEYS.APP_SETTINGS, JSON.stringify(settings));
    }
};

