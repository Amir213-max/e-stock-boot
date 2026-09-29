import React, { useState } from 'react';
import { ChatLog } from '../types';

const SYSTEM_BADGE: Record<string, { label: string; cls: string }> = {
    'e-Stock Pharmacy': { label: 'صيدليات',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    'e-Stock Retail':   { label: 'تجاري',    cls: 'bg-orange-100  text-orange-700  dark:bg-orange-900/30  dark:text-orange-300'  },
    'Pharma Store':     { label: 'سلاسل',    cls: 'bg-blue-100    text-blue-700    dark:bg-blue-900/30    dark:text-blue-300'    },
};

interface HistoryTabProps {
    logs: ChatLog[];
    isDarkMode?: boolean;
    onExport: () => void;
    onPrint: () => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ logs, isDarkMode, onExport, onPrint }) => {
    const [searchName,   setSearchName]   = useState('');
    const [fromDate,     setFromDate]     = useState('');
    const [toDate,       setToDate]       = useState('');
    const [fromTime,     setFromTime]     = useState('');
    const [toTime,       setToTime]       = useState('');
    const [expandedId,   setExpandedId]   = useState<string | null>(null);
    const [systemFilter, setSystemFilter] = useState<string>('all');

    // فلتر: العملاء المسجلين فقط (يجب أن يكون لديهم systemType)
    const registeredLogs = logs.filter(l => !!l.systemType);

    // تطبيق الفلاتر
    const filtered = registeredLogs.filter(log => {
        // فلتر الاسم
        if (searchName.trim() && !( log.clientName || '' ).toLowerCase().includes(searchName.toLowerCase())) return false;

        // فلتر النظام
        if (systemFilter !== 'all' && log.systemType !== systemFilter) return false;

        // فلتر التاريخ/الوقت
        const logDate = new Date(log.timestamp);
        if (fromDate) {
            const from = new Date(`${fromDate}T${fromTime || '00:00'}`);
            if (logDate < from) return false;
        }
        if (toDate) {
            const to = new Date(`${toDate}T${toTime || '23:59'}`);
            if (logDate > to) return false;
        }
        return true;
    });

    const totalDuration = filtered.reduce((s, l) => s + l.duration, 0);
    const unansweredCount = filtered.filter(l => l.isUnanswered).length;

    const formatDuration = (sec: number) => {
        if (sec < 60) return `${Math.round(sec)}ث`;
        return `${Math.floor(sec / 60)}د ${Math.round(sec % 60)}ث`;
    };

    const fmt = (ts: number) => ({
        date: new Date(ts).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: new Date(ts).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    });

    const clearFilters = () => {
        setSearchName(''); setFromDate(''); setToDate('');
        setFromTime(''); setToTime(''); setSystemFilter('all');
    };

    const hasFilter = searchName || fromDate || toDate || systemFilter !== 'all';

    return (
        <div className="space-y-4 animate-in fade-in duration-300">

            {/* ── شريط الفلاتر ── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <span className="text-blue-500">🔍</span> بحث وتصفية السجلات
                        <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                            العملاء المسجلين فقط
                        </span>
                    </h3>
                    {hasFilter && (
                        <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-bold underline">
                            مسح الفلاتر ✕
                        </button>
                    )}
                </div>

                {/* Row 1: اسم + نظام */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">👤</span>
                        <input
                            type="text"
                            value={searchName}
                            onChange={e => setSearchName(e.target.value)}
                            placeholder="بحث باسم العميل..."
                            className="w-full pr-8 pl-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>
                    <div className="flex gap-2">
                        {[
                            { v: 'all',              label: 'الكل' },
                            { v: 'e-Stock Pharmacy', label: 'صيدليات' },
                            { v: 'e-Stock Retail',   label: 'تجاري' },
                            { v: 'Pharma Store',     label: 'سلاسل' },
                        ].map(opt => (
                            <button
                                key={opt.v}
                                onClick={() => setSystemFilter(opt.v)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                    systemFilter === opt.v
                                        ? 'bg-blue-600 text-white border-blue-600 shadow'
                                        : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-blue-400'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Row 2: التاريخ والوقت */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">من تاريخ</label>
                        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">من وقت</label>
                        <input type="time" value={fromTime} onChange={e => setFromTime(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">إلى تاريخ</label>
                        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">إلى وقت</label>
                        <input type="time" value={toTime} onChange={e => setToTime(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                </div>
            </div>

            {/* ── شريط الإحصائيات ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { icon: '📋', label: 'إجمالي الجلسات',    value: filtered.length.toString(),            cls: 'text-blue-600 dark:text-blue-400' },
                    { icon: '⏱️', label: 'إجمالي وقت الدعم',  value: formatDuration(totalDuration),         cls: 'text-purple-600 dark:text-purple-400' },
                    { icon: '❓', label: 'أسئلة بلا إجابة',   value: unansweredCount.toString(),            cls: 'text-red-600 dark:text-red-400' },
                    { icon: '✅', label: 'جلسات مجاب عنها',   value: (filtered.length - unansweredCount).toString(), cls: 'text-green-600 dark:text-green-400' },
                ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm flex items-center gap-3">
                        <span className="text-2xl">{s.icon}</span>
                        <div>
                            <p className={`text-xl font-black ${s.cls}`}>{s.value}</p>
                            <p className="text-[10px] text-gray-400 font-bold">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── السجلات ── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-700/30">
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                        عرض <span className="text-blue-600 dark:text-blue-400">{filtered.length}</span> جلسة
                        {hasFilter && <span className="text-xs text-gray-400 font-normal"> (من أصل {registeredLogs.length})</span>}
                    </p>
                    <div className="flex items-center gap-2">
                        <button onClick={onPrint}
                            className="text-xs flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-100 transition">
                            🖨️ طباعة / PDF
                        </button>
                        <button onClick={onExport}
                            className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-100 transition">
                            📥 تصدير CSV
                        </button>
                    </div>
                </div>

                {/* Logs list */}
                {filtered.length === 0 ? (
                    <div className="py-16 text-center">
                        <p className="text-4xl mb-3">📭</p>
                        <p className="text-gray-400 dark:text-gray-500 font-bold">
                            {hasFilter ? 'لا توجد نتائج للفلاتر المختارة' : 'لا توجد سجلات للعملاء المسجلين حتى الآن'}
                        </p>
                        {hasFilter && (
                            <button onClick={clearFilters} className="mt-3 text-sm text-blue-500 underline">مسح الفلاتر</button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {filtered.map((log, idx) => {
                            const { date, time } = fmt(log.timestamp);
                            const badge = SYSTEM_BADGE[log.systemType || ''];
                            const isOpen = expandedId === log.id;

                            return (
                                <div key={log.id}
                                    className={`transition-all ${isOpen ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>

                                    {/* Card header — clickable to expand */}
                                    <div className="px-5 py-4 cursor-pointer select-none"
                                        onClick={() => setExpandedId(isOpen ? null : log.id)}>
                                        <div className="flex items-start justify-between gap-3">

                                            {/* Left info */}
                                            <div className="flex items-center gap-3 flex-wrap">
                                                {/* Avatar */}
                                                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 font-black text-sm shrink-0">
                                                    {(log.clientName || '?')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{log.clientName || 'عميل غير معروف'}</p>
                                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                        {badge && (
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                                                                {badge.label}
                                                            </span>
                                                        )}
                                                        {log.isUnanswered && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                                                ❓ لم يُجَب عليه
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-gray-400">
                                                            ⏱️ {formatDuration(log.duration)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: date/time + expand arrow */}
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="text-left">
                                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{date}</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">{time}</p>
                                                </div>
                                                <span className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                                                    </svg>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Summary line */}
                                        <div className="mt-2 mr-12">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                                <span className="font-bold text-gray-600 dark:text-gray-300">الملخص: </span>
                                                {log.botResponse}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Expanded transcript */}
                                    {isOpen && (
                                        <div className="px-5 pb-5 mr-12 animate-in fade-in duration-200">
                                            <div className="bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl p-4 shadow-inner max-h-80 overflow-y-auto scrollbar-thin">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">نص المحادثة الكامل</p>
                                                {log.userQuery.split('\n\n').map((line, li) => {
                                                    const isClient = line.startsWith('👤');
                                                    const isBot = line.startsWith('🤖');
                                                    return (
                                                        <div key={li} className={`mb-3 flex gap-2 ${isClient ? '' : 'flex-row-reverse'}`}>
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5 ${
                                                                isClient ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' :
                                                                isBot    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' :
                                                                           'bg-gray-100 text-gray-400'
                                                            }`}>
                                                                {isClient ? '👤' : isBot ? '🤖' : '•'}
                                                            </div>
                                                            <div className={`flex-1 text-xs leading-relaxed p-2.5 rounded-xl max-w-[90%] ${
                                                                isClient
                                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200'
                                                                    : isBot
                                                                    ? 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                                                    : 'text-gray-500'
                                                            }`}>
                                                                {line.replace(/^(👤 العميل:|🤖 E-stock Bot:)\s*/, '')}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryTab;
