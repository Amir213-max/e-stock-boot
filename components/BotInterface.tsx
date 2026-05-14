import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration, Chat } from '@google/genai';
import { db } from '../services/db';
import { ChatLog, Customer } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Markdown custom styles renderer
const MarkdownRenderer = ({ content }: { content: string }) => {
    return (
        <div className="markdown-body text-sm sm:text-base leading-relaxed space-y-2">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-outside mb-3 mr-5" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-outside mb-3 mr-5" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold !text-inherit" {...props} />,
                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2 pb-1 border-b border-gray-200/50" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-3 mb-2" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-2 mb-1" {...props} />,
                    code: ({ node, inline, className, children, ...props }: any) =>
                        inline ?
                            <code className="bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-md text-[0.9em] font-mono font-semibold" dir="ltr" {...props}>{children}</code> :
                            <pre className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 p-4 rounded-xl my-3 overflow-x-auto shadow-sm backdrop-blur-sm" dir="ltr"><code className="text-[0.9em] font-mono text-gray-800 dark:text-gray-200" {...props}>{children}</code></pre>,
                    a: ({ node, ...props }) => <a className="underline font-semibold hover:opacity-80" target="_blank" rel="noopener noreferrer" {...props} />,
                    blockquote: ({ node, ...props }) => <blockquote className="border-r-4 border-gray-300 dark:border-gray-600 pr-3 py-1 my-2 bg-gray-50/50 dark:bg-gray-800/30 rounded-l" {...props} />
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    image?: string; // URL for display
    timestamp: Date;
    isTyping?: boolean;
}

// Typewriter Component for Streaming effect
const TypewriterText = ({ text, onComplete }: { text: string, onComplete: () => void }) => {
    const [displayed, setDisplayed] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let i = 0;
        setDisplayed('');
        
        const interval = setInterval(() => {
            setDisplayed(text.substring(0, i));
            i += 2; // Speed up typing
            
            // Auto scroll container if needed during typing
            if (scrollRef.current) {
                scrollRef.current.scrollIntoView({ behavior: 'auto' });
            }

            if (i > text.length + 1) {
                clearInterval(interval);
                onComplete();
            }
        }, 15);
        
        return () => clearInterval(interval);
    }, [text, onComplete]);
    
    return (
        <div className="w-full break-words relative">
            <MarkdownRenderer content={displayed} />
            {displayed.length < text.length && (
                <span className="inline-block w-1.5 h-4 bg-current opacity-70 animate-pulse align-middle rounded-full mb-1"></span>
            )}
            <div ref={scrollRef} />
        </div>
    );
};

interface BotInterfaceProps {
    customer: Customer | null;
    onSessionEnd: (logId: string) => void;
    onAdminClick: () => void;
    onBack: () => void;
    isDarkMode?: boolean;
    toggleTheme?: () => void;
}

