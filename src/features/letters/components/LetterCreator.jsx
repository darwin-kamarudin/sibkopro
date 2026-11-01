import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { FileText, Printer, Search, Settings, AlertCircle, ArrowLeft } from 'lucide-react';
import { formatIndoDate } from '../../../common/utils/helpers';
// getViolationListHTML dihapus penggunaannya sesuai request, tapi import dibiarkan jika masih dibutuhkan module lain
import { getViolationListHTML } from '../utils/letterUtils';
import LetterPrintModal from './LetterPrintModal';

const LetterCreator = ({ students, templates, settings, pointLogs, sanctionRules, user }) => {
    const location = useLocation();
    
    // State Form
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [letterNumber, setLetterNumber] = useState('001/BK/2026');
    
    // State Editor
    const [editorContent, setEditorContent] = useState('');
    const [showPrintModal, setShowPrintModal] = useState(false);
    const editorRef = useRef(null);

    // Pisahkan template
    const globalTemplates = templates.filter(t => t.isGlobal);
    const personalTemplates = templates.filter(t => !t.isGlobal);

    useEffect(() => {
        if (location.state?.preSelectedStudentId) {
            setSelectedStudentId(location.state.preSelectedStudentId);
            const keyword = location.state.suggestedTemplateKeyword;
            if (keyword && templates.length > 0) {
                const match = templates.find(t => t.title.toLowerCase().includes(keyword.toLowerCase()));
                if (match) setSelectedTemplateId(match.id);
            }
        }
    }, [location.state, templates]);

    const generatePreview = () => {
        if (!selectedStudentId || !selectedTemplateId) return;

        const student = students.find(s => s.id === selectedStudentId);
        const template = templates.find(t => t.id === selectedTemplateId);
        
        if (!student || !template) return;

        let content = template.body;

        // 1. Ambil Data Log & Urutkan berdasarkan Tanggal Terbaru (Descending)
        const logs = (pointLogs || []).filter(l => l.studentId === selectedStudentId);
        
        // Filter violation dan sort: Terbaru (index 0) ke Terlama
        const violations = logs
            .filter(l => l.type === 'violation')
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        // 2. Hitung Poin (Akumulasi Total)
        const vTotal = violations.reduce((a, b) => a + parseInt(b.value || 0), 0);
        const aTotal = logs.filter(l => l.type === 'achievement').reduce((a, b) => a + parseInt(b.value || 0), 0);
        const currentNetScore = vTotal - aTotal;

        // 3. Tentukan Sanksi (Berdasarkan total poin saat ini)
        const activeRule = (sanctionRules || [])
            .sort((a,b) => b.max - a.max) 
            .find(rule => currentNetScore >= rule.min && currentNetScore <= rule.max);
        
        const sanctionText = activeRule 
            ? `${activeRule.penalty || activeRule.action} (Kategori: ${activeRule.min}-${activeRule.max} Poin)` 
            : "Dalam Pembinaan";

        // 4. [LOGIKA BARU] Ambil Data Pelanggaran TERAKHIR (Kejadian Saat Ini)
        // Mengambil index ke-0 karena sudah di-sort descending
        const latestViolation = violations.length > 0 ? violations[0] : null;

        let lastCode = '-';
        let lastType = '-';
        let lastDate = '-';

        if (latestViolation) {
            // Kode Pelanggaran
            lastCode = latestViolation.code || '-';
            
            // Jenis Pelanggaran (Bersihkan kode jika ada di deskripsi)
            let desc = latestViolation.description || '';
            if (latestViolation.code && desc.startsWith(latestViolation.code)) {
                desc = desc.replace(`${latestViolation.code} - `, '').replace(`${latestViolation.code}-`, '').trim();
            }
            lastType = desc;
            
            // Tanggal Kejadian
            lastDate = formatIndoDate(latestViolation.date);
        }

        // 5. Setup Logo
        const imgLogoKiri = settings.logo ? `<img src="${settings.logo}" style="height: 80px; width: auto; object-fit: contain;" alt="Logo"/>` : '';
        const imgLogoKanan = settings.logo2 ? `<img src="${settings.logo2}" style="height: 80px; width: auto; object-fit: contain;" alt="Logo 2"/>` : '';

        // 6. Replace Variabel (Sesuai Permintaan Terbaru)
        const replacers = {
            // --- Data Kop Surat ---
            '[LOGO_KIRI]': imgLogoKiri,
            '[LOGO_KANAN]': imgLogoKanan,
            '[NAMA_PEMERINTAH]': settings.government || '',
            '[NAMA_DINAS]': settings.department || '',
            '[NAMA_SEKOLAH]': settings.name || 'Nama Sekolah',
            '[ALAMAT_1]': settings.address || '',
            '[ALAMAT_2]': settings.address2 || settings.website || '', 
            
            // --- Data Surat (Kota dipindah ke sini) ---
            '[NOMOR_SURAT]': letterNumber,
            '[KOTA_SEKOLAH]': settings.city || '', 
            '[TANGGAL_SEKARANG]': formatIndoDate(new Date().toISOString()),

            // --- Data Siswa ---
            '[NAMA_SISWA]': student.name,
            '[KELAS]': student.class,
            '[NISN]': student.nisn || '-',
            '[NAMA_ORANGTUA]': student.parent || 'Orang Tua/Wali',
            '[ALAMAT]': student.address || 'Di Tempat',
            '[HP_ORANGTUA]': student.parentPhone || '-',
            
            // --- Pelanggaran & Sanksi ---
            '[TOTAL_POIN]': currentNetScore, 
            '[SANKSI_SAAT_INI]': sanctionText,
            '[LIST_PELANGGARAN]': '', // Dikosongkan sesuai permintaan
            
            // Variabel Kejadian Terakhir
            '[KODE_PELANGGARAN]': lastCode, 
            '[JENIS_PELANGGARAN]': lastType,
            '[TANGGAL_KEJADIAN]': lastDate,

            // --- Pejabat Sekolah ---
            '[KEPALA_SEKOLAH]': settings.headmaster || '...',
            '[NIP_KEPSEK]': settings.nipHeadmaster || '-',
            '[WAKA_KESISWAAN]': settings.wakaKesiswaan || '...', 
            '[NIP_WAKA]': settings.nipWakaKesiswaan || '-',
            '[GURU_BK]': settings.counselor || user?.fullName || '...',
            '[NIP_GURU]': settings.nipCounselor || '-',
            
            // Variabel Wali Kelas (Pastikan data tersedia di Data Siswa)
            '[WALI_KELAS]': student.waliKelas || '...', 
            '[NIP_WALI_KELAS]': student.nipWaliKelas || '-',
        };

        Object.keys(replacers).forEach(key => {
            // Menggunakan replaceAll agar jika variabel muncul berkali-kali tetap terganti
            content = content.replaceAll(key, replacers[key]);
        });

        const fullHtml = `
            <div style="font-family: 'Times New Roman', serif; line-height: 1.15; color: black; font-size: 12pt;">
                ${content}
            </div>
        `;
        
        setEditorContent(fullHtml);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 h-[calc(100vh-140px)]">
            {/* Panel Kiri: Input Data */}
            <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-6 border-b pb-2">Konfigurasi Surat</h3>
                    
                    {location.state?.preSelectedStudentId && (
                        <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg text-xs flex items-center gap-2 border border-green-200 font-medium">
                            <ArrowLeft size={14}/> Mode Tindak Lanjut Sanksi
                        </div>
                    )}

                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">1. Pilih Template</label>
                            <select 
                                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={selectedTemplateId}
                                onChange={(e) => { setSelectedTemplateId(e.target.value); setEditorContent(''); }}
                            >
                                <option value="">-- Pilih Jenis Surat --</option>
                                {globalTemplates.length > 0 && (
                                    <optgroup label="Template Sekolah (Global)">
                                        {globalTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                    </optgroup>
                                )}
                                {personalTemplates.length > 0 && (
                                    <optgroup label="Template Pribadi">
                                        {personalTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                    </optgroup>
                                )}
                            </select>
                            {location.state?.suggestedTemplateKeyword && !selectedTemplateId && (
                                <p className="text-[10px] text-blue-500 mt-1 italic">*Saran: "{location.state.suggestedTemplateKeyword}"</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">2. Pilih Siswa</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                                <select 
                                    className="w-full pl-9 p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedStudentId}
                                    onChange={(e) => { setSelectedStudentId(e.target.value); setEditorContent(''); }}
                                >
                                    <option value="">-- Cari Siswa --</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.name} - {s.class}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">3. Nomor Surat</label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={letterNumber}
                                onChange={e => setLetterNumber(e.target.value)}
                                placeholder="Contoh: 005/BK/SMA/2026"
                            />
                        </div>

                        <button 
                            onClick={generatePreview}
                            disabled={!selectedStudentId || !selectedTemplateId}
                            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 active:scale-95 flex justify-center items-center gap-2"
                        >
                            <FileText size={18}/> Generate & Edit
                        </button>
                    </div>
                </div>

                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-xs space-y-2 border border-blue-100">
                    <p className="font-bold flex items-center gap-2"><AlertCircle size={14}/> Info:</p>
                    <p>Gunakan variabel <b>[JENIS_PELANGGARAN]</b> untuk menampilkan jenis pelanggaran <u>terakhir</u> saja.</p>
                </div>
            </div>

            {/* Panel Kanan: Editor Preview */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-full">
                <div className="p-3 border-b bg-slate-50 flex justify-between items-center flex-shrink-0">
                    <span className="text-sm font-bold text-slate-500 flex items-center gap-2">
                        <Settings size={14}/> Editor Surat Final
                    </span>
                    {editorContent && (
                        <button 
                            onClick={() => setShowPrintModal(true)}
                            className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-black transition-colors shadow-lg"
                        >
                            <Printer size={14}/> Cetak / PDF
                        </button>
                    )}
                </div>
                
                <div className="flex-1 overflow-hidden relative bg-slate-100 p-0 md:p-2">
                    {editorContent ? (
                        <div className="h-full rounded-lg overflow-hidden shadow-inner border border-slate-300">
                            <Editor
                                apiKey="z9befhegvza1db551npe4yek5t81883n4f9rijssnf6aa5p1" 
                                onInit={(evt, editor) => editorRef.current = editor}
                                value={editorContent}
                                onEditorChange={(newContent) => setEditorContent(newContent)}
                                init={{
                                    height: "100%",
                                    menubar: false,
                                    plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount'],
                                    toolbar: 'undo redo | fontfamily fontsize | bold italic underline | alignleft aligncenter alignright alignjustify | lineheight | bullist numlist outdent indent | table | removeformat',
                                    line_height_formats: '1 1.15 1.5 2 2.5 3', 
                                    content_style: `body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.15; color: black; } p { margin-bottom: 0.5em; margin-top: 0; } ul, ol { margin-bottom: 0.5em; margin-top: 0; } li { margin-bottom: 0; } table { border-collapse: collapse; } td { padding: 2px; }`,
                                    statusbar: false,
                                    zindex: 10
                                }}
                            />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                                <FileText size={40} className="text-slate-400"/>
                            </div>
                            <p className="font-medium">Pilih template & siswa, lalu klik "Generate & Edit".</p>
                        </div>
                    )}
                </div>
            </div>

            <LetterPrintModal 
                isOpen={showPrintModal} 
                onClose={() => setShowPrintModal(false)} 
                contentRef={editorContent} 
            />
        </div>
    );
};

export default LetterCreator;