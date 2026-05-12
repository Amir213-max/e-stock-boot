import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { defaultProducts } from '../data/defaultProducts';
import { db } from '../services/db';
import { ChatLog } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Send, X, Globe } from 'lucide-react';

// ---- Markdown Renderer ----
const MarkdownRenderer = ({ content }: { content: string }) => (
  <div className="markdown-body text-sm sm:text-base leading-relaxed space-y-2">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
        ul: ({ ...props }) => <ul className="list-disc list-outside mb-3 mr-5" {...props} />,
        ol: ({ ...props }) => <ol className="list-decimal list-outside mb-3 mr-5" {...props} />,
        li: ({ ...props }) => <li className="mb-1" {...props} />,
        strong: ({ ...props }) => <strong className="font-bold !text-inherit" {...props} />,
        a: ({ ...props }) => <a className="underline font-semibold text-orange-500 hover:opacity-80" target="_blank" rel="noopener noreferrer" {...props} />,
      }}
    >{content}</ReactMarkdown>
  </div>
);

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isTyping?: boolean;
  productLink?: { label: string; productId: string };
}

// ---- Typewriter ----
const TypewriterText = ({ text, onComplete }: { text: string; onComplete: () => void }) => {
  const [displayed, setDisplayed] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let i = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      setDisplayed(text.substring(0, i));
      i += 3;
      endRef.current?.scrollIntoView({ behavior: 'auto' });
      if (i > text.length + 1) { clearInterval(interval); onComplete(); }
    }, 12);
    return () => clearInterval(interval);
  }, [text, onComplete]);
  return (
    <div className="w-full break-words">
      <MarkdownRenderer content={displayed} />
      {displayed.length < text.length && (
        <span className="inline-block w-1.5 h-4 bg-orange-500 opacity-70 animate-pulse align-middle rounded-full mb-1" />
      )}
      <div ref={endRef} />
    </div>
  );
};

// Local Response Generator
const generateLocalResponse = (text: string): string => {
  const lowerText = text.toLowerCase();
  const matchedProducts = [];

  const productKeywords: Record<string, string[]> = {
    'pharmacy': ['صيدليات', 'صيدلية', 'صيدليه', 'دواء', 'ادوية', 'أدوية', 'روشتة'],
    'pharmacy-chain': ['سلاسل', 'سلسلة', 'فروع', 'مركزية', 'سحابي'],
    'retail': ['تجاري', 'سوبر ماركت', 'كاشير', 'محلات', 'بيع', 'بقالة', 'نقاط بيع', 'باركود', 'ميزان'],
    'drug-store': ['مخازن', 'توزيع', 'جملة', 'مخزن', 'شركات أدوية'],
    'manufacturing': ['تصنيع', 'تعبئة', 'مصانع', 'انتاج', 'مواد خام']
  };

  if (lowerText.includes('سلام') || lowerText.includes('اهلا') || lowerText.includes('مرحبا') || lowerText.includes('برامجكم') || lowerText.includes('متاحة')) {
    return `أهلاً بك! 👋\nنحن نقدم 5 أنظمة أساسية لخدمة نشاطك:\n1. **نظام الصيدليات**\n2. **سلاسل الصيدليات**\n3. **الأنشطة التجارية**\n4. **شركات التوزيع والمخازن**\n5. **شركات التصنيع والتعبئة**\n\nاختر البرنامج الذي يناسبك أو اسألني عن تفاصيله!`;
  }

  if (lowerText.includes('تواصل') || lowerText.includes('رقم') || lowerText.includes('واتساب') || lowerText.includes('تليفون') || lowerText.includes('دعم')) {
    return `للتواصل مع المبيعات والاستفسار، يمكنك الاتصال بنا هاتفياً على الرقم:\n📞 **01272000075**\n\nنحن نسعد بتلقي اتصالك وتقديم المساعدة اللازمة.`;
  }

  for (const [id, keywords] of Object.entries(productKeywords)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      const product = defaultProducts.find((p: any) => p.id === id);
      if (product) matchedProducts.push(product);
    }
  }

  if (matchedProducts.length > 0) {
    const p = matchedProducts[0];
    return `### 📦 ${p.title} (${p.subtitle})\n\n**تفاصيل البرنامج:**\n${p.description}\n\n**أهم المميزات:**\n${(p.features || []).slice(0, 3).map((f: string) => `- ${f}`).join('\n')}\n\n🔗 **[اضغط هنا لعرض كافة التفاصيل والأسعار](https://modern-softbot.vercel.app/#product/${p.id})**\n\nهل تود معرفة المزيد أو الاستفسار عن برنامج آخر؟`;
  }

  return `عذراً، لم أتعرف على البرنامج الذي تبحث عنه. \nنحن نقدم برامج للصيدليات، الأنشطة التجارية، المخازن، والتصنيع.\nهل يمكنك توضيح سؤالك، أو يمكنك الاتصال بنا هاتفياً على الرقم **01272000075** لمساعدتك؟`;
};

interface GuestBotProps {
  onBack: () => void;
  onLoginClick: () => void;
  whatsappPhone?: string;
}

