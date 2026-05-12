import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Pill, Store, Building2, Database, Users, 
  BarChart4, TrendingUp, CheckCircle2 
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { firestoreDb } from "../services/db";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const THEMES = [
  {
    hoverBorder: "hover:border-orange-200",
    blurBg: "bg-gradient-to-bl from-orange-100/50 to-transparent",
    iconWrapper: "bg-gradient-to-br from-orange-500 to-teal-600 shadow-orange-500/30 text-white",
    Icon: Pill,
    noteColor: "text-slate-800",
  },
  {
    hoverBorder: "hover:border-amber-400/50",
    blurBg: "bg-amber-50",
    iconWrapper: "bg-amber-50 text-amber-600 border-amber-100",
    Icon: Store,
    noteColor: "text-amber-600",
  },
  {
    hoverBorder: "hover:border-slate-400/50",
    blurBg: "bg-slate-100",
    iconWrapper: "bg-slate-900 text-white border-slate-800",
    Icon: Building2,
    noteColor: "text-slate-800",
  },
  {
    hoverBorder: "hover:border-teal-400/50",
    blurBg: "bg-teal-50",
    iconWrapper: "bg-teal-50 text-teal-600 border-teal-100",
    Icon: Database,
    noteColor: "text-teal-600",
  },
  {
    hoverBorder: "hover:border-emerald-400/50",
    blurBg: "bg-emerald-50",
    iconWrapper: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Icon: TrendingUp,
    noteColor: "text-emerald-600",
  },
  {
    hoverBorder: "hover:border-indigo-400/50",
    blurBg: "bg-indigo-50",
    iconWrapper: "bg-indigo-50 text-indigo-600 border-indigo-100",
    Icon: BarChart4,
    noteColor: "text-indigo-600",
  },
  {
    hoverBorder: "hover:border-rose-400/50",
    blurBg: "bg-rose-50",
    iconWrapper: "bg-rose-50 text-rose-600 border-rose-100",
    Icon: Users,
    noteColor: "text-rose-600",
  }
];

