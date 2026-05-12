import { motion } from 'motion/react';
import { XCircle, CheckCircle, TrendingDown, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Comparison() {
  return (
    <section className="py-24 bg-slate-50 overflow-hidden" id="comparison">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">قارن بنفسك، الفرق واضح!</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            تخلص من صداع الإدارة القديمة وتقارير الجرد الورقية غير الدقيقة. نظامنا ينقلك لمستوى احترافي كامل.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 relative">
          
          {/* VS Badge */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 text-white font-black text-2xl w-16 h-16 rounded-full flex items-center justify-center border-4 border-slate-50 z-10 shadow-xl hidden md:flex">
            VS
          </div>

          {/* Traditional Way */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-8 border border-red-100 shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-2 h-full bg-red-400"></div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">برامج تقليدية / دفاتر</h3>
            </div>

            <ul className="space-y-6">
              <li className="flex gap-4">
                <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5"/>
                <div>
                  <p className="font-bold text-slate-800">بطء شديد في البيع</p>
                  <p className="text-slate-500 text-sm mt-1">تأخير الزبائن بسبب تعقيد الشاشات والماوس.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5"/>
                <div>
                  <p className="font-bold text-slate-800">جرد عشوائي وأخطاء</p>
                  <p className="text-slate-500 text-sm mt-1">عدم دقة في النواقص، مما يُضيع عليك مبيعات محققة.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5"/>
                <div>
                  <p className="font-bold text-slate-800">دعم فني منعدم أو مكلف</p>
                  <p className="text-slate-500 text-sm mt-1">تدفع مبالغ سنوية وإلا يتوقف النظام أو لا يُرد عليك.</p>
                </div>
              </li>
            </ul>
          </motion.div>

          {/* Modern Soft Way */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[80px] -z-0"></div>
            <div className="absolute top-0 right-0 w-2 h-full bg-orange-500 z-10"></div>
            
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 border border-orange-500/30">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white">نظام مودرن سوفت</h3>
            </div>

            <ul className="space-y-6 relative z-10">
              <li className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-orange-500 shrink-0 mt-0.5"/>
                <div>
                  <p className="font-bold text-white">واجهة كاشير طلقات</p>
                  <p className="text-slate-400 text-sm mt-1">اعتمد على اختصارات لوحة المفاتيح لإنجاز العميل فوراً.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-orange-500 shrink-0 mt-0.5"/>
                <div>
                  <p className="font-bold text-white">إشعارات نواقص ذكية</p>
                  <p className="text-slate-400 text-sm mt-1">تعرف على النواقص وصلاحيات الأدوية قبل انتهاء رصيدها بوقت كاف.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-orange-500 shrink-0 mt-0.5"/>
                <div>
                  <p className="font-bold text-orange-400">بدون اشتراكات ودعم مجاني</p>
                  <p className="text-slate-400 text-sm mt-1">اشترِ النظام لمرة واحدة، وتمتع بدعم أونلاين مجاني بلا التزامات إضافية.</p>
                </div>
              </li>
            </ul>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
