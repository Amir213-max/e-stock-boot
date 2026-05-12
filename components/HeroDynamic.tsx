import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { firestoreDb } from "../services/db";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

export default function HeroDynamic({ onOpenChat }: any) {
  const [title, setTitle] = useState("تحكم بأعمالك بقوة الأنظمة الذكية والموثوقة");
  const [subtitle, setSubtitle] = useState("ارتقِ بمؤسستك مع مودرن سوفت. نقدم برمجيات متطورة وسريعة الاستجابة للصيدليات، القطاعات التجارية، وأنظمة (ERP) لإدارة الموارد بدقة متناهية.");

  useEffect(() => {
    const fetchContent = async () => {
      try {
        if(!firestoreDb) return; const docRef = doc(firestoreDb, 'app_content', 'home');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.hero) {
            if (data.hero.title) setTitle(data.hero.title);
            if (data.hero.subtitle) setSubtitle(data.hero.subtitle);
          }
        }
      } catch (err) {
        console.error("Error fetching content:", err);
      }
    };
    fetchContent();
  }, []);

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.1 }}
      className="flex flex-col items-center lg:items-start text-center lg:text-right space-y-6 lg:ml-8"
    >
      <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-white text-sm font-bold shadow-lg shadow-orange-900/10">
        <span className="flex h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
        الحل التقني الأمثل لقطاع الأعمال والصيدليات
      </motion.div>
      
      <motion.div variants={fadeUp}>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.2rem] font-black text-slate-900 leading-[1.2] tracking-tight">
          {title}
        </h1>
      </motion.div>
      
      <motion.p variants={fadeUp} className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-xl font-medium">
        {subtitle}
      </motion.p>
      
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
        <a href="#products" className="inline-flex justify-center items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all shadow-xl hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 w-full sm:w-auto">
          تصفح برامجنا
          <ArrowLeft size={20} className="stroke-[2.5] text-orange-400" />
        </a>
        <a href="#contact" className="inline-flex justify-center items-center gap-2 bg-white border border-slate-200 hover:border-orange-500 hover:bg-orange-50/50 text-slate-800 px-8 py-4 rounded-2xl text-lg font-bold transition-all hover:-translate-y-1 shadow-sm w-full sm:w-auto">
          احجز استشارة مجانية
        </a>
      </motion.div>

      <motion.div variants={fadeUp} className="pt-6 flex items-center gap-6 text-sm font-bold text-slate-500">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-orange-500" />
          بدون تعقيدات تقنية
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-orange-500" />
          دعم فني متواصل
        </div>
      </motion.div>
    </motion.div>
  );
}
