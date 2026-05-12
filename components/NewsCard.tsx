import { motion } from 'motion/react';
import { Calendar, ArrowLeft } from 'lucide-react';

interface NewsCardProps {
  title: string;
  description: string;
  date: string;
  imageUrl: string;
  delay?: number;
}

export default function NewsCard({ title, description, date, imageUrl, delay = 0 }: NewsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-lg shadow-slate-200/50 group hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer min-w-[300px] w-full shrink-0 md:min-w-0"
    >
      <div className="relative h-48 sm:h-56 w-full overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title} 
          className="object-cover group-hover:scale-105 transition-transform duration-500" 
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="p-6 sm:p-8 flex flex-col justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 font-bold mb-5 border border-slate-200 shadow-sm">
            <Calendar size={18} className="text-orange-600" />
            <span className="text-sm tracking-wide pt-0.5">{date}</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-orange-800 leading-tight mb-4 group-hover:text-orange-600 transition-colors">
            {title}
          </h3>
          <p className="text-slate-600 font-medium text-base sm:text-lg leading-relaxed mb-6">
            {description}
          </p>
        </div>
        <button className="flex items-center w-fit gap-2 text-orange-600 font-bold hover:text-orange-700 transition-colors">
          اقرأ المزيد
          <ArrowLeft size={18} />
        </button>
      </div>
    </motion.div>
  );
}
