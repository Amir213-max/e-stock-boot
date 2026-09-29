import React, { useState, useRef } from 'react';
import { Customer, SystemType } from '../types';
import { db } from '../services/db';

interface CustomersTabProps {
    customers: Customer[];
    setCustomers: (c: Customer[]) => void;
    sessionTimeout: number;
    setSessionTimeout: (v: number) => void;
    refreshData: () => void;
    isDarkMode: boolean;
}

export default function CustomersTab({
    customers,
    setCustomers,
    sessionTimeout,
    setSessionTimeout,
    refreshData,
    isDarkMode
}: CustomersTabProps) {
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerContract, setNewCustomerContract] = useState('');
    const [newCustomerSystemType, setNewCustomerSystemType] = useState<SystemType>('e-Stock Pharmacy');
    const excelInputRef = useRef<HTMLInputElement>(null);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

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

            const newCusts: Customer[] = [];

            for (let i = 0; i < jsonData.length; i++) {
                const row: any = jsonData[i];
                if (Array.isArray(row) && row.length >= 2) {
                    const name = row[0]?.toString().trim();
                    const contract = row[1]?.toString().trim();

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

    return (
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
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        لا يوجد عملاء مسجلين حالياً.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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
        </div>
    );
}
