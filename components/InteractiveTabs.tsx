import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Store, Building2, Pill, Database, Users, BarChart4, TrendingUp } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { firestoreDb } from "../services/db";

const ICONS = [Pill, Store, Building2, Database, TrendingUp, BarChart4, Users];

const defaultTabs = [
  { id: '0', title: 'e-Stock Pharmacy', icon: Pill, desc: 'البرنامج الرائد في إدارة الصيدليات بمختلف أحجامها. يمنحك سيطرة تامة على الأرصدة، الصلاحيات، حركة المشتريات والمبيعات مع شاشة (POS) هي الأسرع في فئتها.' },
  { id: '1', title: 'e-Stock Retail', icon: Store, desc: 'الخيار الأقوى للأنشطة التجارية والمحلات. إدارة المخازن، الكاشير، تنظيم المبيعات وتقارير الأرباح للخسائر.' },
  { id: '2', title: 'Pharma Store', icon: Building2, desc: 'برنامج متخصص لسلاسل الصيدليات وشركات التوزيع، يعطيك القدرة على متابعة فروعك، ومراقبة المخازن والإيرادات بشكل مركزي.' },
  { id: '3', title: 'Drug-Store', icon: Database, desc: 'حل متطور ومستقر لمخازن الأدوية والمستلزمات الطبية لتوفير تحكم رقابي شامل وضبط أرصدة المخازن بدقة.' },
  { id: '4', title: 'A3laf', icon: TrendingUp, desc: 'سيستم متخصص لإدارة تجارب ومصانع الأعلاف، تنظيم نسب المكونات، وتتبع حركة المبيعات وحسابات الموردين.' },
  { id: '5', title: 'Stock Market', icon: BarChart4, desc: 'إدارة متقدمة لأسواق المال والمضاربات أو التجارة الكبرى. حسابات ختامية ورسوم بيانية دقيقة للمتابعة.' },
  { id: '6', title: 'Clothes', icon: Users, desc: 'سيستم احترافي لإدارة محلات ومعارض الملابس، يدعم تصنيف الألوان، المقاسات، طباعة الباركود بدقة تامة.' },
];

export default function InteractiveTabs() {
  const [tabs, setTabs] = useState(defaultTabs);
  const [active, setActive] = useState(defaultTabs[0].id);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        if(!firestoreDb) return; const docRef = doc(firestoreDb, 'app_content', 'home');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.products && Array.isArray(data.products) && data.products.length > 0) {
            const fetchedTabs = data.products.map((p: any, idx: number) => ({
              id: idx.toString(),
              title: p.name,
              desc: p.desc,
              icon: ICONS[idx % ICONS.length]
            }));
            setTabs(fetchedTabs);
            setActive(fetchedTabs[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching products for tabs:", err);
      }
    };
    fetchContent();
  }, []);

  return (
    <section className="py-24 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">حلول مرنة تناسب طبيعة نشاطك</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">سواء كنت تمتلك نشاطاً صغيراً في بداياته، أو تدير سلسلة فروع ضخمة، فقد قمنا بتخصيص أنظمتنا لتلائم حجم وتفاصيل مؤسستك بدقة.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
          {/* Tabs Navigation */}
          <div className="w-full lg:w-1/3 flex flex-col gap-2 md:gap-3 pb-4 lg:pb-0 h-[300px] lg:h-[500px] overflow-y-auto no-scrollbar scroll-smooth">
            {tabs.map((tab) => {
              const isActive = active === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  className={`text-right w-full flex-shrink-0 flex items-center justify-between p-3 md:p-4 rounded-2xl transition-all border outline-none ${isActive ? 'bg-orange-50 border-orange-500 shadow-md shadow-orange-100/50' : 'bg-transparent border-slate-100 md:border-transparent hover:bg-slate-50 text-slate-600'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl transition-colors shrink-0 ${isActive ? 'bg-orange-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon size={20} className="w-5 h-5" />
                    </div>
                    <span className={`text-base md:text-lg font-extrabold transition-colors ${isActive ? 'text-orange-700' : 'text-slate-600'}`}>{tab.title}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tab Content Display */}
          <div className="w-full lg:w-2/3 bg-slate-50 p-6 sm:p-8 md:p-12 rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 min-h-[300px] lg:min-h-[500px] flex items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-200/40 rounded-full blur-[80px] -z-10 mix-blend-multiply"></div>
            <AnimatePresence mode="wait">
              {tabs.map((tab) => {
                if (tab.id !== active) return null;
                const Icon = tab.icon;
                return (
                  <motion.div
                    key={tab.id}
                    initial={{ opacity: 0, scale: 0.95, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: 20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="space-y-4 sm:space-y-6 w-full"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white border border-orange-100 shadow-sm text-orange-600 rounded-2xl flex items-center justify-center">
                      <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight">{tab.title}</h3>
                    <p className="text-lg text-slate-700 leading-relaxed font-medium">{tab.desc}</p>
                    <div className="pt-6">
                      <a href="#demo" className="inline-flex text-white bg-orange-600 hover:bg-orange-700 font-bold px-8 py-3 rounded-xl shadow-md transition-colors items-center gap-2">
                         تفاصيل النظام 
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
