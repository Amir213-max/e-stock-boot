import { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc } from 'firebase/firestore';
import { firestoreDb } from "../services/db";

export default function FAQ() {
  const [faqs, setFaqs] = useState([
    { q: 'هل البرامج تعمل بدون اتصال دائم بالإنترنت (Offline)؟', a: 'نعم بالتأكيد، أنظمتنا مُصممة لتعمل بشكل كامل ومستقر أوفلاين على الأجهزة المحلية (Local Network) داخل الصيدلية أو المحل. وفي حال السلاسل، تتوفر خيارات الربط السحابي (Cloud Sync) الآمن لنقل التقارير وحركة الفروع لحظياً.' },
    { q: 'ما هي مواصفات الأجهزة المطلوبة لتشغيل النظام؟', a: 'نظام e-Stock مهيأ باحترافية ليعمل بسلاسة حتى على الأجهزة متوسطة أو ضعيفة الإمكانيات. لا تحتاج لتحديث أجهزتك الحالية، فهو يدعم ويندوز بشكل ممتاز واستهلاكه للرامات والمعالج منخفض جداً.' },
    { q: 'هل تقدمون دعماً فنياً بعد عملية الشراء والتركيب؟', a: 'الدعم الفني هو الركيزة الأساسية في مودرن سوفت. بمجرد الاشتراك، تحصل على خدمات كول سنتر متخصصة، ودعم عن بعد لضمان حل أي مشكلة تواجهك في دقائق معدودة، طوال أيام الأسبوع.' },
    { q: 'لدي بالفعل برنامج آخر، هل يمكن نقل قاعدة البيانات القديمة؟', a: 'نعم، نوفر أداة استيراد قوية تتيح لك إدخال أرصدة الأصناف والأسماء والبيانات القديمة من خلال ملفات الإكسيل (Excel) لتبدأ العمل على نظامنا فوراً وبدون إعادة التدخيل اليدوي.' },
    { q: 'هل تدعم البرامج الموازين الإلكترونية وأنظمة الباركود؟', a: 'الأنظمة تدعم جميع قارئات الباركود (Barcode Scanners)، الموازين الإلكترونية في السوبر ماركت، طابعات الفواتير والباركود بأحجامها المختلفة.' }
  ]);

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        if(!firestoreDb) return; const docRef = doc(firestoreDb, 'app_content', 'home');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.faqs && Array.isArray(data.faqs) && data.faqs.length > 0) {
            setFaqs(data.faqs.map((f: any) => ({ q: f.question, a: f.answer })));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchFaqs();
  }, []);

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">الأسئلة المتداولة الشائعة</h2>
          <p className="text-lg text-slate-600 font-medium">كل ما يدور بذهنك من استفسارات، جمعنا إجاباتها هنا لراحتك وطمأنينتك.</p>
        </div>
        
        <div className="space-y-4">
          {faqs.map((item, idx) => (
            <div key={idx} className={`border rounded-[1.5rem] transition-colors duration-300 overflow-hidden ${openIndex === idx ? 'border-slate-300 shadow-sm ring-1 ring-slate-900/5 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full px-5 sm:px-8 py-5 sm:py-6 text-right flex justify-between items-center focus:outline-none transition-colors"
                aria-expanded={openIndex === idx}
              >
                <span className={`font-bold text-base sm:text-lg md:text-xl pr-2 ${openIndex === idx ? 'text-slate-900' : 'text-slate-700'}`}>{item.q}</span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${openIndex === idx ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {openIndex === idx ? <Minus size={20} /> : <Plus size={20} />}
                </div>
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    key={`faq-answer-${idx}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 sm:px-8 pb-5 sm:pb-8 bg-slate-50"
                  >
                    <p className="text-slate-600 leading-relaxed font-medium text-base sm:text-lg border-t border-slate-200 pt-4">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
