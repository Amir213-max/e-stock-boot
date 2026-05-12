import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Star, ShieldCheck, HeartHandshake } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { firestoreDb } from "../services/db";

export default function Pricing() {
  const [plans, setPlans] = useState<any[]>([
    {
      name: "إدارة الصيدليات",
      desc: "نظام e-Stock Pharmacy المخصص بالكامل لإدارة دوائية دقيقة",
      popular: true,
      features: [
        "قاعدة بيانات محدثة للأدوية",
        "تنبيهات النواقص وتواريخ الصلاحية",
        "إدارة الورديات ودرج الكاشير",
        "سهولة الجرد ومراقبة التحويلات",
      ]
    }
  ]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        if(!firestoreDb) return; const docRef = doc(firestoreDb, 'app_content', 'home');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.pricing && Array.isArray(data.pricing) && data.pricing.length > 0) {
            setPlans(data.pricing);
          }
        }
      } catch (err) {
        console.error("Error fetching pricing:", err);
      }
    };
    fetchContent();
  }, []);

  return (
    <section className="py-24 bg-white relative" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        
        {/* Massive USP Banner */}
        <div className="bg-slate-900 rounded-[2rem] p-8 md:p-12 mb-16 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-right overflow-hidden relative shadow-2xl">
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-orange-500/10 rounded-full blur-[80px]"></div>
          
          <div className="flex-1 space-y-4 z-10">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              استثمر في تجارتك <span className="text-orange-500">بدون قيود</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-300 font-medium max-w-2xl">
              في مودرن سوفت نؤمن بأن برنامج إدارتك هو أصل من أصولك. لذلك نقدم لك أنظمتنا بلا شروط تعجيزية.
            </p>
          </div>
          
          <div className="flex flex-col gap-4 w-full md:w-auto z-10">
            <div className="flex items-center gap-4 bg-slate-800/50 backdrop-blur-md px-6 py-4 rounded-xl border border-slate-700">
              <ShieldCheck className="w-8 h-8 text-orange-500 shrink-0" />
              <div className="text-right">
                <p className="font-bold text-white leading-tight text-lg">دفع مرة واحدة فقط</p>
                <p className="text-sm text-slate-400">بدون اشتراكات شهرية أو سنوية!</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-slate-800/50 backdrop-blur-md px-6 py-4 rounded-xl border border-slate-700">
              <HeartHandshake className="w-8 h-8 text-orange-500 shrink-0" />
              <div className="text-right">
                <p className="font-bold text-white leading-tight text-lg">دعم فني أونلاين</p>
                <p className="text-sm text-slate-400">مجاناً لمعاونتك دائماً فور اتصالك.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-16">
          <h3 className="text-3xl font-extrabold text-slate-900 mb-4">باقات تناسب حجم عملك</h3>
          <p className="text-slate-600 text-lg">اختر التخصص الذي يلائم نشاطك التجاري الآن</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-white rounded-3xl p-8 border ${plan.popular ? 'border-orange-500 shadow-xl shadow-orange-500/10 relative md:-translate-y-2' : 'border-slate-200 shadow-sm'} flex flex-col ${idx === 2 ? 'md:col-span-2 lg:col-span-1' : ''}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white font-bold px-4 py-1.5 rounded-full text-sm flex items-center gap-1 shadow-sm whitespace-nowrap">
                  <Star size={14} className="fill-current" /> الأكثر طلباً
                </div>
              )}
              
              <div className="mb-6">
                <h4 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h4>
                <p className="text-slate-500 text-sm">{plan.desc}</p>
              </div>

              <div className="my-8 flex-1">
                <ul className="space-y-4">
                  {plan.features.map((feature: string, i: number) => (
                    <li key={i} className="flex gap-3 text-slate-700 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 pt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a 
                href="#contact" 
                className={`w-full py-4 rounded-xl font-bold text-center transition-all ${plan.popular ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
              >
                تواصل لحجز باقتك
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
