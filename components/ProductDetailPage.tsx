import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, ChevronLeft, ArrowLeft } from 'lucide-react';

interface ProductDetail {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  features?: string[];
  benefits?: string[];
  targetUsers?: string;
  screenshots?: string[];
}

interface ProductDetailPageProps {
  product: ProductDetail;
  onClose: () => void;
  whatsappPhone: string;
}

export default function ProductDetailPage({ product, onClose, whatsappPhone }: ProductDetailPageProps) {
  const features = product.features || [];
  const benefits = product.benefits || [];
  const screenshots = product.screenshots || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-white overflow-y-auto font-cairo"
        dir="rtl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <span className="text-slate-400 font-bold text-sm">العودة</span>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Hero Section */}
        <div className="relative h-72 md:h-96 overflow-hidden">
          <img src={product.image} className="w-full h-full object-cover" alt={product.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
          <div className="absolute bottom-0 right-0 p-8 text-right">
            <span className="text-orange-400 font-bold text-lg block mb-2">{product.subtitle}</span>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">{product.title}</h1>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-16 text-right space-y-16">

          {/* Description */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <p className="text-xl md:text-2xl text-slate-500 font-bold leading-relaxed">{product.description}</p>
          </motion.div>

          {/* Target Users */}
          {product.targetUsers && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-orange-50 border border-orange-100 rounded-3xl p-8">
              <h3 className="text-xl font-black text-orange-600 mb-3">👥 مناسب لـ</h3>
              <p className="text-slate-700 font-bold text-lg leading-relaxed">{product.targetUsers}</p>
            </motion.div>
          )}

          {/* Features */}
          {features.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900">المميزات الرئيسية</h2>
                <span className="text-xs sm:text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">اسحب للمزيد ←</span>
              </div>
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-6 pb-8 -mx-6 px-6 no-scrollbar" style={{ scrollBehavior: 'smooth' }}>
                {features.map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="flex flex-col gap-4 bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shrink-0 w-[80vw] sm:w-80 snap-center shadow-lg shadow-slate-200/40 hover:-translate-y-2 transition-all duration-300"
                  >
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
                      <CheckCircle className="text-orange-500" size={26} />
                    </div>
                    <span className="text-slate-700 font-bold text-lg sm:text-xl leading-relaxed">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Benefits */}
          {benefits.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-10">فوائد النظام</h2>
              <div className="space-y-4">
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-black text-sm shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-slate-700 font-bold text-lg pt-1">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Screenshots */}
          {screenshots.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-10">صور النظام</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {screenshots.map((src, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="rounded-3xl overflow-hidden shadow-xl border border-slate-100"
                  >
                    <img src={src} className="w-full h-auto object-cover" alt={`لقطة ${i + 1}`} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* CTA - Subscribe Now */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#1a1c23] rounded-[3rem] p-12 md:p-20 text-center text-white"
          >
            <h2 className="text-3xl md:text-5xl font-black mb-6">
              مستعد تبدأ مع <span className="text-orange-500">{product.title}؟</span>
            </h2>
            <p className="text-slate-400 font-bold text-xl mb-10 leading-relaxed">
              تواصل معنا الآن وسنقوم بتجهيز النظام لنشاطك فوراً
            </p>
            <a
              href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`أهلاً مودرن سوفت، أريد الاشتراك في نظام: ${product.subtitle || product.title}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-4 bg-orange-500 text-white px-14 py-6 rounded-[2rem] font-black text-2xl hover:bg-orange-400 transition-all shadow-2xl shadow-orange-500/30 hover:-translate-y-1"
            >
              <span>اشترك الآن</span>
              <ChevronLeft size={28} />
            </a>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
