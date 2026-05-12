
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { KBItem, ChatLog, Feedback, KnowledgeSnippet, Customer, SystemType } from '../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { GoogleGenAI } from '@google/genai';

interface AdminDashboardProps {
    isDarkMode?: boolean;
    toggleTheme?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ isDarkMode, toggleTheme }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Password Reset State
    const [isResetMode, setIsResetMode] = useState(false);
    const [resetKey, setResetKey] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetStatus, setResetStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const [activeTab, setActiveTab] = useState<'analytics' | 'history' | 'training' | 'customers'>('analytics');
    const [kbItems, setKbItems] = useState<KBItem[]>([]);
    const [logs, setLogs] = useState<ChatLog[]>([]);
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [docsLength, setDocsLength] = useState<number>(0);
    const [selectedSystemType, setSelectedSystemType] = useState<SystemType>('e-Stock Pharmacy');

    // Customer Management State
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
        name: '',
        contractNumber: '',
        systemType: 'e-Stock Pharmacy',
        isActive: true
    });
    const [searchQuery, setSearchQuery] = useState('');

    // Knowledge Snippet State
    const [snippets, setSnippets] = useState<KnowledgeSnippet[]>([]);
    const [snippetText, setSnippetText] = useState('');
    const [snippetImage, setSnippetImage] = useState<string | null>(null);
    const [snippetSystemType, setSnippetSystemType] = useState<SystemType | 'All'>('All');

    // PDF Upload State
    const [pdfUploading, setPdfUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [cloudStatus, setCloudStatus] = useState<'checking' | 'connected' | 'error'>('checking');
    const [cloudError, setCloudError] = useState<string | null>(null);

    const pdfInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isAuthenticated) {
            refreshData();
        }
    }, [isAuthenticated, activeTab, selectedSystemType]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const adminPass = await db.getAdminPassword();
        if (passwordInput === adminPass) {
            setIsAuthenticated(true);
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

    const refreshData = async () => {
        // Test connection
        const conn = await db.testCloudConnection();
        if (conn.success) {
            setCloudStatus('connected');
            setCloudError(null);
        } else {
            setCloudStatus('error');
            setCloudError(conn.error || 'Unknown error');
        }

        const kb = await db.getKB();
        const l = await db.getLogs();
        const f = await db.getFeedback();
        const dLen = await db.getDocLength(selectedSystemType);
        const s = await db.getSnippets(selectedSystemType === 'e-Stock Pharmacy' ? undefined : selectedSystemType); 
        // Note: getSnippets(undefined) returns all, we might want to filter or fetch based on tab.
        // For now, let's fetch customers too.
        const c = await db.getCustomers();

        setKbItems(kb);
        setLogs(l);
        setFeedback(f);
        setDocsLength(dLen);
        setSnippets(s);
        setCustomers(c);
    };

    const handleAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustomer.name || !newCustomer.contractNumber) return;

        const customer: Customer = {
            id: Date.now().toString(),
            name: newCustomer.name,
            contractNumber: newCustomer.contractNumber,
            systemType: newCustomer.systemType as SystemType,
            isActive: true,
            createdAt: Date.now()
        };

        await db.saveCustomer(customer);
        alert('تمت إضافة العميل بنجاح');
        setNewCustomer({ name: '', contractNumber: '', systemType: 'e-Stock Pharmacy', isActive: true });
        refreshData();
    };

    const toggleCustomerStatus = async (customer: Customer) => {
        const updated = { ...customer, isActive: !customer.isActive };
        await db.saveCustomer(updated);
        refreshData();
    };

    const handleDeleteCustomer = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
            await db.deleteCustomer(id);
            refreshData();
        }
    };

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

    const handleAddSnippet = async () => {
        if (!snippetText.trim()) return;

        const snippet: KnowledgeSnippet = {
            id: Date.now().toString(),
            content: snippetText,
            imageUrl: snippetImage || undefined,
            timestamp: Date.now(),
            systemType: snippetSystemType
        };

        await db.addSnippet(snippet);
        setSnippets([snippet, ...snippets]);
        setSnippetText('');
        setSnippetImage(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
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
            // 2. Word (.docx) Handler
            else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const mammoth = await import('mammoth');
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

            // --- AI Processing Step ---
            setUploadProgress('جاري فهم وتحليل المحتوى بواسطة الذكاء الاصطناعي...');

            if (!process.env.API_KEY) {
                throw new Error("مفتاح API غير موجود. لا يمكن تحليل الملف.");
            }

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, apiVersion: 'v1' });
            const model = ai.chats.create({ model: 'gemini-1.5-flash' });

            const analysisPrompt = `
            Act as a **Senior Knowledge Engineer** for "Modern Soft". Your task is to process the following raw documentation into a **High-Quality, Agent-Ready Knowledge Base**.

            **Goal:** Create a structured reference that allows a support bot to answer user questions instantly and accurately.

            **INSTRUCTIONS:**
            1.  **Language**: Output MUST be in **Egyptian Arabic (Technical Support Tone)**. Use terms like "دوس على"، "افتح قائمة"، "يا فندم".
            2.  **Structure**:
                *   **Main Title**: What is this file about?
                *   **Summary**: A 2-line overview.
                *   **Q&A Section (CRITICAL)**: Convert every piece of info into "User Question" -> "Detailed Answer". 
                    *   *Example*: 
                        *   Q: "ازاي اضيف صنف جديد؟"
                        *   A: "1. من القائمة الرئيسية اختر [المخازن]. 2. اضغط على..."
                *   **Troubleshooting**: If the text contains errors or problems, format them as "Problem" -> "Solution".
            3.  **Content Cleanup**: Ignore page numbers, headers, footers, and nonsense characters.
            4.  **Completeness**: Do not summarize away important details. Keep exact button names, shortcuts (e.g., F12), and values.

            **Raw Content from file (${file.name}):**
            ${textContent.substring(0, 50000)}
            `;

            const result = await model.sendMessage({ message: analysisPrompt });
            const processedContent = result.text;

            if (!processedContent) throw new Error("فشل الذكاء الاصطناعي في تحليل الملف.");

            // Append PROCESSED content to existing docs
            const currentDocs = await db.getDocs(selectedSystemType);
            const separator = currentDocs ? "\n\n================================\n" : "";
            const finalDocs = currentDocs + separator + `📚 **source:** ${file.name} (Processed by AI)\n` + processedContent;

            await db.saveDocs(finalDocs, selectedSystemType);
            setDocsLength(finalDocs.length);

            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 5000);

        } catch (error: any) {
            console.error("File Upload Error", error);
            setUploadError(`حدث خطأ أثناء المعالجة: ${error.message || 'خطأ غير معروف'}`);
        } finally {
            setPdfUploading(false);
            setUploadProgress('');
            if (pdfInputRef.current) pdfInputRef.current.value = '';
        }
    };

    const handleClearDocs = async () => {
        if (window.confirm('⚠️ تحذير: سيتم حذف جميع المعلومات (بما في ذلك الدليل الافتراضي للمخازن) ويصبح البوت "ورقة بيضاء". هل أنت متأكد؟')) {
            await db.resetDocs(selectedSystemType);
            setDocsLength(0);
            alert(`✅ تم حذف جميع معلومات ${selectedSystemType} بنجاح.`);
        }
    };

    const handleRestoreDefaults = async () => {
        if (window.confirm('هل تريد استعادة الدليل الأصلي (Modern Soft Default Manual)؟ سيتم حذف أي ملفات رفعتها.')) {
            const len = await db.restoreDefaults();
            setDocsLength(len);
            alert('✅ تم استعادة الدليل الافتراضي بنجاح.');
        }
    };

    const handleDownloadDocs = async () => {
        const currentDocs = await db.getDocs(selectedSystemType);
        // ... rest stays same, just ensuring we get everything
        const snippets = await db.getSnippets();

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

    // --- Analytics Logic ---
    const totalUsers = logs.length;
    const averageRating = feedback.length
        ? (feedback.reduce((acc, curr) => acc + curr.rating, 0) / feedback.length).toFixed(1)
        : '0';

    const logsByDate = logs.reduce((acc: any, log) => {
        const date = new Date(log.timestamp).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    const trendData = Object.keys(logsByDate).map(date => ({
        name: date,
        sessions: logsByDate[date]
    })).reverse().slice(0, 7);

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[500px] transition-colors">
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
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">لوحة التحكم</h1>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            {cloudStatus === 'checking' && (
                                <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></span>
                                    جاري فحص الاتصال بالسحابة...
                                </span>
                            )}
                            {cloudStatus === 'connected' && (
                                <span className="flex items-center gap-1 text-[10px] text-green-500 font-bold">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    متصل بالسحابة (مزامنة نشطة)
                                </span>
                            )}
                            {cloudStatus === 'error' && (
                                <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold group relative cursor-help">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                                    خطأ في المزامنة {cloudError === 'permission-denied' ? '(صلاحيات Firestore)' : ''}
                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-red-600 text-white text-[9px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                        يرجى التأكد من تفعيل Firestore في وحدة تحكم Firebase وضبط القواعد (Rules) للسماح بالقراءة والكتابة.
                                        الخطأ: {cloudError}
                                    </div>
                                </span>
                            )}
                        </div>
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
                        <button
                            onClick={() => setActiveTab('training')}
                            className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'training' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            تدريب البوت (المعرفة)
                        </button>
                        <button
                            onClick={() => setActiveTab('customers')}
                            className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'customers' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            تراخيص العملاء
                        </button>
                    </div>
                </div>
            </div>

            {/* System Type Selector (Contextual) */}
            {(activeTab === 'training' || activeTab === 'analytics') && (
                <div className="px-4 py-2 bg-blue-50/50 dark:bg-blue-900/20 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">النظام المختار:</span>
                        <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                            {(['e-Stock Pharmacy', 'e-Stock Retail', 'Pharma Store'] as SystemType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedSystemType(type)}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${selectedSystemType === type ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

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
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between h-32">
                                <h3 className="text-gray-400 dark:text-gray-500 font-medium text-xs uppercase tracking-wider">حجم المعرفة</h3>
                                <div className="flex items-end justify-between">
                                    <p className="text-3xl font-bold text-gray-800 dark:text-white">
                                        {(docsLength / 1024).toFixed(1)} <span className="text-lg text-gray-400 font-normal">ك.ب</span>
                                    </p>
                                    <span className="text-green-500 dark:text-green-400 text-xs font-bold bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">جاهز</span>
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

                {/* --- Training / Knowledge Management Section --- */}
                {activeTab === 'training' && (
                    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">

                        {/* 1. Quick Info Snippets (Highest Priority) */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-2 h-full bg-orange-500"></div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                                <span>⚡</span> تدريب سريع (أولوية قصوى)
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                استخدم هذا الجزء لتعليم البوت إجابات محددة، أو إضافة معلومات غير موجودة في الدليل، أو تصحيح معلومة خاطئة.
                                <br />
                                <span className="text-xs text-orange-600 dark:text-orange-400 font-bold">ملاحظة: المعلومات المضافة هنا لها الأولوية وتلغي ما في الدليل في حالة التعارض.</span>
                            </p>

                            <div className="space-y-3">
                                <textarea
                                    value={snippetText}
                                    onChange={e => setSnippetText(e.target.value)}
                                    placeholder="مثال: إذا سأل العميل عن سعر النسخة الجديدة، قل له 5000 جنيه بدلاً من 4000."
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 dark:text-gray-100 min-h-[100px] placeholder-gray-400 dark:placeholder-gray-500"
                                />

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
                                        onClick={handleAddSnippet}
                                        disabled={!snippetText.trim()}
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
                                    {snippets.map(snippet => (
                                        <div key={snippet.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600 flex gap-4 items-start group">
                                            {snippet.imageUrl && (
                                                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden flex-shrink-0 border border-gray-300 dark:border-gray-500">
                                                    <img src={snippet.imageUrl} alt="snippet" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <p className="text-gray-700 dark:text-gray-200 text-sm whitespace-pre-wrap">{snippet.content}</p>
                                                <span className="text-[10px] text-gray-400 mt-2 block">{new Date(snippet.timestamp).toLocaleDateString('ar-EG')}</span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteSnippet(snippet.id)}
                                                className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. Full Manual Upload (Base Knowledge) */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">الدليل الكامل (قاعدة المعرفة الأساسية)</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 max-w-md mx-auto leading-relaxed">
                                هذا الخيار يستخدم عند وجود تحديث كبير في النظام أو دليل مستخدم جديد بصيغة PDF. سيتم استبدال الدليل القديم بالكامل.
                            </p>

                            {/* Notifications */}
                            {uploadError && (
                                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium mb-4 text-center border border-red-100 dark:border-red-800 animate-in slide-in-from-top-2">
                                    {uploadError}
                                </div>
                            )}
                            {uploadSuccess && (
                                <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-4 rounded-xl text-sm font-medium mb-4 text-center border border-green-100 dark:border-green-800 animate-in slide-in-from-top-2">
                                    تم تحديث الدليل بنجاح!
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex flex-col gap-3">
                                    <input
                                        type="file"
                                        accept=".pdf,.docx,.txt,.xlsx,.xls,.csv"
                                        ref={pdfInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />

                                    {pdfUploading ? (
                                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden p-4">
                                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                <span>{uploadProgress}</span>
                                                <span className="animate-pulse">جاري المعالجة...</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                                                <div className="bg-blue-600 h-2 rounded-full animate-progress-indeterminate"></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => pdfInputRef.current?.click()}
                                            disabled={pdfUploading}
                                            className="w-full py-3 rounded-xl font-bold text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                                        >
                                            رفع ملف معرفة جديد (PDF, Excel, Word, Text)
                                        </button>
                                    )}
                                </div>
                            </div>

                            {docsLength > 0 && (
                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-800 dark:text-white">حالة الذاكرة الأساسية</p>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                            <p className="text-xs font-medium text-green-600 dark:text-green-400">
                                                {docsLength.toLocaleString()} حرف (محفوظ)
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleDownloadDocs}
                                            disabled={pdfUploading}
                                            className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                        >
                                            استخراج الداتا
                                        </button>
                                        <button
                                            onClick={handleRestoreDefaults}
                                            disabled={pdfUploading}
                                            className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors text-orange-500 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50"
                                        >
                                            استعادة الأصلي
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
                            )}
                        </div>
                    </div>
                )}

                {/* --- History Viewer Section --- */}
                {activeTab === 'history' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden animate-in fade-in duration-300">
                        {/* ... existing history code ... */}
                        <div className="p-4 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm">أحدث الجلسات</h3>
                            {/* ... Buttons ... */}
                            <div className="flex items-center gap-2">
                                <button onClick={handlePrintLogs} className="text-xs flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-lg font-semibold">طباعة / PDF</button>
                                <button onClick={handleExportLogs} className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg font-semibold">تصدير (CSV)</button>
                                <span className="text-xs text-gray-400 bg-white dark:bg-gray-700 px-2 py-1 rounded-md">{logs.length} المجموع</span>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-gray-700">
                            {logs.length > 0 ? logs.map(log => (
                                <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group cursor-pointer">
                                    {/* Log details */}
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">{new Date(log.timestamp).toLocaleDateString('ar-EG')}</span>
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">{log.clientName || 'زائر'}</span>
                                        </div>
                                        <span className="text-xs text-gray-400 font-mono" dir="ltr">{log.duration.toFixed(0)}s</span>
                                    </div>
                                    <div className="mb-1">
                                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">الملخص:</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{log.botResponse}</p>
                                    </div>
                                    <details className="group/details">
                                        <summary className="text-xs text-blue-500 cursor-pointer hover:underline list-none select-none">عرض التفاصيل...</summary>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded leading-relaxed whitespace-pre-wrap font-mono">{log.userQuery}</p>
                                    </details>
                                </div>
                            )) : (
                                <div className="p-12 text-center text-gray-400">لا توجد سجلات محادثات حتى الآن.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- Customer Management Section --- */}
                {activeTab === 'customers' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* 1. Add New Customer */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">إضافة عميل جديد (منح ترخيص)</h3>
                            <form onSubmit={handleAddCustomer} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input
                                    type="text"
                                    placeholder="اسم الصيدلية / العميل"
                                    value={newCustomer.name}
                                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                    className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 dark:text-gray-100"
                                />
                                <input
                                    type="text"
                                    placeholder="رقم العقد / الكود"
                                    value={newCustomer.contractNumber}
                                    onChange={e => setNewCustomer({ ...newCustomer, contractNumber: e.target.value })}
                                    className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 dark:text-gray-100"
                                />
                                <select
                                    value={newCustomer.systemType}
                                    onChange={e => setNewCustomer({ ...newCustomer, systemType: e.target.value as SystemType })}
                                    className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 dark:text-gray-100"
                                >
                                    <option value="e-Stock Pharmacy">e-Stock Pharmacy</option>
                                    <option value="e-Stock Retail">e-Stock Retail</option>
                                    <option value="Pharma Store">Pharma Store</option>
                                </select>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md"
                                >
                                    إضافة العميل
                                </button>
                            </form>
                        </div>

                        {/* 2. Customer List */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 flex justify-between items-center">
                                <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm">قائمة العملاء النشطين</h3>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="text"
                                        placeholder="بحث بالاسم أو رقم العقد..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="text-xs p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg w-64 outline-none focus:ring-1 focus:ring-blue-400"
                                    />
                                    <button 
                                        onClick={() => {
                                            const exportData = customers.map(c => ({
                                                'الاسم': c.name,
                                                'رقم العقد': c.contractNumber,
                                                'نوع النظام': c.systemType,
                                                'الحالة': c.isActive ? 'نشط' : 'معطل',
                                                'تاريخ الإضافة': new Date(c.createdAt).toLocaleDateString('ar-EG')
                                            }));
                                            downloadCSV(exportData, `customers_list_${new Date().toISOString().slice(0,10)}.csv`);
                                        }}
                                        className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg font-semibold"
                                    >
                                        تصدير (CSV)
                                    </button>
                                    <button 
                                        onClick={refreshData}
                                        className="text-xs flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-lg font-semibold"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                        </svg>
                                        مزامنة الآن
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                            <th className="p-4 font-bold">الاسم</th>
                                            <th className="p-4 font-bold">رقم العقد</th>
                                            <th className="p-4 font-bold">نوع النظام</th>
                                            <th className="p-4 font-bold">الحالة</th>
                                            <th className="p-4 font-bold">تاريخ الإضافة</th>
                                            <th className="p-4 font-bold">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                        {customers
                                            .filter(c => c.name.includes(searchQuery) || c.contractNumber.includes(searchQuery))
                                            .map(customer => (
                                            <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                                <td className="p-4 font-bold text-gray-800 dark:text-gray-200">{customer.name}</td>
                                                <td className="p-4 font-mono text-xs">{customer.contractNumber}</td>
                                                <td className="p-4">
                                                    <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                                                        {customer.systemType}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <button 
                                                        onClick={() => toggleCustomerStatus(customer)}
                                                        className={`px-3 py-1 rounded-full text-[10px] font-bold ${customer.isActive ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}
                                                    >
                                                        {customer.isActive ? 'نشط' : 'معطل'}
                                                    </button>
                                                </td>
                                                <td className="p-4 text-xs text-gray-400">{new Date(customer.createdAt).toLocaleDateString('ar-EG')}</td>
                                                <td className="p-4">
                                                    <button 
                                                        onClick={() => handleDeleteCustomer(customer.id)}
                                                        className="text-red-400 hover:text-red-600 transition"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {customers.length === 0 && (
                                    <div className="p-12 text-center text-gray-400">لا يوجد عملاء مضافين حالياً.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminDashboard;
