import React, { useState } from 'react';
import { Shield, Edit, Trash2, PlusCircle, User, Key, Clock, Calendar } from 'lucide-react'; 
import { addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getCollectionRef } from '../../common/config/firebase';
import { COLLECTION_PATHS, ACCESS_OPTIONS } from '../../common/utils/constants'; // Pastikan ACCESS_OPTIONS ada
import { generateCredentials, calculateExpiry } from '../../common/utils/helpers';

const AdminUserManagement = ({ users }) => {
    // State form kembali memuat 'duration'
    const [form, setForm] = useState({ username: '', password: '', fullName: '', duration: 30 });
    const [editingId, setEditingId] = useState(null);
    
    // Auto-generate credentials saat nama diketik
    const handleNameChange = (val) => {
        const newData = { ...form, fullName: val };
        if (!editingId && val.length > 3) {
            const creds = generateCredentials(val);
            newData.username = creds.username;
            newData.password = creds.password;
        }
        setForm(newData);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        if(!form.username || !form.password || !form.fullName) return alert("Mohon lengkapi data utama!");
        
        // Hitung tanggal kadaluarsa berdasarkan durasi yang dipilih
        const expiryDate = calculateExpiry(form.duration);

        const userData = {
            fullName: form.fullName,
            username: form.username,
            password: form.password,
            role: 'guru',
            accessExpiry: expiryDate, // Simpan tanggal expired
            updatedAt: new Date().toISOString()
        };

        try {
            if (editingId) {
                // Saat edit, kita update data (termasuk memperpanjang masa aktif jika durasi diubah)
                await updateDoc(doc(getCollectionRef(COLLECTION_PATHS.users), editingId), userData);
                alert("Data & Masa Aktif Guru berhasil diperbarui.");
            } else {
                if(users.some(u => u.username === form.username)) return alert("Username sudah digunakan!");
                await addDoc(getCollectionRef(COLLECTION_PATHS.users), { ...userData, createdAt: new Date().toISOString() });
                alert("Guru BK baru berhasil ditambahkan.");
            }
            resetForm();
        } catch (error) { alert("Gagal menyimpan data."); }
    };

    const handleEdit = (user) => {
        setEditingId(user.id);
        setForm({
            fullName: user.fullName,
            username: user.username,
            password: user.password,
            duration: 30 // Default ke 1 bulan saat edit (untuk opsi perpanjangan)
        });
    };

    const handleDelete = async (id) => {
        if(confirm("Yakin hapus akun ini? Semua data terkait guru ini mungkin akan hilang aksesnya.")) {
            await deleteDoc(doc(getCollectionRef(COLLECTION_PATHS.users), id));
        }
    };

    const resetForm = () => {
        setForm({ username: '', password: '', fullName: '', duration: 30 });
        setEditingId(null);
    };

    // Helper untuk menampilkan status sisa hari di tabel
    const getStatusLabel = (expiryDate) => {
        if (!expiryDate) return { text: 'PERMANEN', color: 'bg-blue-100 text-blue-700' };
        
        const now = new Date();
        const exp = new Date(expiryDate);
        const diffTime = exp - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays < 0) return { text: 'EXPIRED', color: 'bg-red-100 text-red-700' };
        return { text: `${diffDays} HARI LAGI`, color: 'bg-green-100 text-green-700' };
    };

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Shield size={24}/> Manajemen Akun Guru BK</h2>
            <p className="text-slate-500 -mt-4 text-sm">Kelola akses login dan masa aktif penggunaan aplikasi.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* FORM INPUT */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit border-t-4 border-t-blue-600">
                    <h3 className="font-bold text-slate-800 mb-4">{editingId ? 'Edit Akses Guru' : 'Buat Akun Baru'}</h3>
                    <form onSubmit={handleSaveUser} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><User size={12}/> Nama Lengkap</label>
                            <input 
                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                                value={form.fullName} 
                                onChange={(e) => handleNameChange(e.target.value)} 
                                placeholder="Contoh: Budi Santoso, S.Pd" 
                                required 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Shield size={12}/> Username</label>
                                <input 
                                    className="w-full p-2.5 border rounded-lg bg-slate-50 font-mono text-sm focus:bg-white transition-colors" 
                                    value={form.username} 
                                    onChange={e=>setForm({...form, username: e.target.value})} 
                                    placeholder="user123"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Key size={12}/> Password</label>
                                <input 
                                    className="w-full p-2.5 border rounded-lg bg-slate-50 font-mono text-sm focus:bg-white transition-colors" 
                                    value={form.password} 
                                    onChange={e=>setForm({...form, password: e.target.value})} 
                                    placeholder="pass123"
                                    required
                                />
                            </div>
                        </div>

                        {/* INPUT DURASI AKSES (DIKEMBALIKAN) */}
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                            <label className="block text-xs font-bold text-orange-800 mb-1 flex items-center gap-1"><Clock size={12}/> Masa Aktif Akun</label>
                            <select 
                                className="w-full p-2.5 border border-orange-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-orange-400 outline-none" 
                                value={form.duration} 
                                onChange={e=>setForm({...form, duration: e.target.value})}
                            >
                                {ACCESS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-orange-600 mt-1 italic">
                                *Pilih durasi untuk memperpanjang atau mengatur ulang masa aktif.
                            </p>
                        </div>

                        <div className="flex gap-2 pt-2">
                            {editingId && (
                                <button type="button" onClick={resetForm} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200">
                                    Batal
                                </button>
                            )}
                            <button className={`flex-1 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-lg transition-transform active:scale-95 ${editingId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                {editingId ? <><Edit size={18}/> Simpan & Perpanjang</> : <><PlusCircle size={18}/> Buat Akun</>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* TABLE LIST GURU */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                        <span className="font-bold text-slate-700 uppercase text-xs tracking-wider">Daftar Akun Terdaftar</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{users.filter(u => u.role === 'guru').length} Guru</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                                <tr>
                                    <th className="p-4">Nama Guru</th>
                                    <th className="p-4">Login</th>
                                    <th className="p-4">Status Aktif</th>
                                    <th className="p-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.filter(u => u.role === 'guru').map(u => {
                                    const status = getStatusLabel(u.accessExpiry);
                                    return (
                                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-700">{u.fullName}</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">ID: {u.id}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-mono text-xs text-slate-600">
                                                    <div className="flex items-center gap-1">U: <span className="font-bold">{u.username}</span></div>
                                                    <div className="flex items-center gap-1">P: <span className="font-bold">{u.password}</span></div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${status.color}`}>
                                                    {status.text}
                                                </span>
                                                {u.accessExpiry && (
                                                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                                        <Calendar size={10}/> {new Date(u.accessExpiry).toLocaleDateString('id-ID')}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex justify-center gap-1">
                                                    <button onClick={() => handleEdit(u)} className="text-blue-500 hover:bg-blue-50 p-2 rounded transition-colors" title="Edit / Perpanjang">
                                                        <Edit size={16}/>
                                                    </button>
                                                    <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors" title="Hapus Akun">
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {users.filter(u => u.role === 'guru').length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-slate-400 italic">Belum ada akun guru yang dibuat.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUserManagement;