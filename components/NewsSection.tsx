import NewsCard from './NewsCard';

export default function NewsSection() {
  const news = [
    {
      title: "إطلاق التحديث 3.0 لبرنامج Pharma Store",
      description: "نعلن لعملائنا الكرام عن إطلاق النسخة الجديدة التي تحتوي على ميزات متطورة لتحليل المبيعات وتوقع النواقص بدقة متناهية للحفاظ على استقرار عملك.",
      date: "15 أكتوبر 2023",
      imageUrl: "https://picsum.photos/seed/pharmacy/800/600"
    },
    {
      title: "مودرن سوفت تشارك في المعرض التكنولوجي",
      description: "سعداء بتواجدنا في المعرض السنوي لاستعراض أحدث حلول إدارة الأنشطة التجارية والأنظمة المتكاملة e-Stock أمام نخبة من رواد الأعمال.",
      date: "2 نوفمبر 2023",
      imageUrl: "https://picsum.photos/seed/tech/800/600"
    },
    {
      title: "شراكة استراتيجية مع كبرى سلاسل الصيدليات",
      description: "تم بحمد الله توقيع عقد شراكة استراتيجية لتقديم الحلول البرمجية لـ 150 فرعاً جديداً، لتعزيز الكفاءة التشغيلية والربط المركزي الموثوق.",
      date: "20 نوفمبر 2023",
      imageUrl: "https://picsum.photos/seed/business/800/600"
    }
  ];

  return (
    <section className="py-24 bg-slate-50 border-t border-slate-100 relative overflow-hidden" id="news">
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-100/40 rounded-full blur-[100px] -z-10 mix-blend-multiply pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-sm font-bold mb-4">أحدث الإنجازات</div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">آخر الأخبار والتحديثات</h2>
          <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">
            تعرف على أحدث الأخبار، التحديثات البرمجية، والمشاركات الخاصة بشبكة مودرن سوفت للبرمجيات وانضم إلى مسيرة تقدمنا.
          </p>
        </div>
        
        <div className="flex overflow-x-auto gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 snap-x snap-mandatory no-scrollbar pb-6 md:pb-0 px-4 -mx-4 md:px-0 md:mx-0">
          {news.map((item, idx) => (
            <div key={idx} className="snap-center sm:snap-start shrink-0 w-[85%] md:w-auto flex">
              <NewsCard 
                {...item} 
                delay={idx * 0.15} 
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
