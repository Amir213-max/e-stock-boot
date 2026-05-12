import { motion } from 'motion/react';
import { MessagesSquare } from 'lucide-react';

interface BotFloatingButtonProps {
  onClick: () => void;
}

export default function BotFloatingButton({ onClick }: BotFloatingButtonProps) {
  return (
    <div className="fixed bottom-10 right-10 z-[999] animate-bounce">
      <motion.button
        onClick={onClick}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-5 rounded-full shadow-[0_20px_50px_rgba(249,115,22,0.4)] flex items-center justify-center group border-4 border-white/20 backdrop-blur-xl"
      >
        <span className="absolute right-full mr-6 bg-slate-950 text-white text-base font-black px-5 py-3 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none translate-x-4 group-hover:translate-x-0 border border-slate-800">
          تحدث مع المساعد الذكي الآن 🤖
        </span>
        <div className="relative">
          <MessagesSquare size={38} className="text-white" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-white shadow-[0_0_10px_rgba(255,255,255,1)]"></span>
          </span>
        </div>
      </motion.button>
    </div>
  );
}