export default function ProductsDynamic() {
  const [products, setProducts] = useState<any[]>([
    {
      name: "e-Stock Pharmacy",
      desc: "البرنامج الرائد في إدارة الصيدليات بمختلف أحجامها. يمنحك سيطرة تامة على الأرصدة، الصلاحيات، حركة المشتريات والمبيعات مع شاشة (POS) هي الأسرع في فئتها.",
      note: "قيادة ذكية لصيدليتك",
      features: ["دعم كامل وشامل للباركود", "تحديث تلقائي لأسعار الدواء", "شاشات بيع فائقة السرعة", "معالجة النواقص الذكية"],
      featured: true
    },
    {
      name: "e-Stock Retail",
      desc: "الخيار الأقوى للأنشطة التجارية والمحلات. إدارة المخازن، الكاشير، تنظيم المبيعات وتقارير الأرباح للخسائر.",
      note: "مثالي للماركت وتجارة التجزئة",
      features: [],
      featured: false
    },
    {
      name: "Pharma Store",
      desc: "برنامج متخصص لسلاسل الصيدليات وشركات التوزيع، يعطيك القدرة على متابعة فروعك، ومراقبة المخازن والإيرادات بشكل مركزي.",
      note: "ربط الفروع بسلاسة مركزية",
      features: [],
      featured: false
    },
    {
      name: "Drug-Store",
      desc: "حل متطور ومستقر لمخازن الأدوية والمستلزمات الطبية لتوفير تحكم رقابي شامل وضبط أرصدة المخازن بدقة.",
      note: "حلول المخازن والتوريد الطبية",
      features: [],
      featured: false
    },
    {
      name: "A3laf",
      desc: "سيستم متخصص لإدارة تجارب ومصانع الأعلاف، تنظيم نسب المكونات، وتتبع حركة المبيعات وحسابات الموردين.",
      note: "أقوى نظام لتجارة الأعلاف",
      features: [],
      featured: false
    },
    {
      name: "Stock Market",
      desc: "إدارة متقدمة لأسواق المال والمضاربات أو التجارة الكبرى. حسابات ختامية ورسوم بيانية دقيقة للمتابعة.",
      note: "للمؤسسات والأسواق الكبرى",
      features: [],
      featured: false
    },
    {
      name: "Clothes",
      desc: "سيستم احترافي لإدارة محلات ومعارض الملابس، يدعم تصنيف الألوان، المقاسات، طباعة الباركود بدقة تامة.",
      note: "إدارة تجارة الملابس والأزياء",
      features: [],
      featured: false
    }
  ]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        if(!firestoreDb) return; const docRef = doc(firestoreDb, 'app_content', 'home');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.products && Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products);
          }
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };
    fetchContent();
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth > 768 ? 420 : 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative group max-w-[100%] mx-auto mb-16">
      {/* Right Arrow (Previous in RTL) */}
      <button 
        onClick={() => scroll('right')} 
        className="hidden sm:flex absolute top-1/2 -right-4 md:-right-8 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 items-center justify-center bg-white rounded-full shadow-xl shadow-slate-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-colors border border-orange-100 z-20"
        aria-label="السابق"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </button>

      {/* Left Arrow (Next in RTL) */}
      <button 
        onClick={() => scroll('left')} 
        className="hidden sm:flex absolute top-1/2 -left-4 md:-left-8 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 items-center justify-center bg-orange-600 rounded-full shadow-xl shadow-orange-600/30 text-white hover:bg-orange-700 hover:shadow-orange-700/40 transition-colors z-20"
        aria-label="التالي"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
      </button>

      <div ref={scrollRef} className="flex overflow-x-auto gap-4 sm:gap-6 lg:gap-8 snap-x snap-mandatory no-scrollbar pb-12 pt-4 scroll-smooth px-2 sm:px-4 mx-0">
        {products.map((product, idx) => {
          const theme = THEMES[idx % THEMES.length];
          const Icon = theme.Icon;
          const isFeatured = product.featured;

          return (
            <motion.div
              key={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              className={`shrink-0 w-[85vw] sm:w-[380px] md:w-[420px] snap-center bg-white rounded-3xl lg:rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 flex flex-col items-start group overflow-hidden relative transition-all hover:shadow-[0_20px_60px_rgb(0,0,0,0.08)] ${theme.hoverBorder}`}
            >
              {/* Background blur decoration */}
              <div className={`absolute bottom-0 left-0 w-64 h-64 sm:w-[400px] sm:h-[400px] ${theme.blurBg} rounded-full blur-3xl -z-10 transition-transform duration-700 group-hover:scale-110 opacity-60`}></div>
              
              <div className="flex-1 space-y-5 z-10 w-full flex flex-col h-full">
                <div className="flex items-center justify-between w-full">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-sm border transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${theme.iconWrapper}`}>
                    <Icon size={28} strokeWidth={2.5} />
                  </div>
                  {isFeatured && (
                    <span className="bg-orange-100 text-orange-700 text-xs font-black px-3 py-1 rounded-full border border-orange-200">
                      الأكثر مبيعاً
                    </span>
                  )}
                </div>
                
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-4">
                  {product.name}
                </h3>
                
                <p className="text-base text-slate-600 leading-relaxed font-medium flex-grow">
                  {product.desc}
                </p>
                
                {product.features && product.features.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 pt-2">
                    {product.features.slice(0, 3).map((f: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-slate-700 font-bold bg-slate-50 border border-slate-100 p-2.5 rounded-xl transition-colors group-hover:bg-white group-hover:border-orange-100">
                        <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                        <span className="text-xs sm:text-sm">{f}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Note / Tagline at bottom */}
                <div className="mt-auto pt-4 border-t border-slate-100 w-full">
                  <span className={`${theme.noteColor} font-bold text-sm`}>{product.note}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
