import React, { useMemo, useState, useEffect } from 'react';
import { 
    Users, AlertTriangle, Trophy, FileText, 
    TrendingUp, Activity, Calendar, Clock, 
    ArrowRight, PlusCircle, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GuruDashboard = ({ students = [], pointLogs = [], journals = [], user, settings }) => {
    const navigate = useNavigate();
    
    // --- LOGIKA WAKTU DINAMIS (GREETING) ---
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const updateGreeting = () => {
            const hour = new Date().getHours();
            if (hour >= 4 && hour < 11) {
                setGreeting('Selamat Pagi');
            } else if (hour >= 11 && hour < 15) {
                setGreeting('Selamat Siang');
            } else if (hour >= 15 && hour < 18) {
                setGreeting('Selamat Sore');
            } else {
                setGreeting('Selamat Malam');
            }
        };
        updateGreeting();
    }, []);

    // --- PENGOLAHAN DATA STATISTIK ---
    const stats = useMemo(() => {
        const totalStudents = students.length;
        
        const violations = pointLogs.filter(p => p.type === 'violation');
        const achievements = pointLogs.filter(p => p.type === 'achievement');
        
        const troubledStudents = students.filter(s => {
            const pts = pointLogs.filter(p => p.studentId === s.id && p.type === 'violation')
                                 .reduce((a, b) => a + parseInt(b.value || 0), 0);
            return pts > 0;
        }).length;

        const todayStr = new Date().toISOString().split('T')[0];
        const todayJournals = journals.filter(j => j.date === todayStr).length;

        return {
            totalStudents,
            totalViolations: violations.length,
            totalAchievements: achievements.length,
            troubledStudents,
            todayJournals
        };
    }, [students, pointLogs, journals]);

    // --- TOP 5 SISWA PELANGGARAN ---
    const topViolators = useMemo(() => {
        return students.map(s => {
            const vPoints = pointLogs
                .filter(p => p.studentId === s.id && p.type === 'violation')
                .reduce((a, b) => a + parseInt(b.value || 0), 0);
            const aPoints = pointLogs
                .filter(p => p.studentId === s.id && p.type === 'achievement')
                .reduce((a, b) => a + parseInt(b.value || 0), 0);
            return { ...s, netPoints: vPoints - aPoints, vPoints };
        })
        .filter(s => s.netPoints > 0)
        .sort((a, b) => b.netPoints - a.netPoints)
        .slice(0, 5);
    }, [students, pointLogs]);

    // --- STATISTIK PER KELAS ---
    const classStats = useMemo(() => {
        const classes = {};
        pointLogs.filter(p => p.type === 'violation').forEach(log => {
            const student = students.find(s => s.id === log.studentId);
            if (student && student.class) {
                classes[student.class] = (classes[student.class] || 0) + 1;
            }
        });
        
        return Object.entries(classes)
            .map(([cls, count]) => ({ cls, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); 
    }, [pointLogs, students]);

    // --- AKTIVITAS TERBARU (DIPERBAIKI) ---
    const recentActivities = useMemo(() => {
        // Ambil 5 log terakhir, balik urutan biar yang baru di atas
        const logs = pointLogs.slice(-5).reverse().map(l => {
            // 1. Cari Nama Siswa dari data students berdasarkan ID (Biar aman dari undefined)
            const student = students.find(s => s.id === l.studentId);
            const studentName = student ? student.name : (l.studentName || 'Siswa Tidak Dikenal');

            // 2. Ambil Deskripsi (Cek 'description' dulu, baru 'desc', lalu default strip)
            const description = l.description || l.desc || '-';

            // 3. Format Tanggal (Opsional: biar 'Baru saja' jadi tanggal asli)
            // const time = new Date(l.date).toLocaleDateString('id-ID'); 
            
            return {
                type: l.type === 'violation' ? 'violation' : 'achievement',
                title: l.type === 'violation' ? 'Pelanggaran Dicatat' : 'Prestasi Dicatat',
                // Gabungkan Nama dan Deskripsi yang sudah dipastikan ada isinya
                desc: `${studentName} - ${description}`,
                time: 'Baru saja', // Bisa diganti variabel time di atas jika mau tanggal
                icon: l.type === 'violation' ? AlertTriangle : Trophy,
                color: l.type === 'violation' ? 'text-red-500 bg-red-50' : 'text-green-500 bg-green-50'
            };
        });
        return logs;
    }, [pointLogs, students]);

    return (
        <div className="p-4 md:p-8 space-y-8 bg-slate-50 min-h-screen pb-20 animate-in fade-in">
            
            {/* WELCOME SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        {greeting}, {user?.fullName || 'Guru BK'} 👋
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Berikut adalah ringkasan aktivitas konseling saat ini.
                    </p>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-sm font-bold text-slate-700">
                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="text-xs text-slate-400">
                        Tahun Ajaran {settings?.academicYear || '...'} - Semester {settings?.semester || '...'}
                    </div>
                </div>
            </div>

            {/* QUICK STATS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                    title="Total Siswa" 
                    value={stats.totalStudents} 
                    icon={Users} 
                    color="blue"
                    desc="Data Terdaftar"
                />
                <StatCard 
                    title="Siswa Bermasalah" 
                    value={stats.troubledStudents} 
                    icon={AlertTriangle} 
                    color="orange" 
                    desc="Memiliki Poin > 0"
                />
                <StatCard 
                    title="Total Prestasi" 
                    value={stats.totalAchievements} 
                    icon={Trophy} 
                    color="green" 
                    desc="Tercatat Sistem"
                />
                <StatCard 
                    title="Jurnal Hari Ini" 
                    value={stats.todayJournals} 
                    icon={FileText} 
                    color="purple" 
                    desc="Agenda Konseling"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN (2/3 width) */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* QUICK ACTIONS */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Activity size={18} className="text-blue-600"/> Akses Cepat
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <QuickActionBtn 
                                icon={PlusCircle} label="Input Pelanggaran" 
                                color="bg-red-50 text-red-600 hover:bg-red-100" 
                                onClick={() => navigate('/points')}
                            />
                            <QuickActionBtn 
                                icon={Trophy} label="Input Prestasi" 
                                color="bg-green-50 text-green-600 hover:bg-green-100" 
                                onClick={() => navigate('/points')}
                            />
                            <QuickActionBtn 
                                icon={FileText} label="Tulis Jurnal" 
                                color="bg-purple-50 text-purple-600 hover:bg-purple-100" 
                                onClick={() => navigate('/journal')}
                            />
                            <QuickActionBtn 
                                icon={Search} label="Cari Siswa" 
                                color="bg-blue-50 text-blue-600 hover:bg-blue-100" 
                                onClick={() => navigate('/students')}
                            />
                        </div>
                    </div>

                    {/* TOP VIOLATORS TABLE */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-red-500"/> Siswa Perlu Perhatian
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">Top 5 siswa dengan akumulasi poin tertinggi</p>
                            </div>
                            
                            {/* TOMBOL LIHAT SEMUA MENGARAH KE BUKU SANKSI */}
                            <button 
                                onClick={() => navigate('/sanction-book')}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                Lihat Semua <ArrowRight size={14}/>
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="px-6 py-3">Nama Siswa</th>
                                        <th className="px-6 py-3">Kelas</th>
                                        <th className="px-6 py-3 text-center">Poin</th>
                                        <th className="px-6 py-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {topViolators.length > 0 ? (
                                        topViolators.map((s, idx) => (
                                            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-700">{s.name}</div>
                                                    <div className="text-xs text-slate-400">NISN: {s.nisn || '-'}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-slate-600">{s.class}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-black">
                                                        {s.netPoints}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {idx === 0 ? (
                                                        <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">Prioritas 1</span>
                                                    ) : (
                                                        <span className="text-[10px] uppercase font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">Pantau</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-slate-400 text-sm">
                                                Belum ada data pelanggaran yang signifikan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN (1/3 width) */}
                <div className="space-y-8">
                    
                    {/* KELAS TERBANYAK */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider">Sebaran Pelanggaran</h3>
                        <div className="space-y-4">
                            {classStats.length > 0 ? classStats.map((item, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                                        <span>Kelas {item.cls}</span>
                                        <span>{item.count} Kasus</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className="bg-blue-500 h-2 rounded-full" 
                                            style={{ width: `${(item.count / classStats[0].count) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs text-slate-400 text-center py-4">Data belum cukup untuk analisis</p>
                            )}
                        </div>
                    </div>

                    {/* RECENT ACTIVITY */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                            <Clock size={16}/> Aktivitas Terkini
                        </h3>
                        <div className="space-y-4">
                            {recentActivities.length > 0 ? recentActivities.map((act, idx) => (
                                <div key={idx} className="flex gap-3 items-start">
                                    <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${act.color}`}>
                                        <act.icon size={14}/>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700 leading-tight">{act.title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{act.desc}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">{act.time}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs text-slate-400 text-center py-4">Belum ada aktivitas baru</p>
                            )}
                        </div>
                    </div>

                    {/* UPCOMING AGENDA */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-blue-100 mb-1 flex items-center gap-2">
                                <Calendar size={16}/> Agenda BK
                            </h3>
                            <p className="text-2xl font-bold mt-2">Rapat Evaluasi</p>
                            <p className="text-sm text-blue-200 mt-1">Senin, 08:00 WITA</p>
                            <button className="mt-4 bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors backdrop-blur-sm">
                                Tambah Agenda
                            </button>
                        </div>
                        <Calendar size={120} className="absolute -bottom-6 -right-6 text-white/10 rotate-12"/>
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, icon: Icon, color, desc }) => {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600",
        orange: "bg-orange-50 text-orange-600",
        green: "bg-green-50 text-green-600",
        purple: "bg-purple-50 text-purple-600",
    };

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-2">
                <div className={`p-3 rounded-xl ${colorClasses[color]} group-hover:scale-110 transition-transform`}>
                    <Icon size={22} />
                </div>
            </div>
            <div>
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
                <div className="text-2xl font-black text-slate-800">{value}</div>
                <p className="text-[10px] text-slate-400 mt-1">{desc}</p>
            </div>
        </div>
    );
};

const QuickActionBtn = ({ icon: Icon, label, color, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-4 rounded-xl gap-2 transition-all ${color} h-28 border border-transparent hover:border-current hover:shadow-sm`}
    >
        <Icon size={28} />
        <span className="text-xs font-bold text-center leading-tight">{label}</span>
    </button>
);

export default GuruDashboard;