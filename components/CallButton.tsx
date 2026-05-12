import { motion } from 'motion/react';
import { Phone } from 'lucide-react';

export default function CallButton() {
  return (
    <motion.a
      href="tel:01272000075"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-50 bg-orange-500 text-white p-4 rounded-full shadow-lg shadow-orange-500/30 flex items-center justify-center group"
    >
      <span className="absolute right-full mr-4 bg-white text-slate-800 text-sm font-bold px-3 py-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        إتصل بنا الآن
      </span>
      <Phone size={28} />
      {/* Pulse effect */}
      <div className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-20 -z-10"></div>
    </motion.a>
  );
}
