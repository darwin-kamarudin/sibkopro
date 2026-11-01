import React from 'react';
import { Users, FileText } from 'lucide-react';

const AdminDashboard = ({ users, studentsCount, journalsCount }) => {
    return (
        <div className="p-6 space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold text-slate-800">Dashboard Administrator</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-blue-100 text-blue-600 rounded-full"><Users size={32}/></div>
                    <div>
                        <p className="text-sm text-slate-500 font-bold uppercase">Total Guru BK</p>
                        <p className="text-3xl font-extrabold text-slate-800">{users.filter(u => u.role === 'guru').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-green-100 text-green-600 rounded-full"><Users size={32}/></div>
                    <div>
                        <p className="text-sm text-slate-500 font-bold uppercase">Total Siswa Terdata</p>
                        <p className="text-3xl font-extrabold text-slate-800">{studentsCount}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-purple-100 text-purple-600 rounded-full"><FileText size={32}/></div>
                    <div>
                        <p className="text-sm text-slate-500 font-bold uppercase">Total Jurnal Aktivitas</p>
                        <p className="text-3xl font-extrabold text-slate-800">{journalsCount}</p>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded shadow-sm">
                <h3 className="font-bold text-blue-800 mb-2">Informasi Sistem</h3>
                <p className="text-sm text-blue-700">Sebagai Admin, Anda memiliki akses untuk mengelola akun pengguna (Guru BK) dan mengubah password Admin sendiri. Anda dapat mengatur masa aktif akun guru (trial/full time).</p>
            </div>
        </div>
    );
};

export default AdminDashboard;