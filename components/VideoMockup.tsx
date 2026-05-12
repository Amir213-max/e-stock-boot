import { Play, MonitorPlay } from 'lucide-react';
import { motion } from 'motion/react';

export default function VideoMockup() {
  return (
    <section className="py-24 bg-slate-900 relative border-y border-slate-800">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">شاهد النظام في بيئة العمل الحقيقية</h2>
          <p className="text-lg text-slate-400">واجهة مستخدم سريعة، مستقرة، ومصممة خصيصاً للمستخدم العربي لتسريع إدخال البيانات والبيع.</p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-5xl mx-auto rounded-xl p-2 bg-slate-800 border-x border-t border-slate-700 shadow-2xl shadow-orange-900/20"
        >
          <div className="w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 aspect-[16/9] md:aspect-[21/9] relative flex items-center justify-center group cursor-pointer">
            {/* Simulated UI background */}
            <div className="absolute inset-0 opacity-10 bg-slate-100 bg-cover bg-center">
              <div className="w-full h-full flex flex-col opacity-50">
                <div className="h-10 border-b border-slate-800 flex items-center px-4"><div className="w-32 h-3 bg-orange-500/50 rounded-full"></div></div>
                <div className="flex-1 flex gap-4 p-4"><div className="w-64 h-full border border-slate-800 rounded-lg"></div><div className="flex-1 border border-slate-800 rounded-lg"></div></div>
              </div>
            </div>
            
            <div className="absolute inset-0 bg-slate-900/60 transition-colors group-hover:bg-slate-900/40"></div>
            
            {/* Play Button */}
            <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
              <Play className="ml-1 md:ml-2 fill-current w-6 h-6 md:w-9 md:h-9" />
            </div>

            <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 flex gap-2">
               <div className="px-2 md:px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-md text-orange-400 text-xs md:text-sm flex items-center gap-1.5 md:gap-2 font-bold shadow-sm">
                 <MonitorPlay className="w-4 h-4 md:w-5 md:h-5"/> <span className="hidden sm:inline">معاينة النظام</span><span className="sm:hidden">معاينة</span>
               </div>
            </div>
          </div>
          <div className="h-4 w-full bg-slate-700 mx-auto mt-2 rounded-b-xl max-w-[80%]"></div>
          <div className="h-1.5 w-32 bg-slate-600 mx-auto mt-1 rounded-sm shadow-sm"></div>
        </motion.div>
      </div>
    </section>
  );
}
