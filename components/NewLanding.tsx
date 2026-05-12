import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Pill, Store, Building2, 
  Users, Zap, Headset, Award, CheckCircle2, ChevronRight, ChevronLeft,
  Menu, X, Shield, Layout, Database, Clock, Cloud, Smartphone,
  Plus, Minus, XCircle, CheckCircle, Quote, Star, ArrowUpRight, HeartHandshake, Wallet, Bot,
  Play, Monitor, Cpu
} from 'lucide-react';
import LogoSVG from './LogoSVG';
import BotFloatingButton from './BotFloatingButton';
import ProductDetailPage from './ProductDetailPage';
import { db } from '../services/db';
import { LandingConfig } from '../types';
import { defaultProducts } from '../data/defaultProducts';

// --- DATA ---
const products = [
  {
    title: "الصيدليات",
    subtitle: "نظام e-Stock Pharmacy",
    description: "حل متكامل مصمم خصيصاً لإدارة الصيدليات بكفاءة عالية. يشمل إدارة المخزون، تتبع تواريخ الصلاحية، التنبيه بالنواقص، وربط مباشر مع منظومة الفاتورة الإلكترونية.",
    icon: Pill,
    image: "https://images.unsplash.com/photo-1576602976047-174e57a47881?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "سلاسل الصيدليات",
    subtitle: "نظام e-Stock Pharmacy Chain",
    description: "إدارة مركزية سحابية لسلاسل الصيدليات متعددة الفروع. تحكم كامل في المخزون، المبيعات اللحظية، والتقارير التشغيلية لكل الفروع من مكان واحد.",
    icon: Cloud,
    image: "/images/pharmacy_chain_erp.png"
  },
  {
    title: "الأنشطة التجارية",
    subtitle: "نظام e-Stock Retail",
    description: "الحل الأمثل للمحلات التجارية والسوبر ماركت. واجهة كاشير فائقة السرعة، دعم كامل للباركود والموازين الإلكترونية، وتقارير مبيعات وأرباح لحظية.",
    icon: Store,
    image: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "شركات التوزيع والمخازن",
    subtitle: "نظام e-Stock Drug-Store ERP",
    description: "نظام ERP متكامل لشركات توزيع الأدوية ومستحضرات التجميل. تتبع دقيق لأرقام التشغيلات (Batch)، إدارة المناديب، الطلبيات، والحسابات بكل احترافية.",
    icon: Database,
    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "شركات التصنيع والتعبئة",
    subtitle: "نظام e-Stock Manufacturing",
    description: "حلول برمجية متطورة لإدارة مصانع التعبئة والتصنيع. تتبع المواد الخام، إدارة مراحل الإنتاج، حساب تكاليف التصنيع، وضمان الجودة في كل مرحلة.",
    icon: Cpu,
    image: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?q=80&w=2071&auto=format&fit=crop"
  }
];

const plans = [
  {
    name: "نظام الصيدليات",
    desc: "E-Stock Pharmacy",
    features: ["ربط الفاتورة الإلكترونية", "تتبع تواريخ الصلاحية", "إشعارات النواقص الذكية", "إدارة الحسابات والعملاء"],
    highlight: false,
    link: "#"
  },
  {
    name: "نظام النشاط التجاري",
    desc: "E-Stock Retail",
    features: ["دعم كافة أنواع الباركود", "تقارير مبيعات لحظية", "إدارة المخازن والفروع", "واجهة كاشير فائقة السرعة"],
    highlight: true,
    link: "#"
  },
  {
    name: "نظام الشركات والمخازن",
    desc: "E-Stock Enterprise",
    features: ["إدارة سلاسل الإمداد", "نظام محاسبي متكامل", "صلاحيات مستخدمين دقيقة", "دعم الربط السحابي"],
    highlight: false,
    link: "#"
  }
];

const testimonials = [
  { name: "د. محمود صبري", role: "مالك صيدلية", text: "استخدم برنامج e-Stock Pharmacy منذ عامين، بصراحة النظام مذهل في معالجة النواقص وتتبع تواريخ الصلاحية وتحديث الأسعار التلقائي.", rating: 5 },
  { name: "أ. مصطفى الشافعي", role: "مدير سوبر ماركت", text: "برنامج e-Stock Retail سلس جداً، الكاشير تعودوا عليه في يوم واحد، وتقفيل الخزانات والشفتات وفر عليّ مراجعات يومية مرهقة.", rating: 5 },
  { name: "م. أحمد حسن", role: "مدير مخازن أدوية", text: "نظام المخازن وفر لنا دقة متناهية في جرد الأصناف وتوزيع المناديب. الربط بين المخزن والصيدليات جعل العمل يسير بسرعة البرق.", rating: 5 },
];

