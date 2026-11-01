// src/pages/Login.jsx
import React, { useState } from 'react';
import { BookOpen, Users, Key, UserCheck, AlertTriangle } from 'lucide-react';

const Login = ({ onLogin, loading, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-200 p-4" style={{
            backgroundImage: `linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)`
        }}>
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-blue-600 animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-8">
                    <div className="h-20 w-20 bg-blue-600 rounded-full mx-auto flex items-center justify-center shadow-lg mb-4">
                        <BookOpen size={40} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold uppercase text-blue-900 tracking-wider">SIBKO LOGIN</h1>
                    <p className="text-sm font-semibold text-slate-500 uppercase">Sistem Informasi Bimbingan Konseling</p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm flex items-center gap-2">
                        <AlertTriangle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Users size={18} />
                            </div>
                            <input 
                                className="w-full pl-10 p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                                value={username} 
                                onChange={e => setUsername(e.target.value)} 
                                placeholder="Masukkan Username" 
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Key size={18} />
                            </div>
                            <input 
                                type="password" 
                                className="w-full pl-10 p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                placeholder="Masukkan Password" 
                                required
                            />
                        </div>
                    </div>
                    <button 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded shadow-lg transition-transform transform hover:scale-105 active:scale-95 disabled:bg-slate-400 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {loading ? 'Memuat...' : <><UserCheck size={20} /> MASUK APLIKASI</>}
                    </button>
                </form>
                <div className="mt-8 text-center text-xs text-gray-400 border-t pt-4">
                    &copy; {new Date().getFullYear()} Layanan Bimbingan Konseling Digital
                </div>
            </div>
        </div>
    );
};

export default Login;