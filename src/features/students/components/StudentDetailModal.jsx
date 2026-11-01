import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // <-- 1. IMPORT PORTAL
import { 
    X, AlertOctagon, CheckCircle, Gavel, Activity, BookOpen, 
    UserCheck, User, Calendar, Phone, MapPin, GripVertical, 
    GraduationCap, Briefcase, Heart, ShieldAlert, Navigation,
    AlertTriangle, Trophy, ChevronDown, ChevronUp, Image as ImageIcon
} from 'lucide-react';

const StudentDetailModal = ({ 
    student, 
    journals = [], 
    pointLogs = [], 
    sanctionRules = [], 
    onClose 
}) => {
    const [width, setWidth] = useState(500); 
    const [isResizing, setIsResizing] = useState(false);

    // STATE UNTUK ACCORDION (AUTO TERSEMBUNYI = false)
    const [showViolations, setShowViolations] = useState(false);
    const [showAchievements, setShowAchievements] = useState(false);
    const [showJournals, setShowJournals] = useState(false);

    // ==========================================
    // LOGIKA PEMBACAAN DATA Poin (Prestasi & Pelanggaran)
    // ==========================================
    const studentPoints = pointLogs.filter(p => p.studentId === student.id);
    
    const studentViolations = studentPoints
        .filter(p => p.type === 'violation' || p.type === 'PELANGGARAN')
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const studentAchievements = studentPoints
        .filter(p => p.type === 'achievement' || p.type === 'PRESTASI')
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalPelanggaran = studentViolations.reduce((acc, curr) => acc + Number(curr.value || curr.point || 0), 0);
    const totalPrestasi = studentAchievements.reduce((acc, curr) => acc + Number(curr.value || curr.point || 0), 0);
    const netScore = totalPrestasi - totalPelanggaran;

    const activeSanction = sanctionRules
        .filter(rule => totalPelanggaran >= rule.minPoint && totalPelanggaran <= rule.maxPoint)
        .sort((a, b) => b.minPoint - a.minPoint)[0];

    // ==========================================
    // LOGIKA PEMBACAAN DATA Bimbingan (Journals)
    // ==========================================
    const studentJournals = journals
        .filter(item => item.studentId === student.id || item.studentName === student.name)
        .sort((a, b) => new Date(b.date) - new Date(a.date));


    // ==========================================
    // HELPER RESIZE & FORMAT TANGGAL
    // ==========================================
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            const newWidth = document.body.clientWidth - e.clientX;
            if (newWidth >= 380 && newWidth <= 900) setWidth(newWidth);
        };
        const handleMouseUp = () => setIsResizing(false);
        
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (!student) return null;

    const DataItem = ({ icon: Icon, label, value, subValue, colorClass = "text-blue-500" }) => (
        <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
            <div className={`mt-0.5 p-2 rounded-lg bg-slate-50 ${colorClass} shadow-sm border border-slate-100`}>
                <Icon size={16} />
            </div>
            <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-slate-700">{value || '-'}</p>
                {subValue && <p className="text-xs text-slate-500 mt-0.5">{subValue}</p>}
            </div>
        </div>
    );

    // <-- 2. BUNGKUS DENGAN createPortal KE document.body -->
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-hidden" onClick={onClose}>
            <div 
                className="bg-slate-50 shadow-2xl relative flex flex-col animate-in slide-in-from-right h-full max-h-screen w-full" 
                style={{ maxWidth: `${width}px` }} 
                onClick={(e) => e.stopPropagation()}
            >
                
                {/* Handle Resize (Sembunyikan di Mobile) */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors hidden md:flex items-center justify-center group z-20" onMouseDown={() => setIsResizing(true)}>
                    <div className="bg-slate-300 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><GripVertical size={12} className="text-slate-600" /></div>
                </div>

                {/* --- HEADER PROFILE --- */}
                <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 md:p-8 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-cyan-300 opacity-10 rounded-full blur-xl pointer-events-none"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md text-white border-2 border-white/30 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg overflow-hidden relative">
                                {/* Tampilkan foto profil dari URL (misal: student.photoUrl) jika ada, jika tidak inisial */}
                                {student.photoUrl ? (
                                    <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                                ) : (
                                    student.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1 tracking-wide">{student.name}</h2>
                                <div className="flex flex-wrap items-center gap-2 text-sm text-blue-100">
                                    <span className="font-semibold bg-black/20 px-2.5 py-1 rounded-md backdrop-blur-sm border border-white/10">{student.nisn || 'NISN Kosong'}</span>
                                    <span className="font-semibold bg-white text-blue-700 px-2.5 py-1 rounded-md shadow-sm">Kelas {student.class}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/70 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full transition-all backdrop-blur-sm"><X size={20} /></button>
                    </div>
                </div>

                {/* --- KONTEN UTAMA SCROLLABLE --- */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
                    
                    {/* STATISTIK POIN */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 -mt-10 relative z-10 mx-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Ringkasan Poin Kedisiplinan</h3>
                        <div className="grid grid-cols-3 gap-3 divide-x divide-slate-100">
                            <div className="text-center px-2">
                                <div className="flex justify-center items-center gap-1.5 text-red-500 mb-1"><AlertOctagon size={16} /><span className="text-[10px] font-bold uppercase">Pelanggaran</span></div>
                                <p className="text-2xl font-black text-slate-800">{totalPelanggaran}</p>
                            </div>
                            <div className="text-center px-2">
                                <div className="flex justify-center items-center gap-1.5 text-green-500 mb-1"><CheckCircle size={16} /><span className="text-[10px] font-bold uppercase">Prestasi</span></div>
                                <p className="text-2xl font-black text-slate-800">{totalPrestasi}</p>
                            </div>
                            <div className="text-center px-2">
                                <div className="flex justify-center items-center gap-1.5 text-blue-500 mb-1"><Activity size={16} /><span className="text-[10px] font-bold uppercase">Net Score</span></div>
                                <p className={`text-2xl font-black ${netScore < 0 ? 'text-red-600' : 'text-blue-600'}`}>{netScore}</p>
                            </div>
                        </div>
                    </div>

                    {/* STATUS SANKSI (JIKA ADA) */}
                    {activeSanction && (
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 shadow-md text-white flex gap-4 items-center">
                            <div className="bg-white/20 p-3 rounded-full shrink-0">
                                <Gavel size={24} className="text-white" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold mb-1 flex items-center gap-2">
                                    Sanksi Aktif: {activeSanction.action || activeSanction.name}
                                </h4>
                                <p className="text-xs text-orange-100 leading-relaxed">
                                    {activeSanction.description || 'Siswa telah mencapai batas poin pelanggaran ini dan memerlukan tindak lanjut.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* BIODATA & ALAMAT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-blue-50/50 p-3 border-b border-slate-100 flex items-center gap-2"><GraduationCap size={16} className="text-blue-600" /><h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Data Akademik</h3></div>
                            <div className="p-2">
                                <DataItem icon={User} label="Wali Kelas" value={student.homeroomTeacher} subValue={student.homeroomTeacherNip ? `NIP: ${student.homeroomTeacherNip}` : null} colorClass="text-indigo-500" />
                                <DataItem icon={UserCheck} label="Guru Pendamping" value={student.guardianTeacher} subValue={student.guardianTeacherNip ? `NIP: ${student.guardianTeacherNip}` : null} colorClass="text-teal-500" />
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-purple-50/50 p-3 border-b border-slate-100 flex items-center gap-2"><User size={16} className="text-purple-600" /><h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Info Pribadi</h3></div>
                            <div className="p-2">
                                <DataItem icon={Calendar} label="Tempat, Tgl Lahir" value={`${student.pob || '-'}, ${student.dob ? formatDate(student.dob) : '-'}`} colorClass="text-purple-500" />
                                <DataItem icon={Phone} label="Kontak Siswa" value={student.phone} colorClass="text-green-500" />
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden md:col-span-2">
                            <div className="bg-orange-50/50 p-3 border-b border-slate-100 flex items-center gap-2"><Heart size={16} className="text-orange-600" /><h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Data Wali Utama</h3></div>
                            <div className="p-2 grid grid-cols-1 md:grid-cols-2">
                                <DataItem icon={User} label="Nama Wali" value={student.parent} colorClass="text-orange-500" />
                                <DataItem icon={Briefcase} label="Pekerjaan" value={student.jobParent} colorClass="text-amber-500" />
                                <DataItem icon={Phone} label="Kontak Wali" value={student.parentPhone} colorClass="text-green-500" />
                                <DataItem icon={ShieldAlert} label="Tingkat Kerawanan" value={student.riskLevel === 'HIGH' ? 'Resiko Tinggi' : student.riskLevel === 'MEDIUM' ? 'Resiko Sedang' : 'Resiko Rendah'} colorClass={student.riskLevel === 'HIGH' ? 'text-red-500' : student.riskLevel === 'MEDIUM' ? 'text-yellow-500' : 'text-emerald-500'} />
                            </div>
                        </div>
                        
                        {/* KARTU LOKASI & ALAMAT (DENGAN FOTO DAN GOOGLE MAPS) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden md:col-span-2">
                            <div className="bg-emerald-50/50 p-3 border-b border-slate-100 flex items-center gap-2">
                                <MapPin size={16} className="text-emerald-600" />
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Domisili & Lokasi (Home Visit)</h3>
                            </div>
                            <div className="p-4">
                                {/* TAMPILAN GAMBAR DARI TAUTAN LOKASI */}
                                {student.locationPhotoUrl && (
                                    <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative w-full h-48 md:h-64 bg-slate-100 flex items-center justify-center group">
                                        <img 
                                            src={student.locationPhotoUrl} 
                                            alt="Foto Lokasi/Rumah" 
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            onError={(e) => {
                                                e.target.onerror = null; 
                                                e.target.src = 'https://via.placeholder.com/600x400?text=Gambar+Tidak+Dapat+Dimuat';
                                            }}
                                        />
                                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                                            <ImageIcon size={12} /> Foto Tersimpan
                                        </div>
                                    </div>
                                )}

                                <p className="text-sm text-slate-600 leading-relaxed font-medium mb-4">
                                    {student.address || 'Alamat belum diinput ke dalam sistem.'}
                                </p>
                                
                                {student.googleMapsLink ? (
                                    <a href={student.googleMapsLink} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold transition-all border border-emerald-200 shadow-sm">
                                        <Navigation size={16} /> Mulai Navigasi Kunjungan Rumah (Maps)
                                    </a>
                                ) : (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-lg text-xs font-semibold border border-slate-200">
                                        <MapPin size={14} /> Link Google Maps belum tersedia
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* PELANGGARAN (ACCORDION) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200">
                        <button 
                            onClick={() => setShowViolations(!showViolations)}
                            className="w-full p-4 border-b border-slate-100 flex items-center justify-between bg-red-50/50 hover:bg-red-100/50 transition-colors focus:outline-none"
                        >
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={18} className="text-red-500" />
                                <h3 className="text-sm font-bold text-slate-700">Riwayat Pelanggaran</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-md">{studentViolations.length} Kasus</span>
                                {showViolations ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                            </div>
                        </button>
                        
                        {showViolations && (
                            <div className="p-0 animate-in slide-in-from-top-2">
                                {studentViolations.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {studentViolations.slice(0, 5).map((violation, idx) => (
                                            <div key={idx} className="p-4 hover:bg-slate-50 transition-colors group">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-sm font-bold text-slate-800 group-hover:text-red-600 transition-colors">{violation.description || violation.pointName || 'Pelanggaran'}</span>
                                                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded whitespace-nowrap">{formatDate(violation.date)}</span>
                                                </div>
                                                <div className="flex justify-between items-center mt-2">
                                                    <p className="text-xs text-slate-500">Tercatat oleh sistem</p>
                                                    <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 whitespace-nowrap ml-3">-{violation.value || violation.point || 0} Poin</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 text-center text-sm font-bold text-slate-400 flex flex-col items-center bg-slate-50/30">
                                        <CheckCircle size={20} className="text-emerald-400 mb-2" /> Bebas Pelanggaran
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* PRESTASI (ACCORDION) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200">
                        <button 
                            onClick={() => setShowAchievements(!showAchievements)}
                            className="w-full p-4 border-b border-slate-100 flex items-center justify-between bg-green-50/50 hover:bg-green-100/50 transition-colors focus:outline-none"
                        >
                            <div className="flex items-center gap-2">
                                <Trophy size={18} className="text-green-600" />
                                <h3 className="text-sm font-bold text-slate-700">Riwayat Prestasi</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-md">{studentAchievements.length} Catatan</span>
                                {showAchievements ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                            </div>
                        </button>

                        {showAchievements && (
                            <div className="p-0 animate-in slide-in-from-top-2">
                                {studentAchievements.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {studentAchievements.slice(0, 5).map((achievement, idx) => (
                                            <div key={idx} className="p-4 hover:bg-slate-50 transition-colors group">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-sm font-bold text-slate-800 group-hover:text-green-600 transition-colors">{achievement.description || achievement.pointName || 'Prestasi'}</span>
                                                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded whitespace-nowrap">{formatDate(achievement.date)}</span>
                                                </div>
                                                <div className="flex justify-between items-center mt-2">
                                                    <p className="text-xs text-slate-500">Tercatat oleh sistem</p>
                                                    <span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded border border-green-200 whitespace-nowrap ml-3">+{achievement.value || achievement.point || 0} Poin</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 text-center text-sm font-bold text-slate-400 flex flex-col items-center bg-slate-50/30">
                                        <Trophy size={20} className="text-slate-300 mb-2" /> Belum Ada Prestasi
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* BIMBINGAN / JURNAL (ACCORDION) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6 transition-all duration-200">
                        <button 
                            onClick={() => setShowJournals(!showJournals)}
                            className="w-full p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50 hover:bg-indigo-100/50 transition-colors focus:outline-none"
                        >
                            <div className="flex items-center gap-2">
                                <BookOpen size={18} className="text-indigo-500" />
                                <h3 className="text-sm font-bold text-slate-700">Catatan Bimbingan / Jurnal</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md">{studentJournals.length} Catatan</span>
                                {showJournals ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                            </div>
                        </button>

                        {showJournals && (
                            <div className="p-0 animate-in slide-in-from-top-2">
                                {studentJournals.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {studentJournals.slice(0, 5).map((item, idx) => (
                                            <div key={idx} className="p-4 hover:bg-slate-50 transition-colors group">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors pr-2">
                                                        {item.issue || item.title || item.keterangan || 'Layanan Bimbingan'}
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded whitespace-nowrap">{formatDate(item.date)}</span>
                                                </div>
                                                <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                                    <strong className="block text-slate-700 mb-1">Tindak Lanjut / Solusi:</strong>
                                                    {item.handling || item.description || item.notes || item.solusi || '-'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 text-center text-sm font-bold text-slate-400 flex flex-col items-center bg-slate-50/30">
                                        <UserCheck size={20} className="text-slate-300 mb-2" /> Belum Ada Catatan Bimbingan
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>,
        document.body 
    );
};

export default StudentDetailModal;