const BotInterface: React.FC<BotInterfaceProps> = ({ customer, onSessionEnd, onAdminClick, onBack, isDarkMode, toggleTheme }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEnding, setIsEnding] = useState(false);
    const [statusText, setStatusText] = useState<string>('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [sessionId] = useState(() => Date.now().toString());

    // Secret Admin Access State
    const [logoClicks, setLogoClicks] = useState(0);
    const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Admin Access State
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [adminError, setAdminError] = useState('');

    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLInputElement>(null); // Ref for text input
    const initialized = useRef(false);
    const systemInstructionRef = useRef<string>('');
    const toolsRef = useRef<any[]>([]);

    // Smart Robot Icon with dynamic colors based on SystemType
    const getSystemTheme = () => {
        const sysType = customer?.systemType;
        if (sysType === 'e-Stock Pharmacy') {
            return {
                iconColor: '%2310B981',
                bubble: 'bg-gradient-to-l from-emerald-600 to-emerald-700',
                header: 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white',
                accent: 'text-emerald-600',
                btn: 'bg-emerald-600 hover:bg-emerald-700',
                ring: 'focus:ring-emerald-500',
                isColoredHeader: true
            };
        }
        if (sysType === 'e-Stock Retail') {
            return {
                iconColor: '%23F4A261',
                bubble: 'bg-gradient-to-l from-orange-400 to-orange-500',
                header: 'bg-gradient-to-r from-orange-400 to-orange-500 text-white',
                accent: 'text-orange-500',
                btn: 'bg-orange-500 hover:bg-orange-600',
                ring: 'focus:ring-orange-400',
                isColoredHeader: true
            };
        }
        if (sysType === 'Pharma Store') {
            return {
                iconColor: '%233B82F6',
                bubble: 'bg-gradient-to-l from-blue-600 to-blue-700',
                header: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white',
                accent: 'text-blue-600',
                btn: 'bg-blue-600 hover:bg-blue-700',
                ring: 'focus:ring-blue-500',
                isColoredHeader: true
            };
        }
        return {
            iconColor: '%23F7941D',
            bubble: 'bg-gradient-to-l from-blue-600 to-blue-700',
            header: 'bg-white/95 dark:bg-gray-800/95 text-gray-800 dark:text-gray-100',
            accent: 'text-blue-600',
            btn: 'bg-blue-600 hover:bg-blue-700',
            ring: 'focus:ring-blue-500',
            isColoredHeader: false
        };
    };

    const theme = getSystemTheme();
    const ROBOT_ICON = `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='${theme.iconColor}'/%3E%3Cpath d='M20 30 Q 50 15 80 30 V 75 Q 50 90 20 75 Z' fill='white' opacity='0.2'/%3E%3Ctext x='50' y='65' font-size='45' font-weight='bold' font-family='serif' text-anchor='middle' fill='white'%3EMS%3C/text%3E%3C/svg%3E`;

    // Auto-scroll to bottom
    useLayoutEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading, statusText, selectedImage]);

    // Auto-focus input when not loading
    useEffect(() => {
        if (!isLoading && !isEnding && textInputRef.current) {
            // Small timeout to ensure DOM update is complete
            setTimeout(() => {
                textInputRef.current?.focus();
            }, 100);
        }
    }, [isLoading, isEnding]);

    // --- AUTO SAVE LOGIC ---
    useEffect(() => {
        // Only auto-save if we have actual conversation (more than just the welcome message)
        if (messages.length > 1) {
            const sessionData = {
                id: sessionId,
                messages: messages,
                timestamp: Number(sessionId)
            };
            localStorage.setItem('est_autosave_session', JSON.stringify(sessionData));
        }
    }, [messages, sessionId]);

    const searchKBTool: FunctionDeclaration = {
        name: 'search_knowledge_base',
        description: 'Search the internal technical support database. Use this for specific technical questions or business info.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                query: {
                    type: Type.STRING,
                    description: 'The search query (e.g., "login error", "pricing", "api key").'
                }
            },
            required: ['query']
        }
    };

    const showImageTool: FunctionDeclaration = {
        name: 'show_screen_image',
        description: 'Show an illustrative screenshot of a specific screen in the e-stock system to the user.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                screen_name: {
                    type: Type.STRING,
                    enum: ['sales', 'purchases', 'inventory', 'login', 'barcode', 'settings', 'customers', 'reports'],
                    description: 'The name of the screen to show.'
                }
            },
            required: ['screen_name']
        }
    };

    const showSnippetImageTool: FunctionDeclaration = {
        name: 'show_knowledge_image',
        description: 'Display an image associated with a specific knowledge snippet/info that was added by the admin.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                snippet_id: {
                    type: Type.STRING,
                    description: 'The ID of the snippet image to show.'
                }
            },
            required: ['snippet_id']
        }
    };

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const initChat = async () => {
            const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || "";
            if (!apiKey) {
                setMessages([{
                    id: 'error',
                    role: 'model',
                    text: 'عذراً، لم يتم العثور على مفتاح API (VITE_GEMINI_API_KEY). يرجى التحقق من ملف .env.local.',
                    timestamp: new Date()
                }]);
                return;
            }

            try {
                // Load documentation and config asynchronously
                const sysType = customer?.systemType || 'e-Stock Pharmacy';
                const menusText = await db.getMenus(sysType);
                const snippets = await db.getSnippets(sysType);
                const landingConfig = await db.getLandingConfig();

                let snippetsInstruction = '';
                if (snippets.length > 0) {
                    // IMPORTANT: We tell the model these snippets are CRITICAL UPDATES
                    snippetsInstruction = `\n\n=== 🚨 CRITICAL UPDATES & NEW KNOWLEDGE (HIGHEST PRIORITY) ===\nThe following information was manually added by the admin to train you. \n**RULE: If any information here conflicts with other manuals, YOU MUST USE THE INFO BELOW as the correct truth.**\n`;
                    snippets.forEach(s => {
                        const content = s.content.length > 2000 ? s.content.substring(0, 2000) + '...' : s.content;
                        const navInfo = (s.menuName || s.screenName) ? `[Navigation Protocol: ${s.menuName ? 'القائمة الرئيسية: ' + s.menuName : ''} ${s.screenName ? ' -> الشاشة: ' + s.screenName : ''}]` : '';
                        snippetsInstruction += `-[ID: ${s.id}] ${navInfo}\nContent: ${content} ${s.imageUrl ? '(Has Image available)' : ''}\n`;
                    });
                }

                // Inject Company Info from Admin Settings
                const companyInfo = `
            \n=== CURRENT COMPANY INFORMATION (USE THIS FOR CONTACT INFO) ===
            Address: ${landingConfig.contactAddress}
            Phone: ${landingConfig.contactPhone}
            Email: ${landingConfig.contactEmail}
            WhatsApp Number (for Demo): ${landingConfig.whatsappNumber}
            Website Footer Text: ${landingConfig.footerText}
            `;

                const docsInstruction = `\n\n=== UI SCREENS & MENUS PATHS (Navigation Guide) ===\n${menusText}\n${snippetsInstruction}\n${companyInfo}\n\nUse the menus to accurately guide the customer step by step. Answer queries strictly relevant to ${sysType} system based on RAG contexts.`;

                const ai = new GoogleGenAI({ apiKey });

                // --- PERSONA SETUP ---
                const clientName = customer?.name || "عميل غير معروف";
                const clientInfoStr = customer
                    ? `Client Name: ${customer.name}\nContract Number: ${customer.contractNumber}\nPrevious Logins: ${new Date(Number(customer.lastLogin)).toLocaleDateString()}`
                    : "Client: Guest/Unknown";

                const systemInstruction = `You are "E-stock Bot" (مساعد إي ستوك), a dedicated and expert TECHNICAL SUPPORT agent for Modern Soft. Your specific assignment is to support users of the **${sysType}** software.
                    
                    **YOUR IDENTITY & TONE:**
                    - You are a smart, friendly, and expert support agent.
                    - **Language**: Speak strictly in **Egyptian Arabic (Masri)**. Use natural phrases like: "من عيوني", "تحت أمرك", "يا فندم", "بسيطة خالص".
                    - **Attitude**: Helpful, patient, and knowledgeable. Always acknowledge the user's problem first.
                    - **System Focus**: You ONLY support ${sysType}. If a screen or feature does not exist in the provided ${sysType} documentation below, tell the user gracefully that it does not exist in this system, without mentioning other systems.
                    
                    **KNOWLEDGE BASE USAGE:**
                    - Your knowledge base now contains **Structured Q&A** sections.
                    - **Navigation Paths**: If a snippet contains "القائمة الرئيسية" or "الشاشة", prioritize mentioning these paths clearly to the user (e.g., "اتفضل يا فندم، هتدخل على قائمة [اسم القائمة] وتختار شاشة [اسم الشاشة]").
                    - **Strategy**: First, scan the docs for a "Q: [User Question]" that matches the user's intent. If found, use the provided "A: [Answer]" as your core response.
                    - **Style**: Convert the stiff documentation into a warm, helpful conversation.
                    - **Steps**: When giving instructions, ALWAYS use numbered lists (1. 2. 3.) for clarity.
                    - **Conflict Resolution**: If the "Critical Updates" section contradicts the main manual, the Critical Updates ALWAYS win.
                    
                    **TROUBLESHOOTING & PROCEDURES:**
                    - If a user reports a **Printer Issue**, guide them through driver installation (Seagull) and page setup (38x25mm).
                    - If a user asks about **Networking**, explain the 4 methods (Local name, Static IP, Radmin VPN) + Firewall (Port 1433).
                    
                    **INTERACTION RULES:** 
                    - **Greeting**:  If the customer name is known (${clientName}), welcome them warmly.
                    - **Unknowns**: If the info is completely missing from your docs, say: "للاسف المعلومة دي مش موجودة عندي حالياً بخصوص برنامج ${sysType}، ممكن تتواصل مع الدعم الفني عشان يفيدوك أكتر." provide the phone number.

                    ${docsInstruction}`;

                const tools = [{ functionDeclarations: [searchKBTool, showImageTool, showSnippetImageTool] }];

                // Store for API route usage in production
                systemInstructionRef.current = systemInstruction;
                toolsRef.current = tools;

                chatRef.current = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: systemInstruction,
                        tools: tools,
                    },
                });

                // Initial greeting requesting data (More human-like)
                setMessages([{
                    id: 'init',
                    role: 'model',
                    text: 'أهلاً بحضرتك في الدعم الفني لشركة Modern Soft 🧡\nمعاك المساعد الذكي لنظام E-stock، وأنا هنا عشان أساعدك في أي وقت.\n\nعشان أقدر أخدمك بأفضل شكل، ممكن أتشرف ببيانات حضرتك؟\n(الاسم، اسم الصيدلية، رقم التليفون، والعنوان)\n\nوبعدها أمرني، أنا معاك.',
                    timestamp: new Date()
                }]);
            } catch (error) {
                console.error("Initialization Error:", error);
                setMessages([{
                    id: 'error_init',
                    role: 'model',
                    text: 'بعتذر جداً، حصل خطأ تقني بسيط أثناء التحميل. ممكن تعمل تحديث للصفحة؟',
                    timestamp: new Date()
                }]);
            }
        };

        initChat();
    }, []);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Limit to 1MB to avoid "Rpc failed" / XHR Timeout errors
            if (file.size > 1024 * 1024) {
                alert('عفواً، حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 1 ميجابايت.');
                return;
            }
            setSelectedImage(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result.split(',')[1]);
                } else {
                    reject(new Error("Failed to read file"));
                }
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleSecretLogoClick = () => {
        // Restriction: Only account 'hatem' can access the secret admin panel
        if (customer?.name.toLowerCase() !== 'hatem') {
            return;
        }

        const newCount = logoClicks + 1;
        setLogoClicks(newCount);

        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
        }

        if (newCount >= 10) {
            setLogoClicks(0);
            setShowAdminLogin(true);
        } else {
            clickTimeoutRef.current = setTimeout(() => {
                setLogoClicks(0);
            }, 2000);
        }
    };

    const handleAdminSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const storedPass = await db.getAdminPassword();
        if (adminPassword === storedPass) {
            // حفظ في sessionStorage إنه دخل كلمة المرور بنجاح
            sessionStorage.setItem('admin_password_entered', 'true');
            
            setShowAdminLogin(false);
            setAdminPassword('');
            setAdminError('');
            onAdminClick();
        } else {
            setAdminError('كلمة المرور غير صحيحة');
        }
    };

    // Wrapper function for Gemini API calls - routes to direct call (DEV) or API route (production)
    const sendMessageToGemini = async (params: { message: any; functionCalls?: any[] }, retries = 2): Promise<{ text: string; functionCalls?: any[] }> => {
        let attempt = 0;
        let lastError: any = null;

        while (attempt <= retries) {
            try {
                if (!chatRef.current) {
                    throw new Error("Chat not initialized");
                }
                return await chatRef.current.sendMessage({ message: params.message });
            } catch (error: any) {
                lastError = error;
                attempt++;
                console.warn(`[API] محاولة الاتصال ${attempt} فشلت بسبب الضغط، جاري إعادة المحاولة...`, error.message);
                
                // لا تقم بإعادة المحاولة إذا كان الخطأ بسبب نفاد الرصيد (Quota/429) لأنها ستفشل حتماً
                if (error.message && (error.message.includes('429') || error.message.toLowerCase().includes('quota') || error.message.includes('RESOURCE_EXHAUSTED'))) {
                    throw error;
                }

                if (attempt <= retries) {
                    await new Promise(res => setTimeout(res, 1000 * attempt));
                }
            }
        }
        
        console.error('[API] فشل الاتصال نهائياً بعد استنفاد المحاولات:', lastError);
        throw lastError;
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!input.trim() && !selectedImage) || isLoading || isEnding) return;
        if (!chatRef.current) {
            alert("جاري الاتصال بالنظام، يرجى الانتظار قليلاً...");
            return;
        }

        const userText = input;
        const currentImage = selectedImage;
        const userMsgId = Date.now().toString();

        // Reset input state
        setInput('');
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Optimistic Update
        setMessages(prev => [...prev, {
            id: userMsgId,
            role: 'user',
            text: userText,
            image: currentImage ? URL.createObjectURL(currentImage) : undefined,
            timestamp: new Date()
        }]);

        setIsLoading(true);
        setStatusText(currentImage ? 'جاري تحليل الصورة...' : 'جاري البحث في الدليل...');

        try {
            let contextParts = "";
            const sysType = customer?.systemType || 'e-Stock Pharmacy';

            // 1. RAG Search: Get similar chunks
            if (userText && userText.length > 3) {
                try {
                    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (process.env as any).API_KEY || "";
                    const ai = new GoogleGenAI({ apiKey });
                    const embResponse = await ai.models.embedContent({
                        model: 'gemini-embedding-2',
                        contents: userText
                    });
                    
                    if (embResponse.embeddings?.[0]?.values) {
                        const similarChunks = await db.searchSimilarChunks(embResponse.embeddings[0].values, sysType);
                        if (similarChunks.length > 0) {
                            contextParts = "\n\n=== RELEVANT DOCUMENTATION CONTEXT ===\n" + 
                                similarChunks.map(c => c.text).join("\n---\n") + 
                                "\n====================================\n";
                        }
                    }
                } catch (ragErr) {
                    console.error("RAG Search failed, falling back to basic chat", ragErr);
                }
            }

            setStatusText('جاري الكتابة...');

            let messagePayload: any = contextParts ? contextParts + "\n\nUser Question: " + userText : userText;

            // Construct payload if image exists
            if (currentImage) {
                const base64Data = await fileToBase64(currentImage);
                const imagePart = {
                    inlineData: {
                        mimeType: currentImage.type,
                        data: base64Data
                    }
                };
                
                if (contextParts) {
                    // Complex payload: array with context, image, and text
                    messagePayload = [
                        { text: contextParts },
                        imagePart,
                        { text: userText || "Analyze this image." }
                    ];
                } else {
                    messagePayload = [
                        imagePart,
                        { text: userText || "Please analyze this image in the context of e-stock system." }
                    ];
                }
            }

            let response = await sendMessageToGemini({ message: messagePayload });

            // Loop to handle potential multiple tool calls
            while (response.functionCalls && response.functionCalls.length > 0) {
                setStatusText('جاري تنفيذ الطلب...');

                const functionResponses = await Promise.all(response.functionCalls.map(async (call) => {
                    const args = call.args as any;

                    if (call.name === 'search_knowledge_base') {
                        const query = args.query;
                        const result = await db.searchKB(query || "");
                        return {
                            name: call.name,
                            response: { result: result || "No exact match found in KB, rely on System Documentation." },
                            id: call.id
                        };
                    } else if (call.name === 'show_screen_image') {
                        const screenName = args.screen_name;
                        const imageUrl = db.getScreenImage(screenName || "");

                        if (imageUrl) {
                            setMessages(prev => [...prev, {
                                id: Date.now().toString() + '_img',
                                role: 'model',
                                text: '',
                                image: imageUrl,
                                timestamp: new Date()
                            }]);
                            return {
                                name: call.name,
                                response: { result: "Image displayed to the user successfully." },
                                id: call.id
                            };
                        } else {
                            return {
                                name: call.name,
                                response: { error: "Image not found." },
                                id: call.id
                            };
                        }
                    } else if (call.name === 'show_knowledge_image') {
                        const snippetId = args.snippet_id;
                        const snippets = await db.getSnippets(customer?.systemType);
                        const snippet = snippets.find(s => s.id === snippetId);

                        if (snippet && snippet.imageUrl) {
                            setMessages(prev => [...prev, {
                                id: Date.now().toString() + '_snip_img',
                                role: 'model',
                                text: '',
                                image: snippet.imageUrl,
                                timestamp: new Date()
                            }]);
                            return {
                                name: call.name,
                                response: { result: "Snippet image displayed successfully." },
                                id: call.id
                            };
                        } else {
                            return {
                                name: call.name,
                                response: { error: "Snippet image not found." },
                                id: call.id
                            };
                        }
                    }
                    return { name: call.name, response: { error: "Unknown function" }, id: call.id };
                }));

                // Send function response back to the model
                const parts = functionResponses.map(fr => ({
                    functionResponse: {
                        name: fr.name,
                        response: fr.response,
                        id: fr.id
                    }
                }));

                response = await sendMessageToGemini({ message: parts });
            }

            const modelText = response.text;
            if (modelText) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'model',
                    text: modelText,
                    isTyping: true, // Enable typing effect
                    timestamp: new Date()
                }]);
            }

        } catch (error: any) {
            console.error("Gemini Error:", error);
            const errorMessage = error.message || '';
            
            let friendlyMessage = 'عذراً، أواجه مشكلة بسيطة في الاتصال بالخادم الآن. ممكن تحاول تاني؟ 🔄';
            
            // التعامل مع رسالة استنفاد الرصيد/الضغط بشكل لطيف ومخفي عن العميل
            if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
                friendlyMessage = 'عذراً، أواجه ضغطاً كبيراً في الطلبات حالياً ⏳\nيرجى الانتظار دقيقة والمحاولة مرة أخرى، أو التواصل مع الدعم الفني هاتفياً للحصول على مساعدة فورية.';
            }

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: friendlyMessage,
                isTyping: true,
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
            setStatusText('');
        }
    };

    const endSession = async () => {
        setIsEnding(true);
        setStatusText('جاري حفظ المحادثة وبيانات العميل...');

        try {
            let extractedName = "زائر";
            let summary = "محادثة عامة";

            let isUnanswered = false;

            // توفير الطلبات: لا نرسل طلب للذكاء الاصطناعي للتلخيص إلا إذا كان هناك محادثة فعلية (أكثر من رسالتين)
            if ((chatRef.current || systemInstructionRef.current) && messages.length > 2) {
                const analysisPrompt = `
             SYSTEM_INTERNAL_REQUEST:
             The session is ending. Please analyze the entire conversation history above.
             1. Extract the user's name if they mentioned it (e.g., "I am Ahmed", "My name is..."). If not found, use "Unknown Client".
             2. Create a very brief summary (one sentence) of the technical issue they asked about.
             3. Determine if the bot failed to answer a question properly (e.g., it said it didn't know, or said "المعلومة دي مش موجودة"). Set unanswered to true or false.

             Return ONLY a JSON object:
             { "clientName": "...", "summary": "...", "unanswered": boolean }
             `;

                try {
                    const result = await sendMessageToGemini({
                        message: analysisPrompt
                    });

                    const text = result.text;
                    const jsonMatch = text && text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const data = JSON.parse(jsonMatch[0]);
                        extractedName = data.clientName || "زائر";
                        summary = data.summary || "محادثة دعم فني";
                        isUnanswered = !!data.unanswered;
                    }
                } catch (e) {
                    console.warn("Failed to extract session details via AI, using defaults.", e);
                }
            }

            const fullLog: ChatLog = {
                id: sessionId,
                timestamp: Number(sessionId),
                duration: (Date.now() - Number(sessionId)) / 1000,
                userQuery: messages.map(m => {
                    const role = m.role === 'user' ? '👤 العميل' : '🤖 E-stock Bot';
                    const imgTag = m.image ? ' [مرفق صورة]' : '';
                    return `${role}: ${m.text}${imgTag}`;
                }).join('\n\n'),
                botResponse: summary,
                clientName: extractedName,
                isUnanswered: isUnanswered,
                systemType: customer?.systemType
            };

            await db.addLog(fullLog);
            // Clear the auto-save because we successfully saved to DB
            localStorage.removeItem('est_autosave_session');

            onSessionEnd(sessionId);
        } catch (e) {
            console.error("Error saving log", e);
            const fallbackLog: ChatLog = {
                id: sessionId,
                timestamp: Number(sessionId),
                duration: (Date.now() - Number(sessionId)) / 1000,
                userQuery: "Error saving detail",
                botResponse: "Session ended with error",
                clientName: "Error"
            };
            await db.addLog(fallbackLog);
            localStorage.removeItem('est_autosave_session');
            onSessionEnd(sessionId);
        } finally {
            setIsEnding(false);
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-gray-800 sm:shadow-2xl sm:rounded-2xl rounded-none overflow-hidden border-0 sm:border border-gray-200 dark:border-gray-700 font-sans relative transition-colors duration-300">
            {/* Header */}
            <div className={`${theme.header} backdrop-blur-md p-3 sm:p-4 flex justify-between items-center shadow-md z-10 shrink-0`}>
                <div className="flex items-center space-x-3 space-x-reverse">
                    <button
                        onClick={onBack}
                        className={`p-2 rounded-full transition-colors ${theme.isColoredHeader ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800'}`}
                        title="العودة للصفحة الرئيسية"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" transform="rotate(180 12 12)" />
                        </svg>
                    </button>
                    <div
                        className="relative cursor-pointer select-none active:scale-95 transition-transform"
                        onClick={handleSecretLogoClick}
                        title="E-stock Chat"
                    >
                        <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-md ring-2 ring-blue-50 dark:ring-gray-600 overflow-hidden">
                            <img src={ROBOT_ICON} alt="Robot" className="w-full h-full object-cover" />
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                    </div>
                    <div
                        className="flex flex-col cursor-pointer select-none"
                        onClick={handleSecretLogoClick}
                    >
                        <h2 className="font-bold text-base sm:text-lg leading-tight flex items-center gap-1">
                            E-stock chat
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${theme.isColoredHeader ? 'text-white' : 'text-blue-500'}`}>
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                            </svg>
                        </h2>
                        <p className={`text-[11px] ${theme.isColoredHeader ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>متصل الآن • يرد فوراً</p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={endSession}
                        disabled={isEnding || isLoading}
                        className={`text-xs sm:text-sm px-3 py-2 rounded-lg transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ${theme.isColoredHeader ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30' : 'bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400'}`}
                    >
                        {isEnding ? 'جاري الحفظ...' : 'إنهاء'}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" transform="rotate(180 12 12)" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Admin Password Modal */}
            {showAdminLogin && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className={`w-full max-w-sm p-6 rounded-2xl shadow-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} animate-in zoom-in-95`}>
                        <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>الدخول للوحة التحكم</h3>
                        <form onSubmit={handleAdminSubmit} className="space-y-4">
                            <div>
                                <input
                                    type="password"
                                    value={adminPassword}
                                    onChange={e => setAdminPassword(e.target.value)}
                                    placeholder="كلمة المرور"
                                    className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                    autoFocus
                                />
                                {adminError && <p className="text-red-500 text-xs mt-2 font-bold">{adminError}</p>}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowAdminLogin(false); setAdminPassword(''); setAdminError(''); }}
                                    className={`flex-1 py-2 rounded-lg font-bold ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md"
                                >
                                    دخول
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div
                className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-5 space-y-6 bg-[#f0f2f5] dark:bg-gray-900 scrollbar-hide"
                style={{
                    backgroundImage: isDarkMode
                        ? `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                        : `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2V6h4V4H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
            >
                <div className="text-center my-4">
                    <span className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-500 dark:text-gray-300 text-xs px-3 py-1 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
                        اليوم
                    </span>
                </div>

                {messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                        <div
                            key={msg.id}
                            className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex max-w-[85%] sm:max-w-[75%] gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Avatar */}
                                {!isUser && (
                                    <div className="flex-shrink-0 self-end mb-1">
                                        <img
                                            src={ROBOT_ICON}
                                            alt="Bot"
                                            className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 p-0.5 object-cover shadow-sm border border-gray-100 dark:border-gray-600"
                                        />
                                    </div>
                                )}

                                {/* Bubble */}
                                <div
                                    className={`relative px-4 py-2 sm:px-5 sm:py-3 shadow-sm text-sm sm:text-base leading-relaxed break-words ${isUser
                                        ? `${theme.bubble} text-white rounded-2xl rounded-br-none`
                                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600 rounded-2xl rounded-bl-none'
                                        }`}
                                >
                                    {msg.image && (
                                        <div className="mb-2 -mx-2 -mt-2">
                                            <img
                                                src={msg.image}
                                                alt={isUser ? "User Upload" : "Bot Response"}
                                                className="w-full h-auto max-h-64 object-cover rounded-xl bg-gray-50 dark:bg-gray-800"
                                            />
                                        </div>
                                    )}
                                    {msg.text && (
                                        msg.isTyping ? (
                                            <TypewriterText 
                                                text={msg.text} 
                                                onComplete={() => {
                                                    setMessages(prev => prev.map(m => 
                                                        m.id === msg.id ? { ...m, isTyping: false } : m
                                                    ));
                                                }} 
                                            />
                                        ) : (
                                            <div className="w-full break-words">
                                                <MarkdownRenderer content={msg.text} />
                                            </div>
                                        )
                                    )}
                                    {/* Timestamp */}
                                    <div className={`text-[10px] mt-1 flex items-center gap-1 ${isUser ? 'text-white/80 justify-start' : 'text-gray-400 dark:text-gray-400 justify-end'}`}>
                                        <span>{formatTime(new Date(msg.timestamp))}</span>
                                        {isUser && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white/60">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Loading Bubble */}
                {(isLoading || isEnding) && (
                    <div className="flex w-full justify-start">
                        <div className="flex max-w-[80%] gap-2 flex-row">
                            <div className="flex-shrink-0 self-end mb-1">
                                <img
                                    src={ROBOT_ICON}
                                    alt="Bot"
                                    className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 p-0.5 object-cover shadow-sm border border-gray-100 dark:border-gray-600"
                                />
                            </div>
                            <div className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-3">
                                <div className="flex space-x-1 space-x-reverse items-center h-full pt-1">
                                    <div className={`w-2 h-2 ${theme.btn} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
                                    <div className={`w-2 h-2 ${theme.btn} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                                    <div className={`w-2 h-2 ${theme.btn} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <span className="text-xs text-gray-400 animate-pulse font-medium">{statusText}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-3 sm:p-4 shrink-0 z-20 transition-colors">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto relative">

                    {/* Image Preview Overlay */}
                    {selectedImage && (
                        <div className="absolute bottom-full right-0 left-0 mb-4 mx-2 bg-white dark:bg-gray-700 p-3 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-600 animate-in slide-in-from-bottom-2 fade-in flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-xl overflow-hidden relative border border-gray-200 dark:border-gray-600">
                                    <img
                                        src={URL.createObjectURL(selectedImage)}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-800 dark:text-white">صورة مرفقة</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-300 max-w-[150px] truncate">{selectedImage.name}</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={removeImage}
                                className="p-2 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                </svg>
                            </button>
                        </div>
                    )}

                    <div className={`flex items-end gap-2 bg-gray-100 dark:bg-gray-700 rounded-[2rem] p-1.5 pr-2 focus-within:bg-white dark:focus-within:bg-gray-800 focus-within:ring-2 ${theme.ring} focus-within:shadow-lg transition-all border border-transparent`}>

                        {/* File Attachment Button */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            accept="image/*"
                            className="hidden"
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={`p-2.5 rounded-full transition-all duration-200 ${selectedImage ? `bg-gray-200 ${theme.accent}` : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                            title="رفع صورة"
                            disabled={isLoading || isEnding}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                        </button>

                        <textarea
                            ref={textInputRef as any}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder={selectedImage ? "اكتب تعليق على الصورة..." : "اكتب رسالتك هنا..."}
                            className="flex-1 bg-transparent border-0 py-3 px-2 outline-none text-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-base resize-none max-h-32 min-h-[44px]"
                            rows={1}
                            disabled={isLoading || isEnding}
                            style={{ overflow: 'hidden' }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                            }}
                        />

                        <button
                            type="submit"
                            disabled={(!input.trim() && !selectedImage) || isLoading || isEnding}
                            className={`p-3 rounded-full flex items-center justify-center transition-all duration-200 ${(!input.trim() && !selectedImage) || isLoading || isEnding
                                ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                : `${theme.btn} text-white hover:scale-105 shadow-md active:scale-95`
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transform rotate-180">
                                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BotInterface;
