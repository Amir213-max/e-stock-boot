
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, ArrowLeft, Loader2, ShieldCheck, AlertCircle, Globe } from 'lucide-react';
import { db } from '../services/db';
import { Customer } from '../types';

interface LoginProps {
    onLoginSuccess: (customer: Customer) => void;
    onAdminLogin: () => void;
    onBack: () => void;
    onGuestAccess: () => void;
    isDarkMode: boolean;
    expired?: boolean;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onAdminLogin, onBack, onGuestAccess, isDarkMode, expired }) => {
    const [name, setName] = useState('');
    const [contractNumber, setContractNumber] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const customer = await db.authenticateCustomer(name, contractNumber);
            if (customer) {
                onLoginSuccess(customer);
            } else {
                setError('بيانات الدخول غير صحيحة، يرجى التأكد من الاسم ورقم التعاقد.');
            }
        } catch (err) {
            setError('حدث خطأ في الاتصال، حاول مرة أخرى.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0f172a] font-cairo overflow-hidden" dir="rtl">
            {/* Animated Background Blobs */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-500/20 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full animate-pulse delay-1000" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl overflow-hidden"
            >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-transparent via-orange-500 to-transparent opacity-50" />
                
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-orange-500/20 ring-4 ring-orange-500/10">
                        <ShieldCheck size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2">تسجيل الدخول</h2>
                    <p className="text-slate-400 font-bold">بوابة الدعم الفني لعملاء مودرن سوفت</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-black text-slate-300 pr-2">اسم العميل</label>
                        <div className="relative group">
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors">
                                <User size={20} />
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pr-14 pl-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white/10 transition-all placeholder:text-slate-600"
                                placeholder="الاسم المسجل في التعاقد"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-black text-slate-300 pr-2">رقم التعاقد</label>
                        <div className="relative group">
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors">
                                <Lock size={20} />
                            </div>
                            <input
                                type="password"
                                value={contractNumber}
                                onChange={(e) => setContractNumber(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pr-14 pl-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white/10 transition-all placeholder:text-slate-600"
                                placeholder="رقم التعاقد الخاص بك"
                                required
                            />
                        </div>
                    </div>

                    <AnimatePresence>
                        {(error || expired) && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold ${expired && !error ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                            >
                                <AlertCircle size={18} />
                                {error || 'انتهت الجلسة، يرجى الدخول مرة أخرى'}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" size={24} /> : 'تسجيل الدخول'}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-slate-500 font-bold text-sm">أو</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Guest Button */}
                    <button
                        type="button"
                        onClick={onGuestAccess}
                        className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/15 text-slate-200 py-4 rounded-2xl font-black text-lg hover:bg-white/10 hover:border-orange-500/40 transition-all active:scale-95"
                    >
                        <Globe size={22} className="text-orange-400" />
                        <span>متابعة كزائر</span>
                        <span className="text-xs text-slate-500 font-bold">(استفسارات عامة)</span>
                    </button>

                    <button
                        type="button"
                        onClick={onBack}
                        className="w-full flex items-center justify-center gap-2 text-slate-500 font-bold hover:text-white transition-colors py-2"
                    >
                        <ArrowLeft size={18} className="rotate-180" /> العودة للموقع
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-white/5 text-center">
                    <p className="text-slate-600 font-bold text-xs">نظام الدعم الفني الذكي © Modern Soft 2024</p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;

