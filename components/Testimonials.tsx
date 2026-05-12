import { useState, useEffect, useRef } from 'react';
import { Star, Quote, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { doc, getDoc } from 'firebase/firestore';
import { firestoreDb } from "../services/db";

export default function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [reviews, setReviews] = useState<any[]>([
    { name: 'د. محمود صبري', role: 'مالك صيدلية', text: 'استخدم برنامج e-Stock Pharmacy منذ عامين، بصراحة النظام مذهل في معالجة النواقص وتتبع تواريخ الصلاحية وتحديث الأسعار التلقائي.' },
    { name: 'أ. مصطفى الشافعي', role: 'مدير سوبر ماركت', text: 'برنامج e-Stock Retail سلس جداً، الكاشير تعودوا عليه في يوم واحد، وتقفيل الخزانات والشفتات وفر عليّ مراجعات يومية مرهقة.' },
    { name: 'د. خالد عبد الرحمن', role: 'رئيس مجلس إدارة سلسلة صيدليات', text: 'انتقلنا لاستخدام Pharma Store ERP منذ 3 سنوات لتشغيل 15 فرع. فرق معنا جداً في دورة المشتريات المركزية وضبط الأرصدة وربط الفروع بسلاسة.' },
    { name: 'م. عبد العزيز', role: 'مدير مصنع أعلاف', text: 'برنامج A3laf غير مفهومنا في إدارة نسب المكونات والخامات. حسابات الموردين دقيقة جداً والمخازن مضبوطة بالجرام.' },
    { name: 'أ. زينب علي', role: 'صاحبة معرض ملابس', text: 'أهم شيء في شغلي هو تصنيف الألوان والمقاسات. برنامج الملابس أتاح لي سهولة في الجرد واستخراج الباركود بشكل لا يقارن بالبرامج القديمة.' },
    { name: 'د. ياسر حسني', role: 'مدير مخزن أدوية', text: 'إدارة مخزن أدوية محتاجة نظام قوي يتحمل آلاف الأصناف. Drug-Store كان الحل الأمثل بالنسبة لنا في سرعة الفواتير وحسابات العملاء الدقيقة.' }
  ]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth > 768 ? 450 : 320;
      // Note: In an RTL tailored application, scrollLeft values can be confusing.
      // Moving right makes it go to previous items, moving left goes to next items.
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        if(!firestoreDb) return; const docRef = doc(firestoreDb, 'app_content', 'home');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.testimonials && Array.isArray(data.testimonials) && data.testimonials.length > 2) {
            setReviews(data.testimonials);
          }
        }
      } catch (err) {
        console.error("Error fetching testimonials:", err);
      }
    };
    fetchContent();
  }, []);

  return (
    <section className="py-32 bg-orange-900/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4 sm:mb-6 leading-tight tracking-tight">آراء شركاء مسيرة النجاح</h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 font-medium">نفخر بثقة آلاف العملاء الذين يعتبرون أنظمة مودرن سوفت العمود الفقري لمنشآتهم.</p>
        </div>
        
        <div className="relative group max-w-[100%] md:max-w-[95%] lg:max-w-[90%] mx-auto">
          {/* Right Arrow (Previous in RTL) */}
          <button 
            onClick={() => scroll('right')} 
            className="hidden sm:flex absolute top-1/2 -right-4 md:-right-12 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 items-center justify-center bg-white rounded-full shadow-xl shadow-slate-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-colors border border-orange-100 z-20"
            aria-label="السابق"
          >
            <ArrowRight size={24} />
          </button>

          {/* Left Arrow (Next in RTL) */}
          <button 
            onClick={() => scroll('left')} 
            className="hidden sm:flex absolute top-1/2 -left-4 md:-left-12 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 items-center justify-center bg-orange-600 rounded-full shadow-xl shadow-orange-600/30 text-white hover:bg-orange-700 hover:shadow-orange-700/40 transition-colors z-20"
            aria-label="التالي"
          >
            <ArrowLeft size={24} />
          </button>

          <div ref={scrollRef} className="flex overflow-x-auto gap-4 sm:gap-8 snap-x snap-mandatory no-scrollbar pb-10 pt-4 scroll-smooth px-4 mx-0">
            {reviews.map((r, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white p-6 sm:p-8 md:p-10 rounded-[2rem] shadow-xl shadow-orange-900/5 border border-orange-100/50 relative group transition-transform duration-300 shrink-0 w-[85vw] sm:w-[400px] md:w-[450px] snap-center sm:snap-start flex flex-col justify-between"
            >
              {/* Background Quote Icon */}
              <Quote className="absolute top-6 left-6 sm:top-8 sm:left-8 text-orange-50 w-12 h-12 sm:w-16 sm:h-16 -z-0 rotate-180 transform group-hover:scale-110 transition-transform duration-500" />
              
              <div className="flex gap-1.5 text-amber-500 mb-6 relative z-10 drop-shadow-sm">
                {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" stroke="transparent" />)}
              </div>
              
              <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-8 md:mb-10 relative z-10 font-medium">&quot;{r.text}&quot;</p>
              
              <div className="flex items-center gap-4 border-t border-slate-100 pt-6 mt-auto relative z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 text-slate-800 flex items-center justify-center rounded-xl font-black text-lg sm:text-xl">
                  {r.name.charAt(r.name.indexOf('.') + 2) || r.name.charAt(2)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">{r.name}</h4>
                  <p className="text-xs sm:text-sm font-medium text-slate-500">{r.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}