const GuestBot: React.FC<GuestBotProps> = ({ onBack, onLoginClick, whatsappPhone = '201272000075' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);
  const [sessionId] = useState(() => `guest_${Date.now()}`);

  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isLoading]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initChat = () => {
      setMessages([{
        id: 'init',
        role: 'model',
        text: `أهلاً وسهلاً بك في **مودرن سوفت** 🧡\n\nأنا مساعدك الذكي، هنا لمساعدتك في التعرف على برامجنا وحلولنا المتكاملة.\n\n**يمكنني مساعدتك في:**\n- التعرف على برامجنا المختلفة\n- معرفة مميزات كل برنامج\n- توجيهك للتواصل مع فريق المبيعات\n\nما الذي تودّ الاستفسار عنه؟ 😊`,
        timestamp: new Date(),
      }]);
    };

    initChat();
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date(),
    }]);
    setIsLoading(true);

    // Simulate network delay for natural feel
    setTimeout(async () => {
      const modelText = generateLocalResponse(userText);
      const newModelMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: modelText,
        isTyping: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => {
        const updated = [...prev, newModelMsg];
        
        // Save log to DB asynchronously
        const fullLog: ChatLog = {
          id: sessionId,
          timestamp: Number(sessionId.replace('guest_', '')),
          duration: (Date.now() - Number(sessionId.replace('guest_', ''))) / 1000,
          userQuery: updated.map(m => {
            const role = m.role === 'user' ? '👤 العميل (زائر)' : '🤖 مساعد مودرن سوفت';
            return `${role}: ${m.text}`;
          }).join('\n\n'),
          botResponse: userText.length > 30 ? userText.substring(0, 30) + "..." : userText,
          clientName: "زائر (Guest)",
          isUnanswered: modelText.includes('عذراً، لم أتعرف'),
          systemType: 'e-Stock Pharmacy' 
        };
        db.addLog(fullLog).catch(e => console.error("Guest log save failed", e));
        
        return updated;
      });
      setIsLoading(false);
    }, 1000);
  };

  // Quick question chips
  const quickQuestions = [
    'ما هي برامجكم المتاحة؟',
    'برنامج الصيدليات',
    'سلاسل الصيدليات',
    'برنامج الأنشطة التجارية',
    'كيف أتواصل معكم؟',
  ];

  return (
    <div className="flex flex-col h-full w-full bg-white sm:shadow-2xl sm:rounded-2xl rounded-none overflow-hidden border-0 sm:border border-gray-200 font-cairo relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-2 sm:p-4 flex justify-between items-center shadow-lg shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <button onClick={onBack} className="p-1 sm:p-2 rounded-full hover:bg-white/20 text-white transition-colors shrink-0" title="رجوع">
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-md shrink-0">
            <Globe size={18} className="text-orange-500 sm:w-[22px] sm:h-[22px]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-black text-xs sm:text-lg text-white leading-tight truncate">مساعد مودرن سوفت</h2>
            <p className="text-[9px] sm:text-[11px] text-white/80 truncate">زائر • مبيعات واستفسارات</p>
          </div>
        </div>
        <button
          onClick={onLoginClick}
          className="bg-white text-orange-600 px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl font-black text-[10px] sm:text-sm hover:bg-orange-50 transition-all shadow-md shrink-0"
        >
          تسجيل الدخول
        </button>
      </div>

      {/* Guest Banner */}
      <div className="bg-orange-50 border-b border-orange-100 px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-center sm:justify-between shrink-0 text-center sm:text-right">
        <p className="text-[10px] sm:text-xs text-orange-700 font-bold leading-relaxed sm:leading-none">
          🌐 هذا وضع الزائر — للحصول على دعم فني لبرنامجك{' '}
          <button onClick={onLoginClick} className="underline text-orange-600 hover:text-orange-800 font-black mr-1">
            سجّل دخولك
          </button>
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-black shrink-0 ml-2 mt-1 shadow">
                MS
              </div>
            )}
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${
              msg.role === 'user'
                ? 'bg-slate-800 text-white rounded-tr-sm'
                : 'bg-white text-gray-900 rounded-tl-sm border border-gray-100'
            }`}>
              {msg.isTyping && msg.role === 'model' ? (
                <TypewriterText
                  text={msg.text}
                  onComplete={() => {
                    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isTyping: false } : m));
                  }}
                />
              ) : (
                msg.role === 'model'
                  ? <div className="text-xs sm:text-sm prose prose-sm max-w-none"><MarkdownRenderer content={msg.text} /></div>
                  : <p className="text-xs sm:text-sm leading-relaxed">{msg.text}</p>
              )}
              <p className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-white/50' : 'text-gray-400'}`}>
                {msg.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-end">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-black shrink-0 ml-2 shadow">MS</div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && !isLoading && (
        <div className="px-3 pb-2 flex gap-2 flex-wrap shrink-0 bg-gray-50">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => { setInput(q); setTimeout(() => handleSend(), 50); }}
              className="text-xs bg-white border border-orange-200 text-orange-600 px-3 py-1.5 rounded-full font-bold hover:bg-orange-50 transition-all shadow-sm"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-2.5 sm:p-4 bg-white border-t border-gray-100 shrink-0 pb-safe">
        <form onSubmit={handleSend} className="flex gap-2 items-center max-w-3xl mx-auto w-full">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="اسألني عن برامجنا..."
            disabled={isLoading}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-400 transition-all disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 sm:w-11 sm:h-11 bg-orange-500 text-white rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-orange-600 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default GuestBot;