const faqs = [
  { q: "هل البرامج تعمل بدون اتصال دائم بالإنترنت (Offline)؟", a: "نعم، كافة أنظمة مودرن سوفت تعمل بكفاءة تامة بدون إنترنت، ويتم استخدام الإنترنت فقط في حالات الربط السحابي أو النسخ الاحتياطي." },
  { q: "ما هي مواصفات الأجهزة المطلوبة لتشغيل النظام؟", a: "النظام مصمم ليعمل على أقل المواصفات المتاحة لضمان عدم تكليف العميل أعباء إضافية." },
];

// --- COMPONENTS ---
const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    className={className}
  >
    {children}
  </motion.div>
);

const PlanCard = ({ plan, i, config }: { plan: any, i: number, config: any }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <FadeIn delay={i * 0.1} className="snap-center shrink-0">
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`w-[300px] md:w-[380px] bg-white p-10 rounded-[3rem] shadow-xl border-2 transition-all duration-500 flex flex-col h-full ${isHovered ? 'border-orange-500/20' : 'border-transparent'}`}
      >
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-10 transition-all duration-500 ${isHovered ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-100 text-slate-400'}`}>
          {i % 3 === 0 ? <Pill size={40} /> : i % 3 === 1 ? <Store size={40} /> : <Building2 size={40} />}
        </div>
        
        <h3 className="text-3xl font-black text-slate-900 mb-4">{plan.name}</h3>
        <p className="text-slate-400 font-bold mb-8">{plan.desc}</p>
        
        <div className="space-y-5 mb-12 flex-1">
          {plan.features.map((f: any, j: number) => (
            <div key={j} className={`flex gap-4 items-center font-bold text-lg text-right transition-colors ${isHovered ? 'text-slate-900' : 'text-slate-500'}`}>
              <CheckCircle className={`transition-colors ${isHovered ? 'text-orange-500' : 'text-slate-200'}`} size={22} />
              <span>{f}</span>
            </div>
          ))}
        </div>
        
        <a 
          href={`https://wa.me/${config.whatsappPhone}?text=${encodeURIComponent(`أهلاً مودرن سوفت، أريد الاستفسار عن باقة: ${plan.name}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`py-6 rounded-3xl font-black text-xl text-center transition-all duration-500 flex items-center justify-center gap-3 ${isHovered ? 'bg-orange-500 text-white shadow-orange-500/20' : 'bg-slate-900 text-white shadow-slate-900/10'} shadow-xl`}
        >
          <span>اشترك الآن</span>
          <ChevronLeft size={20} className={isHovered ? '-translate-x-2 transition-transform' : ''} />
        </a>
      </div>
    </FadeIn>
  );
};

