import React, { useEffect, useState, useRef } from 'react';
import { User, Users, Save, X, PlusCircle, Edit } from 'lucide-react';

// Sub-component Input Sederhana
const InputGroup = ({ label, value, onChange, placeholder, required, type="text", disabled }) => (
    <div>
        <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">{label}</label>
        <input 
            type={type}
            className={`w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'}`} 
            value={value} 
            onChange={onChange} 
            placeholder={placeholder}
            required={required}
            disabled={disabled}
        />
    </div>
);

const StudentForm = ({ initialData, onSubmit, onCancel, isEditing }) => {
    // 1. Ref untuk efek auto-scroll ke form
    const formRef = useRef(null);

    // Default State (Ditambah photoUrl)
    const defaultState = { 
        nisn: '', name: '', class: '', gender: 'L', 
        pob: '', dob: '', address: '', googleMapsLink: '', locationPhotoUrl: '', photoUrl: '', phone: '',
        fatherName: '', fatherJob: '', fatherPhone: '', fatherDeceased: false,
        motherName: '', motherJob: '', motherPhone: '', motherDeceased: false,
        parent: '', parentPhone: '', jobParent: '', 
        career: '', riskLevel: 'LOW',
        homeroomTeacher: '', homeroomTeacherNip: '', 
        guardianTeacher: '', guardianTeacherNip: ''  
    };

    const [formData, setFormData] = useState(defaultState);

    // Load data jika sedang Edit + Efek Auto-Scroll
    useEffect(() => {
        if (initialData) {
            setFormData({
                ...defaultState,
                ...initialData,
                fatherDeceased: !!initialData.fatherDeceased,
                motherDeceased: !!initialData.motherDeceased
            });
        } else {
            setFormData(defaultState);
        }

        // 2. Efek Scroll Halus
        setTimeout(() => {
            if (formRef.current) {
                formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }, [initialData]);

    // --- SMART AUTO-FILL HANDLERS ---
    const handleFatherChange = (field, value) => {
        setFormData(prev => {
            const newState = { ...prev, [field]: value };
            if (!prev.fatherDeceased) {
                if (field === 'fatherName' && (!prev.parent || prev.parent === prev.fatherName)) newState.parent = value;
                if (field === 'fatherJob' && (!prev.jobParent || prev.jobParent === prev.fatherJob)) newState.jobParent = value;
                if (field === 'fatherPhone' && (!prev.parentPhone || prev.parentPhone === prev.fatherPhone)) newState.parentPhone = value;
            }
            return newState;
        });
    };

    const handleMotherChange = (field, value) => {
        setFormData(prev => {
            const newState = { ...prev, [field]: value };
            if (prev.fatherDeceased && !prev.motherDeceased) {
                if (field === 'motherName' && (!prev.parent || prev.parent === prev.motherName)) newState.parent = value;
                if (field === 'motherJob' && (!prev.jobParent || prev.jobParent === prev.motherJob)) newState.jobParent = value;
                if (field === 'motherPhone' && (!prev.parentPhone || prev.parentPhone === prev.motherPhone)) newState.parentPhone = value;
            }
            return newState;
        });
    };

    const handleDeceasedChange = (type, isChecked) => {
        setFormData(prev => {
            const newState = { ...prev, [type]: isChecked };
            if (type === 'fatherDeceased') {
                if (isChecked && !prev.motherDeceased && prev.motherName) {
                    newState.parent = prev.motherName;
                    newState.jobParent = prev.motherJob;
                    newState.parentPhone = prev.motherPhone;
                } else if (!isChecked && prev.fatherName) {
                    newState.parent = prev.fatherName;
                    newState.jobParent = prev.fatherJob;
                    newState.parentPhone = prev.fatherPhone;
                }
            }
            return newState;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div ref={formRef} className="bg-white p-6 rounded-xl border border-blue-200 shadow-xl animate-in fade-in slide-in-from-top-4 relative overflow-hidden scroll-mt-20">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    {isEditing ? <Edit className="text-blue-600"/> : <PlusCircle className="text-blue-600"/>}
                    {isEditing ? 'Edit Data Siswa' : 'Input Siswa Baru'}
                </h3>
                <button onClick={onCancel} className="text-slate-400 hover:text-red-500"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* IDENTITAS SISWA */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-2 border-b border-slate-200 pb-2"><User size={14}/> Identitas Siswa</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup label="Nama Lengkap" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} required placeholder="Nama Siswa"/>
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="NISN" value={formData.nisn} onChange={e=>setFormData({...formData, nisn: e.target.value})} placeholder="00xxxx"/>
                            <InputGroup label="Kelas" value={formData.class} onChange={e=>setFormData({...formData, class: e.target.value})} required placeholder="X-1"/>
                        </div>
                    </div>
                    
                    {/* BAGIAN DATA GURU WALI */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="Wali Kelas" value={formData.homeroomTeacher} onChange={e=>setFormData({...formData, homeroomTeacher: e.target.value})} placeholder="Nama Wali Kelas"/>
                            <InputGroup label="NIP Wali Kelas" value={formData.homeroomTeacherNip} onChange={e=>setFormData({...formData, homeroomTeacherNip: e.target.value})} placeholder="NIP (Opsional)"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="Guru Pendamping" value={formData.guardianTeacher} onChange={e=>setFormData({...formData, guardianTeacher: e.target.value})} placeholder="Nama Pendamping"/>
                            <InputGroup label="NIP Pendamping" value={formData.guardianTeacherNip} onChange={e=>setFormData({...formData, guardianTeacherNip: e.target.value})} placeholder="NIP (Opsional)"/>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Jenis Kelamin</label>
                            <select className="w-full p-2.5 border rounded-lg bg-white text-sm" value={formData.gender} onChange={e=>setFormData({...formData, gender: e.target.value})}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select>
                        </div>
                        <InputGroup label="Tempat Lahir" value={formData.pob} onChange={e=>setFormData({...formData, pob: e.target.value})} />
                        <InputGroup label="Tanggal Lahir" type="date" value={formData.dob} onChange={e=>setFormData({...formData, dob: e.target.value})} />
                        <InputGroup label="No HP Siswa" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} placeholder="08xxx"/>
                    </div>

                    {/* BAGIAN ALAMAT, MEDIA, GOOGLE MAPS & FOTO LOKASI */}
                    <div className="space-y-4 pt-2">
                        <InputGroup label="Alamat Lengkap" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} placeholder="Jalan, Desa, Kecamatan..."/>
                        
                        {/* 3. Penambahan Input Tautan Foto Profil di sini */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputGroup label="Tautan Foto Profil Siswa" value={formData.photoUrl} onChange={e=>setFormData({...formData, photoUrl: e.target.value})} placeholder="https://contoh.com/foto-siswa.jpg"/>
                            <InputGroup label="Tautan Gambar Rumah / Lokasi" value={formData.locationPhotoUrl} onChange={e=>setFormData({...formData, locationPhotoUrl: e.target.value})} placeholder="https://contoh.com/gambar-rumah.jpg"/>
                            <div className="md:col-span-2">
                                <InputGroup label="Link Google Maps (Home Visit)" value={formData.googleMapsLink} onChange={e=>setFormData({...formData, googleMapsLink: e.target.value})} placeholder="http://googleusercontent.com/... (Opsional)"/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ORANG TUA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-4 rounded-xl border space-y-4 transition-colors ${formData.fatherDeceased ? 'bg-red-50 border-red-200' : 'bg-blue-50/50 border-blue-100'}`}>
                        <div className="flex justify-between items-center border-b pb-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><User size={14}/> Data Ayah</h4>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-red-600 rounded" checked={formData.fatherDeceased} onChange={e => handleDeceasedChange('fatherDeceased', e.target.checked)}/><span className="text-[10px] font-bold text-red-600">Meninggal Dunia</span></label>
                        </div>
                        <InputGroup label="Nama Ayah" value={formData.fatherName} onChange={e=>handleFatherChange('fatherName', e.target.value)} disabled={formData.fatherDeceased} />
                        <div className="grid grid-cols-2 gap-3">
                            <InputGroup label="Pekerjaan" value={formData.fatherJob} onChange={e=>handleFatherChange('fatherJob', e.target.value)} disabled={formData.fatherDeceased} />
                            <InputGroup label="No HP" value={formData.fatherPhone} onChange={e=>handleFatherChange('fatherPhone', e.target.value)} disabled={formData.fatherDeceased} />
                        </div>
                    </div>
                    <div className={`p-4 rounded-xl border space-y-4 transition-colors ${formData.motherDeceased ? 'bg-red-50 border-red-200' : 'bg-pink-50/50 border-pink-100'}`}>
                        <div className="flex justify-between items-center border-b pb-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><User size={14}/> Data Ibu</h4>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-red-600 rounded" checked={formData.motherDeceased} onChange={e => handleDeceasedChange('motherDeceased', e.target.checked)}/><span className="text-[10px] font-bold text-red-600">Meninggal Dunia</span></label>
                        </div>
                        <InputGroup label="Nama Ibu" value={formData.motherName} onChange={e=>handleMotherChange('motherName', e.target.value)} disabled={formData.motherDeceased} />
                        <div className="grid grid-cols-2 gap-3">
                            <InputGroup label="Pekerjaan" value={formData.motherJob} onChange={e=>handleMotherChange('motherJob', e.target.value)} disabled={formData.motherDeceased} />
                            <InputGroup label="No HP" value={formData.motherPhone} onChange={e=>handleMotherChange('motherPhone', e.target.value)} disabled={formData.motherDeceased} />
                        </div>
                    </div>
                </div>

                {/* WALI & RESIKO */}
                <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 space-y-4">
                    <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-2 mb-2 border-b border-purple-200 pb-2"><Users size={14}/> Wali Utama</h4>
                    <p className="text-[10px] text-slate-400 italic">*Otomatis terisi dari Ayah/Ibu yang masih hidup.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputGroup label="Nama Wali" value={formData.parent} onChange={e=>setFormData({...formData, parent: e.target.value})} />
                        <InputGroup label="Pekerjaan" value={formData.jobParent} onChange={e=>setFormData({...formData, jobParent: e.target.value})} />
                        <InputGroup label="No HP Wali" value={formData.parentPhone} onChange={e=>setFormData({...formData, parentPhone: e.target.value})} />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-end gap-4 pt-2 border-t">
                    <div className="w-full md:w-1/3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Tingkat Kerawanan</label>
                        <select className={`w-full p-2.5 border rounded-lg font-bold text-sm ${formData.riskLevel === 'HIGH' ? 'text-red-600 bg-red-50 border-red-200' : formData.riskLevel === 'MEDIUM' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' : 'text-green-600 bg-green-50 border-green-200'}`} value={formData.riskLevel} onChange={e=>setFormData({...formData, riskLevel: e.target.value})}>
                            <option value="LOW">Resiko Rendah</option><option value="MEDIUM">Resiko Sedang</option><option value="HIGH">Resiko Tinggi</option>
                        </select>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button type="button" onClick={onCancel} className="flex-1 md:flex-none px-6 py-2.5 text-slate-500 hover:bg-slate-100 rounded-lg font-bold text-sm">Batal</button>
                        <button type="submit" className="flex-1 md:flex-none bg-blue-600 text-white font-bold rounded-lg px-8 py-2.5 shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2"><Save size={18}/> Simpan Data</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default StudentForm;