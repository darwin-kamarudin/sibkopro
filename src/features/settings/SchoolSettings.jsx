import React, { useState, useEffect } from 'react';
import { 
    Settings, Save, Image as ImageIcon, MapPin, 
    CalendarClock, Building2, FileSignature, 
    UploadCloud, ChevronRight, Link as LinkIcon, Trash2, Eye 
} from 'lucide-react';

const SchoolSettings = ({ settings, onSave }) => {
    // Default State
    const [form, setForm] = useState({ 
        academicYear: '2025/2026',
        semester: 'Ganjil',
        logo: '',
        logo2: '',
        government: '',
        department: '',
        name: '',
        address: '',
        address2: '',
        city: '', // Kota penandatanganan
        // Data Pejabat
        principal: '', nipPrincipal: '',
        counselor: '', nipCounselor: '',
        studentAffairs: '', nipStudentAffairs: '', // Data Kesiswaan Baru
        ...settings 
    });
    
    // Default tab set to 'academic' sesuai urutan baru
    const [activeTab, setActiveTab] = useState('academic');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if(settings) setForm(prev => ({...prev, ...settings}));
    }, [settings]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    
    // Handler Upload File (Convert to Base64)
    const handleFile = (e, key) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2048 * 1024) return alert("Ukuran file maksimal 2MB");
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm(prev => ({ ...prev, [key]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Handler Input URL
    const handleUrlChange = (e, key) => {
        setForm(prev => ({ ...prev, [key]: e.target.value }));
    };

    const handleSave = () => {
        setIsSaving(true);
        // Simulasi loading save agar UX lebih terasa
        setTimeout(() => {
            onSave(form);
            setIsSaving(false);
            alert("Pengaturan berhasil disimpan!");
        }, 600);
    };

    // Tabs Configuration
    const TABS = [
        { id: 'academic', label: 'Periode Akademik', icon: CalendarClock, desc: 'Tahun ajaran dan semester aktif' },
        { id: 'profile', label: 'Profil & Identitas', icon: Building2, desc: 'Nama sekolah, alamat, dan kop surat' },
        { id: 'assets', label: 'Logo & Aset', icon: ImageIcon, desc: 'Logo kiri dan kanan pada kop surat' },
        { id: 'officials', label: 'Pejabat Penandatangan', icon: FileSignature, desc: 'Kepala sekolah, BK, dan Kesiswaan' },
    ];

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen pb-20">
            
            {/* HEADER STICKY */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center sticky top-0 z-20 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Settings className="text-blue-600"/> Pengaturan Sekolah
                    </h1>
                    <p className="text-xs text-slate-500 hidden md:block">Kelola identitas sekolah dan konfigurasi sistem.</p>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-70"
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <Save size={18}/>
                    )}
                    {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
                
                {/* NAVIGATION SIDEBAR */}
                <div className="w-full md:w-72 flex-shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky md:top-24 z-10">
                    <div className="p-4 bg-slate-50 border-b border-slate-100">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Navigasi Menu</h3>
                    </div>
                    <div className="p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible no-scrollbar">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all min-w-[200px] md:min-w-0 ${
                                    activeTab === tab.id 
                                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200' 
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <div className={`p-2 rounded-md ${activeTab === tab.id ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                    <tab.icon size={18}/>
                                </div>
                                <div>
                                    <div className="font-bold text-sm">{tab.label}</div>
                                    <div className="text-[10px] opacity-70 hidden md:block">{tab.desc}</div>
                                </div>
                                {activeTab === tab.id && <ChevronRight size={16} className="ml-auto hidden md:block"/>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* FORM CONTENT */}
                <div className="flex-1 w-full bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4">
                    
                    {/* --- PERIODE AKADEMIK --- */}
                    {activeTab === 'academic' && (
                        <div className="space-y-6">
                            <SectionHeader title="Periode Akademik" icon={CalendarClock} desc="Tentukan tahun ajaran dan semester aktif saat ini." />
                            
                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-6 text-sm text-yellow-800 flex items-start gap-3">
                                <AlertTriangle className="flex-shrink-0 mt-0.5" size={18}/>
                                <p>Perubahan periode akademik akan mempengaruhi filter default pada semua menu laporan dan input data.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tahun Pelajaran</label>
                                    <input 
                                        type="text" 
                                        name="academicYear" 
                                        value={form.academicYear} 
                                        onChange={handleChange} 
                                        placeholder="Contoh: 2025/2026"
                                        className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Semester Aktif</label>
                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                        {['Ganjil', 'Genap'].map(smt => (
                                            <button
                                                key={smt} onClick={() => setForm({...form, semester: smt})}
                                                className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all ${
                                                    form.semester === smt 
                                                    ? 'bg-white text-blue-600 shadow-sm' 
                                                    : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                            >
                                                {smt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- PROFIL SEKOLAH --- */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <SectionHeader title="Profil & Identitas Sekolah" icon={Building2} desc="Informasi ini akan tampil pada Kop Surat dokumen." />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <InputGroup label="Pemerintah Provinsi / Daerah" name="government" value={form.government} onChange={handleChange} placeholder="PEMERINTAH PROVINSI ..." />
                                    <InputGroup label="Nama Dinas / Yayasan" name="department" value={form.department} onChange={handleChange} placeholder="DINAS PENDIDIKAN" />
                                </div>
                                <div className="md:col-span-2">
                                    <InputGroup label="Nama Sekolah (Satuan Pendidikan)" name="name" value={form.name} onChange={handleChange} placeholder="SMK NEGERI 1..." className="font-bold text-lg" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alamat Lengkap</label>
                                    <textarea 
                                        name="address" 
                                        value={form.address} 
                                        onChange={handleChange} 
                                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm h-24 resize-none transition-all"
                                        placeholder="Jl. Raya No. 1, Kelurahan..."
                                    />
                                </div>
                                <InputGroup label="Info Tambahan (Email/Website)" name="address2" value={form.address2} onChange={handleChange} placeholder="Telp: 021-xxxx | Email: info@sekolah.sch.id" />
                                <InputGroup label="Kota / Tempat Penandatanganan Surat" name="city" value={form.city} onChange={handleChange} placeholder="Contoh: Jakarta" icon={<MapPin size={14}/>} />
                            </div>
                        </div>
                    )}

                    {/* --- LOGO & ASET (UPDATED: WITH LIVE PREVIEW) --- */}
                    {activeTab === 'assets' && (
                        <div className="space-y-8">
                            <SectionHeader title="Logo & Aset Visual" icon={ImageIcon} desc="Upload logo kiri (Pemda/Yayasan) dan logo kanan (Tut Wuri Handayani)." />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <ImageUploader 
                                    label="Logo Kiri (Pemda/Instansi)" 
                                    imageValue={form.logo} 
                                    onFileChange={(e) => handleFile(e, 'logo')} 
                                    onUrlChange={(e) => handleUrlChange(e, 'logo')} 
                                    onRemove={() => setForm({...form, logo: ''})}
                                />
                                <ImageUploader 
                                    label="Logo Kanan (Sekolah/Kemdikbud)" 
                                    imageValue={form.logo2} 
                                    onFileChange={(e) => handleFile(e, 'logo2')} 
                                    onUrlChange={(e) => handleUrlChange(e, 'logo2')} 
                                    onRemove={() => setForm({...form, logo2: ''})}
                                />
                            </div>

                            {/* --- LIVE PREVIEW SECTION --- */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm mt-4">
                                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Eye size={16} className="text-blue-600"/>
                                        <h3 className="font-bold text-slate-700 text-sm">Live Preview Kop Surat</h3>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tampilan Cetak</span>
                                </div>
                                <div className="p-6 bg-slate-100 overflow-x-auto">
                                    {/* SIMULASI KERTAS */}
                                    <div className="min-w-[700px] w-full bg-white p-8 shadow-md mx-auto" style={{fontFamily: 'Times New Roman, serif'}}>
                                        
                                        {/* KONTEN KOP SURAT */}
                                        <div className="flex items-center justify-between gap-4 border-b-4 border-double border-black pb-4 mb-2">
                                            {/* Logo Kiri */}
                                            <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
                                                {form.logo ? (
                                                    <img src={form.logo} alt="Logo 1" className="w-full h-full object-contain"/>
                                                ) : (
                                                    <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded flex items-center justify-center text-[10px] text-slate-400 text-center p-1 font-sans">
                                                        Logo Kiri
                                                    </div>
                                                )}
                                            </div>

                                            {/* Teks Tengah */}
                                            <div className="flex-1 text-center text-slate-900">
                                                <h3 className="text-lg uppercase tracking-wide leading-tight">
                                                    {form.government || <span className="text-slate-300 bg-slate-50 px-2 italic text-sm">Pemprov / Yayasan...</span>}
                                                </h3>
                                                <h3 className="text-lg font-bold uppercase tracking-wide leading-tight">
                                                    {form.department || <span className="text-slate-300 bg-slate-50 px-2 italic text-sm">Nama Dinas...</span>}
                                                </h3>
                                                <h2 className="text-2xl font-black uppercase tracking-wider my-1 leading-none">
                                                    {form.name || <span className="text-slate-300 bg-slate-50 px-2 italic text-lg">NAMA SEKOLAH...</span>}
                                                </h2>
                                                <p className="text-sm leading-tight">
                                                    {form.address || <span className="text-slate-300 bg-slate-50 px-2 italic">Alamat Lengkap Sekolah...</span>}
                                                </p>
                                                <p className="text-xs italic mt-1 text-slate-600">
                                                    {form.address2 || <span className="text-slate-300 bg-slate-50 px-2">Kontak / Email / Website...</span>}
                                                </p>
                                            </div>

                                            {/* Logo Kanan */}
                                            <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
                                                {form.logo2 ? (
                                                    <img src={form.logo2} alt="Logo 2" className="w-full h-full object-contain"/>
                                                ) : (
                                                    <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded flex items-center justify-center text-[10px] text-slate-400 text-center p-1 font-sans">
                                                        Logo Kanan
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-center text-xs text-slate-400 mt-4 font-sans">
                                        *Preview ini mensimulasikan tata letak pada dokumen surat resmi.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- PEJABAT --- */}
                    {activeTab === 'officials' && (
                        <div className="space-y-8">
                            <SectionHeader title="Pejabat Penandatangan" icon={FileSignature} desc="Nama dan NIP pejabat yang bertanda tangan di dokumen." />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <OfficialCard 
                                    title="Kepala Sekolah" role="Penanggung Jawab Utama"
                                    nameValue={form.principal} nipValue={form.nipPrincipal} 
                                    onChangeName={(e) => setForm({...form, principal: e.target.value})}
                                    onChangeNip={(e) => setForm({...form, nipPrincipal: e.target.value})}
                                />
                                <OfficialCard 
                                    title="Waka Kesiswaan" role="Bidang Kesiswaan & Kedisiplinan"
                                    nameValue={form.studentAffairs} nipValue={form.nipStudentAffairs} 
                                    onChangeName={(e) => setForm({...form, studentAffairs: e.target.value})}
                                    onChangeNip={(e) => setForm({...form, nipStudentAffairs: e.target.value})}
                                />
                                <OfficialCard 
                                    title="Guru BK / Konselor" role="Bimbingan Konseling"
                                    nameValue={form.counselor} nipValue={form.nipCounselor} 
                                    onChangeName={(e) => setForm({...form, counselor: e.target.value})}
                                    onChangeNip={(e) => setForm({...form, nipCounselor: e.target.value})}
                                />
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

// --- HELPER COMPONENTS ---

const SectionHeader = ({ title, icon: Icon, desc }) => (
    <div className="border-b border-slate-100 pb-4 mb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icon size={20}/></div>
            {title}
        </h2>
        <p className="text-sm text-slate-500 mt-1 ml-11">{desc}</p>
    </div>
);

const InputGroup = ({ label, name, value, onChange, placeholder, className, icon }) => (
    <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
            {icon} {label}
        </label>
        <input 
            type="text" 
            name={name} 
            value={value || ''} 
            onChange={onChange} 
            placeholder={placeholder}
            className={`w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all ${className}`}
        />
    </div>
);

const ImageUploader = ({ label, imageValue, onFileChange, onUrlChange, onRemove }) => {
    const isBase64 = imageValue?.startsWith('data:');

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-500 uppercase">{label}</label>
                {imageValue && (
                    <button onClick={onRemove} className="text-[10px] text-red-500 hover:underline flex items-center gap-1">
                        <Trash2 size={10}/> Hapus
                    </button>
                )}
            </div>
            
            <div 
                className="relative w-full h-48 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors group overflow-hidden cursor-pointer"
                onClick={() => !imageValue && document.getElementById(label).click()}
            >
                {imageValue ? (
                    <img 
                        src={imageValue} 
                        alt="Preview" 
                        className="h-full w-full object-contain p-4" 
                        onError={(e) => {e.target.src = 'https://via.placeholder.com/150?text=Error+Loading';}} 
                    />
                ) : (
                    <div className="text-center p-6">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <UploadCloud size={24}/>
                        </div>
                        <span className="text-sm font-bold text-slate-600 block">Klik untuk Upload File</span>
                        <span className="text-xs text-slate-400">atau tempel URL di bawah</span>
                    </div>
                )}
                <input 
                    id={label}
                    type="file" 
                    accept="image/*" 
                    onChange={onFileChange} 
                    className="hidden"
                />
            </div>

            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon size={14} className="text-slate-400" />
                </div>
                <input 
                    type="text" 
                    value={isBase64 ? '' : imageValue} 
                    onChange={onUrlChange}
                    placeholder="Atau tempel URL gambar (https://...)"
                    className="w-full pl-9 p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400"
                    disabled={isBase64} 
                />
                {isBase64 && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-100">File Uploaded</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const OfficialCard = ({ title, role, nameValue, nipValue, onChangeName, onChangeNip }) => (
    <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md transition-all group">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {title.charAt(0)}
            </div>
            <div>
                <h4 className="font-bold text-slate-800">{title}</h4>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{role}</p>
            </div>
        </div>
        <div className="space-y-3">
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nama Lengkap & Gelar</label>
                <input 
                    value={nameValue} 
                    onChange={onChangeName} 
                    className="w-full p-2 border-b border-slate-300 bg-transparent focus:border-blue-500 outline-none font-medium text-slate-700 text-sm"
                    placeholder="Nama Pejabat..."
                />
            </div>
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">NIP / NIY</label>
                <input 
                    value={nipValue} 
                    onChange={onChangeNip} 
                    className="w-full p-2 border-b border-slate-300 bg-transparent focus:border-blue-500 outline-none font-mono text-slate-600 text-sm"
                    placeholder="19xxxxxxxxxx"
                />
            </div>
        </div>
    </div>
);

const AlertTriangle = ({size, className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);

export default SchoolSettings;