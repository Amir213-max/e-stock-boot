
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LogoSVG from './LogoSVG';

const navLinks = [
  { name: 'الرئيسية', href: '/' },
  { name: 'أنظمتنا الأساسية', href: '#products' },
  { name: 'باقات الأسعار', href: '#pricing' },
];

export default function Navbar({ onSecretClick }: { onSecretClick?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);

  const handleLogoClick = (e: React.MouseEvent) => {
    if (!onSecretClick) return;
    e.preventDefault();
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);
    if (newCount >= 10) {
      setLogoClicks(0);
      onSecretClick();
    }
    // Reset clicks after 3 seconds of inactivity
    setTimeout(() => setLogoClicks(0), 3000);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm py-3 md:py-4' : 'bg-transparent py-4 md:py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-50">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <a href="/" onClick={handleLogoClick} className="flex items-center gap-2 shrink-0 select-none">
            <div className="relative w-24 md:w-28 pt-1">
              <LogoSVG theme="light" className="w-full h-auto drop-shadow-sm" />
            </div>
          </a>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-8 bg-slate-50 rounded-full border border-slate-100 px-8 py-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-bold text-slate-700 hover:text-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-md px-2 py-1"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <a
              href="#contact"
              className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-bold transition-all hover:-translate-y-1 shadow-lg shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              تواصل معنا
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsOpen(true)}
              className="text-slate-900 bg-white shadow-sm border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-expanded={isOpen}
              aria-label="فتح القائمة"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
        )}
      </AnimatePresence>
      
      {/* Mobile Slide-in Drawer */}
      <AnimatePresence>
        {isOpen && (
            <motion.div
              key="mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="القائمة الرئيسية"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 bottom-0 right-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center p-4 border-b border-slate-100">
                <a href="/" className="flex items-center gap-2 shrink-0" onClick={() => setIsOpen(false)}>
                  <div className="relative w-28 pt-1">
                    <LogoSVG theme="light" className="w-full h-auto drop-shadow-sm" />
                  </div>
                </a>
                <button
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  onClick={() => setIsOpen(false)}
                  className="text-slate-500 hover:text-slate-900 bg-slate-50 p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                  aria-label="إغلاق القائمة"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-4 flex-grow overflow-y-auto no-scrollbar">
                <div className="space-y-2 mt-2">
                  {navLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-3.5 text-base font-bold text-slate-700 hover:text-orange-600 hover:bg-orange-50 focus:bg-orange-50 focus:text-orange-600 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {link.name}
                    </a>
                  ))}
                </div>
              </div>
              
              <div className="p-4 border-t border-slate-100">
                <a
                  href="#contact"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center w-full text-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-4 rounded-xl font-bold transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  تواصل معنا
                </a>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
