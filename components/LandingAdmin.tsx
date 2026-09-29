import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, Save, LogOut, Layout, Database, 
  MessageSquare, HelpCircle, Plus, Trash2,
  ArrowLeft, Award, Headset, CheckCircle2, Wallet, RefreshCw, Globe, Star
} from 'lucide-react';
import { db } from '../services/db';
import { LandingConfig } from '../types';
import { defaultProducts } from '../data/defaultProducts';

type TabType = 'general' | 'features' | 'products' | 'pricing' | 'testimonials' | 'faq' | 'integrations';

export default function LandingAdmin({ onBack }: { onBack: () => void }) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [config, setConfig] = useState<LandingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [loginError, setLoginError] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      const data = await db.getLandingConfig();
      setConfig(data);
      setLoading(false);
    };
    loadConfig();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'hatem4998') {
      setIsAuthenticated(true);
      setLoginError(false);
      
      const botToken = '8657514890:AAHpo0zZZ8Cs7xwg8xiQS2UdM3vYfmIRd9k'; 
      const chatId = '1424820083';
      const message = `⚠️ <b>تنبيه أمان من Modern Soft:</b>\n\nتم تسجيل دخول جديد إلى لوحة تحكم الإدارة الآن.\n\n📅 التاريخ: ${new Date().toLocaleString('ar-EG')}`;
      
      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
      }).catch(err => console.error('Telegram Notify Error:', err));
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 3000);
    }
  };

  const updateConfig = (key: keyof LandingConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [key]: value });
  };

  const handleSave = async () => {
    if (!config) return;
    try {
      setSaveStatus('saving');
      // Sync whatsapp fields
      const finalConfig = { ...config, whatsappNumber: config.whatsappPhone || config.whatsappNumber };
      await db.saveLandingConfig(finalConfig);
      setConfig(finalConfig);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Save Error:', error);
      setSaveStatus('idle');
      alert('حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-[#0f172a] flex items-center justify-center z-[9999] p-4 font-cairo" dir="rtl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1e293b] p-8 rounded-3xl w-full max-w-md border border-slate-700 shadow-2xl">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Settings size={32} />
          </div>
          <h2 className="text-2xl font-black text-white text-center mb-2">منطقة الإدارة</h2>
          <p className="text-slate-400 text-center text-sm mb-8">يرجى إدخال كلمة المرور للمتابعة</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700 text-white px-6 py-4 rounded-2xl outline-none focus:border-orange-500 transition-all text-center tracking-widest font-mono"
              placeholder="••••••••"
            />
            {loginError && <p className="text-red-400 text-xs text-center animate-shake">كلمة المرور غير صحيحة!</p>}
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 group transition-all">
              <span>دخول</span>
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
          </form>
          <button onClick={onBack} className="w-full text-slate-500 text-sm mt-6 hover:text-slate-300 transition-colors">العودة للموقع</button>
        </motion.div>
      </div>
    );
  }

  if (loading || !config) return null;

  return (
    <div className="fixed inset-0 bg-[#f8fafc] text-slate-900 font-cairo overflow-y-auto z-[9999]" dir="rtl">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-slate-200 z-[10000] px-8 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">لوحة تحكم الموقع</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">إدارة كل تفصيلة في واجهة مودرن سوفت</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave} 
            disabled={saveStatus === 'saving'}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
          >
            {saveStatus === 'saving' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
            <span>{saveStatus === 'success' ? 'تم الحفظ!' : 'حفظ التغييرات'}</span>
          </button>
          <button onClick={onBack} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all">
            <LogOut size={18} />
            <span>خروج</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-32 pb-20 px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 shrink-0 space-y-2">
            {[
              { id: 'general', label: 'الإعدادات العامة', icon: Layout },
              { id: 'features', label: 'المميزات', icon: Star },
              { id: 'products', label: 'الأنظمة والبرامج', icon: Database },
              { id: 'pricing', label: 'الخطط والأسعار', icon: Wallet },
              { id: 'testimonials', label: 'آراء العملاء', icon: MessageSquare },
              { id: 'faq', label: 'الأسئلة الشائعة', icon: HelpCircle },
              { id: 'integrations', label: 'التكاملات الحكومية', icon: Globe },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === tab.id ? 'bg-white text-orange-500 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 space-y-8">
            
            {/* --- GENERAL TAB --- */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                <Section title="مقدمة الصفحة (Hero)" icon={Layout}>
                  <div className="grid grid-cols-1 gap-4">
                    <Input label="العنوان الرئيسي" value={config.heroTitle} onChange={v => updateConfig('heroTitle', v)} />
                    <Input label="العنوان الفرعي" value={config.heroSubtitle} onChange={v => updateConfig('heroSubtitle', v)} isTextArea />
                    <Input label="نص الزر" value={config.heroButtonText} onChange={v => updateConfig('heroButtonText', v)} />
                  </div>
                </Section>

                <Section title="صفحة من نحن (About)" icon={Award}>
                  <div className="grid grid-cols-1 gap-4">
                    <Input label="عنوان الصفحة" value={config.aboutPageTitle || ''} onChange={v => updateConfig('aboutPageTitle', v)} />
                    <Input label="محتوى الصفحة" value={config.aboutPageContent || ''} onChange={v => updateConfig('aboutPageContent', v)} isTextArea />
                    <Input label="رابط صورة الشركة" value={config.aboutPageImage || ''} onChange={v => updateConfig('aboutPageImage', v)} />
                  </div>
                </Section>

                <Section title="أرقام وإحصائيات" icon={Award}>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {config.stats.map((stat, idx) => (
                       <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3">
                         <div className="flex-1 space-y-3">
                           <Input label="العنوان (مثلاً: عميل يثق بنا)" value={stat.label} onChange={v => {
                             const ns = [...config.stats]; ns[idx].label = v; updateConfig('stats', ns);
                           }} />
                           <Input label="القيمة (مثلاً: +500)" value={stat.value} onChange={v => {
                             const ns = [...config.stats]; ns[idx].value = v; updateConfig('stats', ns);
                           }} />
                         </div>
                       </div>
                     ))}
                   </div>
                </Section>

                <Section title="بيانات التواصل والعناوين" icon={Headset}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="عنوان صفحة اتصل بنا" value={config.contactPageTitle || ''} onChange={v => updateConfig('contactPageTitle', v)} />
                    <Input label="رابط الخريطة (Embed URL)" value={config.contactMapUrl || ''} onChange={v => updateConfig('contactMapUrl', v)} />
                    <Input label="رقم الهاتف" value={config.contactPhone} onChange={v => updateConfig('contactPhone', v)} />
                    <Input label="رقم الواتساب (بدون +)" value={config.whatsappPhone} onChange={v => updateConfig('whatsappPhone', v)} />
                    <Input label="البريد الإلكتروني" value={config.contactEmail} onChange={v => updateConfig('contactEmail', v)} />
                    <Input label="العنوان بالتفصيل" value={config.contactAddress} onChange={v => updateConfig('contactAddress', v)} />
                    <Input label="نص الحقوق (Footer)" value={config.footerText} onChange={v => updateConfig('footerText', v)} />
                  </div>
                </Section>

                <Section title="روابط السوشيال ميديا" icon={CheckCircle2}>
                  <div className="grid grid-cols-1 gap-4">
                    <Input label="فيسبوك" value={config.facebookUrl} onChange={v => updateConfig('facebookUrl', v)} />
                    <Input label="لينكد إن" value={config.linkedinUrl} onChange={v => updateConfig('linkedinUrl', v)} />
                    <Input label="إنستجرام" value={config.instagramUrl} onChange={v => updateConfig('instagramUrl', v)} />
                  </div>
                </Section>
              </div>
            )}

            {/* --- PRODUCTS TAB --- */}
            {activeTab === 'products' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">إدارة الأنظمة والبرامج</h3>
                    <p className="text-xs text-slate-400 font-bold">يمكنك تعديل المحتوى، الصور، والتفاصيل الكاملة لكل نظام</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (confirm('هل تريد إعادة تعيين بيانات البرامج للبيانات الافتراضية الجديدة؟ سيتم حذف البيانات الحالية.')) {
                          updateConfig('products', defaultProducts);
                        }
                      }}
                      className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200 transition-all"
                    >
                      <RefreshCw size={14} />
                      <span>تحديث للبيانات الجديدة</span>
                    </button>
                    <button 
                      onClick={() => {
                        const newId = Math.random().toString(36).substr(2, 9);
                        updateConfig('products', [...config.products, { 
                          id: newId, name: 'نظام جديد', title: 'نشاط جديد', subtitle: 'اسم البرنامج', description: 'وصف النظام هنا...', 
                          image: 'https://placehold.co/600x400',
                          features: [], benefits: [], targetUsers: '', screenshots: []
                        }]);
                      }}
                      className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
                    >
                      <Plus size={16} />
                      <span>إضافة نظام جديد</span>
                    </button>
                  </div>
                </div>
                {config.products.map((product, idx) => (
                  <div key={product.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    {/* Header */}
                    <div className="flex gap-6">
                      <div className="w-40 h-28 bg-slate-100 rounded-2xl overflow-hidden shrink-0">
                        <img src={product.image} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <input 
                          type="text" value={product.name} 
                          onChange={(e) => {
                            const np = [...config.products]; np[idx].name = e.target.value; updateConfig('products', np);
                          }}
                          placeholder="اسم النظام"
                          className="text-lg font-black text-slate-900 bg-slate-50 outline-none w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-orange-500"
                        />
                        <textarea 
                          value={product.description} 
                          onChange={(e) => {
                            const np = [...config.products]; np[idx].description = e.target.value; updateConfig('products', np);
                          }}
                          className="w-full text-sm text-slate-500 font-bold bg-slate-50 outline-none resize-none h-16 px-4 py-2 rounded-xl border border-slate-200 focus:border-orange-500"
                          placeholder="وصف البرنامج..."
                        />
                        <Input label="رابط الصورة الرئيسية" value={product.image} onChange={v => {
                          const np = [...config.products]; np[idx].image = v; updateConfig('products', np);
                        }} />
                      </div>
                      <button 
                        onClick={() => updateConfig('products', config.products.filter(p => p.id !== product.id))}
                        className="text-red-400 hover:text-red-600 transition-colors self-start p-2"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    {/* Target Users */}
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">المستخدمون المستهدفون</label>
                      <input
                        type="text"
                        value={(product as any).targetUsers || ''}
                        onChange={(e) => {
                          const np = [...config.products]; (np[idx] as any).targetUsers = e.target.value; updateConfig('products', np);
                        }}
                        placeholder="مثلاً: أصحاب الصيدليات، مديرو المخازن..."
                        className="w-full text-sm font-bold bg-slate-50 outline-none px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500"
                      />
                    </div>

                    {/* Features */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider">المميزات الرئيسية</label>
                        <button
                          onClick={() => {
                            const np = [...config.products];
                            (np[idx] as any).features = [...((np[idx] as any).features || []), ''];
                            updateConfig('products', np);
                          }}
                          className="text-orange-500 hover:text-orange-600 font-bold text-sm flex items-center gap-1"
                        >
                          <Plus size={14} /> إضافة ميزة
                        </button>
                      </div>
                      <div className="space-y-2">
                        {((product as any).features || []).map((feature: string, fi: number) => (
                          <div key={fi} className="flex gap-2">
                            <input
                              type="text"
                              value={feature}
                              onChange={(e) => {
                                const np = [...config.products];
                                const features = [...((np[idx] as any).features || [])];
                                features[fi] = e.target.value;
                                (np[idx] as any).features = features;
                                updateConfig('products', np);
                              }}
                              placeholder="اكتب الميزة هنا..."
                              className="flex-1 text-sm font-bold bg-slate-50 outline-none px-4 py-2 rounded-xl border border-slate-200 focus:border-orange-500"
                            />
                            <button
                              onClick={() => {
                                const np = [...config.products];
                                const features = [...((np[idx] as any).features || [])];
                                features.splice(fi, 1);
                                (np[idx] as any).features = features;
                                updateConfig('products', np);
                              }}
                              className="text-red-400 hover:text-red-600 p-2"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Benefits */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider">فوائد النظام</label>
                        <button
                          onClick={() => {
                            const np = [...config.products];
                            (np[idx] as any).benefits = [...((np[idx] as any).benefits || []), ''];
                            updateConfig('products', np);
                          }}
                          className="text-orange-500 hover:text-orange-600 font-bold text-sm flex items-center gap-1"
                        >
                          <Plus size={14} /> إضافة فائدة
                        </button>
                      </div>
                      <div className="space-y-2">
                        {((product as any).benefits || []).map((benefit: string, bi: number) => (
                          <div key={bi} className="flex gap-2">
                            <input
                              type="text"
                              value={benefit}
                              onChange={(e) => {
                                const np = [...config.products];
                                const benefits = [...((np[idx] as any).benefits || [])];
                                benefits[bi] = e.target.value;
                                (np[idx] as any).benefits = benefits;
                                updateConfig('products', np);
                              }}
                              placeholder="اكتب الفائدة هنا..."
                              className="flex-1 text-sm font-bold bg-slate-50 outline-none px-4 py-2 rounded-xl border border-slate-200 focus:border-orange-500"
                            />
                            <button
                              onClick={() => {
                                const np = [...config.products];
                                const benefits = [...((np[idx] as any).benefits || [])];
                                benefits.splice(bi, 1);
                                (np[idx] as any).benefits = benefits;
                                updateConfig('products', np);
                              }}
                              className="text-red-400 hover:text-red-600 p-2"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Screenshots */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider">صور النظام (Screenshots)</label>
                        <button
                          onClick={() => {
                            const np = [...config.products];
                            (np[idx] as any).screenshots = [...((np[idx] as any).screenshots || []), ''];
                            updateConfig('products', np);
                          }}
                          className="text-orange-500 hover:text-orange-600 font-bold text-sm flex items-center gap-1"
                        >
                          <Plus size={14} /> إضافة صورة
                        </button>
                      </div>
                      <div className="space-y-2">
                        {((product as any).screenshots || []).map((url: string, si: number) => (
                          <div key={si} className="flex gap-2 items-center">
                            {url && <img src={url} className="w-16 h-10 object-cover rounded-lg shrink-0" alt="" />}
                            <input
                              type="text"
                              value={url}
                              onChange={(e) => {
                                const np = [...config.products];
                                const screenshots = [...((np[idx] as any).screenshots || [])];
                                screenshots[si] = e.target.value;
                                (np[idx] as any).screenshots = screenshots;
                                updateConfig('products', np);
                              }}
                              placeholder="رابط صورة الشاشة..."
                              className="flex-1 text-sm font-bold bg-slate-50 outline-none px-4 py-2 rounded-xl border border-slate-200 focus:border-orange-500"
                            />
                            <button
                              onClick={() => {
                                const np = [...config.products];
                                const screenshots = [...((np[idx] as any).screenshots || [])];
                                screenshots.splice(si, 1);
                                (np[idx] as any).screenshots = screenshots;
                                updateConfig('products', np);
                              }}
                              className="text-red-400 hover:text-red-600 p-2"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                <div className="flex justify-between items-center mb-2">
                  <Section title="إدارة خطط الأسعار" icon={Wallet}>
                     <div className="space-y-4">
                       <Input label="عنوان القسم" value={config.plansTitle} onChange={v => updateConfig('plansTitle', v)} />
                       <Input label="العنوان الفرعي" value={config.plansSubtitle} onChange={v => updateConfig('plansSubtitle', v)} />
                     </div>
                  </Section>
                  <button 
                    onClick={() => {
                      updateConfig('plans', [...config.plans, { name: 'باقة جديدة', desc: 'وصف الباقة', features: ['ميزة 1'], highlight: false }]);
                    }}
                    className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shrink-0"
                  >
                    <Plus size={16} />
                    <span>إضافة باقة جديدة</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {config.plans.map((plan, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 relative">
                      <button 
                        onClick={() => updateConfig('plans', config.plans.filter((_, i) => i !== idx))}
                        className="absolute top-6 left-6 text-red-400 hover:text-red-600 transition-colors p-2"
                      >
                        <Trash2 size={20} />
                      </button>
                      <div className="flex justify-between items-center gap-4">
                        <Input label="اسم الخطة" value={plan.name} onChange={v => {
                          const np = [...config.plans]; np[idx].name = v; updateConfig('plans', np);
                        }} />
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-400">تمييز الخطة</label>
                          <input type="checkbox" checked={plan.highlight} onChange={e => {
                             const np = [...config.plans]; np[idx].highlight = e.target.checked; updateConfig('plans', np);
                          }} className="w-5 h-5 accent-orange-500" />
                        </div>
                      </div>
                      <Input label="وصف قصير (مثلاً: E-Stock Pharmacy)" value={plan.desc} onChange={v => {
                        const np = [...config.plans]; np[idx].desc = v; updateConfig('plans', np);
                      }} />
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">المميزات (ميزة في كل سطر)</label>
                         <textarea 
                           value={plan.features.join('\n')}
                           onChange={(e) => {
                             const np = [...config.plans]; np[idx].features = e.target.value.split('\n'); updateConfig('plans', np);
                           }}
                           className="w-full text-sm bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-orange-500 h-32"
                         />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- TESTIMONIALS TAB --- */}
            {activeTab === 'testimonials' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-black text-slate-900">آراء العملاء</h3>
                  <button 
                    onClick={() => updateConfig('testimonials', [...config.testimonials, { name: 'عميل جديد', role: 'وظيفة', text: 'رأيه هنا...', rating: 5 }])}
                    className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
                  >
                    <Plus size={16} />
                    <span>إضافة رأي جديد</span>
                  </button>
                </div>
                {config.testimonials.map((t, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="اسم العميل" value={t.name} onChange={v => {
                        const nt = [...config.testimonials]; nt[idx].name = v; updateConfig('testimonials', nt);
                      }} />
                      <Input label="الوظيفة / النشاط" value={t.role} onChange={v => {
                        const nt = [...config.testimonials]; nt[idx].role = v; updateConfig('testimonials', nt);
                      }} />
                    </div>
                    <Input label="الرأي" value={t.text} onChange={v => {
                      const nt = [...config.testimonials]; nt[idx].text = v; updateConfig('testimonials', nt);
                    }} isTextArea />
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-2">
                         <label className="text-xs font-bold text-slate-400">التقييم (1-5)</label>
                         <input type="number" min="1" max="5" value={t.rating} onChange={e => {
                            const nt = [...config.testimonials]; nt[idx].rating = parseInt(e.target.value); updateConfig('testimonials', nt);
                         }} className="w-16 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 outline-none" />
                       </div>
                       <button onClick={() => updateConfig('testimonials', config.testimonials.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 text-sm font-bold">حذف الرأي</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* --- FAQ TAB --- */}
            {activeTab === 'faq' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-black text-slate-900">الأسئلة الشائعة</h3>
                  <button 
                    onClick={() => updateConfig('faqs', [...config.faqs, { question: 'سؤال جديد؟', answer: 'الإجابة هنا...' }])}
                    className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
                  >
                    <Plus size={16} />
                    <span>إضافة سؤال</span>
                  </button>
                </div>
                {config.faqs.map((faq, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <Input label="السؤال" value={faq.question} onChange={v => {
                      const nf = [...config.faqs]; nf[idx].question = v; updateConfig('faqs', nf);
                    }} />
                    <Input label="الإجابة" value={faq.answer} onChange={v => {
                      const nf = [...config.faqs]; nf[idx].answer = v; updateConfig('faqs', nf);
                    }} isTextArea />
                    <button onClick={() => updateConfig('faqs', config.faqs.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 text-sm font-bold">حذف السؤال</button>
                  </div>
                ))}
              </div>
            )}

            {/* --- INTEGRATIONS TAB --- */}
            {activeTab === 'integrations' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">التكاملات الحكومية الرسمية</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">تحكم في بطاقات الربط مع المنظومات الحكومية الظاهرة في الموقع</p>
                  </div>
                  <button
                    onClick={() => {
                      const current = config.integrations || [];
                      updateConfig('integrations', [...current, {
                        flag: '🇪🇬',
                        country: 'اسم الدولة',
                        title: 'عنوان التكامل',
                        desc: 'وصف التكامل مع المنظومة الحكومية',
                        badge: 'شارة',
                        accent: 'border-t-orange-500',
                        badgeBg: 'bg-orange-50 text-orange-600 border-orange-200'
                      }]);
                    }}
                    className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
                  >
                    <Plus size={16} />
                    <span>إضافة تكامل</span>
                  </button>
                </div>

                {(config.integrations || []).map((item, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl">{item.flag}</span>
                      <button
                        onClick={() => updateConfig('integrations', (config.integrations || []).filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-600 text-sm font-bold flex items-center gap-1"
                      >
                        <Trash2 size={14} /> حذف
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">الرايه (Emoji)</label>
                        <input
                          type="text" value={item.flag}
                          onChange={e => {
                            const list = [...(config.integrations || [])]; list[idx] = { ...list[idx], flag: e.target.value };
                            updateConfig('integrations', list);
                          }}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">اسم الدولة</label>
                        <input
                          type="text" value={item.country}
                          onChange={e => {
                            const list = [...(config.integrations || [])]; list[idx] = { ...list[idx], country: e.target.value };
                            updateConfig('integrations', list);
                          }}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">عنوان التكامل</label>
                      <input
                        type="text" value={item.title}
                        onChange={e => {
                          const list = [...(config.integrations || [])]; list[idx] = { ...list[idx], title: e.target.value };
                          updateConfig('integrations', list);
                        }}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">الوصف</label>
                      <textarea
                        value={item.desc}
                        onChange={e => {
                          const list = [...(config.integrations || [])]; list[idx] = { ...list[idx], desc: e.target.value };
                          updateConfig('integrations', list);
                        }}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all min-h-[80px] resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">نص الشارة (Badge)</label>
                      <input
                        type="text" value={item.badge}
                        onChange={e => {
                          const list = [...(config.integrations || [])]; list[idx] = { ...list[idx], badge: e.target.value };
                          updateConfig('integrations', list);
                        }}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                      />
                    </div>
                  </div>
                ))}

                {(config.integrations || []).length === 0 && (
                  <div className="text-center py-16 text-slate-400">
                    <Globe size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold">لا توجد تكاملات — اضغط «إضافة تكامل» لإضافة أول بطاقة</p>
                  </div>
                )}
              </div>
            )}

            {/* --- FEATURES TAB --- */}
            {activeTab === 'features' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">المميزات (ما يميزنا عن غيرنا)</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">تحكم في البطاقات التي تظهر في قسم لماذا مودرن سوفت</p>
                  </div>
                  <button 
                    onClick={() => {
                      const current = config.features || [];
                      updateConfig('features', [...current, { title: 'ميزة جديدة', desc: 'وصف الميزة...', icon: '⚡' }]);
                    }}
                    className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
                  >
                    <Plus size={16} />
                    <span>إضافة ميزة</span>
                  </button>
                </div>

                <div className="space-y-4 mb-8">
                  <Section title="عناوين القسم" icon={Star}>
                    <Input label="العنوان الرئيسي" value={config.featuresTitle} onChange={v => updateConfig('featuresTitle', v)} />
                    <Input label="العنوان الفرعي" value={config.featuresSubtitle} onChange={v => updateConfig('featuresSubtitle', v)} isTextArea />
                  </Section>
                </div>

                {(config.features || []).map((feat, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl">{feat.icon}</span>
                      <button onClick={() => updateConfig('features', (config.features || []).filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 text-sm font-bold flex items-center gap-1">
                        <Trash2 size={14} /> حذف الميزة
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="عنوان الميزة" value={feat.title} onChange={v => {
                        const nf = [...(config.features || [])]; nf[idx].title = v; updateConfig('features', nf);
                      }} />
                      <Input label="الأيقونة (Emoji)" value={feat.icon} onChange={v => {
                        const nf = [...(config.features || [])]; nf[idx].icon = v; updateConfig('features', nf);
                      }} />
                    </div>
                    <Input label="الوصف" value={feat.desc} onChange={v => {
                        const nf = [...(config.features || [])]; nf[idx].desc = v; updateConfig('features', nf);
                    }} isTextArea />
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
function Section({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
        <Icon size={20} className="text-orange-500" />
        <h3 className="font-black text-slate-900">{title}</h3>
      </div>
      <div className="p-8 space-y-6">
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, isTextArea = false }: { label: string, value: string, onChange: (v: string) => void, isTextArea?: boolean }) {
  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">{label}</label>
      {isTextArea ? (
        <textarea 
          value={value} onChange={e => onChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all min-h-[100px] resize-none"
        />
      ) : (
        <input 
          type="text" value={value} onChange={e => onChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
        />
      )}
    </div>
  );
}
