import React, { useState } from 'react';
import { 
    Save, Key, User, Shield, Calendar, 
    Lock, CheckCircle, AlertTriangle, UserCog 
} from 'lucide-react';
import { formatIndoDate } from '../../common/utils/helpers';

const AccountSettings = ({ user, onUpdatePassword }) => {
    const [password, setPassword] = useState(user.password || '');
    const [fullName, setFullName] = useState(user.fullName || '');

    const handleSave = (e) => {
        e.preventDefault();
        if(confirm("Apakah Anda yakin ingin menyimpan perubahan pada akun ini?")) {
            onUpdatePassword({ id: user.id, password, fullName });
        }
    }

    // Helper untuk status akun
    const isExpired = user.accessExpiry && new Date(user.accessExpiry) < new Date();
    const expiryDate = user.accessExpiry ? formatIndoDate(user.accessExpiry) : 'Permanen (Full Time)';

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* HEADER: Sticky seperti Pengaturan Sekolah */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm flex-shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <UserCog className="text-blue-600" /> Profil & Akun Saya
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 hidden md:block">Kelola informasi pribadi dan keamanan login akun Anda.</p>
                </div>
                <button 
                    onClick={handleSave} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 text-sm md:text-base"
                >
                    <Save size={18}/> <span className="hidden md:inline">Simpan Perubahan</span><span className="md:hidden">Simpan</span>
                </button>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* KOLOM KIRI: KARTU PROFIL VISUAL */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-center relative group">
                            <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                            <div className="absolute top-12 left-1/2 transform -translate-x-1/2">
                                <div className="w-24 h-24 bg-white p-1.5 rounded-full shadow-lg">
                                    <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-3xl uppercase">
                                        {user.fullName?.charAt(0) || 'U'}
                                    </div>
                                </div>
                            </div>
                            <div className="pt-16 pb-6 px-4">
                                <h2 className="text-lg font-bold text-slate-800">{user.fullName}</h2>
                                <div className="flex justify-center items-center gap-1.5 mt-1">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {user.role === 'admin' ? 'Administrator' : 'Guru BK'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* STATUS CARD (Khusus Guru) */}
                        {user.role === 'guru' && (
                            <div className={`rounded-xl border p-4 flex flex-col gap-3 ${isExpired ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${isExpired ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {isExpired ? <AlertTriangle size={20}/> : <CheckCircle size={20}/>}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Status Akun</p>
                                        <p className={`font-bold ${isExpired ? 'text-red-700' : 'text-green-700'}`}>
                                            {isExpired ? 'Masa Aktif Habis' : 'Akun Aktif'}
                                        </p>
                                    </div>
                                </div>
                                <div className="border-t border-dashed border-slate-300 pt-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 flex items-center gap-1"><Calendar size={14}/> Berlaku Sampai:</span>
                                        <span className="font-mono font-bold text-slate-700">{expiryDate}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* KOLOM KANAN: FORM EDIT */}
                    <div className="md:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
                            <h3 className="font-bold text-lg text-slate-800 border-b pb-4 mb-6 flex items-center gap-2">
                                <Shield size={20} className="text-blue-500"/> Informasi Login
                            </h3>
                            
                            <form onSubmit={handleSave} className="space-y-6">
                                {/* Nama Lengkap */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-slate-700">Nama Lengkap</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <User size={18} />
                                        </div>
                                        <input 
                                            className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                                            value={fullName} 
                                            onChange={e=>setFullName(e.target.value)} 
                                            placeholder="Nama Lengkap Anda"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-400">Nama ini akan muncul pada laporan dan dokumen cetak.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Username (Disabled) */}
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                                            Username <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border">(Permanen)</span>
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                <Lock size={18} />
                                            </div>
                                            <input 
                                                className="w-full pl-10 p-3 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg font-mono cursor-not-allowed" 
                                                value={user.username} 
                                                disabled 
                                            />
                                            {/* Tooltip sederhana */}
                                            <div className="absolute hidden group-hover:block bottom-full left-0 mb-2 w-max px-2 py-1 bg-black text-white text-xs rounded shadow-lg">
                                                Username tidak dapat diubah
                                            </div>
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-slate-700">Password Baru</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                <Key size={18} />
                                            </div>
                                            <input 
                                                className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                                                value={password} 
                                                onChange={e=>setPassword(e.target.value)} 
                                                placeholder="Masukkan password baru"
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-400">Gunakan kombinasi yang aman. Biarkan sama jika tidak ingin mengubah.</p>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
export default AccountSettings;