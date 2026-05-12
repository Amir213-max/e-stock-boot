import { MonitorPlay, Mail, Phone, MapPin } from 'lucide-react';
import LogoSVG from './LogoSVG';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 pt-20 pb-10" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Info */}
          <div className="space-y-6">
            <a href="/" className="flex items-center gap-2 shrink-0 w-fit bg-white/5 p-4 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
              <div className="relative w-40 md:w-48 drop-shadow-[0_0_15px_rgba(247,147,30,0.15)]">
                <LogoSVG theme="dark" className="w-full h-auto" />
              </div>
            </a>
            <p className="text-slate-400 leading-relaxed text-base font-medium pr-2">
              شريكك التقني الموثوق لأكثر من 15 عاماً في قيادة التحول الرقمي. نبتكر أنظمة ERP متكاملة وحلولاً سحابية ذكية لقطاع الأعمال والصيدليات، نفخر بخدمة أكثر من 5000 عميل واعتمادهم على ثبات أنظمتنا مع دعم فني يعمل على مدار الساعة.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-xl mb-6">روابط سريعة</h3>
            <ul className="space-y-4">
              <li><a href="/" className="text-slate-400 font-medium hover:text-orange-500 hover:translate-x-1 block transition-all">الرئيسية</a></li>
              <li><a href="#about" className="text-slate-400 font-medium hover:text-orange-500 hover:translate-x-1 block transition-all">عن الشركة</a></li>
              <li><a href="#products" className="text-slate-400 font-medium hover:text-orange-500 hover:translate-x-1 block transition-all">أنظمتنا</a></li>
              <li><a href="#features" className="text-slate-400 font-medium hover:text-orange-500 hover:translate-x-1 block transition-all">لماذا نحن؟</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-bold text-xl mb-6">برامجنا الرئيسية</h3>
            <ul className="space-y-4">
              <li className="text-orange-500 font-bold block">e-Stock Pharmacy</li>
              <li className="text-slate-400 font-medium block hover:text-orange-500 transition-colors">e-Stock Retail</li>
              <li className="text-slate-400 font-medium block hover:text-orange-500 transition-colors">Pharma Store ERP</li>
              <li className="text-slate-400 font-medium block hover:text-orange-500 transition-colors">عقود الدعم الفني</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-xl mb-6">خدمة العملاء</h3>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="pt-1"><MapPin size={24} className="text-orange-500" /></div>
                <span className="text-slate-300 font-medium leading-relaxed">القاهرة، مدينة نصر، شارع مكرم عبيد</span>
              </li>
              <li className="flex items-start gap-4">
                <div className="pt-1"><Phone size={24} className="text-orange-500" /></div>
                <div className="flex flex-col gap-2 relative top-0.5">
                  <span className="text-white font-bold tracking-wider" dir="ltr">012 72 0000 75</span>
                  <span className="text-white font-bold tracking-wider" dir="ltr">012 06 342 777</span>
                  <p className="text-slate-500 text-sm mt-1">متاح طوال أيام الأسبوع</p>
                </div>
              </li>
              <li className="flex items-center gap-4">
                <div><Mail size={24} className="text-orange-500" /></div>
                <span className="text-slate-300 font-medium">info@modernsoft.com</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 font-medium text-sm text-center md:text-right">
            © {new Date().getFullYear()} مودرن سوفت للبرمجيات. جميع الحقوق محفوظة لشركة Modern Soft.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-500 hover:text-orange-500 font-medium text-sm transition-colors">سياسة الخصوصية</a>
            <span className="text-slate-700">|</span>
            <a href="#" className="text-slate-500 hover:text-orange-500 font-medium text-sm transition-colors">شروط الاستخدام</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
