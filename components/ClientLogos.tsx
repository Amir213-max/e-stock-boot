import { Store, Pill, ShoppingCart, HeartPulse, Stethoscope, Activity } from 'lucide-react';

export default function ClientLogos() {
  const logos = [
    { icon: Pill, name: 'صيدليات الشفاء' },
    { icon: ShoppingCart, name: 'هايبر ماركت النور' },
    { icon: HeartPulse, name: 'مجموعة العناية' },
    { icon: Store, name: 'أسواق المدينة' },
    { icon: Stethoscope, name: 'ميديكال جروب' },
    { icon: Activity, name: 'صيدليات الحياة' },
  ];

  return (
    <section className="py-12 bg-white border-y border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-bold text-slate-400 mb-8 uppercase tracking-widest leading-loose">شركاء النجاح الذين يثقون بأنظمتنا</p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
          {logos.map((logo, idx) => (
            <div key={idx} className="flex items-center gap-2 text-slate-800 font-bold text-lg md:text-xl transition-all hover:text-orange-600">
              <logo.icon size={28} className="text-orange-500 shrink-0" />
              {logo.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
