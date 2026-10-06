
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { KBItem, ChatLog, Feedback, KnowledgeSnippet, Customer, SystemType, LandingConfig } from '../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { GoogleGenAI } from '@google/genai';
import BotInterface from './BotInterface';

// ============================================================
// HistoryTab — سجل المحادثات (العملاء المسجلين فقط)
// ============================================================
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
// ============================================================

interface AdminDashboardProps {
    isDarkMode?: boolean;
    toggleTheme?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ isDarkMode, toggleTheme }) => {
    const [adminRole, setAdminRole] = useState<'super' | 'support' | null>(null);
    const [passwordInput, setPasswordInput] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Password Reset State
    const [isResetMode, setIsResetMode] = useState(false);
    const [resetKey, setResetKey] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetStatus, setResetStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Training Tab Password Protection
    const [trainingPasswordEntered, setTrainingPasswordEntered] = useState(false);
    const [showTrainingPasswordPrompt, setShowTrainingPasswordPrompt] = useState(false);
    const [trainingPassword, setTrainingPassword] = useState('');
    const [trainingPasswordError, setTrainingPasswordError] = useState('');

    const [activeTab, setActiveTab] = useState<'analytics' | 'history' | 'training' | 'landing' | 'settings'>('analytics');
    const [landingConfig, setLandingConfig] = useState<LandingConfig | null>(null);
    const [isSavingLanding, setIsSavingLanding] = useState(false);
    const [cloudStatus, setCloudStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking');
    const [activeSystemType, setActiveSystemType] = useState<SystemType>('e-Stock Pharmacy');
    const [newCustomerSystemType, setNewCustomerSystemType] = useState<SystemType>('e-Stock Pharmacy');
    const [kbItems, setKbItems] = useState<KBItem[]>([]);

    const [logs, setLogs] = useState<ChatLog[]>([]);
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [docsLengthPharmacy, setDocsLengthPharmacy] = useState<number>(0);
    const [docsLengthRetail, setDocsLengthRetail] = useState<number>(0);
    const [docsLengthStore, setDocsLengthStore] = useState<number>(0);

    const activeDocsLength = activeSystemType === 'e-Stock Pharmacy' ? docsLengthPharmacy :
                             activeSystemType === 'e-Stock Retail' ? docsLengthRetail : docsLengthStore;
    // Knowledge Snippet State
    const [snippets, setSnippets] = useState<KnowledgeSnippet[]>([]);
    const [snippetQuestion, setSnippetQuestion] = useState('');
    const [snippetCategory, setSnippetCategory] = useState<string>('البيانات العامه');
    const [snippetMenu, setSnippetMenu] = useState('');
    const [snippetScreen, setSnippetScreen] = useState('');
    const [snippetAnswer, setSnippetAnswer] = useState('');
    const [snippetImage, setSnippetImage] = useState<string | null>(null);
    const [menuText, setMenuText] = useState('');
    const [pathMenuInput, setPathMenuInput] = useState('');
    const [pathScreenInput, setPathScreenInput] = useState('');
    const [structuredPaths, setStructuredPaths] = useState<{menu: string, screen: string}[]>([]);
    const [globalCategories, setGlobalCategories] = useState<string[]>([]);
    const [newCategoryInput, setNewCategoryInput] = useState('');

    const [directText, setDirectText] = useState('');
    const [isDirectTraining, setIsDirectTraining] = useState(false);

    // Unanswered Inbox State
    const [unansweredLogs, setUnansweredLogs] = useState<ChatLog[]>([]);
    const [expandedUnansweredId, setExpandedUnansweredId] = useState<string | null>(null);
    
    // Live Testing Arena State
    const [showTestBot, setShowTestBot] = useState(false);


    // User Management State
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerContract, setNewCustomerContract] = useState('');
    const [sessionTimeout, setSessionTimeout] = useState(15);
    const excelInputRef = useRef<HTMLInputElement>(null);


    // PDF Upload State
    const [pdfUploading, setPdfUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // URL Scrape Setup
    const [scrapeUrl, setScrapeUrl] = useState('');
    const [isScraping, setIsScraping] = useState(false);

    // Audio Upload State
    const [isAudioUploading, setIsAudioUploading] = useState(false);
    
    // Sanity Check State
    const [isSanityChecking, setIsSanityChecking] = useState(false);
    const [sanityCheckResult, setSanityCheckResult] = useState<string | null>(null);

    const pdfInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const visionInputRef = useRef<HTMLInputElement>(null);

    // Vision UI Upload State
    const [isVisionUploading, setIsVisionUploading] = useState(false);

    // Chunks Editor State
    const [showChunksModal, setShowChunksModal] = useState(false);
    const [chunksToEdit, setChunksToEdit] = useState<any[]>([]);
    const [editingChunkId, setEditingChunkId] = useState<string | null>(null);
    const [editingChunkText, setEditingChunkText] = useState('');
    const [isSavingChunk, setIsSavingChunk] = useState(false);

    // Check if password was already entered in this session
    useEffect(() => {
        const role = sessionStorage.getItem('admin_role');
        const legacyAuth = sessionStorage.getItem('admin_password_entered');
        if (role) {
            setAdminRole(role as 'super' | 'support');
        } else if (legacyAuth === 'true') {
            setAdminRole('super');
            sessionStorage.setItem('admin_role', 'super');
        }
    }, []);

    useEffect(() => {
        if (adminRole !== null) {
            refreshData();
        }
    }, [adminRole, activeSystemType]);

    // Reset training password when switching away from training tab
    useEffect(() => {
        if (activeTab !== 'training') {
            setTrainingPasswordEntered(false);
        }
    }, [activeTab]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const adminPass = await db.getAdminPassword();
        if (passwordInput === adminPass) {
            setAdminRole('super');
            sessionStorage.setItem('admin_role', 'super');
            setErrorMsg('');
        } else if (passwordInput === 'support') {
            setAdminRole('support');
            sessionStorage.setItem('admin_role', 'support');
            setErrorMsg('');
        } else {
            setErrorMsg('كلمة المرور غير صحيحة');
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (resetKey.trim() === 'admin-recovery') {
            if (newPassword.length < 4) {
                setResetStatus('error');
                setErrorMsg('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
                return;
            }
            await db.saveAdminPassword(newPassword);
            setResetStatus('success');
            setErrorMsg('تم تغيير كلمة المرور بنجاح! جاري التحويل...');

            setTimeout(() => {
                setIsResetMode(false);
                setResetStatus('idle');
                setErrorMsg('');
                setResetKey('');
                setNewPassword('');
                setPasswordInput('');
            }, 1500);
        } else {
            setResetStatus('error');
            setErrorMsg('مفتاح الاستعادة غير صحيح');
        }
    };

    const handleTrainingPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const adminPass = await db.getAdminPassword();
        if (trainingPassword === adminPass) {
            setTrainingPasswordEntered(true);
            setShowTrainingPasswordPrompt(false);
            setTrainingPassword('');
            setTrainingPasswordError('');
            setActiveTab('training');
        } else {
            setTrainingPasswordError('كلمة المرور غير صحيحة');
        }
    };

    const checkCloud = async () => {
        setCloudStatus('checking');
        const res = await db.testCloudConnection();
        setCloudStatus(res.success ? 'online' : (res.error === 'permission-denied' ? 'error' : 'offline'));
    };

    const refreshData = async () => {
        checkCloud();
        const kb = await db.getKB();
        const l = await db.getLogs();
        const f = await db.getFeedback();
        
        setLogs(l);
        setFeedback(f);

        // Filter unanswered
        const unanswered = l.filter(log => log.isUnanswered);
        setUnansweredLogs(unanswered);

        const dLenPharma = await db.getDocLength('e-Stock Pharmacy');
        const dLenRetail = await db.getDocLength('e-Stock Retail');
        const dLenStore = await db.getDocLength('Pharma Store');
        
        setDocsLengthPharmacy(dLenPharma);
        setDocsLengthRetail(dLenRetail);
        setDocsLengthStore(dLenStore);

        const cust = await db.getCustomers();
        const settings = await db.getAppSettings();
        setCustomers(cust);
        setSessionTimeout(settings.sessionTimeoutMinutes);
        
        const lConfig = await db.getLandingConfig();
        setLandingConfig(lConfig);
    };

    // Load Snippets and Menus whenever the active system tab changes
    useEffect(() => {
        const loadSystemData = async () => {
            const s = await db.getSnippets(activeSystemType);
            const updatedSnippets = s.map(snip => ({
                ...snip,
                category: snip.category === 'عام' ? 'البيانات العامه' : snip.category
            }));
            const m = await db.getMenus(activeSystemType);
            setSnippets(updatedSnippets);
            setMenuText(m);
            
            // Load custom categories for this system from Cloud Database
            const savedCats = await db.getGlobalCategories(activeSystemType);
            const filtered = savedCats.filter(c => c !== 'عام');
            setGlobalCategories(filtered.length > 0 ? filtered : ['البيانات العامه']);

            // Parse menuText into structured paths for the builder
            if (m) {
                const lines = m.split('\n').filter(l => l.includes('->'));
                try {
                    const parsed = lines.map(line => {
                        const parts = line.split('->');
                        const menu = parts[0].replace(/^\d+[-.]?\s*/, '').trim();
                        const screen = parts[1].trim();
                        return { menu, screen };
                    });
                    setStructuredPaths(parsed);
                } catch (e) {
                    console.error("Failed to parse menus", e);
                }
            } else {
                setStructuredPaths([]);
            }
        };
        // only if authenticated to avoid unnecessary calls on login screen
        if (adminRole !== null) {
            loadSystemData();
        }
    }, [activeSystemType, adminRole]);

    const handleSnippetImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 1024 * 1024) {
                alert("حجم الصورة كبير جداً، يرجى اختيار صورة أصغر من 1 ميجابايت.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setSnippetImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddSnippet = async (overrideQ?: string, overrideA?: string, logIdToRemove?: string) => {
        const q = overrideQ || snippetQuestion;
        const a = overrideA || snippetAnswer;
        if (!q.trim() || !a.trim()) return;

        const newSnippet: KnowledgeSnippet = {
            id: Date.now().toString(),
            content: `سؤال: ${q}\n- إجابة: ${a}`,
            timestamp: Date.now(),
            systemType: activeSystemType,
            category: snippetCategory,
            menuName: snippetMenu,
            screenName: snippetScreen,
            imageUrl: snippetImage || undefined
        };
        await db.addSnippet(newSnippet);
        setSnippets(prev => [newSnippet, ...prev]);
        if (!overrideQ) {
            setSnippetQuestion('');
            setSnippetAnswer('');
            setSnippetMenu('');
            setSnippetScreen('');
            setSnippetImage(null);
            if (imageInputRef.current) imageInputRef.current.value = '';
        }
        
        // If it was from an unanswered log, we should mark it as resolved (delete the log or just update it)
        if (logIdToRemove) {
            alert('تم حفظ المعلومة وتدريب البوت عليها!');
            await db.dismissUnansweredLog(logIdToRemove);
            setUnansweredLogs(prev => prev.filter(l => l.id !== logIdToRemove));
        }
    };

    const handleDismissUnanswered = async (logId: string) => {
        if (window.confirm('هل تريد حذف هذا السؤال من صندوق الأسئلة المفقودة؟')) {
            await db.dismissUnansweredLog(logId);
            setUnansweredLogs(prev => prev.filter(l => l.id !== logId));
        }
    };

    const handleSaveMenu = async () => {
        // Regenerate menuText from structuredPaths to ensure NO numbers are saved in the raw bot text
        const cleanText = structuredPaths.map(p => `${p.menu} -> ${p.screen}`).join('\n');
        setMenuText(cleanText);
        await db.saveMenus(cleanText, activeSystemType);
        alert('✅ تم حفظ المسارات بنجاح وتصفية الأرقام من ذاكرة البوت.');
    };

    const handleDeleteSnippet = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذه المعلومة؟')) {
            await db.deleteSnippet(id);
            setSnippets(snippets.filter(s => s.id !== id));
        }
    };

    // --- Universal File Handler ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadError(null);
        setUploadSuccess(false);
        setPdfUploading(true);
        setUploadProgress('جاري قراءة الملف...');

        try {
            let textContent = "";

            // 1. PDF Handler
            if (file.type === 'application/pdf') {
                const pdfjsLib = (window as any).pdfjsLib;
                if (!pdfjsLib) throw new Error('مكتبة PDF غير متوفرة.');
                if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                }

                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                const totalPages = pdf.numPages;

                for (let i = 1; i <= totalPages; i++) {
                    setUploadProgress(`جاري معالجة صفحة ${i} من ${totalPages}...`);
                    const page = await pdf.getPage(i);
                    const tContent = await page.getTextContent();
                    const pageText = tContent.items.map((item: any) => item.str).join(' ');
                    textContent += `\n--- الصفحة ${i} ---\n${pageText}`;
                }
            }
            // 2. Word (.docx / .doc) Handler
            else if (file.type.includes('word') || file.type.includes('officedocument') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
                const mammothModule = await import('mammoth');
                const mammoth = mammothModule.default || mammothModule;
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                textContent = result.value;
            }
            // 3. Excel (.xlsx, .xls) / CSV Handler
            else if (file.type.includes('sheet') || file.type.includes('excel') || file.type.includes('csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
                const XLSX = await import('xlsx');
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer);

                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    textContent += `\n--- Sheet: ${sheetName} ---\n`;
                    jsonData.forEach((row: any) => {
                        textContent += row.join(' | ') + '\n';
                    });
                });
            }
            // 4. Text / Plain Handler
            else if (file.type === 'text/plain') {
                textContent = await file.text();
            }
            else {
                throw new Error(`نوع الملف غير مدعوم: ${file.type}`);
            }

            if (!textContent.trim()) throw new Error('الملف فارغ أو لم يتم استخراج نصوص منه.');

            // RAG Processing: Chunking and Embedding
            setUploadProgress('جاري تقسيم النص وبناء ذواكر البحث الذكية (Vector Embeddings)، يرجى الانتظار...');
            const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || (process.env as any).API_KEY || "" });
            
            // Clean text and split by paragraphs
            const paragraphs = textContent.split(/\n\s*\n/).filter(p => p.trim().length > 20); 
            
            // Combine short paragraphs into 1000-char chunks
            const chunks: string[] = [];
            let currentChunk = "";
            for (let p of paragraphs) {
                if ((currentChunk.length + p.length) > 1000) {
                    chunks.push(`📚 **source:** ${file.name}\n` + currentChunk);
                    currentChunk = p;
                } else {
                    currentChunk += "\n\n" + p;
                }
            }
            if (currentChunk) chunks.push(`📚 **source:** ${file.name}\n` + currentChunk);

            const docChunks: any[] = []; // Explicitly use any to match DocChunk if import fails implicitly

            // Batch embed
            for (let i = 0; i < chunks.length; i++) {
                setUploadProgress(`جاري حفظ الفقرة ${i + 1} من ${chunks.length} بالذكاء الاصطناعي...`);
                try {
                    const response = await ai.models.embedContent({
                        model: 'gemini-embedding-2',
                        contents: chunks[i]
                    });
                    if (response.embeddings?.[0]?.values) {
                        docChunks.push({
                            id: Date.now() + "_" + i,
                            systemType: activeSystemType,
                            text: chunks[i],
                            embedding: response.embeddings[0].values
                        });
                    }
                } catch (embErr) {
                    console.warn(`Retry chunk ${i}`, embErr);
                    await new Promise(r => setTimeout(r, 2000));
                    try {
                        const response = await ai.models.embedContent({
                            model: 'gemini-embedding-2',
                            contents: chunks[i]
                        });
                        if (response.embeddings?.[0]?.values) {
                            docChunks.push({
                                id: Date.now() + "_" + i,
                                systemType: activeSystemType,
                                text: chunks[i],
                                embedding: response.embeddings[0].values
                            });
                        }
                    } catch (e) {
                         console.error("Skipping chunk due to embedding error", e);
                    }
                }
            }

            // Append PROCESSED content to existing docs chunks
            const currentChunks = await db.getDocChunks(activeSystemType);
            const finalDocChunks = [...currentChunks, ...docChunks];

            await db.saveDocChunks(finalDocChunks, activeSystemType);
            
            const newLen = finalDocChunks.reduce((acc, c) => acc + c.text.length, 0);
            if (activeSystemType === 'e-Stock Pharmacy') setDocsLengthPharmacy(newLen);
            else if (activeSystemType === 'e-Stock Retail') setDocsLengthRetail(newLen);
            else setDocsLengthStore(newLen);

            setUploadSuccess(true);
            alert("✅ تم رفع ومعالجة الملف بنجاح! تم تحديث ذاكرة البوت.");
            setTimeout(() => setUploadSuccess(false), 5000);

        } catch (error: any) {
            console.error("File Upload Error", error);
            const msg = `حدث خطأ أثناء المعالجة: ${error.message || 'خطأ غير معروف'}`;
            setUploadError(msg);
            alert("❌ " + msg);
        } finally {
            setPdfUploading(false);
            setUploadProgress('');
            if (pdfInputRef.current) pdfInputRef.current.value = '';
        }
    };

    const handleClearDocs = async () => {
        if (window.confirm(`⚠️ تحذير: سيتم حذف جميع معلومات (${activeSystemType}). هل أنت متأكد؟`)) {
            await db.resetDocs(activeSystemType);
            if (activeSystemType === 'e-Stock Pharmacy') setDocsLengthPharmacy(0);
            else if (activeSystemType === 'e-Stock Retail') setDocsLengthRetail(0);
            else setDocsLengthStore(0);
            alert('✅ تم حذف المعلومات بنجاح.');
        }
    };

    // --- Scraping Handler ---
    const handleScrapeUrl = async () => {
        if (!scrapeUrl.trim()) return;
        setIsScraping(true);
        setUploadError(null);
        setUploadSuccess(false);
        setUploadProgress('جاري سحب البيانات من الرابط...');

        try {
            // Use allorigins to bypass CORS
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(scrapeUrl)}`);
            if (!response.ok) throw new Error('فشل الاتصال بالرابط.');
            const data = await response.json();
            const html = data.contents;
            
            // Extract text roughly
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const textContent = doc.body.innerText.replace(/\n\s*\n/g, '\n\n').trim();

            if (!textContent) throw new Error('لم يتم العثور على أي نصوص في الرابط.');

            setUploadProgress('جاري حفظ الداتا من الرابط وبناء ذواكر البحث...');
            const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || (process.env as any).API_KEY || "" });
            
            const paragraphs = textContent.split(/\n\s*\n/).filter(p => p.trim().length > 20); 
            const chunks: string[] = [];
            let currentChunk = "";
            for (let p of paragraphs) {
                if ((currentChunk.length + p.length) > 1000) {
                    chunks.push(`📚 **source url:** ${scrapeUrl}\n` + currentChunk);
                    currentChunk = p;
                } else {
                    currentChunk += "\n\n" + p;
                }
            }
            if (currentChunk) chunks.push(`📚 **source url:** ${scrapeUrl}\n` + currentChunk);

            const docChunks: any[] = [];
            for (let i = 0; i < chunks.length; i++) {
                setUploadProgress(`سحب فقرة ${i + 1} من ${chunks.length}...`);
                const res = await ai.models.embedContent({ model: 'gemini-embedding-2', contents: chunks[i] });
                if (res.embeddings?.[0]?.values) {
                    docChunks.push({
                        id: Date.now() + "_scrape_" + i,
                        systemType: activeSystemType,
                        text: chunks[i],
                        embedding: res.embeddings[0].values
                    });
                }
            }

            const currentChunks = await db.getDocChunks(activeSystemType);
            const finalDocChunks = [...currentChunks, ...docChunks];
            await db.saveDocChunks(finalDocChunks, activeSystemType);
            
            const newLen = finalDocChunks.reduce((acc, c) => acc + c.text.length, 0);
            if (activeSystemType === 'e-Stock Pharmacy') setDocsLengthPharmacy(newLen);
            else if (activeSystemType === 'e-Stock Retail') setDocsLengthRetail(newLen);
            else setDocsLengthStore(newLen);

            setUploadSuccess(true);
            setScrapeUrl('');
            setTimeout(() => setUploadSuccess(false), 5000);

        } catch(e: any) {
            setUploadError(`خطأ في الرابط: ${e.message}`);
        } finally {
            setIsScraping(false);
            setUploadProgress('');
        }
    };

    // --- Audio Training Handler ---
    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsAudioUploading(true);
        try {
            const base64Data = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const dataUrl = reader.result as string;
                    resolve(dataUrl.split(',')[1]);
                };
                reader.readAsDataURL(file);
            });
            const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || (process.env as any).API_KEY || "" });
            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: [{
                    role: "user",
                    parts: [
                        { inlineData: { mimeType: file.type || "audio/mp3", data: base64Data } },
                        { text: "أنت خبير دعم فني. استمع للمكالمة، واستخرج المشكلة التي سألها العميل والإجابة (الحل) بطريقة مختصرة وواضحة جداً. أرجعهم بصيغة JSON فقط: {\"question\": \"...\", \"answer\": \"...\"}" }
                    ]
                }]
            });
            
            const text = response.text || "";
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if(jsonMatch) {
                const res = JSON.parse(jsonMatch[0]);
                setSnippetQuestion(res.question);
                setSnippetAnswer(res.answer);
                alert("تم استخراج المشكلة والحل بنجاح، متبقي فقط الضغط على 'حفظ المعلومة'.");
                window.scrollTo({ top: 300, behavior: 'smooth' });
            } else {
                 alert("لم يتم استخراج معلومات كافية من الصوت.");
            }
        } catch(err:any) {
            alert("خطأ أثناء تحليل الصوت: " + err.message);
        } finally {
            setIsAudioUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    // --- Vision Training Handler ---
    const handleVisionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsVisionUploading(true);
        try {
            const base64Data = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const dataUrl = reader.result as string;
                    resolve(dataUrl.split(',')[1]);
                };
                reader.readAsDataURL(file);
            });
            const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || (process.env as any).API_KEY || "" });
            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: [{
                    role: "user",
                    parts: [
                        { inlineData: { mimeType: file.type || "image/jpeg", data: base64Data } },
                        { text: "أنت خبير تصوير واستخدام لأنظمة الكمبيوتر. هذه شاشة لبرنامج. استخرج وصف كامل للزراير والمهام التي يمكن القيام بها في هذه الشاشة بصيغة (سؤال: ما هي شاشة كذا؟ / جواب: هذه الشاشة تحتوي على كذا وكذا). رده بصيغة JSON فقط: {\"question\": \"...\", \"answer\": \"...\"}" }
                    ]
                }]
            });
            
            const text = response.text || "";
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if(jsonMatch) {
                const res = JSON.parse(jsonMatch[0]);
                setSnippetQuestion(res.question);
                setSnippetAnswer(res.answer);
                alert("تم تحليل الشاشة واستخراج الداتا. راجع السؤال والجواب ثم اضغط حفظ.");
                window.scrollTo({ top: 300, behavior: 'smooth' });
            } else {
                 alert("لم يتم استخراج معلومات كافية من الصورة.");
            }
        } catch(err:any) {
            alert("خطأ أثناء تحليل الصورة: " + err.message);
        } finally {
            setIsVisionUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    // --- Chunks Editor Logic ---
    const handleOpenChunksEditor = async () => {
        const c = await db.getDocChunks(activeSystemType);
        setChunksToEdit(c);
        setShowChunksModal(true);
    };

    const handleSaveChunkEdit = async () => {
        if (!editingChunkId || !editingChunkText.trim()) return;
        setIsSavingChunk(true);
        try {
            const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || (process.env as any).API_KEY || "" });
            const res = await ai.models.embedContent({ model: 'gemini-embedding-2', contents: editingChunkText });
            if (res.embeddings?.[0]?.values) {
                const updatedChunks = chunksToEdit.map(c => 
                    c.id === editingChunkId ? { ...c, text: editingChunkText, embedding: res.embeddings[0].values } : c
                );
                await db.saveDocChunks(updatedChunks, activeSystemType);
                setChunksToEdit(updatedChunks);
                setEditingChunkId(null);
                setEditingChunkText('');
                
                // Update length
                const newLen = updatedChunks.reduce((acc, c) => acc + c.text.length, 0);
                if (activeSystemType === 'e-Stock Pharmacy') setDocsLengthPharmacy(newLen);
                else if (activeSystemType === 'e-Stock Retail') setDocsLengthRetail(newLen);
                else setDocsLengthStore(newLen);
            }
        } catch (e: any) {
            alert("خطأ أثناء تعديل الفقرة: " + e.message);
        } finally {
            setIsSavingChunk(false);
        }
    };

    const handleDeleteChunk = async (id: string) => {
        if (!window.confirm("حذف هذه الفقرة من ذاكرة البوت نهائياً؟")) return;
        const updatedChunks = chunksToEdit.filter(c => c.id !== id);
        await db.saveDocChunks(updatedChunks, activeSystemType);
        setChunksToEdit(updatedChunks);
        // Update length
        const newLen = updatedChunks.reduce((acc, c) => acc + c.text.length, 0);
        if (activeSystemType === 'e-Stock Pharmacy') setDocsLengthPharmacy(newLen);
        else if (activeSystemType === 'e-Stock Retail') setDocsLengthRetail(newLen);
        else setDocsLengthStore(newLen);
    };

    const handleSanityCheck = async () => {
        setIsSanityChecking(true);
        setSanityCheckResult(null);
        try {
            const currentSnippets = snippets.filter(s => s.systemType === activeSystemType || s.systemType === 'All');
            const docChunks = await db.getDocChunks(activeSystemType);
            
            const snippetData = currentSnippets.map(s => s.content).join('\n\n');
            const chunksData = docChunks.slice(0, 30).map(c => c.text).join('\n\n'); // أول 30 chunk فقط لتجنب حجم prompt كبير
            
            if (!snippetData.trim() && !chunksData.trim()) {
                setSanityCheckResult('⚠️ لا توجد بيانات تدريب محفوظة بعد في هذا النظام. قم برفع ملفات أو إضافة معلومات أولاً.');
                return;
            }
            
            const dataToAnalyze = [
                snippetData ? `=== أسئلة وأجوبة مباشرة ===\n${snippetData}` : '',
                chunksData ? `=== محتوى الملفات المرفوعة (أول 30 فقرة) ===\n${chunksData}` : ''
            ].filter(Boolean).join('\n\n');
            
            const prompt = `أنت خبير وتدقق معلومات تدريب البوت لنظام ${activeSystemType}. حلل هذه المعلومات بدقة، واكتشف ما إذا كان هناك أي تضارب (Contradiction) أو تعارض قاطع في المنطق أو الأرقام. اكتب تحليلاً بالعربية، إذا وجد تضارب وضحه بوضوح شديد، وإن لم يوجد قل بصراحة: "جميع المعلومات متوافقة ولا يوجد تضارب".\n\nمعلومات النظام:\n${dataToAnalyze}`;
            
            const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || (process.env as any).API_KEY || "" });
            const response = await ai.models.generateContent({ model: 'gemini-3.5-flash', contents: prompt });
            setSanityCheckResult(response.text || "لم يتم إيجاد تضارب.");
        } catch(e: any) {
            setSanityCheckResult(`خطأ في فحص التضارب: ${e.message}`);
        } finally {
            setIsSanityChecking(false);
        }
    };



    const handleDownloadDocs = async () => {
        const currentDocs = await db.getDocs(activeSystemType);
        // ... rest stays same, just ensuring we get everything
        const snippets = await db.getSnippets(activeSystemType);

        let fullContent = currentDocs || "";

        if (snippets.length > 0) {
            fullContent += "\n\n=== 🚨 Snippets & Critical Updates ===\n";
            snippets.forEach(s => {
                fullContent += `\n[ID: ${s.id}] ${new Date(s.timestamp).toLocaleDateString()} \n${s.content}\n-------------------`;
            });
        }

        if (!fullContent.trim()) {
            alert('لا يوجد محتوى إضافي لتحميله.');
            return;
        }

        const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `knowledge_base_complete_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Export Functions ---
    const downloadCSV = (data: any[], filename: string) => {
        if (!data.length) {
            alert('لا توجد بيانات للتصدير');
            return;
        }
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(fieldName => {
                let cell = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName].toString();
                if (cell.search(/("|,|\n)/g) >= 0) {
                    cell = `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(','))
        ].join('\n');
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportLogs = () => {
        const exportData = logs.map(log => ({
            'رقم الجلسة': log.id,
            'التاريخ': new Date(log.timestamp).toLocaleDateString('ar-EG'),
            'الوقت': new Date(log.timestamp).toLocaleTimeString('ar-EG'),
            'اسم العميل': log.clientName || 'غير معروف',
            'المدة (ثانية)': log.duration.toFixed(0),
            'ملخص الطلب': log.botResponse,
            'سجل المحادثة الكامل': log.userQuery
        }));
        downloadCSV(exportData, `mosaad_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    const handlePrintLogs = () => {
        if (logs.length === 0) {
            alert('لا توجد سجلات للطباعة');
            return;
        }
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const content = `
      <html dir="rtl" lang="ar">
        <head>
          <title>سجل المحادثات - Modern Soft</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Cairo', sans-serif; padding: 20px; background: #fff; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .header h1 { color: #2563eb; margin: 0; }
            .header p { color: #666; margin: 5px 0 0; }
            .session-card { 
                border: 1px solid #e5e7eb; 
                border-radius: 8px; 
                margin-bottom: 20px; 
                padding: 15px; 
                page-break-inside: avoid;
                background: #f9fafb;
            }
            .meta { 
                display: flex; 
                justify-content: space-between; 
                border-bottom: 1px solid #e5e7eb; 
                padding-bottom: 10px; 
                margin-bottom: 10px;
                font-size: 12px;
                color: #4b5563;
            }
            .client-name { font-weight: bold; color: #1f2937; font-size: 14px; }
            .transcript { font-size: 13px; line-height: 1.6; white-space: pre-wrap; color: #374151; }
            .summary-badge {
                display: inline-block;
                background: #e0e7ff;
                color: #3730a3;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                margin-top: 5px;
            }
            @media print { body { padding: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>سجل محادثات المساعد الذكي</h1>
            <p>Modern Soft - e-stock Support Agent</p>
            <p style="font-size: 12px; color: #999">تم االستخراج بتاريخ: ${new Date().toLocaleString('ar-EG')}</p>
          </div>
          <div class="logs-container">
            ${logs.map(log => `
                <div class="session-card">
                    <div class="meta">
                        <div>
                            <span class="client-name">👤 ${log.clientName || 'زائر'}</span>
                            <br/>
                            <span class="summary-badge">${log.botResponse}</span>
                        </div>
                        <div style="text-align: left;">
                            <div>📅 ${new Date(log.timestamp).toLocaleDateString('ar-EG')}</div>
                            <div>🕒 ${new Date(log.timestamp).toLocaleTimeString('ar-EG')}</div>
                        </div>
                    </div>
                    <div class="transcript">${log.userQuery}</div>
                </div>
            `).join('')}
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
        printWindow.document.write(content);
        printWindow.document.close();
    };

    const handleExportFeedback = () => {
        const exportData = feedback.map(fb => ({
            'التاريخ': new Date(fb.timestamp).toLocaleDateString('ar-EG'),
            'الوقت': new Date(fb.timestamp).toLocaleTimeString('ar-EG'),
            'التقييم': fb.rating,
            'التعليق': fb.comment || '',
            'رقم الجلسة': fb.chatId
        }));
        downloadCSV(exportData, `mosaad_feedback_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    // --- User Management Handlers ---
    const handleAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustomerName.trim() || !newCustomerContract.trim()) return;

        const cust: Customer = {
            id: Date.now().toString(),
            name: newCustomerName.trim(),
            contractNumber: newCustomerContract.trim(),
            isActive: true,
            createdAt: Date.now(),
            systemType: newCustomerSystemType
        };

        if (customers.some(c => c.contractNumber === cust.contractNumber)) {
            alert('رقم التعاقد مسجل بالفعل (Contract number already exists)');
            return;
        }

        await db.saveCustomer(cust);
        setCustomers([...customers, cust]);
        setNewCustomerName('');
        setNewCustomerContract('');
    };

    const handleEditCustomer = (customer: Customer) => {
        setEditingCustomer({ ...customer });
    };

    const handleUpdateCustomer = async () => {
        if (!editingCustomer) return;
        await db.saveCustomer(editingCustomer);
        setCustomers(customers.map(c => c.id === editingCustomer.id ? editingCustomer : c));
        setEditingCustomer(null);
        alert('✅ تم تحديث بيانات العميل بنجاح.');
    };

    const handleToggleStatus = async (customer: Customer) => {
        const updated = { ...customer, isActive: !customer.isActive };
        await db.saveCustomer(updated);
        setCustomers(customers.map(c => c.id === customer.id ? updated : c));
    };

    const handleDeleteCustomer = async (id: string, name: string) => {
        if (window.confirm(`هل أنت متأكد من حذف العميل: ${name}؟`)) {
            await db.deleteCustomer(id);
            setCustomers(customers.filter(c => c.id !== id));
        }
    };

    const handleSaveSettings = async () => {
        await db.saveAppSettings({ sessionTimeoutMinutes: sessionTimeout });
        alert('تم حفظ الإعدادات بنجاح');
    };

    const handleCustomerExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const XLSX = await import('xlsx');
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer);
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            // Assume format: [Name, ContractNumber] or Header row then data
            // We'll iterate and try to find valid rows
            const newCusts: Customer[] = [];

            for (let i = 0; i < jsonData.length; i++) {
                const row: any = jsonData[i];
                if (Array.isArray(row) && row.length >= 2) {
                    const name = row[0]?.toString().trim();
                    const contract = row[1]?.toString().trim();

                    // Basic validation: Name should be string, Contract should be string/num, skip headers if "name" or "contract"
                    if (name && contract && name.toLowerCase() !== 'name' && name.toLowerCase() !== 'الاسم') {
                        newCusts.push({
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                            name,
                            contractNumber: contract,
                            isActive: true,
                            createdAt: Date.now(),
                            systemType: 'e-Stock Pharmacy'
                        });
                    }
                }
            }

            if (newCusts.length > 0) {
                const count = await db.bulkAddCustomers(newCusts);
                alert(`تم استدعاء ${newCusts.length} عميل من الملف. تمت إضافة ${count} بنجاح (المكرر تم تجاهله).`);
                refreshData();
            } else {
                alert('لم يتم العثور على بيانات صالحة في الملف. تأكد من أن العمود الأول هو الاسم والعمود الثاني هو رقم التعاقد.');
            }

        } catch (err) {
            console.error(err);
            alert('حدث خطأ أثناء قراءة ملف Excel');
        } finally {
            if (excelInputRef.current) excelInputRef.current.value = '';
        }
    };

    const handleExportCustomers = async () => {
        try {
            const XLSX = await import('xlsx');
            const data = customers.map(c => ({
                'الاسم': c.name,
                'رقم التعاقد': c.contractNumber,
                'الحالة': c.isActive ? 'نشط' : 'متوقف',
                'تاريخ الإضافة': new Date(c.createdAt).toLocaleDateString('ar-EG'),
                'آخر ظهور': c.lastLogin ? new Date(c.lastLogin).toLocaleString('ar-EG') : 'لم يدخل بعد'
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "العملاء");
            XLSX.writeFile(wb, `modern_soft_customers_${new Date().toISOString().slice(0, 10)}.xlsx`);
        } catch (err) {
            console.error(err);
            alert('حدث خطأ أثناء تصدير ملف Excel');
        }
    };


    // Filter logs and feedback based on active system for the analytics
    const filteredLogs = logs.filter(log => !activeSystemType || log.systemType === activeSystemType);
    const filteredFeedback = feedback.filter(f => !activeSystemType || f.systemType === activeSystemType);

    const totalUsers = filteredLogs.length;
    const averageRating = filteredFeedback.length
        ? (filteredFeedback.reduce((acc, curr) => acc + curr.rating, 0) / filteredFeedback.length).toFixed(1)
        : '0';

    const logsByDate = filteredLogs.reduce((acc: any, log) => {
        const date = new Date(log.timestamp).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    const trendData = Object.keys(logsByDate).map(date => ({
        name: date,
        sessions: logsByDate[date]
    })).reverse().slice(0, 7);

    if (adminRole === null) {
        return (
            <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50'} flex flex-col items-center justify-center h-full min-h-[500px] transition-colors`}>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-700 transition-all duration-300">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                {isResetMode ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                )}
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                            {isResetMode ? 'استعادة كلمة المرور' : 'لوحة تحكم المسؤول'}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                            {isResetMode
                                ? 'أدخل مفتاح الاستعادة لتعيين كلمة مرور جديدة'
                                : 'يرجى إدخال كلمة المرور للمتابعة'}
                        </p>
                    </div>

                    {!isResetMode ? (
                        <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <input
                                type="password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                placeholder="كلمة المرور"
                                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center text-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                autoFocus
                            />
                            {errorMsg && (
                                <p className="text-red-500 text-sm text-center font-medium bg-red-50 dark:bg-red-900/30 py-2 rounded">
                                    {errorMsg}
                                </p>
                            )}
                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                                دخول
                            </button>
                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsResetMode(true); setErrorMsg(''); setResetStatus('idle'); }}
                                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline transition-colors"
                                >
                                    نسيت كلمة المرور؟
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in slide-in-from-left-4">
                            <div>
                                <input
                                    type="text"
                                    value={resetKey}
                                    onChange={(e) => setResetKey(e.target.value)}
                                    placeholder="مفتاح الاستعادة (admin-recovery)"
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center text-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 mb-3"
                                    autoFocus
                                />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="كلمة المرور الجديدة"
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center text-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                />
                            </div>

                            {errorMsg && (
                                <p className={`text-sm text-center font-medium py-2 rounded ${resetStatus === 'success' ? 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400' : 'text-red-500 bg-red-50 dark:bg-red-900/30'}`}>
                                    {errorMsg}
                                </p>
                            )}

                            {resetStatus !== 'success' && (
                                <button
                                    type="submit"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                >
                                    تغيير كلمة المرور
                                </button>
                            )}

                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsResetMode(false); setErrorMsg(''); setResetStatus('idle'); }}
                                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors flex items-center justify-center gap-1 mx-auto"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" transform="scale(-1,1) translate(-24,0)" />
                                    </svg>
                                    عودة لتسجيل الدخول
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50/50 dark:bg-gray-900/50 sm:rounded-2xl rounded-none overflow-hidden shadow-2xl border-0 sm:border border-gray-100 dark:border-gray-700 font-sans transition-colors" dir="rtl">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center p-4 sm:p-6 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">لوحة التحكم</h1>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold transition-all duration-500 ${
                        cloudStatus === 'online' ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400' :
                        cloudStatus === 'error' ? 'bg-red-50 border-red-200 text-red-600 animate-pulse dark:bg-red-900/30 dark:border-red-800 dark:text-red-400' :
                        cloudStatus === 'offline' ? 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400' :
                        'bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700'
                    }`}>
                        <div className={`w-2 h-2 rounded-full ${
                            cloudStatus === 'online' ? 'bg-green-500' :
                            cloudStatus === 'error' ? 'bg-red-500' :
                            cloudStatus === 'offline' ? 'bg-orange-500' :
                            'bg-gray-400 animate-bounce'
                        }`} />
                        {cloudStatus === 'online' ? 'متصل بالسحابة (مزامنة نشطة)' :
                         cloudStatus === 'error' ? 'خطأ مزامنة (Firestore Rules)' :
                         cloudStatus === 'offline' ? 'وضع الأوفلاين (تخزين محلي)' :
                         'جاري التحقق من السحابة...'}
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-4 md:mt-0 w-full md:w-auto">
                    <div className="flex bg-gray-100/80 dark:bg-gray-700/50 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'analytics' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            الإحصائيات
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            سجل المحادثات
                        </button>
                        
                        {adminRole === 'super' && (
                            <>
                                <button
                                    onClick={async () => {
                                        if (trainingPasswordEntered) {
                                            setActiveTab('training');
                                        } else {
                                            setShowTrainingPasswordPrompt(true);
                                        }
                                    }}
                                    className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'training' ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    تدريب البوت (المعرفة)
                                </button>
                                <button
                                    onClick={() => setActiveTab('landing')}
                                    className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'landing' ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    🌐 الصفحة الرئيسية
                                </button>
                                <button
                                    onClick={() => setActiveTab('settings')}
                                    className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    المستخدمين والإعدادات
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-600">

                {/* --- Analytics Section --- */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between h-32 relative group">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-gray-400 dark:text-gray-500 font-medium text-xs uppercase tracking-wider">تقييم المحادثات</h3>
                                    <button
                                        onClick={handleExportFeedback}
                                        className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                        title="تصدير بيانات التقييم (CSV)"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex items-end justify-between">
                                    <p className="text-3xl font-bold text-gray-800 dark:text-white">{averageRating}<span className="text-lg text-gray-400 font-normal">/5.0</span></p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between h-32">
                                <h3 className="text-gray-400 dark:text-gray-500 font-medium text-xs uppercase tracking-wider">إجمالي الجلسات</h3>
                                <div className="flex items-end justify-between">
                                    <p className="text-3xl font-bold text-gray-800 dark:text-white">{totalUsers}</p>
                                    <span className="text-blue-500 dark:text-blue-400 text-xs font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">جلسة</span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between min-h-32 relative group overflow-hidden">
                                <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-600"></div>
                                <div className="flex justify-between items-start">
                                    <h3 className="text-gray-400 dark:text-gray-500 font-medium text-[10px] uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                        ذاكرة النظام النشط ({activeSystemType})
                                    </h3>
                                    <div className="flex gap-2">
                                        <button onClick={handleDownloadDocs} className="text-gray-400 hover:text-blue-600 transition-colors" title="استخراج الداتا">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                            </svg>
                                        </button>
                                        <button onClick={handleOpenChunksEditor} className="text-gray-400 hover:text-purple-600 transition-colors" title="تعديل الذاكرة">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col mt-2">
                                    <p className="text-3xl font-black text-gray-800 dark:text-white">
                                        {(activeDocsLength / 1024).toFixed(1)} <span className="text-sm font-normal text-gray-400 tracking-normal">ك.ب</span>
                                    </p>
                                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1 uppercase">مساحة التخزين المستهلكة</p>
                                </div>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="text-gray-800 dark:text-white font-bold mb-6 text-sm uppercase tracking-wider">مؤشر التفاعل اليومي</h3>
                            <div className="h-64 w-full" dir="ltr">
                                {trendData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={trendData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#374151" : "#f3f4f6"} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)',
                                                    textAlign: 'right',
                                                    backgroundColor: isDarkMode ? '#1f2937' : '#fff',
                                                    color: isDarkMode ? '#fff' : '#000'
                                                }}
                                                cursor={{ stroke: '#e5e7eb', strokeWidth: 2 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="sessions"
                                                stroke="#3b82f6"
                                                strokeWidth={3}
                                                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: isDarkMode ? '#1f2937' : '#fff' }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">لا توجد بيانات كافية للعرض</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Training Password Prompt Modal */}
                {showTrainingPasswordPrompt && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                        <div className={`w-full max-w-sm p-6 rounded-2xl shadow-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} animate-in zoom-in-95`}>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">
                                كلمة مرور المسؤول
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
                                يرجى إدخال كلمة مرور المسؤول للوصول إلى قسم تدريب البوت
                            </p>
                            <form onSubmit={handleTrainingPasswordSubmit} className="space-y-4">
                                <input
                                    type="password"
                                    value={trainingPassword}
                                    onChange={(e) => {
                                        setTrainingPassword(e.target.value);
                                        setTrainingPasswordError('');
                                    }}
                                    placeholder="كلمة المرور"
                                    className={`w-full px-4 py-3 rounded-lg border ${trainingPasswordError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none`}
                                    autoFocus
                                />
                                {trainingPasswordError && (
                                    <p className="text-sm text-red-500 text-center">{trainingPasswordError}</p>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowTrainingPasswordPrompt(false);
                                            setTrainingPassword('');
                                            setTrainingPasswordError('');
                                        }}
                                        className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold transition-colors"
                                    >
                                        تأكيد
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* --- Training / Knowledge Management Section --- */}
                {activeTab === 'training' && trainingPasswordEntered && (
                    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
                        {/* Tab Bar for 3 Systems */}
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-full">
                            {(['e-Stock Pharmacy', 'e-Stock Retail', 'Pharma Store'] as SystemType[]).map(sys => (
                                <button
                                    key={sys}
                                    onClick={() => setActiveSystemType(sys)}
                                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeSystemType === sys ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'}`}
                                >
                                    {sys === 'e-Stock Pharmacy' ? 'صيدليات (Pharmacy)' : sys === 'e-Stock Retail' ? 'تجاري (Retail)' : 'سلاسل (Pharma Store)'}
                                </button>
                            ))}
                            <button
                                onClick={() => setShowTestBot(true)}
                                className="ml-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all shadow-md flex items-center gap-2"
                            >
                                <span>🤖</span> ساحة التجربة
                            </button>
                        </div>


                        {/* Active System Memory Status Card */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 animate-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center text-2xl">
                                    📊
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">حالة ذاكرة برنامج: {activeSystemType}</h3>
                                    <div className="flex items-center gap-3">
                                        <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
                                            {(activeDocsLength / 1024).toFixed(2)} <span className="text-xs font-normal text-gray-500">كيلوبايت</span>
                                        </p>
                                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold rounded-full animate-pulse">
                                            متصل وجاهز
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">إجمالي الحروف: {activeDocsLength.toLocaleString()} حرف</p>
                                </div>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button
                                    onClick={handleOpenChunksEditor}
                                    className="flex-1 md:flex-none px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all shadow-sm flex items-center justify-center gap-2"
                                >
                                    <span>✏️</span> تعديل الذاكرة
                                </button>
                                <button
                                    onClick={handleDownloadDocs}
                                    className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                    <span>📥</span> استخراج الداتا
                                </button>
                            </div>
                        </div>


                        {/* Sanity Check Feature */}
                        <div className="flex justify-between items-center bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-2xl border border-yellow-200 dark:border-yellow-800 shadow-sm relative overflow-hidden animate-in fade-in duration-300">
                            <div className="absolute top-0 right-0 w-2 h-full bg-yellow-500"></div>
                            <div>
                                <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-400 mb-1 flex items-center gap-2">
                                    <span>🧠</span> فحص تضارب البيانات الذكي (Sanity Check)
                                </h3>
                                <p className="text-xs text-yellow-700 dark:text-yellow-500/80 max-w-lg">
                                    هل أضفت بيانات متضاربة بالخطأ؟ اضغط هنا وسيقوم الذكاء الاصطناعي بمراجعة كل الأسئلة والأجوبة واكتشاف التعارضات.
                                </p>
                            </div>
                            <button
                                onClick={handleSanityCheck}
                                disabled={isSanityChecking}
                                className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all whitespace-nowrap"
                            >
                                {isSanityChecking ? '⏳ جاري الفحص...' : 'فحص البيانات الآن'}
                            </button>
                        </div>
                        
                        {sanityCheckResult && (
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner">
                                <h4 className="text-sm font-bold mb-2 flex justify-between items-center text-gray-800 dark:text-white">
                                    نتائج الفحص:
                                    <button onClick={() => setSanityCheckResult(null)} className="text-red-500 hover:text-red-700 text-xs font-normal">إغلاق</button>
                                </h4>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{sanityCheckResult}</p>
                            </div>
                        )}

                        {/* Unanswered Inbox */}
                        {unansweredLogs.length > 0 && (
                            <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-200 dark:border-red-800 shadow-sm relative overflow-hidden animate-in fade-in duration-300">
                                <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>
                                <h3 className="text-lg font-bold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">
                                    <span>📥</span> صندوق الأسئلة المفقودة ({unansweredLogs.length})
                                </h3>
                                <p className="text-sm text-red-600 dark:text-red-400/80 mb-4">
                                    العملاء سألوا الأسئلة دي ومقدرش البوت يجاوب. جاوبهم هنا عشان توفرها كمعلومة ذكية للبوت فوراً.
                                </p>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                                   {unansweredLogs.map(log => {
                                       // Extract user's question accurately
                                       const rawLines = (log.userQuery || '').split('\n').map(l => l.trim()).filter(Boolean);
                                       const userLines = rawLines.filter(l => l.startsWith('👤') || l.includes('العميل'));
                                       let lastQ = '';
                                       if (userLines.length > 0) {
                                           lastQ = userLines[userLines.length - 1].replace(/^👤[^:]*:\s*/, '').trim();
                                       } else if (log.userQuery && log.userQuery.includes('🤖')) {
                                           lastQ = log.userQuery.split('🤖')[0].replace(/^👤[^:]*:\s*/, '').trim();
                                       } else {
                                           lastQ = (log.userQuery || '').trim();
                                       }
                                       const isExpanded = expandedUnansweredId === log.id;

                                       return (
                                       <div key={log.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-red-100 dark:border-red-900 flex flex-col gap-2 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">سؤال العميل:</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedUnansweredId(isExpanded ? null : log.id)}
                                                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition"
                                                >
                                                    <span>{isExpanded ? '🔼' : '💬'}</span>
                                                    <span>{isExpanded ? 'إخفاء المحادثة' : 'عرض المحادثة كاملة'}</span>
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/60 p-2.5 rounded-lg border border-gray-100 dark:border-gray-600 font-medium">{lastQ || 'سؤال غير محدد'}</p>

                                            {isExpanded && (
                                                <div className="my-1 p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 max-h-56 overflow-y-auto space-y-2 scrollbar-thin">
                                                    <p className="text-[11px] font-bold text-gray-400 mb-1">سجل المحادثة بالكامل:</p>
                                                    {(log.userQuery || '').split('\n\n').map((line, li) => {
                                                        const isClient = line.startsWith('👤') || line.includes('العميل');
                                                        return (
                                                            <div key={li} className={`text-xs p-2.5 rounded-lg leading-relaxed ${
                                                                isClient 
                                                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200' 
                                                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-300 border border-gray-100 dark:border-gray-700'
                                                            }`}>
                                                                {line}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                             
                                            <textarea 
                                                id={`ans_${log.id}`}
                                                placeholder="اكتب الإجابة هنا لتعليم البوت..."
                                                className="w-full mt-2 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-red-400"
                                            />
                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                                                <button 
                                                    type="button"
                                                    onClick={() => handleDismissUnanswered(log.id)}
                                                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-1"
                                                    title="حذف هذا السؤال من صندوق الأسئلة المفقودة"
                                                >
                                                    <span>🗑️</span>
                                                    <span>حذف من الصندوق</span>
                                                </button>
                                                <button 
                                                    onClick={async () => {
                                                        const ans = (document.getElementById(`ans_${log.id}`) as HTMLTextAreaElement).value;
                                                        if(ans) await handleAddSnippet(lastQ, ans, log.id);
                                                    }}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-sm">حفظ وتدريب البوت</button>
                                            </div>
                                       </div>
                                       );
                                   })}
                                </div>
                            </div>
                        )}

                        {/* 0. System Structure Manager (Map) */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-2 h-full bg-blue-600"></div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                                <span>🗺️</span> إدارة خريطة النظام (القوائم والشاشات)
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                عرف البوت هنا على هيكل برنامجك. أضف أسماء القوائم الرئيسية ثم أضف الشاشات التابعة لكل قائمة. هذا يساعد البوت في إعطاء مسارات دقيقة جداً.
                            </p>

                            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-800 mb-6">
                                <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                                    <span>📁</span> الخطوة 1: أضف القوائم الرئيسية (مثل: المبيعات، الحسابات)
                                </h4>


                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newCategoryInput}
                                    onChange={e => setNewCategoryInput(e.target.value)}
                                    placeholder="اسم القسم (مثال: المبيعات)"
                                    className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-gray-700 dark:text-gray-100 text-sm"
                                    onKeyPress={e => e.key === 'Enter' && document.getElementById('add-cat-btn')?.click()}
                                />
                                <button
                                    id="add-cat-btn"
                                    onClick={async () => {
                                        if (!newCategoryInput.trim() || globalCategories.includes(newCategoryInput.trim())) return;
                                        const newCats = [...globalCategories, newCategoryInput.trim()];
                                        setGlobalCategories(newCats);
                                        await db.saveGlobalCategories(newCats, activeSystemType);
                                        setNewCategoryInput('');
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-md"
                                >
                                    إضافة قسم
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {globalCategories.map(cat => (
                                    <div key={cat} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-800 transition-all group">
                                        {cat}
                                        {cat !== 'البيانات العامه' && (
                                            <button 
                                                onClick={async () => {
                                                    const filtered = globalCategories.filter(c => c !== cat);
                                                    setGlobalCategories(filtered);
                                                    await db.saveGlobalCategories(filtered, activeSystemType);
                                                }}
                                                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >✕</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                                <h4 className="text-sm font-bold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
                                    <span>📑</span> الخطوة 2: أضف الشاشات التابعة لكل قائمة
                                </h4>


                            <div className="flex flex-col md:flex-row gap-3 mb-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-600">
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 mr-2 uppercase">اسم القائمة</label>
                                    <input
                                        type="text"
                                        list="menu-suggestions"
                                        value={pathMenuInput}
                                        onChange={e => setPathMenuInput(e.target.value)}
                                        placeholder="مثال: المبيعات"
                                        className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-gray-700 dark:text-gray-100 text-sm"
                                    />
                                    <datalist id="menu-suggestions">
                                        {globalCategories.map(cat => (
                                            <option key={cat} value={cat} />
                                        ))}
                                    </datalist>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 mr-2 uppercase">اسم الشاشة</label>
                                    <input
                                        id="screen-input"
                                        type="text"
                                        value={pathScreenInput}
                                        onChange={e => setPathScreenInput(e.target.value)}
                                        placeholder="مثال: فاتورة بيع"
                                        className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-gray-700 dark:text-gray-100 text-sm"
                                        onKeyPress={e => {
                                            if(e.key === 'Enter') {
                                                // Trigger addition on Enter key
                                                document.getElementById('add-path-btn')?.click();
                                            }
                                        }}
                                    />
                                </div>
                                <button
                                    id="add-path-btn"
                                        onClick={() => {
                                            if (!pathMenuInput.trim() || !pathScreenInput.trim()) return;
                                            const newPaths = [...structuredPaths, { menu: pathMenuInput.trim(), screen: pathScreenInput.trim() }];
                                            setStructuredPaths(newPaths);
                                            setPathScreenInput(''); // Only clear screen to allow bulk adding to same menu
                                            // Update the raw text for the bot WITHOUT numbers
                                            const raw = newPaths.map((p) => `${p.menu} -> ${p.screen}`).join('\n');
                                            setMenuText(raw);
                                            // Refocus screen input
                                            document.getElementById('screen-input')?.focus();
                                        }}
                                        className="md:mt-5 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
                                    >
                                        <span>➕</span> إضافة
                                    </button>
                                </div>

                                {structuredPaths.length > 0 && (
                                    <div className="mb-6 space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
                                        {/* Group paths by menu for cleaner view */}
                                        {Object.entries(
                                            structuredPaths.reduce((acc, curr) => {
                                                if (!acc[curr.menu]) acc[curr.menu] = [];
                                                acc[curr.menu].push(curr.screen);
                                                return acc;
                                            }, {} as Record<string, string[]>)
                                        ).map(([menu, screens], gIdx) => (
                                            <div key={menu} className="bg-white dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-600 overflow-hidden shadow-sm">
                                                <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-2 border-b border-gray-100 dark:border-gray-600 flex justify-between items-center">
                                                    <span className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                                                        📁 {menu}
                                                        <span className="text-[10px] bg-purple-200 dark:bg-purple-800 px-1.5 py-0.5 rounded-full">{screens.length}</span>
                                                    </span>
                                                </div>
                                                <div className="p-2 flex flex-wrap gap-2">
                                                    {screens.map((screen, sIdx) => (
                                                        <div key={sIdx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-500 rounded-lg px-3 py-1.5 flex items-center gap-2 group transition-all hover:border-red-300">
                                                            <span className="text-xs text-gray-700 dark:text-gray-200">{screen}</span>
                                                            <button 
                                                                onClick={() => {
                                                                    // Delete specific item
                                                                    const filtered = structuredPaths.filter(p => !(p.menu === menu && p.screen === screen));
                                                                    setStructuredPaths(filtered);
                                                                    const raw = filtered.map((p) => `${p.menu} -> ${p.screen}`).join('\n');
                                                                    setMenuText(raw);
                                                                }}
                                                                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                            <details className="mb-4">
                                <summary className="text-xs font-bold text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors">تعديل النص الخام (Advanced)</summary>
                                <textarea
                                    value={menuText}
                                    onChange={e => {
                                        setMenuText(e.target.value);
                                        // Try to sync back to structured
                                        const lines = e.target.value.split('\n').filter(l => l.includes('->'));
                                        const parsed = lines.map(line => {
                                            const parts = line.split('->');
                                            const menu = parts[0].replace(/^\d+[-.]?\s*/, '').trim();
                                            const screen = parts[1].trim();
                                            return { menu, screen };
                                        });
                                        setStructuredPaths(parsed);
                                    }}
                                    placeholder="تعديل مباشر بتنسيق: القائمة -> الشاشة"
                                    className="w-full mt-2 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none text-xs font-mono text-gray-500 min-h-[100px]"
                                />
                            </details>

                            <div className="text-left">
                                <button
                                    onClick={handleSaveMenu}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95"
                                >
                                    حفظ وتفعيل المسارات
                                </button>
                            </div>
                        </div>

                        {/* --- Question & Answer Training Section --- */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden mt-8">
                            <div className="absolute top-0 right-0 w-2 h-full bg-orange-500"></div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                                <span>⚡</span> الطريقة الثانية: إضافة سؤال وجواب مباشر (مع الصور)
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                أسرع طريقة لتدريب البوت على حل مشكلة معينة أو الرد على سؤال متكرر. يمكنك إرفاق صورة توضيحية.
                            </p>

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-gray-500 mr-2 text-right">اسم القائمة</label>
                                        <input
                                            type="text"
                                            value={snippetMenu}
                                            onChange={e => setSnippetMenu(e.target.value)}
                                            placeholder="مثال: المبيعات"
                                            className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 dark:text-gray-100 text-sm"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-gray-500 mr-2 text-right">اسم الشاشة</label>
                                        <input
                                            type="text"
                                            value={snippetScreen}
                                            onChange={e => setSnippetScreen(e.target.value)}
                                            placeholder="مثال: فاتورة مبيعات صيدلية"
                                            className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 dark:text-gray-100 text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex flex-col flex-1 gap-1">
                                        <label className="text-xs font-bold text-gray-500 mr-2 text-right">التصنيف</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={snippetCategory}
                                                onChange={e => setSnippetCategory(e.target.value)}
                                                className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 dark:text-gray-100 text-sm font-bold"
                                            >
                                                {globalCategories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                                <option value="Other">... يدوي</option>
                                            </select>
                                            {snippetCategory === 'Other' && (
                                                <input 
                                                    type="text"
                                                    placeholder="اكتب اسم القسم..."
                                                    className="flex-1 p-3 bg-white dark:bg-gray-700 border border-purple-300 rounded-xl text-sm"
                                                    onBlur={e => {
                                                        if(e.target.value) setSnippetCategory(e.target.value);
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col flex-[3] gap-1">
                                        <label className="text-xs font-bold text-gray-500 mr-2 text-right">سؤال العميل</label>
                                        <input
                                            type="text"
                                            value={snippetQuestion}
                                            onChange={e => setSnippetQuestion(e.target.value)}
                                            placeholder="سؤال العميل (مثال: ازاي اضيف صنف جديد؟)"
                                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-gray-500 mr-2 text-right">إجابة البوت</label>
                                    <textarea
                                        value={snippetAnswer}
                                        onChange={e => setSnippetAnswer(e.target.value)}
                                        placeholder="إجابة البوت (مثال: من القائمة الرئيسية اختر المخازن ثم...)"
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 dark:text-gray-100 min-h-[100px] placeholder-gray-400 dark:placeholder-gray-500"
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                        </svg>
                                        إرفاق صورة توضيحية
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={imageInputRef}
                                            onChange={handleSnippetImageSelect}
                                        />
                                    </label>

                                    {snippetImage && (
                                        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-lg text-xs font-bold">
                                            <span>تم اختيار صورة</span>
                                            <button onClick={() => { setSnippetImage(null); if (imageInputRef.current) imageInputRef.current.value = ''; }} className="text-red-500 hover:text-red-700">✕</button>
                                        </div>
                                    )}

                                    <div className="flex-1"></div>

                                    <button
                                        onClick={() => handleAddSnippet()}
                                        disabled={!snippetQuestion.trim() || !snippetAnswer.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        حفظ المعلومة
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Existing Snippets List */}
                        {snippets.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">معلومات مضافة يدوياً ({snippets.length})</h3>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                                    {snippets.map(s => (
                                        <div key={s.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600 flex gap-4 items-start group">
                                            {s.imageUrl && (
                                                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden flex-shrink-0 border border-gray-300 dark:border-gray-500">
                                                    <img src={s.imageUrl} alt="snippet" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                            {s.category || 'البيانات العامه'}
                                                        </span>
                                                        {(s.menuName || s.screenName) && (
                                                            <span className="mr-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                                                📍 {s.menuName} {s.screenName ? ` -> ${s.screenName}` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDeleteSnippet(s.id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <p className="text-gray-700 dark:text-gray-200 text-sm whitespace-pre-wrap mt-1">{s.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. Manual Upload (Base Knowledge) */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-2 h-full bg-green-500"></div>
                            <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">الطريقة الأولى: رفع ملفات المعرفة</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-md mx-auto leading-relaxed">
                                ارفع ملفات (Word, PDF, Text) تحتوي على شرح للبرنامج. اتبع النموذج المرفق لضمان أفضل إجابة من البوت.
                            </p>

                            <div className="flex flex-col gap-3 max-w-md mx-auto">
                                <input
                                    type="file"
                                    accept=".pdf,.docx,.txt"
                                    ref={pdfInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />

                                {pdfUploading ? (
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden p-4">
                                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                                            <span>{uploadProgress}</span>
                                            <span className="animate-pulse font-bold text-blue-600">جاري المعالجة...</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 overflow-hidden">
                                            <div className="bg-blue-600 h-2.5 rounded-full animate-progress-indeterminate"></div>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => pdfInputRef.current?.click()}
                                        disabled={pdfUploading}
                                        className="w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                        </svg>
                                        اختر الملف من جهازك
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* --- NEW: Direct Text Training (Alternative to Files) --- */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                                    📝
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-800 dark:text-white">تدريب سريع بالنص المباشر (نسخ ولصق)</h3>
                                    <p className="text-xs text-gray-500 font-medium">إذا واجهت مشكلة في رفع الملف، انسخ محتواه هنا مباشرة وسيفهمه البوت فوراً.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <textarea
                                    value={directText}
                                    onChange={(e) => setDirectText(e.target.value)}
                                    placeholder="انسخ النص من ملف الـ Word أو أي مكان والصقه هنا... (يمكنك لصق نصوص ضخمة جداً)"
                                    className="w-full h-64 p-5 bg-gray-50 dark:bg-gray-700/50 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none text-gray-700 dark:text-gray-200 transition-all resize-none scrollbar-thin"
                                />
                                
                                <button
                                    onClick={async () => {
                                        if (!directText.trim()) return;
                                        setIsDirectTraining(true);
                                        try {
                                            // Reuse the chunking logic for the pasted text
                                            const paragraphs = directText.split(/\n\s*\n/).filter(p => p.trim().length > 20);
                                            const chunks: string[] = [];
                                            let currentChunk = "";
                                            for (let p of paragraphs) {
                                                if ((currentChunk.length + p.length) > 1000) {
                                                    chunks.push(`📝 **Direct Input:**\n` + currentChunk);
                                                    currentChunk = p;
                                                } else {
                                                    currentChunk += "\n\n" + p;
                                                }
                                            }
                                            if (currentChunk) chunks.push(`📝 **Direct Input:**\n` + currentChunk);

                                            const docChunks: any[] = [];
                                            const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || (process.env as any).API_KEY || "" });
                                            
                                            for (let i = 0; i < chunks.length; i++) {
                                                setUploadProgress(`جاري معالجة الجزء ${i+1} من ${chunks.length}...`);
                                                const res = await ai.models.embedContent({ model: 'gemini-embedding-2', contents: chunks[i] });
                                                if (res.embeddings?.[0]?.values) {
                                                    docChunks.push({
                                                        id: Date.now() + "_direct_" + i,
                                                        systemType: activeSystemType,
                                                        text: chunks[i],
                                                        embedding: res.embeddings[0].values
                                                    });
                                                }
                                            }

                                            const currentChunks = await db.getDocChunks(activeSystemType);
                                            await db.saveDocChunks([...currentChunks, ...docChunks], activeSystemType);
                                            
                                            const newLen = [...currentChunks, ...docChunks].reduce((acc, c) => acc + c.text.length, 0);
                                            if (activeSystemType === 'e-Stock Pharmacy') setDocsLengthPharmacy(newLen);
                                            else if (activeSystemType === 'e-Stock Retail') setDocsLengthRetail(newLen);
                                            else setDocsLengthStore(newLen);

                                            setDirectText('');
                                            alert("✅ تم تدريب البوت على النص المباشر بنجاح!");
                                        } catch (e: any) {
                                            alert("خطأ أثناء التدريب: " + e.message);
                                        } finally {
                                            setIsDirectTraining(false);
                                            setUploadProgress('');
                                        }
                                    }}
                                    disabled={isDirectTraining || !directText.trim()}
                                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black shadow-lg shadow-green-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                                >
                                    {isDirectTraining ? (
                                        <>
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            جاري التدريب...
                                        </>
                                    ) : (
                                        <><span>🚀</span> تدريب البوت على هذا النص الآن</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* --- Memory Management Section --- */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden mt-8">
                            <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                                <span>💾</span> إدارة الذاكرة والمراجعة
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                من هنا يمكنك مراجعة وتعديل كل المعلومات التي استوعبها البوت.
                            </p>

                            {activeDocsLength > 0 ? (
                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                    <div className="text-right bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                        <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">📊 حجم ذاكرة ({activeSystemType})</p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                                    {(activeDocsLength / 1024).toFixed(2)} <span className="text-xs font-normal">كيلوبايت</span>
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-bold">
                                                    إجمالي الحروف: {activeDocsLength.toLocaleString()} حرف
                                                </p>
                                            </div>
                                            <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse"></span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleOpenChunksEditor}
                                            className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors text-purple-600 dark:text-purple-400 hover:text-purple-800 hover:bg-purple-100 bg-purple-50 dark:bg-purple-900/30 dark:hover:bg-purple-900/50"
                                        >
                                            👁️ محرر الذاكرة
                                        </button>
                                        <button
                                            onClick={handleDownloadDocs}
                                            disabled={pdfUploading}
                                            className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors text-blue-500 dark:blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                        >
                                            استخراج الداتا
                                        </button>
                                        <button
                                            onClick={handleClearDocs}
                                            disabled={pdfUploading}
                                            className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50"
                                        >
                                            حذف الكل
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-center flex flex-col items-center justify-center gap-2">
                                    <span className="text-2xl">📭</span>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">
                                        لم تقم برفع أي ملفات أو نصوص للبرنامج الحالي.
                                    </p>
                                    <p className="text-gray-400 dark:text-gray-500 text-xs">
                                        ابدأ بتدريب البوت من الطرق المذكورة أعلاه لتظهر لك حالة الذاكرة هنا.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 4. Global Control - Clear All */}
                        <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm mt-8">
                            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                                <span>⚠️</span> منطقة التحكم الشاملة (جميع البرامج)
                            </h3>
                            <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
                                تحذير: هذا القسم يؤثر على جميع الأنظمة الثلاثة (صيدليات، تجاري، سلاسل). استخدمه فقط عند الرغبة في تصفير ذكاء البوت بالكامل والبدء من جديد.
                            </p>
                            <button
                                onClick={async () => {
                                    if (window.confirm('هل أنت متأكد تماماً من حذف كافة بيانات التدريب لجميع البرامج؟ لا يمكن التراجع عن هذه الخطوة.')) {
                                        await db.clearAllTrainingData();
                                        await refreshData();
                                        alert('✅ تم تصفير كافة بيانات البوت في جميع الأنظمة بنجاح.');
                                    }
                                }}
                                className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                🗑️ حذف كافة بيانات التدريب لجميع الأنظمة
                            </button>
                        </div>
                    </div>
                )}

                {/* --- History Viewer Section (Redesigned) --- */}
                {activeTab === 'history' && (() => {
                    // ---- State (inline via IIFE pattern in JSX using a sub-component approach) ----
                    // We'll use existing state refs for filters — defined inside a wrapper div
                    return <HistoryTab
                        logs={logs}
                        isDarkMode={isDarkMode}
                        onExport={handleExportLogs}
                        onPrint={handlePrintLogs}
                    />;
                })()}



                {/* --- Settings & Users Section --- */}
                {activeTab === 'landing' && landingConfig && (
                    <div className="space-y-6 animate-in fade-in duration-300 pb-20 text-right" dir="rtl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-800 dark:text-white">إدارة محتوى الصفحة الرئيسية</h2>
                            <button 
                                onClick={async () => {
                                    if (!landingConfig) return;
                                    setIsSavingLanding(true);
                                    try {
                                        // Ensure sync between both whatsapp fields
                                        const finalConfig = { 
                                            ...landingConfig, 
                                            whatsappNumber: landingConfig.whatsappPhone || landingConfig.whatsappNumber 
                                        };
                                        await db.saveLandingConfig(finalConfig);
                                        setLandingConfig(finalConfig);
                                        alert('✅ تم حفظ تعديلات الموقع بنجاح!');
                                    } catch (err: any) {
                                        console.error(err);
                                        alert('❌ حدث خطأ أثناء الحفظ في قاعدة البيانات. يرجى التحقق من الاتصال.');
                                    } finally {
                                        setIsSavingLanding(false);
                                    }
                                }}
                                disabled={isSavingLanding}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg transition-all flex items-center gap-2"
                            >
                                {isSavingLanding ? 'جاري الحفظ...' : 'حفظ كافة التعديلات'}
                                <span>💾</span>
                            </button>
                        </div>

                        {/* --- HERO SECTION --- */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4">
                                <span className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600">🚀</span>
                                الجزء العلوي (Hero Section)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-500 mb-2">العنوان الرئيسي</label>
                                    <textarea 
                                        value={landingConfig.heroTitle}
                                        onChange={e => setLandingConfig({...landingConfig, heroTitle: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-bold"
                                        rows={2}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-2">العنوان الفرعي</label>
                                    <textarea 
                                        value={landingConfig.heroSubtitle}
                                        onChange={e => setLandingConfig({...landingConfig, heroSubtitle: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-2">نص زر المساعد الذكي</label>
                                    <input 
                                        type="text"
                                        value={landingConfig.heroButtonText}
                                        onChange={e => setLandingConfig({...landingConfig, heroButtonText: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* --- PRODUCTS SECTION --- */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4">
                                <span className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600">📦</span>
                                قسم الأنظمة الأساسية (المنتجات)
                            </h3>
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-2">عنوان القسم</label>
                                    <input 
                                        type="text"
                                        value={landingConfig.productsTitle}
                                        onChange={e => setLandingConfig({...landingConfig, productsTitle: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-2">وصف القسم</label>
                                    <input 
                                        type="text"
                                        value={landingConfig.productsSubtitle}
                                        onChange={e => setLandingConfig({...landingConfig, productsSubtitle: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {landingConfig.products.map((prod, idx) => (
                                    <div key={idx} className="p-6 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-400">نظام #{idx + 1}</span>
                                            <button 
                                                onClick={() => {
                                                    const newProds = [...landingConfig.products];
                                                    newProds.splice(idx, 1);
                                                    setLandingConfig({...landingConfig, products: newProds});
                                                }}
                                                className="text-red-500 text-[10px] font-bold hover:underline"
                                            >حذف ✕</button>
                                        </div>
                                        <input 
                                            type="text"
                                            placeholder="اسم النظام"
                                            value={prod.name}
                                            onChange={e => {
                                                const newProds = [...landingConfig.products];
                                                newProds[idx].name = e.target.value;
                                                setLandingConfig({...landingConfig, products: newProds});
                                            }}
                                            className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-bold"
                                        />
                                        <textarea 
                                            placeholder="وصف النظام"
                                            value={prod.description}
                                            onChange={e => {
                                                const newProds = [...landingConfig.products];
                                                newProds[idx].description = e.target.value;
                                                setLandingConfig({...landingConfig, products: newProds});
                                            }}
                                            className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                            rows={2}
                                        />
                                        <input 
                                            type="text"
                                            placeholder="رابط الصورة (URL)"
                                            value={prod.image}
                                            onChange={e => {
                                                const newProds = [...landingConfig.products];
                                                newProds[idx].image = e.target.value;
                                                setLandingConfig({...landingConfig, products: newProds});
                                            }}
                                            className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-[10px] font-mono"
                                        />
                                    </div>
                                ))}
                                <button 
                                    onClick={() => {
                                        setLandingConfig({
                                            ...landingConfig, 
                                            products: [...landingConfig.products, { id: Date.now().toString(), name: 'نظام جديد', description: '', image: '' }]
                                        });
                                    }}
                                    className="md:col-span-2 py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 hover:text-pink-500 hover:border-pink-500 transition-all font-bold text-sm"
                                >+ إضافة نظام جديد</button>
                            </div>
                        </div>

                        {/* --- FEATURES SECTION --- */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4">
                                <span className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600">⭐</span>
                                قسم مميزات مودرن سوفت (لماذا تختارنا؟)
                            </h3>
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-2">عنوان القسم</label>
                                    <input 
                                        type="text"
                                        value={landingConfig.featuresTitle}
                                        onChange={e => setLandingConfig({...landingConfig, featuresTitle: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-2">وصف القسم</label>
                                    <input 
                                        type="text"
                                        value={landingConfig.featuresSubtitle}
                                        onChange={e => setLandingConfig({...landingConfig, featuresSubtitle: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {landingConfig.features.map((feat, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-400">ميزة #{idx + 1}</span>
                                            <button 
                                                onClick={() => {
                                                    const newFeats = [...landingConfig.features];
                                                    newFeats.splice(idx, 1);
                                                    setLandingConfig({...landingConfig, features: newFeats});
                                                }}
                                                className="text-red-500 text-[10px] font-bold hover:underline"
                                            >حذف ✕</button>
                                        </div>
                                        <input 
                                            type="text"
                                            placeholder="عنوان الميزة"
                                            value={feat.title}
                                            onChange={e => {
                                                const newFeats = [...landingConfig.features];
                                                newFeats[idx].title = e.target.value;
                                                setLandingConfig({...landingConfig, features: newFeats});
                                            }}
                                            className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-bold"
                                        />
                                        <textarea 
                                            placeholder="وصف الميزة"
                                            value={feat.desc}
                                            onChange={e => {
                                                const newFeats = [...landingConfig.features];
                                                newFeats[idx].desc = e.target.value;
                                                setLandingConfig({...landingConfig, features: newFeats});
                                            }}
                                            className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-[11px]"
                                            rows={3}
                                        />
                                    </div>
                                ))}
                                <button 
                                    onClick={() => {
                                        setLandingConfig({
                                            ...landingConfig, 
                                            features: [...landingConfig.features, { title: 'ميزة جديدة', desc: '', icon: 'Zap' }]
                                        });
                                    }}
                                    className="md:col-span-3 py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 hover:text-yellow-500 hover:border-yellow-500 transition-all font-bold text-sm"
                                >+ إضافة ميزة جديدة</button>
                            </div>
                        </div>



                        {/* --- STATS SECTION --- */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4">
                                <span className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">📊</span>
                                قسم الإحصائيات (الأرقام)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {landingConfig.stats.map((stat, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-gray-400">إحصائية #{idx + 1}</span>
                                            <button 
                                                onClick={() => {
                                                    const newStats = [...landingConfig.stats];
                                                    newStats.splice(idx, 1);
                                                    setLandingConfig({...landingConfig, stats: newStats});
                                                }}
                                                className="text-red-500 text-[10px] font-bold hover:underline"
                                            >حذف</button>
                                        </div>
                                        <input 
                                            type="text"
                                            placeholder="الرقم (مثلاً: +500)"
                                            value={stat.value}
                                            onChange={e => {
                                                const newStats = [...landingConfig.stats];
                                                newStats[idx].value = e.target.value;
                                                setLandingConfig({...landingConfig, stats: newStats});
                                            }}
                                            className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-black text-indigo-600"
                                        />
                                        <input 
                                            type="text"
                                            placeholder="الوصف (مثلاً: عميل)"
                                            value={stat.label}
                                            onChange={e => {
                                                const newStats = [...landingConfig.stats];
                                                newStats[idx].label = e.target.value;
                                                setLandingConfig({...landingConfig, stats: newStats});
                                            }}
                                            className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-[11px] font-bold"
                                        />
                                    </div>
                                ))}
                                <button 
                                    onClick={() => {
                                        setLandingConfig({
                                            ...landingConfig, 
                                            stats: [...landingConfig.stats, { label: 'إحصائية جديدة', value: '0', icon: 'Activity' }]
                                        });
                                    }}
                                    className="md:col-span-4 py-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 hover:text-indigo-500 hover:border-indigo-500 transition-all font-bold text-xs"
                                >+ إضافة إحصائية</button>
                            </div>
                        </div>

                        {/* --- PLANS SECTION --- */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4">
                                <span className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">💎</span>
                                قسم البرامج والأسعار
                            </h3>
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-2">عنوان القسم</label>
                                    <input 
                                        type="text"
                                        value={landingConfig.plansTitle}
                                        onChange={e => setLandingConfig({...landingConfig, plansTitle: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-2">وصف القسم</label>
                                    <input 
                                        type="text"
                                        value={landingConfig.plansSubtitle}
                                        onChange={e => setLandingConfig({...landingConfig, plansSubtitle: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                {landingConfig.plans.map((plan, idx) => (
                                    <div key={idx} className="p-6 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-black text-blue-600 dark:text-blue-400">باقة: {plan.name}</h4>
                                            <button 
                                                onClick={() => {
                                                    const newPlans = [...landingConfig.plans];
                                                    newPlans.splice(idx, 1);
                                                    setLandingConfig({...landingConfig, plans: newPlans});
                                                }}
                                                className="text-red-500 text-xs font-bold hover:underline"
                                            >حذف الباقة ✕</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input 
                                                type="text"
                                                placeholder="اسم الباقة"
                                                value={plan.name}
                                                onChange={e => {
                                                    const newPlans = [...landingConfig.plans];
                                                    newPlans[idx].name = e.target.value;
                                                    setLandingConfig({...landingConfig, plans: newPlans});
                                                }}
                                                className="px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                            />
                                            <input 
                                                type="text"
                                                placeholder="وصف الباقة (Subtext)"
                                                value={plan.desc}
                                                onChange={e => {
                                                    const newPlans = [...landingConfig.plans];
                                                    newPlans[idx].desc = e.target.value;
                                                    setLandingConfig({...landingConfig, plans: newPlans});
                                                }}
                                                className="px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                            />
                                            <div className="md:col-span-2">
                                                <label className="block text-[10px] font-bold text-gray-400 mb-1">المميزات (ميزة في كل سطر أو مفصولة بفاصلة)</label>
                                                <textarea 
                                                    value={plan.features.join('\n')}
                                                    onChange={e => {
                                                        const newPlans = [...landingConfig.plans];
                                                        // Split by newline or comma
                                                        newPlans[idx].features = e.target.value.split(/[\n,]/).map(s => s.trim()).filter(s => s !== '');
                                                        setLandingConfig({...landingConfig, plans: newPlans});
                                                    }}
                                                    className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                                    rows={4}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => {
                                        setLandingConfig({
                                            ...landingConfig, 
                                            plans: [...landingConfig.plans, { name: 'باقة جديدة', desc: '', features: [], highlight: false }]
                                        });
                                    }}
                                    className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 hover:text-blue-500 hover:border-blue-500 transition-all font-bold text-sm"
                                >+ إضافة باقة جديدة</button>
                            </div>
                        </div>

                        {/* --- FOOTER & CONTACT SECTION --- */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4">
                                <span className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">📞</span>
                                بيانات التواصل والتذييل (Footer)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-500 mb-2">نبذة عن الشركة (Footer About)</label>
                                    <textarea 
                                        value={landingConfig.aboutCompanyText}
                                        onChange={e => setLandingConfig({...landingConfig, aboutCompanyText: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-2">البريد الإلكتروني</label>
                                    <input 
                                        type="email"
                                        value={landingConfig.contactEmail}
                                        onChange={e => setLandingConfig({...landingConfig, contactEmail: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-2">رقم المبيعات (Call)</label>
                                    <input 
                                        type="text"
                                        value={landingConfig.contactPhone}
                                        onChange={e => setLandingConfig({...landingConfig, contactPhone: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-2">رقم الواتساب (لأزرار الاشتراك)</label>
                                    <input 
                                        type="text"
                                        value={landingConfig.whatsappPhone}
                                        onChange={e => setLandingConfig({...landingConfig, whatsappPhone: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="مثال: 201234567890"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-2">العنوان</label>
                                    <input 
                                        type="text"
                                        value={landingConfig.contactAddress}
                                        onChange={e => setLandingConfig({...landingConfig, contactAddress: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-500 mb-2">نص حقوق الملكية (Copyright)</label>
                                    <input 
                                        type="text"
                                        value={landingConfig.footerText}
                                        onChange={e => setLandingConfig({...landingConfig, footerText: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* --- ABOUT & CONTACT SUB-PAGES --- */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4">
                                <span className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">📄</span>
                                الصفحات الفرعية (من نحن واتصل بنا)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-500 mb-2">عنوان صفحة "من نحن"</label>
                                    <input 
                                        type="text"
                                        value={landingConfig.aboutPageTitle || ''}
                                        onChange={e => setLandingConfig({...landingConfig, aboutPageTitle: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-bold"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-500 mb-2">محتوى صفحة "من نحن"</label>
                                    <textarea 
                                        value={landingConfig.aboutPageContent || ''}
                                        onChange={e => setLandingConfig({...landingConfig, aboutPageContent: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        rows={4}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-2">رابط صورة صفحة "من نحن"</label>
                                    <input 
                                        type="text"
                                        value={landingConfig.aboutPageImage || ''}
                                        onChange={e => setLandingConfig({...landingConfig, aboutPageImage: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        dir="ltr"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-2">عنوان صفحة "اتصل بنا"</label>
                                    <input 
                                        type="text"
                                        value={landingConfig.contactPageTitle || ''}
                                        onChange={e => setLandingConfig({...landingConfig, contactPageTitle: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-bold"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-500 mb-2">رابط الخريطة (Google Maps Embed)</label>
                                    <input 
                                        type="text"
                                        value={landingConfig.contactMapUrl || ''}
                                        onChange={e => setLandingConfig({...landingConfig, contactMapUrl: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* --- TESTIMONIALS SECTION --- */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4">
                                <span className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600">⭐</span>
                                آراء العملاء (Testimonials)
                            </h3>
                            <div className="space-y-4">
                                {(landingConfig.testimonials || []).map((t, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-400">رأي #{idx + 1}</span>
                                            <button 
                                                onClick={() => {
                                                    const newT = [...(landingConfig.testimonials || [])];
                                                    newT.splice(idx, 1);
                                                    setLandingConfig({...landingConfig, testimonials: newT});
                                                }}
                                                className="text-red-500 text-[10px] font-bold hover:underline"
                                            >حذف ✕</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input 
                                                type="text"
                                                placeholder="اسم العميل"
                                                value={t.name}
                                                onChange={e => {
                                                    const newT = [...(landingConfig.testimonials || [])];
                                                    newT[idx] = {...newT[idx], name: e.target.value};
                                                    setLandingConfig({...landingConfig, testimonials: newT});
                                                }}
                                                className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-bold"
                                            />
                                            <input 
                                                type="text"
                                                placeholder="المسمى الوظيفي (مثال: مالك صيدلية)"
                                                value={t.role}
                                                onChange={e => {
                                                    const newT = [...(landingConfig.testimonials || [])];
                                                    newT[idx] = {...newT[idx], role: e.target.value};
                                                    setLandingConfig({...landingConfig, testimonials: newT});
                                                }}
                                                className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                            />
                                        </div>
                                        <textarea 
                                            placeholder="نص التقييم"
                                            value={t.text}
                                            onChange={e => {
                                                const newT = [...(landingConfig.testimonials || [])];
                                                newT[idx] = {...newT[idx], text: e.target.value};
                                                setLandingConfig({...landingConfig, testimonials: newT});
                                            }}
                                            className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                            rows={2}
                                        />
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-bold text-gray-500">التقييم (1-5):</label>
                                            <input 
                                                type="number"
                                                min={1} max={5}
                                                value={t.rating}
                                                onChange={e => {
                                                    const newT = [...(landingConfig.testimonials || [])];
                                                    newT[idx] = {...newT[idx], rating: Number(e.target.value)};
                                                    setLandingConfig({...landingConfig, testimonials: newT});
                                                }}
                                                className="w-20 px-3 py-1.5 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-bold text-amber-500"
                                            />
                                            <span className="text-amber-400 text-lg">{Array.from({length: t.rating}).map(() => '★').join('')}</span>
                                        </div>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => {
                                        setLandingConfig({
                                            ...landingConfig, 
                                            testimonials: [...(landingConfig.testimonials || []), { name: '', role: '', text: '', rating: 5 }]
                                        });
                                    }}
                                    className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 hover:text-amber-500 hover:border-amber-500 transition-all font-bold text-sm"
                                >+ إضافة رأي جديد</button>
                            </div>
                        </div>

                        {/* --- FAQS SECTION --- */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4">
                                <span className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">❓</span>
                                الأسئلة الشائعة (FAQ)
                            </h3>
                            <div className="space-y-4">
                                {(landingConfig.faqs || []).map((faq, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-400">سؤال #{idx + 1}</span>
                                            <button 
                                                onClick={() => {
                                                    const newFaqs = [...(landingConfig.faqs || [])];
                                                    newFaqs.splice(idx, 1);
                                                    setLandingConfig({...landingConfig, faqs: newFaqs});
                                                }}
                                                className="text-red-500 text-[10px] font-bold hover:underline"
                                            >حذف ✕</button>
                                        </div>
                                        <input 
                                            type="text"
                                            placeholder="السؤال"
                                            value={faq.question}
                                            onChange={e => {
                                                const newFaqs = [...(landingConfig.faqs || [])];
                                                newFaqs[idx] = {...newFaqs[idx], question: e.target.value};
                                                setLandingConfig({...landingConfig, faqs: newFaqs});
                                            }}
                                            className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-bold"
                                        />
                                        <textarea 
                                            placeholder="الإجابة"
                                            value={faq.answer}
                                            onChange={e => {
                                                const newFaqs = [...(landingConfig.faqs || [])];
                                                newFaqs[idx] = {...newFaqs[idx], answer: e.target.value};
                                                setLandingConfig({...landingConfig, faqs: newFaqs});
                                            }}
                                            className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                            rows={2}
                                        />
                                    </div>
                                ))}
                                <button 
                                    onClick={() => {
                                        setLandingConfig({
                                            ...landingConfig, 
                                            faqs: [...(landingConfig.faqs || []), { question: '', answer: '' }]
                                        });
                                    }}
                                    className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 hover:text-purple-500 hover:border-purple-500 transition-all font-bold text-sm"
                                >+ إضافة سؤال جديد</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Session Settings */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                إعدادات الجلسة (Session)
                            </h3>
                            <div className="flex items-end gap-4">
                                <div className="flex-1 max-w-xs">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مدة الجلسة (دقائق)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={sessionTimeout}
                                        onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 15)}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                                    />
                                </div>
                                <button
                                    onClick={handleSaveSettings}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold shadow-sm transition-all"
                                >
                                    حفظ الإعدادات
                                </button>
                            </div>
                        </div>

                        {/* Add User */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                                </svg>
                                إضافة عميل جديد
                            </h3>

                            <form onSubmit={handleAddCustomer} className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">اسم العميل</label>
                                    <input
                                        type="text"
                                        value={newCustomerName}
                                        onChange={(e) => setNewCustomerName(e.target.value)}
                                        placeholder="الاسم الثلاثي"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">رقم التعاقد</label>
                                    <input
                                        type="text"
                                        value={newCustomerContract}
                                        onChange={(e) => setNewCustomerContract(e.target.value)}
                                        placeholder="رقم فريد"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">نوع النظام</label>
                                    <select
                                        value={newCustomerSystemType}
                                        onChange={(e) => setNewCustomerSystemType(e.target.value as SystemType)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white cursor-pointer"
                                    >
                                        <option value="e-Stock Pharmacy">e-Stock Pharmacy</option>
                                        <option value="e-Stock Retail">e-Stock Retail</option>
                                        <option value="Pharma Store">Pharma Store</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition-all"
                                >
                                    إضافة
                                </button>
                            </form>

                            {/* Excel Actions */}
                            <div className="mt-6 flex flex-wrap gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    ref={excelInputRef}
                                    onChange={handleCustomerExcelUpload}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => excelInputRef.current?.click()}
                                    className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                    استيراد من Excel (الاسم, رقم التعاقد)
                                </button>
                                <button
                                    onClick={handleExportCustomers}
                                    className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-4 py-2 rounded-lg transition-colors border border-blue-100 dark:border-blue-800"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                    </svg>
                                    تصدير كشيت (XLSX)
                                </button>

                            </div>
                        </div>

                        {/* Users List */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50 dark:bg-gray-700/30">
                                <h3 className="font-bold text-gray-800 dark:text-white">قائمة العملاء ({customers.length})</h3>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-bold text-gray-400">تصفية حسب:</label>
                                    <select
                                        className="text-xs p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'all') {
                                                refreshData(); // Should reload all
                                            } else {
                                                db.getCustomers().then(all => {
                                                    setCustomers(all.filter(c => c.systemType === val));
                                                });
                                            }
                                        }}
                                    >
                                        <option value="all">كل البرامج</option>
                                        <option value="e-Stock Pharmacy">e-Stock Pharmacy</option>
                                        <option value="e-Stock Retail">e-Stock Retail</option>
                                        <option value="Pharma Store">Pharma Store</option>
                                    </select>
                                </div>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto">
                                <table className="w-full text-right">
                                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-medium uppercase sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-6 py-3">الاسم</th>
                                            <th className="px-6 py-3">رقم التعاقد</th>
                                            <th className="px-6 py-3">نوع البرنامج</th>
                                            <th className="px-6 py-3">تاريخ الإضافة</th>
                                            <th className="px-6 py-3">الحالة</th>
                                            <th className="px-6 py-3">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {customers.length > 0 ? customers.map((c) => (
                                            <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{c.name}</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono">{c.contractNumber}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                                                        c.systemType === 'e-Stock Pharmacy' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' :
                                                        c.systemType === 'e-Stock Retail' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300' :
                                                        'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'
                                                    }`}>
                                                        {c.systemType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">{new Date(c.createdAt).toLocaleDateString('ar-EG')}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                        {c.isActive ? 'نشط' : 'موقوف'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEditCustomer(c)}
                                                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                                        title="تعديل البيانات"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(c)}
                                                        className={`p-1.5 rounded-lg transition-colors ${c.isActive ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30' : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30'}`}
                                                        title={c.isActive ? 'إيقاف الحساب' : 'تنشيط الحساب'}
                                                    >
                                                        {c.isActive ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                                                            </svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCustomer(c.id, c.name)}
                                                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                                        title="حذف نهائي"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                    لا يوجد عملاء مسجلين حالياً.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Editing Customer Modal */}
            {editingCustomer && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className={`w-full max-w-md p-6 rounded-2xl shadow-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-900'} animate-in zoom-in-95`}>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                             ✏️ تعديل بيانات العميل
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">الاسم</label>
                                <input
                                    type="text"
                                    value={editingCustomer.name}
                                    onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">رقم التعاقد</label>
                                <input
                                    type="text"
                                    value={editingCustomer.contractNumber}
                                    onChange={(e) => setEditingCustomer({ ...editingCustomer, contractNumber: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">نوع النظام</label>
                                <select
                                    value={editingCustomer.systemType}
                                    onChange={(e) => setEditingCustomer({ ...editingCustomer, systemType: e.target.value as SystemType })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="e-Stock Pharmacy">e-Stock Pharmacy</option>
                                    <option value="e-Stock Retail">e-Stock Retail</option>
                                    <option value="Pharma Store">Pharma Store</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setEditingCustomer(null)}
                                className="flex-1 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleUpdateCustomer}
                                className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md transition-colors"
                            >
                                حفظ التعديلات
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Bot Modal */}
            {showTestBot && (
                <div className="fixed inset-0 z-[100] bg-black/60 p-4 md:p-12 flex justify-center items-center backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-lg h-[90vh] bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative flex flex-col border border-white/20">
                        <button 
                            onClick={() => setShowTestBot(false)} 
                            className="absolute top-4 left-4 z-50 w-10 h-10 bg-red-500 hover:bg-red-600 transition shadow-lg rounded-full text-white flex justify-center items-center font-bold text-xl"
                        >
                            ✕
                        </button>
                        <div className="h-full pointer-events-auto">
                            <BotInterface 
                                customer={{ 
                                    id: 'test_mode', 
                                    name: 'حساب تجريبي (التدريب)', 
                                    contractNumber: 'TEST', 
                                    systemType: activeSystemType, 
                                    isActive: true, 
                                    createdAt: Date.now() 
                                }} 
                                onSessionEnd={() => setShowTestBot(false)}
                                onAdminClick={() => {}}
                                onBack={() => setShowTestBot(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
            {/* Chunks Editor Modal */}
            {showChunksModal && (
                <div className="fixed inset-0 z-[110] bg-black/60 p-4 md:p-8 flex justify-center items-center backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-4xl h-[85vh] bg-gray-50 dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col border border-gray-200 dark:border-gray-800">
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                                <span>👓</span> محرر الذواكر الدقيق ({activeSystemType})
                            </h2>
                            <button 
                                onClick={() => setShowChunksModal(false)}
                                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center hover:bg-red-500 hover:text-white transition"
                            >
                                ✕
                            </button>
                        </div>
                        
                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                            {chunksToEdit.length === 0 ? (
                                <p className="text-center text-gray-500 dark:text-gray-400 mt-10">لا توجد فقرات محفوظة في ذاكرة هذا النظام.</p>
                            ) : (
                                chunksToEdit.map((chunk, idx) => (
                                    <div key={chunk.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-gray-400">فقرة #{idx + 1}</span>
                                            <div className="flex gap-2">
                                                {editingChunkId !== chunk.id ? (
                                                    <button 
                                                        onClick={() => { setEditingChunkId(chunk.id); setEditingChunkText(chunk.text); }}
                                                        className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-3 py-1 rounded"
                                                    >
                                                        تعديل
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={() => setEditingChunkId(null)}
                                                            className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 px-3 py-1 rounded"
                                                        >
                                                            إلغاء
                                                        </button>
                                                        <button 
                                                            onClick={handleSaveChunkEdit}
                                                            disabled={isSavingChunk}
                                                            className="text-xs bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 px-3 py-1 rounded font-bold"
                                                        >
                                                            {isSavingChunk ? 'يتم الترميز..' : 'حفظ'}
                                                        </button>
                                                    </>
                                                )}
                                                <button 
                                                    onClick={() => handleDeleteChunk(chunk.id)}
                                                    className="text-xs bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 px-3 py-1 rounded"
                                                >
                                                    حذف
                                                </button>
                                            </div>
                                        </div>
                                        {editingChunkId === chunk.id ? (
                                            <textarea 
                                                value={editingChunkText}
                                                onChange={(e) => setEditingChunkText(e.target.value)}
                                                className="w-full h-32 p-3 bg-gray-50 dark:bg-gray-700 border border-blue-300 dark:border-blue-600 rounded outline-none text-sm text-gray-800 dark:text-gray-200"
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{chunk.text}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