export default function NewLanding({ onOpenChat, onSecretClick }: any) {
  const [scrolled, setScrolled] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [logoClicks, setLogoClicks] = useState(0);
  const clickTimerRef = useRef<any>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [config, setConfig] = useState<LandingConfig | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // --- Hash-based routing for product detail pages ---
  const openProduct = (product: any) => {
    window.location.hash = `product/${product.id}`;
    setSelectedProduct(product);
  };

  const closeProduct = () => {
    window.history.pushState('', document.title, window.location.pathname + window.location.search + '#home');
    setSelectedProduct(null);
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#product\/(.+)$/);
      if (match) {
        const id = match[1];
        const found = defaultProducts.find((p: any) => p.id === id);
        if (found) { setSelectedProduct(found); return; }
      }
      setSelectedProduct(null);
    };
    handleHash(); // run on mount
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      const data = await db.getLandingConfig();
      setConfig(data);
    };
    fetchConfig();
  }, []);

  const displayProducts = defaultProducts; // Force new professional data
  const displayTestimonials = (config?.testimonials || testimonials);
  const displayFaqs = (config?.faqs || faqs).map(f => ({
    q: (f as any).q || (f as any).question,
    a: (f as any).a || (f as any).answer
  }));
  const displayPlans = (config?.plans || plans);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % displayProducts.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [displayProducts.length]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!config) {
    return (
      <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center font-cairo">
         <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }} className="mb-8">
            <LogoSVG theme="light" className="w-40" />
         </motion.div>
         <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden relative">
            <motion.div initial={{ left: "-100%" }} animate={{ left: "100%" }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="absolute top-0 bottom-0 w-1/2 bg-orange-500 rounded-full" />
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-cairo selection:bg-orange-500 selection:text-white antialiased overflow-x-hidden">
      {/* --- NAV --- */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-md py-1 border-b border-slate-200 shadow-md' : 'bg-white/80 backdrop-blur-md py-1.5 border-b border-slate-200/50 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <a href="/" className="flex items-center" onClick={(e) => {
              e.preventDefault();
              const newCount = logoClicks + 1;
              setLogoClicks(newCount);
              if (newCount >= 20) { setLogoClicks(0); onSecretClick?.(); }
              if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
              clickTimerRef.current = setTimeout(() => setLogoClicks(0), 3000);
            }}>
            <LogoSVG theme="light" className="w-12 md:w-20 h-auto" />
          </a>
          <div className="hidden lg:flex items-center gap-8">
            {['الرئيسية', 'برامجنا', 'المميزات', 'الأسئلة الشائعة'].map((item, i) => (
              <a key={i} href={`#${['home', 'pricing', 'compare', 'faq'][i]}`} className="text-base font-black text-slate-600 hover:text-orange-500 transition-colors tracking-tight">{item}</a>
            ))}
            <a href={`tel:${config.contactPhone}`} className="bg-slate-900 text-white px-5 py-1.5 rounded-xl font-black text-base hover:bg-orange-500 transition-all shadow-lg shadow-slate-900/10">اتصل بنا</a>
          </div>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden w-12 h-12 flex items-center justify-center text-slate-900"><Menu size={32} /></button>
        </div>
      </nav>

      <AnimatePresence>
         {isMenuOpen && (
           <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 bg-white z-[150] flex flex-col p-8 text-right">
              <div className="flex justify-between items-center mb-16"><LogoSVG theme="light" className="w-24" /><button onClick={() => setIsMenuOpen(false)}><X size={32} /></button></div>
              <div className="flex flex-col gap-8">
                 {['الرئيسية', 'برامجنا', 'المميزات', 'الأسئلة الشائعة'].map((item, i) => (
                   <a key={i} href={`#${['home', 'pricing', 'compare', 'faq'][i]}`} onClick={() => setIsMenuOpen(false)} className="text-3xl font-black text-slate-900 hover:text-orange-500">{item}</a>
                 ))}
                 <a href={`tel:${config.contactPhone}`} className="mt-8 bg-orange-500 text-white py-6 rounded-3xl font-black text-2xl text-center shadow-2xl">اتصل بنا الآن</a>
              </div>
           </motion.div>
         )}
      </AnimatePresence>

      <main>
        {/* --- HERO --- */}
        <section id="home" className="pt-40 pb-24 md:pt-60 md:pb-32 px-6 bg-slate-50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <FadeIn>
               <h1 className="text-5xl md:text-8xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tight">
                  مؤسسة مودرن سوفت للبرمجيات
               </h1>
               <p className="text-xl md:text-2xl text-slate-500 font-bold max-w-4xl mx-auto mb-14 leading-relaxed px-4">
                  متخصصون فى صناعه حلول برمجية متطورة لنمو اعمالك
               </p>
               <div className="flex justify-center">
                  <button onClick={onOpenChat} className="bg-[#1a1c23] text-white px-14 py-6 rounded-[2rem] font-black text-2xl hover:bg-orange-500 transition-all shadow-2xl shadow-orange-500/20 hover:-translate-y-1 flex items-center gap-4 group">
                    {config.heroButtonText}<div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors"><Bot size={24} className="text-orange-400" /></div>
                  </button>
               </div>
            </FadeIn>
          </div>
        </section>

        {/* --- PRODUCTS SLIDER --- */}
        <section id="demo" className="h-screen px-6 bg-white overflow-hidden flex flex-col justify-center">
          <div className="max-w-7xl mx-auto mb-6 text-center">
             <FadeIn><h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-3">حلول برمجية متكاملة تخدم نشاطك</h2><div className="w-16 h-1.5 bg-orange-500 mx-auto rounded-full" /></FadeIn>
          </div>
          <div className="relative max-w-6xl mx-auto w-full">
             <FadeIn delay={0.2}>
                <div className="overflow-hidden rounded-[2rem] shadow-2xl bg-white border border-slate-100">
                    <div className="flex transition-transform duration-1000 ease-in-out" style={{ transform: `translateX(${activeSlide * 100}%)` }}>
                       {displayProducts.map((product: any, index: number) => (
                          <div key={index} className="w-full shrink-0 flex flex-col md:flex-row" style={{height: '52vh'}}>
                             <div className="w-full md:w-1/2 relative h-40 md:h-auto"><img src={product.image} className="w-full h-full object-cover" alt="" /><div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" /></div>
                             <div className="w-full md:w-1/2 p-5 md:p-8 flex flex-col justify-center text-right">
                                <span className="text-orange-500 font-bold mb-1 block text-sm">{product.subtitle || product.name}</span>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2">{product.title || product.name}</h3>
                                <p className="text-sm text-slate-500 font-bold mb-4 leading-relaxed line-clamp-2">{product.description}</p>
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => openProduct(product)}
                                    className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-xl font-black text-sm hover:bg-orange-500 transition-all group"
                                  >
                                    <span>عرض التفاصيل</span>
                                    <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
                                  </button>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                </div>
                <div className="flex justify-center gap-3 mt-6">
                   {displayProducts.map((_, i) => (<button key={i} onClick={() => setActiveSlide(i)} className={`h-2 transition-all duration-500 rounded-full ${activeSlide === i ? 'w-10 bg-orange-500' : 'w-4 bg-slate-200'}`} />))}
                </div>
             </FadeIn>
          </div>
        </section>

        {/* --- PRICING SECTION --- */}
        <section id="pricing" className="py-32 px-6 bg-slate-50 overflow-hidden">
           <div className="max-w-7xl mx-auto relative px-4 md:px-12">
              <FadeIn>
                  <div className="text-center mb-24">
                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6">برامجنا</h2>
                    <p className="text-xl text-slate-500 font-bold max-w-2xl mx-auto">{config.plansSubtitle}</p>
                  </div>
              </FadeIn>
              
              <div className="relative group">
                 <button 
                   onClick={() => document.getElementById('plans-container')?.scrollBy({ left: 450, behavior: 'smooth' })}
                   className="absolute -right-4 lg:-right-10 top-1/2 -translate-y-1/2 z-40 w-14 h-14 bg-white rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-all hidden md:flex border border-slate-100"
                 >
                   <ChevronRight size={28} />
                 </button>
                 <button 
                   onClick={() => document.getElementById('plans-container')?.scrollBy({ left: -450, behavior: 'smooth' })}
                   className="absolute -left-4 lg:-left-10 top-1/2 -translate-y-1/2 z-40 w-14 h-14 bg-white rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-all hidden md:flex border border-slate-100"
                 >
                   <ChevronLeft size={28} />
                 </button>

                 <div id="plans-container" className="flex gap-8 overflow-x-auto pb-16 px-2 no-scrollbar snap-x scroll-smooth">
                    {displayPlans.map((plan: any, i: number) => (
                       <PlanCard key={i} plan={plan} i={i} config={config} />
                    ))}
                 </div>
              </div>
           </div>
        </section>

        {/* --- INTEGRATIONS & FEATURES --- */}
        <section id="compare" className="py-28 px-6 bg-slate-50 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/8 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/6 rounded-full blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">

            {/* --- Integrations --- */}
            <FadeIn>
              <div className="text-center mb-16">
                <span className="inline-block bg-orange-500/10 text-orange-600 font-black text-sm px-5 py-2 rounded-full mb-5 tracking-widest uppercase border border-orange-500/20">ربط حكومي رسمي</span>
                <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-5 leading-tight">
                  تكامل مع المنظومات
                  <span className="block text-orange-500">الحكومية الرسمية</span>
                </h2>
                <p className="text-lg text-slate-500 font-bold max-w-2xl mx-auto">برامجنا مرتبطة رسمياً بالجهات الحكومية لضمان الامتثال القانوني الكامل</p>
              </div>
            </FadeIn>

            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 mb-24 pb-8 -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:pb-0 no-scrollbar" style={{ scrollBehavior: 'smooth' }}>
              {[
                {
                  flag: "🇪🇬",
                  country: "جمهورية مصر العربية",
                  title: "منظومة الفاتورة والإيصال الإلكتروني",
                  desc: "ربط مباشر ومعتمد مع منظومة الفاتورة الإلكترونية التابعة لمصلحة الضرائب المصرية",
                  accent: "border-t-red-500",
                  badgeBg: "bg-red-50 text-red-600 border-red-200",
                  iconBg: "bg-red-50 text-red-500",
                  badge: "مصر"
                },
                {
                  flag: "🇸🇦",
                  country: "المملكة العربية السعودية",
                  title: "هيئة الزكاة والضريبة والجمارك",
                  desc: "تكامل كامل مع منظومة فاتورة (FATOORA) وضريبة القيمة المضافة وفق اشتراطات ZATCA",
                  accent: "border-t-green-500",
                  badgeBg: "bg-green-50 text-green-700 border-green-200",
                  iconBg: "bg-green-50 text-green-600",
                  badge: "السعودية"
                },
                {
                  flag: "🇸🇦",
                  country: "المملكة العربية السعودية",
                  title: "هيئة الرصد والتحقق من المنتجات",
                  desc: "ربط تلقائي مع منظومة رصد للتحقق من مصدر المنتجات الصيدلانية وضمان سلامة سلسلة الإمداد",
                  accent: "border-t-blue-500",
                  badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
                  iconBg: "bg-blue-50 text-blue-600",
                  badge: "السعودية"
                }
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 0.15} className="shrink-0 w-[85vw] sm:w-[320px] md:w-auto snap-center">
                  <div className={`bg-white rounded-[2rem] p-8 h-full flex flex-col text-right shadow-md border border-slate-100 border-t-4 ${item.accent} group hover:-translate-y-2 hover:shadow-xl transition-all duration-500`}>
                    <div className="flex justify-between items-start mb-6">
                      <span className={`text-xs font-black px-3 py-1.5 rounded-full border ${item.badgeBg}`}>{item.badge}</span>
                      <div className="text-5xl">{item.flag}</div>
                    </div>
                    <p className="text-slate-400 font-bold text-sm mb-2">{item.country}</p>
                    <h3 className="text-lg md:text-xl font-black text-slate-900 mb-4 leading-snug">{item.title}</h3>
                    <p className="text-slate-500 font-bold text-sm leading-relaxed flex-1">{item.desc}</p>
                    <div className="mt-6 pt-5 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-orange-500" size={17} />
                        <span className="text-orange-600 font-black text-sm">معتمد ومرخّص رسمياً</span>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>

            {/* Divider */}
            <FadeIn>
              <div className="flex items-center gap-6 mb-20">
                <div className="flex-1 h-px bg-slate-200" />
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            </FadeIn>

            {/* --- Features --- */}
            <FadeIn>
              <div className="text-center mb-14">
                <span className="inline-block bg-orange-500/10 text-orange-600 font-black text-sm px-5 py-2 rounded-full mb-5 tracking-widest uppercase border border-orange-500/20">لماذا مودرن سوفت؟</span>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-2">ما يميزنا عن غيرنا</h2>
                <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full inline-block md:hidden mt-4">اسحب للمزيد ←</span>
              </div>
            </FadeIn>

            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:pb-0 no-scrollbar" style={{ scrollBehavior: 'smooth' }}>
              {[
                {
                  icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
                  title: "نصلك أينما كنت",
                  desc: "متواجدون داخل جميع المحافظات — فريقنا يصل إليك في أي مكان لضمان التركيب والدعم الميداني",
                },
                {
                  icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
                  title: "أقوى دعم أونلاين مجاني",
                  desc: "فريق دعم فني متخصص على مدار الساعة — بدون رسوم إضافية، لأن نجاحك هو نجاحنا",
                },
                {
                  icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
                  title: "تحديثات مستمرة مجانية",
                  desc: "تطويرات دورية تواكب تغيرات السوق والتشريعات الحكومية — نظامك دائماً محدّث وفي المقدمة",
                }
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 0.15} className="shrink-0 w-[85vw] sm:w-[320px] md:w-auto snap-center">
                  <div className="bg-white rounded-[2rem] p-8 h-full flex flex-col text-right shadow-md border border-slate-100 group hover:-translate-y-2 hover:shadow-xl hover:border-orange-200 transition-all duration-500">
                    <div className="w-14 h-14 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center text-orange-500 mb-6 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all duration-500 self-end">
                      {item.icon}
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-4">{item.title}</h3>
                    <p className="text-slate-500 font-bold text-sm leading-relaxed flex-1">{item.desc}</p>
                    <div className="mt-6 pt-5 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-orange-500" size={17} />
                        <span className="text-orange-600 font-black text-sm">ميزة حصرية في مودرن سوفت</span>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>

          </div>
        </section>

        {/* --- TESTIMONIALS --- */}
        <section id="testimonials" className="py-32 px-6 bg-[#f8f9fa]">
           <div className="max-w-7xl mx-auto">
              <FadeIn><div className="text-center mb-20"><h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">آراء شركاء النجاح</h2><p className="text-xl text-slate-500 font-bold max-w-3xl mx-auto">نفخر بثقة آلاف العملاء في أنظمتنا.</p></div></FadeIn>
              <div className="flex gap-8 overflow-x-auto pb-12 px-4 no-scrollbar snap-x">
                 {displayTestimonials.map((t: any, i: number) => (
                    <FadeIn key={i} delay={i * 0.1} className="snap-center">
                       <div className="min-w-[300px] md:min-w-[400px] bg-white p-10 rounded-3xl shadow-lg border border-slate-50">
                          <div className="flex justify-end gap-1 mb-6">{[...Array(t.rating)].map((_, i) => <Star key={i} size={16} fill="#ffb800" className="text-[#ffb800]" />)}</div>
                          <p className="text-lg text-slate-600 font-bold leading-relaxed mb-10 text-right">"{t.text}"</p>
                          <div className="flex items-center justify-end gap-4"><div className="text-right"><div className="font-black text-slate-900 text-lg">{t.name}</div><div className="text-slate-400 font-bold text-sm">{t.role}</div></div><div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center font-black text-orange-500">{t.name[0]}</div></div>
                       </div>
                    </FadeIn>
                 ))}
              </div>
           </div>
        </section>

        {/* --- FAQ --- */}
        <section id="faq" className="py-32 px-6 bg-white">
           <div className="max-w-4xl mx-auto">
              <FadeIn><h2 className="text-4xl md:text-5xl font-black text-slate-900 text-center mb-20">الأسئلة الشائعة</h2></FadeIn>
              <div className="space-y-6">
                 {displayFaqs.map((faq, i) => (
                    <FadeIn key={i} delay={i * 0.1}>
                       <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                          <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full p-8 flex justify-between items-center text-right"><span className="text-xl md:text-2xl font-black text-slate-900">{faq.q}</span><div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${openFaq === i ? 'bg-orange-500 text-white rotate-45' : 'bg-slate-50 text-slate-400'}`}><Plus size={24} /></div></button>
                          <AnimatePresence>{openFaq === i && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-10 pb-10 text-xl text-slate-500 font-bold leading-relaxed pt-2">{faq.a}</motion.div>)}</AnimatePresence>
                       </div>
                    </FadeIn>
                 ))}
              </div>
           </div>
        </section>

        {/* --- CTA --- */}
        <section className="py-32 px-6 bg-white">
           <FadeIn>
              <div className="max-w-6xl mx-auto bg-[#1a1c23] rounded-[4rem] p-16 md:p-32 text-center text-white relative overflow-hidden">
                 <h2 className="text-4xl md:text-7xl font-black mb-12 tracking-tight">انضم لعالم <span className="text-orange-500">مودرن سوفت</span> وطوّر عملك</h2>
                 <a href={`tel:${config.contactPhone}`} className="bg-orange-500 text-white px-16 py-6 rounded-3xl font-black text-2xl hover:bg-orange-400 transition-all shadow-2xl relative z-10 inline-block">اتصل بالمبيعات الآن</a>
              </div>
           </FadeIn>
        </section>
      </main>

      <footer className="py-24 bg-[#0a0b0e] text-white border-t border-white/5">
         <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mb-20 text-right">
               <div className="lg:col-span-2">
                  <LogoSVG theme="dark" className="w-32 mb-8" />
                  <p className="text-slate-400 font-bold text-xl leading-relaxed max-w-md">{config.aboutCompanyText}</p>
               </div>
               <div>
                  <h4 className="text-xl font-black mb-8 text-orange-500 uppercase tracking-widest">تواصل معنا</h4>
                  <ul className="space-y-4 text-slate-400 font-bold text-lg">
                     <li>{config.contactAddress}</li>
                     <li><a href={`tel:${config.contactPhone}`} className="hover:text-white">{config.contactPhone}</a></li>
                     <li><a href={`mailto:${config.contactEmail}`} className="hover:text-white">{config.contactEmail}</a></li>
                  </ul>
               </div>

            </div>
            <div className="pt-12 border-t border-white/5 text-center text-slate-500 font-bold"><p>{config.footerText}</p></div>
         </div>
      </footer>

      <BotFloatingButton onClick={onOpenChat} />

      {/* Product Detail Page Overlay */}
      {selectedProduct && (
        <ProductDetailPage
          product={selectedProduct}
          onClose={closeProduct}
          whatsappPhone={config.whatsappPhone}
        />
      )}
    </div>
  );
}
