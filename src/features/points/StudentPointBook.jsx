import { ensureSignerNips } from '../../common/utils/signers';
import PdfPreviewModal from '../../common/components/PdfPreviewModal';
import { buildBukuSiswaPdf } from './bukuSiswaPdf';
import { hitungStatusPasal, KATEGORI_LABEL } from '../../common/utils/tataTertib';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    Search, Printer, ShieldAlert, 
    BookOpen, History, Award, X, ChevronDown, AlertTriangle, Trophy,
    FileText, ListOrdered, Lock, Eye, EyeOff, Trash2, CheckSquare, Square
} from 'lucide-react';
import { formatIndoDate } from '../../common/utils/helpers';

// ==========================================
// 1. KOMPONEN PORTAL CETAK
// ==========================================
const PrintPreviewModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return createPortal(
        // PERBAIKAN: Menambahkan print:block print:w-full print:h-auto
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex flex-col animate-in fade-in duration-200 backdrop-blur-sm print:bg-white print:static print:block print:w-full print:h-auto">
            
            {/* --- CSS ISOLASI CETAK --- */}
            <style>{`
                @media print {
                    @page { size: auto; margin: 10mm; }
                    #root, .app-container, header, aside, nav { display: none !important; }
                    
                    html, body, * { 
                        font-family: 'Helvetica', 'Arial', sans-serif !important;
                    }

                    html, body { 
                        height: auto !important; 
                        min-height: auto !important;
                        overflow: visible !important; 
                        background-color: white !important; 
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    /* PERBAIKAN: Mengubah position: absolute menjadi static agar browser mengenali flow halaman untuk page-break */
                    .print-portal-root { 
                        display: block !important; 
                        position: static !important; 
                        width: 100% !important; 
                        height: auto !important; 
                        overflow: visible !important;
                        background-color: white !important; 
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* PERBAIKAN: Menghapus batasan tinggi dan memaksakan flow static */
                    .print-paper-content { 
                        position: static !important;
                        box-shadow: none !important; 
                        border: none !important; 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        width: 100% !important; 
                        max-width: none !important; 
                        height: auto !important;
                        min-height: 0 !important;
                        overflow: visible !important;
                    }
                    
                    .print-header-actions { display: none !important; }
                    
                    /* PERBAIKAN: Memastikan tabel tidak terpotong di tengah baris saat berganti kertas */
                    table { width: 100% !important; border-collapse: collapse !important; page-break-inside: auto !important; }
                    tr { page-break-inside: avoid !important; page-break-after: auto !important; }
                    thead { display: table-header-group !important; }
                    tfoot { display: table-footer-group !important; }
                    
                    /* ATURAN GLOBAL: Semua tabel punya border saat dicetak */
                    td, th { border: 1px solid black !important; padding: 4px; }
                    
                    /* PENGECUALIAN: Tabel Identitas (tanpa border) */
                    .no-border-table td, .no-border-table th { 
                        border: none !important; 
                        padding: 2px 0 !important; 
                    }
                    
                    /* KHUSUS TABEL KONSELING: Lebih Rapat */
                    .compact-table td {
                        padding: 2px 4px !important; /* Padding vertikal sangat tipis */
                    }

                    .signature-section { page-break-inside: avoid; }
                }
            `}</style>

            {/* Header Modal */}
            <div className="bg-slate-800 text-white px-4 py-3 shadow-md flex justify-between items-center flex-shrink-0 border-b border-slate-700 print-header-actions">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                        <Printer size={20} className="text-blue-400"/> Pratinjau: {title}
                    </h2>
                    <p className="text-[10px] text-slate-400 hidden sm:block">
                        Gunakan kertas A4/F4. Anda dapat mengatur ukuran kertas di dialog cetak browser.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                        Tutup
                    </button>
                    <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-blue-500/20 transition-all active:scale-95">
                        <Printer size={16}/> Cetak / PDF
                    </button>
                </div>
            </div>

            {/* Area Konten */}
            {/* PERBAIKAN: Menambahkan class print:static print:block untuk mematikan mode flex saat print */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-slate-900/50 print:bg-white print:p-0 print:overflow-visible print:block print:static print:h-auto print-portal-root">
                
                {/* PERBAIKAN: Menimpa kelas h-fit dan max-w dengan modifier print untuk mengizinkan kertas merentang bebas */}
                <div className="print-paper-content bg-white text-slate-900 shadow-2xl w-full max-w-[215mm] min-h-[297mm] p-10 md:p-12 origin-top h-fit mx-auto print:max-w-none print:min-h-0 print:p-0 print:m-0 print:shadow-none print:transform-none">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

// ==========================================
// 2. KOMPONEN UTAMA
// ==========================================
const StudentPointBook = ({ students, pointLogs, journals, settings, sanctionRules, sanctionMode = 'poin', tataTertib }) => {
    const isPasal = sanctionMode === 'pasal';
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    
    // --- STATE PENCARIAN SISWA ---
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef(null);

    // --- OPSI TAMPILAN (TOGGLE SECTIONS) ---
    const [showSanctionHistory, setShowSanctionHistory] = useState(false); 
    const [showCounselingHistory, setShowCounselingHistory] = useState(true); 

    // --- MODE PRIVASI LAYANAN BK ---
    const [counselingPrivacy, setCounselingPrivacy] = useState('mask');
    const [signOptions, setSignOptions] = useState(SIGNER_OPTIONS_DEFAULT);
    const toggleSignOpt = (key) => setSignOptions(p => ({ ...p, [key]: !p[key] }));

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredStudents = useMemo(() => {
        if (!searchQuery) return students;
        return students.filter(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            s.nisn?.includes(searchQuery) ||
            s.class?.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a,b) => a.name.localeCompare(b.name));
    }, [students, searchQuery]);

    const student = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);

    // Data Poin
    const pointData = useMemo(() => {
        if (!student) return null;
        const logs = pointLogs.filter(p => p.studentId === student.id).sort((a,b) => new Date(b.date) - new Date(a.date));
        
        const violationTotal = logs.filter(p => p.type === 'violation').reduce((acc, curr) => acc + parseInt(curr.value || 0), 0);
        const achievementTotal = logs.filter(p => p.type === 'achievement').reduce((acc, curr) => acc + parseInt(curr.value || 0), 0);
        
        const netScoreRaw = violationTotal - achievementTotal; 
        const activeSanction = (sanctionRules || []).sort((a,b) => b.max - a.max).find(rule => netScoreRaw >= rule.min && netScoreRaw <= rule.max);

        return { logs, violationTotal, achievementTotal, netScoreRaw, activeSanction };
    }, [student, pointLogs, sanctionRules]);

    // Data Konseling
    const counselingHistory = useMemo(() => {
        if (!student) return [];
        let data = journals.filter(j => 
            j.studentId === student.id || (j.studentIds && j.studentIds.includes(student.id))
        ).sort((a,b) => b.date.localeCompare(a.date));

        if (counselingPrivacy === 'hide') {
            data = data.filter(j => {
                const isPrivate = j.isPrivate || (j.serviceType && j.serviceType.toLowerCase().includes('pribadi'));
                return !isPrivate;
            });
        }
        return data;
    }, [student, journals, counselingPrivacy]);

    const handleSelectStudent = (s) => {
        setSelectedStudentId(s.id);
        setSearchQuery(s.name);
        setIsSearchOpen(false);
    };

    // --- FUNGSI GENERATE WORD ---
    const handleDownloadWordPasal = () => {
        if (!student || !pointData) return;
        if (!ensureSignerNips(settings, signOptions)) return;
        const st = hitungStatusPasal(pointData.logs, tataTertib?.pasal || [], tataTertib?.spRules || []);
        const logs = [...pointData.logs].sort((a, b) => new Date(a.date) - new Date(b.date));
        const vLogs = logs.filter(l => l.type === 'violation');
        const aLogs = logs.filter(l => l.type === 'achievement');
        const tb = 'border-collapse: collapse; width: 100%;';
        const td = 'border: 1px solid black; padding: 5px;';
        const th = td + ' background-color: #f1f5f9; font-weight: bold; text-align: center;';
        const c = 'text-align: center;';
        const rowsOf = (arr, cells) => arr.length
            ? arr.map((l, i) => `<tr>${cells(l, i)}</tr>`).join('')
            : `<tr><td colspan="4" style="${td} ${c} font-style: italic;">Tidak ada catatan.</td></tr>`;
        const spHtml = st.spTercapai
            ? `<h4>STATUS SANKSI (BERBASIS PASAL)</h4>
               <table style="${tb}"><tr><th style="${th}">Ambang SP Tercapai</th><th style="${th}">Tindakan</th><th style="${th}">Menuju SP Berikutnya</th></tr>
               <tr><td style="${td} ${c} font-weight: bold;">${st.spTercapai.level}</td><td style="${td}">${st.spTercapai.tindakan || '-'}</td><td style="${td} ${c}">${st.menujuSp ? `${st.menujuSp.level}: kurang ${st.menujuSp.kurang}` : 'Tertinggi'}</td></tr></table>`
            : (st.totalPelanggaran > 0
                ? `<p><i>Belum mencapai ambang SP. ${st.menujuSp ? `Menuju ${st.menujuSp.level}: kurang ${st.menujuSp.kurang}.` : ''}</i></p>`
                : '');

        const htmlContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
            <head><meta charset="utf-8"><title>Buku Siswa ${student.name}</title></head>
            <body style="font-family: Arial, sans-serif; font-size: 10pt;">
                <h2 style="text-align: center; text-decoration: underline;">BUKU SISWA</h2>
                <table style="width: 100%; margin-bottom: 12px;">
                    <tr><td>Nama Siswa</td><td>: ${student.name}</td><td>Kelas</td><td>: ${student.class}</td></tr>
                    <tr><td>NISN</td><td>: ${student.nisn || '-'}</td><td>Jenis Kelamin</td><td>: ${student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td></tr>
                    <tr><td>Wali Kelas</td><td>: ${student.homeroomTeacher || '-'}</td><td>Guru Wali</td><td>: ${student.guardianTeacher || '-'}</td></tr>
                    <tr><td>Thn Ajaran</td><td colspan="3">: ${settings?.academicYear || '-'} / ${settings?.semester || '-'}</td></tr>
                </table>
                <h4>RINGKASAN</h4>
                <table style="${tb}">
                    <tr><th style="${th}">Pelanggaran Ringan</th><th style="${th}">Pelanggaran Sedang</th><th style="${th}">Pelanggaran Berat</th><th style="${th}">Prestasi</th></tr>
                    <tr><td style="${td} ${c}">${st.raw.ringan}</td><td style="${td} ${c}">${st.efektif.sedang}</td><td style="${td} ${c}">${st.efektif.berat}</td><td style="${td} ${c}">${aLogs.length}</td></tr>
                </table>
                ${spHtml}
                <h4 style="color: #b91c1c;">A. CATATAN PELANGGARAN</h4>
                <table style="${tb}">
                    <tr><th style="${th}">No</th><th style="${th}">Tanggal</th><th style="${th}">Uraian Pelanggaran</th><th style="${th}">Kategori</th></tr>
                    ${rowsOf(vLogs, (l, i) => `<td style="${td} ${c}">${i + 1}</td><td style="${td} ${c}">${formatIndoDate(l.date)}</td><td style="${td}">${l.description}</td><td style="${td} ${c}">${KATEGORI_LABEL[l.kategori] || '-'}</td>`)}
                </table>
                <h4 style="color: #15803d;">B. CATATAN PRESTASI</h4>
                <table style="${tb}">
                    <tr><th style="${th}">No</th><th style="${th}">Tanggal</th><th style="${th}">Uraian Prestasi</th><th style="${th}">Bidang</th></tr>
                    ${rowsOf(aLogs, (l, i) => `<td style="${td} ${c}">${i + 1}</td><td style="${td} ${c}">${formatIndoDate(l.date)}</td><td style="${td}">${l.description}</td><td style="${td} ${c}">${l.bidang || '-'}</td>`)}
                </table>
            ${signaturesWordHtml(settings, student, signOptions)}
            </body>
            </html>
        `;
        const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Buku_Siswa_${student.name.replace(/\s+/g, '_')}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadWord = () => {
        if (isPasal) return handleDownloadWordPasal();
        if (!student || !pointData) return;
        if (!ensureSignerNips(settings, signOptions)) return;

        const { violationTotal, achievementTotal, netScoreRaw, activeSanction, logs } = pointData;
        const displayScore = Math.abs(netScoreRaw);
        const isDeficit = violationTotal > achievementTotal;
        const isSurplus = achievementTotal > violationTotal;
        const scoreColor = isDeficit ? 'red' : (isSurplus ? 'green' : 'black');

        const violationLogs = logs.filter(l => l.type === 'violation');
        const achievementLogs = logs.filter(l => l.type === 'achievement');

        // TABEL SANKSI (WORD)
        let historyTableHTML = '';
        if (showSanctionHistory) {
            const sortedLogs = [...logs].sort((a,b) => new Date(a.date) - new Date(b.date)); 
            let runningBalance = 0;
            const historyRows = sortedLogs.map((log, idx) => {
                const val = parseInt(log.value || 0);
                const isV = log.type === 'violation';
                if(isV) runningBalance += val; else runningBalance -= val;
                if(runningBalance < 0) runningBalance = 0;
                
                const rule = (sanctionRules || []).find(r => runningBalance >= parseInt(r.min) && runningBalance <= parseInt(r.max));
                const status = rule ? rule.penalty : '-';
                
                return `
                    <tr>
                        <td style="border: 1px solid black; padding: 5px; text-align: center;">${idx+1}</td>
                        <td style="border: 1px solid black; padding: 5px; text-align: center;">${formatIndoDate(log.date)}</td>
                        <td style="border: 1px solid black; padding: 5px;">
                            <b>${isV ? 'Pelanggaran' : 'Prestasi'}</b><br/>${log.description}
                        </td>
                        <td style="border: 1px solid black; padding: 5px; text-align: center; color: ${isV ? 'red' : 'green'}; font-weight: bold;">
                            ${isV ? '+' : '-'}${val}
                        </td>
                        <td style="border: 1px solid black; padding: 5px; text-align: center; font-weight: bold;">${runningBalance}</td>
                        <td style="border: 1px solid black; padding: 5px; background-color: #f9f9f9;">${status}</td>
                    </tr>
                `;
            }).join('');

            historyTableHTML = `
                <h4 style="margin-bottom: 5px; color: #854d0e; text-transform: uppercase;">RIWAYAT PERUBAHAN POIN & SANKSI</h4>
                <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px; font-size: 11px;">
                    <thead>
                        <tr>
                            <th style="border: 1px solid black; padding: 5px; background-color: #fef3c7;">No</th>
                            <th style="border: 1px solid black; padding: 5px; background-color: #fef3c7;">Tanggal</th>
                            <th style="border: 1px solid black; padding: 5px; background-color: #fef3c7;">Keterangan</th>
                            <th style="border: 1px solid black; padding: 5px; background-color: #fef3c7;">Ubah</th>
                            <th style="border: 1px solid black; padding: 5px; background-color: #fef3c7;">Total</th>
                            <th style="border: 1px solid black; padding: 5px; background-color: #fef3c7;">Status Sanksi</th>
                        </tr>
                    </thead>
                    <tbody>${historyRows || '<tr><td colspan="6" style="text-align:center;">Belum ada data.</td></tr>'}</tbody>
                </table>
            `;
        }

        // TABEL KONSELING (WORD) - DIBUAT RAPAT
        let counselingTableHTML = '';
        if (showCounselingHistory) {
            const counselingRows = counselingHistory.map((h, i) => {
                const isPrivate = h.isPrivate || (h.serviceType && h.serviceType.toLowerCase().includes('pribadi'));
                const isMasked = isPrivate && counselingPrivacy === 'mask';
                const descText = isMasked ? '--- Privasi (Disamarkan) ---' : h.description;
                const textStyle = isMasked ? 'font-style: italic; color: #666;' : '';
                
                return `
                    <tr>
                        <td style="border: 1px solid black; padding: 2px 4px; text-align: center;">${i+1}</td>
                        <td style="border: 1px solid black; padding: 2px 4px; text-align: center;">${formatIndoDate(h.date)}</td>
                        <td style="border: 1px solid black; padding: 2px 4px; vertical-align: top;">
                            <div style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">
                                ${h.serviceType}
                            </div>
                            <div style="font-size: 10px; line-height: 1.2;">
                                <b>Bidang:</b> ${h.skkpd || '-'}<br/>
                                <b>Kategori:</b> ${h.category || '-'}<br/>
                                <b>Teknik:</b> ${h.technique || '-'}
                            </div>
                        </td>
                        <td style="border: 1px solid black; padding: 2px 4px; vertical-align: top; ${textStyle}">
                            ${descText}
                        </td>
                        <td style="border: 1px solid black; padding: 2px 4px; vertical-align: top;">${h.followUp}</td>
                    </tr>
                `;
            }).join('');
            
            let infoText = '';
            if (counselingPrivacy === 'mask') infoText = '<p style="font-size: 10px; font-style: italic; margin-top:0;">*Topik yang bersifat privasi disamarkan pada dokumen ini.</p>';
            if (counselingPrivacy === 'hide') infoText = '<p style="font-size: 10px; font-style: italic; margin-top:0;">*Layanan yang bersifat privasi tidak ditampilkan pada dokumen ini.</p>';

            // UPDATE WIDTH KOLOM LAYANAN (WORD): 230px
            counselingTableHTML = `
                <h4 style="margin-bottom: 5px; color: #1e40af;">C. RIWAYAT LAYANAN BK</h4>
                ${infoText}
                <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px; font-size: 11px;">
                    <thead>
                        <tr>
                            <th style="border: 1px solid black; padding: 4px; background-color: #f2f2f2; text-align: center; font-weight: bold; width: 30px;">No</th>
                            <th style="border: 1px solid black; padding: 4px; background-color: #f2f2f2; text-align: center; font-weight: bold; width: 80px;">Tanggal</th>
                            <th style="border: 1px solid black; padding: 4px; background-color: #f2f2f2; text-align: center; font-weight: bold; width: 230px;">Jenis & Detail Layanan</th> 
                            <th style="border: 1px solid black; padding: 4px; background-color: #f2f2f2; text-align: center; font-weight: bold;">Topik / Masalah</th> 
                            <th style="border: 1px solid black; padding: 4px; background-color: #f2f2f2; text-align: center; font-weight: bold; width: 100px;">Tindak Lanjut</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${counselingRows || '<tr><td colspan="5" style="border: 1px solid black; padding: 4px; text-align: center; font-style: italic;">Belum ada riwayat layanan.</td></tr>'}
                    </tbody>
                </table>
            `;
        }

        const tableStyle = `border-collapse: collapse; width: 100%; margin-bottom: 20px; font-size: 12px;`;
        const thStyle = `border: 1px solid black; padding: 5px; background-color: #f2f2f2; text-align: center; font-weight: bold;`;
        const tdStyle = `border: 1px solid black; padding: 5px;`;
        const centerTd = `text-align: center;`;
        const kopTextStyle = `margin: 0; text-transform: uppercase; font-size: 14pt; font-weight: bold; white-space: nowrap;`;

        let htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Buku Siswa ${student.name}</title></head>
            <body style="font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12px;">
                
                <div style="text-align: center; margin-bottom: 20px; border-bottom: 3px double black; padding-bottom: 10px;">
                    <h3 style="${kopTextStyle}">${settings?.government || ''}</h3>
                    <h3 style="${kopTextStyle}">${settings?.department || ''}</h3>
                    <h1 style="${kopTextStyle} font-size: 14pt; font-weight: 800;">${settings?.name || 'NAMA SEKOLAH'}</h1>
                    <p style="margin:0; font-style: italic; font-size: 10pt;">${settings?.address || ''}</p>
                    <p style="margin:0; font-style: italic; font-size: 10pt;">${settings?.address2 || ''}</p>
                </div>

                <h3 style="text-align: center; text-decoration: underline; text-transform: uppercase; margin-bottom: 20px;">
                    BUKU CATATAN REKAM JEJAK SISWA
                </h3>

                <table style="width: 100%; margin-bottom: 20px; font-weight: bold;">
                    <tr><td style="border:none; width: 120px;">Nama Siswa</td><td style="border:none;">: ${student.name}</td><td style="border:none; width: 80px;">Kelas</td><td style="border:none;">: ${student.class}</td></tr>
                    <tr><td style="border:none;">NISN</td><td style="border:none;">: ${student.nisn || '-'}</td><td style="border:none;">Jns Kelamin</td><td style="border:none;">: ${student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td></tr>
                    <tr><td style="border:none;">Wali Kelas</td><td style="border:none;">: ${student.homeroomTeacher || '-'}</td><td style="border:none;">Guru Wali</td><td style="border:none;">: ${student.guardianTeacher || '-'}</td></tr>
                    <tr><td style="border:none;">Thn Ajaran</td><td style="border:none;" colspan="3">: ${settings?.academicYear || '-'} / ${settings?.semester || '-'}</td></tr>
                </table>

                <table style="${tableStyle}">
                    <thead>
                        <tr><th style="${thStyle}">Poin Pelanggaran</th><th style="${thStyle}">Poin Prestasi</th><th style="${thStyle}">Selisih Poin</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="${tdStyle} ${centerTd} color: red; font-weight: bold;">${violationTotal}</td>
                            <td style="${tdStyle} ${centerTd} color: green; font-weight: bold;">${achievementTotal}</td>
                            <td style="${tdStyle} ${centerTd} color: ${scoreColor}; font-weight: bold;">${displayScore}</td>
                        </tr>
                    </tbody>
                </table>

                ${isDeficit && activeSanction ? `
                    <h4 style="margin-bottom: 5px; color: #b91c1c;">TINDAK LANJUT & SANKSI</h4>
                    <table style="${tableStyle}">
                        <thead>
                            <tr><th style="${thStyle}">Range Poin</th><th style="${thStyle}">Tindak Lanjut</th><th style="${thStyle}">Sanksi</th></tr>
                        </thead>
                        <tbody>
                            <tr style="background-color: #fff9c4;">
                                <td style="${tdStyle} ${centerTd} color: red; font-weight: bold;">${activeSanction.min} - ${activeSanction.max}</td>
                                <td style="${tdStyle}">${activeSanction.action}</td>
                                <td style="${tdStyle}">${activeSanction.penalty}</td>
                            </tr>
                        </tbody>
                    </table>
                ` : ''}

                ${historyTableHTML}

                <h4 style="margin-bottom: 5px; color: #b91c1c;">A. CATATAN PELANGGARAN</h4>
                <table style="${tableStyle}">
                    <thead>
                        <tr><th style="${thStyle} width: 30px;">No</th><th style="${thStyle} width: 100px;">Tanggal</th><th style="${thStyle}">Uraian Pelanggaran</th><th style="${thStyle} width: 60px;">Poin</th></tr>
                    </thead>
                    <tbody>
                        ${violationLogs.length > 0 ? violationLogs.map((log, i) => `
                            <tr>
                                <td style="${tdStyle} ${centerTd}">${i+1}</td>
                                <td style="${tdStyle} ${centerTd}">${formatIndoDate(log.date)}</td>
                                <td style="${tdStyle}">${log.description}</td>
                                <td style="${tdStyle} ${centerTd} color: red; font-weight: bold;">${log.value}</td>
                            </tr>
                        `).join('') : `<tr><td colspan="4" style="${tdStyle} ${centerTd} font-style: italic;">Tidak ada catatan pelanggaran.</td></tr>`}
                    </tbody>
                </table>

                <h4 style="margin-bottom: 5px; color: #15803d;">B. CATATAN PRESTASI</h4>
                <table style="${tableStyle}">
                    <thead>
                        <tr><th style="${thStyle} width: 30px;">No</th><th style="${thStyle} width: 100px;">Tanggal</th><th style="${thStyle}">Uraian Prestasi</th><th style="${thStyle} width: 60px;">Poin</th></tr>
                    </thead>
                    <tbody>
                        ${achievementLogs.length > 0 ? achievementLogs.map((log, i) => `
                            <tr>
                                <td style="${tdStyle} ${centerTd}">${i+1}</td>
                                <td style="${tdStyle} ${centerTd}">${formatIndoDate(log.date)}</td>
                                <td style="${tdStyle}">${log.description}</td>
                                <td style="${tdStyle} ${centerTd} color: green; font-weight: bold;">${log.value}</td>
                            </tr>
                        `).join('') : `<tr><td colspan="4" style="${tdStyle} ${centerTd} font-style: italic;">Tidak ada catatan prestasi.</td></tr>`}
                    </tbody>
                </table>

                ${counselingTableHTML}

                <br/><br/>
            ${signaturesWordHtml(settings, student, signOptions)}
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Buku_Poin_${student.name.replace(/\s+/g, '_')}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            
            {/* Header Toolbar */}
            <div className="bg-white border-b px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-10 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen className="text-blue-600"/> Buku Siswa
                    </h1>
                    <p className="text-xs text-slate-500">Lihat dan cetak rekam jejak karakter siswa.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
                    
                    {/* INPUT PENCARIAN */}
                    <div className="relative w-full md:w-80" ref={searchRef}>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                            <input 
                                type="text"
                                className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ketik nama siswa..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setIsSearchOpen(true);
                                    if(e.target.value === '') setSelectedStudentId('');
                                }}
                                onFocus={() => setIsSearchOpen(true)}
                            />
                            {selectedStudentId ? (
                                <button onClick={() => { setSelectedStudentId(''); setSearchQuery(''); setIsSearchOpen(true); }} className="absolute right-3 top-2.5 text-slate-400 hover:text-red-500">
                                    <X size={16}/>
                                </button>
                            ) : (
                                <ChevronDown className="absolute right-3 top-2.5 text-slate-400" size={16}/>
                            )}
                        </div>

                        {/* DROPDOWN HASIL PENCARIAN */}
                        {isSearchOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map(s => (
                                        <div key={s.id} onClick={() => handleSelectStudent(s)} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0">
                                            <div className="font-bold text-slate-800 text-sm">{s.name}</div>
                                            <div className="text-xs text-slate-500 flex justify-between mt-0.5">
                                                <span>Kelas: {s.class}</span>
                                                <span>NISN: {s.nisn || '-'}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-slate-400 text-sm italic">Siswa tidak ditemukan.</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button disabled={!selectedStudentId} onClick={handleDownloadWord} className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-all flex-1 md:flex-none" title="Download Format Word">
                            <FileText size={18}/> Doc
                        </button>
                        <button disabled={!selectedStudentId} onClick={() => setShowPreview(true)} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-all flex-1 md:flex-none">
                            <Printer size={18}/> Cetak
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content (Preview di Layar) */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                {student && pointData ? (
                    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        
                        {/* KONTROL DOKUMEN & PRIVASI */}
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-yellow-100 p-2 rounded-full text-yellow-700"><ShieldAlert size={20}/></div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Opsi Dokumen & Privasi</h4>
                                    <p className="text-xs text-slate-500">Sesuaikan kelengkapan data sebelum mencetak.</p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-1.5 rounded-lg border border-yellow-100 shadow-sm">
                                        <input type="checkbox" className="w-4 h-4 accent-orange-600 rounded" checked={showSanctionHistory} onChange={e => setShowSanctionHistory(e.target.checked)} />
                                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1"><ListOrdered size={14}/> Sertakan Riwayat Sanksi</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-1.5 rounded-lg border border-yellow-100 shadow-sm">
                                        <input type="checkbox" className="w-4 h-4 accent-blue-600 rounded" checked={showCounselingHistory} onChange={e => setShowCounselingHistory(e.target.checked)} />
                                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1"><FileText size={14}/> Sertakan Riwayat BK</span>
                                    </label>
                                    {[
                                        { key: 'parent', label: 'Orang Tua/Wali' },
                                        { key: 'counselor', label: 'Guru BK' },
                                    ].map(o => (
                                        <label key={o.key} className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-1.5 rounded-lg border border-yellow-100 shadow-sm">
                                            <input type="checkbox" className="w-4 h-4 accent-slate-700 rounded" checked={!!signOptions[o.key]} onChange={() => toggleSignOpt(o.key)} />
                                            <span className="text-xs font-bold text-slate-700">TTD {o.label}</span>
                                        </label>
                                    ))}
                                </div>

                                {showCounselingHistory && (
                                    <div className="flex flex-col sm:flex-row gap-2 pl-2 border-l-2 border-slate-300 animate-in fade-in slide-in-from-top-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase self-center mr-2">Mode Privasi BK:</span>
                                        <label className={`flex items-center gap-1.5 cursor-pointer select-none px-2 py-1 rounded border transition-all ${counselingPrivacy === 'show' ? 'bg-blue-100 border-blue-300' : 'bg-white border-slate-200'}`}>
                                            <input type="radio" name="cp_mode_main" className="w-3 h-3 accent-blue-600" checked={counselingPrivacy === 'show'} onChange={() => setCounselingPrivacy('show')} />
                                            <div className="text-[11px] font-bold flex gap-1 items-center"><Eye size={12}/> Tampilkan</div>
                                        </label>
                                        <label className={`flex items-center gap-1.5 cursor-pointer select-none px-2 py-1 rounded border transition-all ${counselingPrivacy === 'mask' ? 'bg-blue-100 border-blue-300' : 'bg-white border-slate-200'}`}>
                                            <input type="radio" name="cp_mode_main" className="w-3 h-3 accent-blue-600" checked={counselingPrivacy === 'mask'} onChange={() => setCounselingPrivacy('mask')} />
                                            <div className="text-[11px] font-bold flex gap-1 items-center"><EyeOff size={12}/> Samarkan</div>
                                        </label>
                                        <label className={`flex items-center gap-1.5 cursor-pointer select-none px-2 py-1 rounded border transition-all ${counselingPrivacy === 'hide' ? 'bg-blue-100 border-blue-300' : 'bg-white border-slate-200'}`}>
                                            <input type="radio" name="cp_mode_main" className="w-3 h-3 accent-blue-600" checked={counselingPrivacy === 'hide'} onChange={() => setCounselingPrivacy('hide')} />
                                            <div className="text-[11px] font-bold flex gap-1 items-center"><Trash2 size={12}/> Sembunyikan Baris</div>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden min-h-[600px]">
                            <BookContent 
                                student={student} 
                                pointData={pointData} 
                                counselingHistory={counselingHistory} 
                                settings={settings}
                                counselingPrivacy={counselingPrivacy}
                                showSanctionHistory={showSanctionHistory}
                                showCounselingHistory={showCounselingHistory}
                                sanctionRules={sanctionRules}
                                isPasal={isPasal}
                                tataTertib={tataTertib}
                                signOptions={signOptions}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <BookOpen size={64} className="mb-4 text-slate-300"/>
                        <p className="text-lg font-medium">Cari dan pilih siswa untuk membuka buku poin</p>
                    </div>
                )}
            </div>

            <PdfPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                title={`Buku Siswa - ${student?.name || 'Siswa'}`}
                buildDoc={() => buildBukuSiswaPdf({
                    student, pointData, counselingHistory, counselingPrivacy, settings,
                    isPasal, tataTertib, signOptions, showSanctionHistory, showCounselingHistory
                })}
                fileName={`Buku_Siswa_${(student?.name || 'Siswa').replace(/\s+/g, '_')}.pdf`}
                guard={() => student && ensureSignerNips(settings, signOptions)}
            />

        </div>
    );
};

// ==========================================
// 3. SUB-KOMPONEN: ISI BUKU (DOKUMEN HTML)
// ==========================================
// ----------------------------------------------------------------------------
// BLOK TANDA TANGAN DINAMIS
// Pilihan pejabat dikendalikan checkbox di halaman Buku Siswa.
// ----------------------------------------------------------------------------
// Buku Siswa diketahui orang tua/wali dan guru BK saja
const SIGNER_OPTIONS_DEFAULT = { parent: true, counselor: true };

const buildSignerItems = (settings, student, opts = {}) => {
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    return [
        opts.parent && { key: 'parent', title: 'Mengetahui,', role: 'Orang Tua / Wali', name: student?.parent || '....................................' },
        opts.counselor && { key: 'counselor', title: `${settings?.city || '...'}, ${dateStr}`, role: 'Guru BK / Konselor', name: settings?.counselor || '......................', nip: settings?.nipCounselor || '......................' },
    ].filter(Boolean);
};

// Buku Siswa: blok orang tua/wali dan guru BK berjajar dalam satu baris
const layoutSignerRows = (items) => [items];

const SignatureBlocks = ({ items }) => {
    if (!items.length) return null;
    const rows = layoutSignerRows(items);
    return (
        <div className="mt-12 text-center text-[10pt] signature-section break-inside-avoid">
            {rows.map((row, ri) => (
                <div key={ri} className="flex justify-center gap-8 mb-6">
                    {row.map(it => (
                        <div key={it.key} style={{ width: '42%' }}>
                            <p>{it.title}</p>
                            <p>{it.role}</p>
                            <br/><br/><br/>
                            {it.key === 'parent'
                                ? <p className="font-bold underline">( {it.name} )</p>
                                : <>
                                    <p className="font-bold underline">{it.name}</p>
                                    <p>NIP. {it.nip}</p>
                                  </>}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

const signaturesWordHtml = (settings, student, opts = {}) => {
    const items = buildSignerItems(settings, student, opts);
    if (!items.length) return '';
    const cellOf = (it, width) => `
        <td style="border: none; text-align: center; width: ${width}; vertical-align: top;">
            <p>${it.title}</p><p>${it.role}</p><br/><br/><br/>
            ${it.key === 'parent'
                ? `<p style="text-decoration: underline; font-weight: bold;">( ${it.name} )</p>`
                : `<p style="text-decoration: underline; font-weight: bold;">${it.name}</p><p>NIP. ${it.nip}</p>`}
        </td>`;
    return layoutSignerRows(items).map(row => {
        const cells = row.length === 1
            ? `<td style="border: none; width: 25%;"></td>${cellOf(row[0], '50%')}<td style="border: none; width: 25%;"></td>`
            : row.map(it => cellOf(it, '50%')).join('');
        return `<table style="width: 100%; border: none; margin-top: 24px;"><tr>${cells}</tr></table>`;
    }).join('');
};

const BookContent = ({ student, pointData, counselingHistory, settings, counselingPrivacy, showSanctionHistory, showCounselingHistory, sanctionRules, isPrintVersion = false, isPasal = false, tataTertib, signOptions = SIGNER_OPTIONS_DEFAULT }) => {
    const { violationTotal, achievementTotal, netScoreRaw, activeSanction, logs } = pointData;
    const pasalStatus = isPasal ? hitungStatusPasal(logs, tataTertib?.pasal || [], tataTertib?.spRules || []) : null;
    const violationLogs = logs.filter(l => l.type === 'violation');
    const achievementLogs = logs.filter(l => l.type === 'achievement');
    const isDeficit = violationTotal > achievementTotal;
    const isSurplus = achievementTotal > violationTotal;
    const displayScore = Math.abs(netScoreRaw);
    const scoreColorClass = isDeficit ? 'text-red-600' : (isSurplus ? 'text-green-600' : 'text-slate-800');

    // Font family style
    const fontStyle = { fontFamily: 'Helvetica, Arial, sans-serif' };

    // LOGIKA RIWAYAT SANKSI
    const sanctionHistoryRows = useMemo(() => {
        if (!showSanctionHistory) return [];
        const chronologicalLogs = [...logs].sort((a,b) => new Date(a.date) - new Date(b.date));
        let runningBalance = 0;
        return chronologicalLogs.map((log) => {
            const val = parseInt(log.value || 0);
            const isV = log.type === 'violation';
            if (isV) runningBalance += val; else runningBalance -= val;
            if (runningBalance < 0) runningBalance = 0;
            const rule = (sanctionRules || []).find(r => runningBalance >= parseInt(r.min) && runningBalance <= parseInt(r.max));
            return { ...log, isViolation: isV, pointVal: val, currentBalance: runningBalance, status: rule ? rule.penalty : '-' };
        });
    }, [logs, showSanctionHistory, sanctionRules]);

    return (
        <div className={`text-slate-900 ${isPrintVersion ? 'text-sm' : 'p-8'}`} style={fontStyle}>
            
            {/* KOP SURAT */}
            <div className="mb-6">
                <div className="grid grid-cols-[80px_1fr_80px] gap-4 items-center mb-2">
                    <div className="flex justify-center items-center h-20 w-20">
                        {settings?.logo && <img src={settings.logo} alt="Logo 1" className="max-h-full max-w-full object-contain"/>}
                    </div>
                    <div className="text-center">
                        <h3 className="font-normal text-black uppercase leading-tight text-[12pt]">{settings?.government || 'PEMERINTAH PROVINSI...'}</h3>
                        <h3 className="font-normal text-black uppercase leading-tight text-[12pt]">{settings?.department || 'DINAS PENDIDIKAN'}</h3>
                        <h1 className="font-bold text-black uppercase leading-tight my-1 text-[14pt]">{settings?.name || 'NAMA SEKOLAH'}</h1>
                        <p className="font-normal text-black text-[10pt] leading-tight">{settings?.address || 'Alamat Sekolah...'}</p>
                        {settings?.address2 && <p className="font-normal italic text-black text-[10pt] leading-tight">{settings.address2}</p>}
                    </div>
                    <div className="flex justify-center items-center h-20 w-20">
                        {settings?.logo2 && <img src={settings.logo2} alt="Logo 2" className="max-h-full max-w-full object-contain"/>}
                    </div>
                </div>
                <div className="border-b-4 border-double border-black w-full"></div>
            </div>

            <div className="text-center mb-8">
                <h2 className="text-[12pt] font-bold underline uppercase tracking-wide">BUKU CATATAN REKAM JEJAK SISWA</h2>
            </div>

            {/* IDENTITAS SISWA (CLASS no-border-table DITAMBAHKAN) */}
            <table className="w-full mb-6 text-[10pt] font-bold no-border-table">
                <tbody>
                    <tr><td className="w-32 py-1">Nama Siswa</td><td>: {student.name}</td><td className="w-32">Kelas</td><td>: {student.class}</td></tr>
                    <tr><td className="py-1">NISN</td><td>: {student.nisn || '-'}</td><td>Jenis Kelamin</td><td>: {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td></tr>
                    <tr><td className="py-1">Wali Kelas</td><td>: {student.homeroomTeacher || '-'}</td><td>Guru Wali</td><td>: {student.guardianTeacher || '-'}</td></tr>
                    <tr><td className="py-1">Thn Ajaran</td><td colSpan="3">: {settings?.academicYear || '-'} / {settings?.semester || '-'}</td></tr>
                </tbody>
            </table>

            {/* RINGKASAN (BERBASIS PASAL / POIN) */}
            {isPasal ? (
            <table className="w-full border-collapse border border-black mb-6 text-center text-[10pt]">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-2">Pelanggaran Ringan</th>
                        <th className="border border-black p-2">Pelanggaran Sedang</th>
                        <th className="border border-black p-2">Pelanggaran Berat</th>
                        <th className="border border-black p-2">Prestasi</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border border-black p-2 font-bold text-red-600">{pasalStatus?.raw.ringan}</td>
                        <td className="border border-black p-2 font-bold text-red-600">{pasalStatus?.efektif.sedang}</td>
                        <td className="border border-black p-2 font-bold text-red-600">{pasalStatus?.efektif.berat}</td>
                        <td className="border border-black p-2 font-bold text-green-600">{achievementLogs.length}</td>
                    </tr>
                </tbody>
            </table>
            ) : (
            <table className="w-full border-collapse border border-black mb-6 text-center text-[10pt]">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-2 w-1/3">Poin Pelanggaran</th>
                        <th className="border border-black p-2 w-1/3">Poin Prestasi</th>
                        <th className="border border-black p-2 w-1/3">Selisih Poin</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border border-black p-2 font-bold text-red-600">{violationTotal}</td>
                        <td className="border border-black p-2 font-bold text-green-600">{achievementTotal}</td>
                        <td className={`border border-black p-2 font-bold ${scoreColorClass}`}>{displayScore}</td>
                    </tr>
                </tbody>
            </table>
            )}

            {/* STATUS SANKSI BERBASIS PASAL */}
            {isPasal && pasalStatus && pasalStatus.totalPelanggaran > 0 && (
                <div className="mb-6">
                    <h3 className="font-bold text-[10pt] uppercase mb-1 text-red-700">Status Sanksi (Berbasis Pasal)</h3>
                    <table className="w-full border-collapse border border-black text-[9pt]">
                        <thead>
                            <tr className="bg-red-50 text-center">
                                <th className="border border-black p-1">Ambang SP Tercapai</th>
                                <th className="border border-black p-1">Tindakan</th>
                                <th className="border border-black p-1">Menuju SP Berikutnya</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-black p-1 text-center font-bold">{pasalStatus.spTercapai ? pasalStatus.spTercapai.level : 'Belum mencapai SP'}</td>
                                <td className="border border-black p-1">{pasalStatus.spTercapai ? (pasalStatus.spTercapai.tindakan || '-') : '-'}</td>
                                <td className="border border-black p-1 text-center">{pasalStatus.menujuSp ? `${pasalStatus.menujuSp.level}: kurang ${pasalStatus.menujuSp.kurang}` : 'Tertinggi'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* KETENTUAN SANKSI (POIN) */}
            {!isPasal && isDeficit && activeSanction && (
                <div className="mb-6">
                    <h3 className="font-bold text-[10pt] uppercase mb-1 text-red-700">Tindak Lanjut & Sanksi Saat Ini</h3>
                    <table className="w-full border-collapse border border-black text-[9pt]">
                        <thead>
                            <tr className="bg-gray-100 text-center"><th className="border border-black p-1">Range</th><th className="border border-black p-1">Tindak Lanjut</th><th className="border border-black p-1">Sanksi</th></tr>
                        </thead>
                        <tbody>
                            <tr className="bg-yellow-50 font-bold"><td className="border border-black p-2 text-center text-red-600">{activeSanction.min} - {activeSanction.max}</td><td className="border border-black p-2">{activeSanction.action}</td><td className="border border-black p-2">{activeSanction.penalty}</td></tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* RIWAYAT SANKSI */}
            {showSanctionHistory && !isPasal && (
                <div className="mb-6">
                    <h3 className="font-bold text-[10pt] uppercase border-b border-black pb-1 mb-2 text-amber-700">Riwayat Perubahan Poin</h3>
                    <table className="w-full border-collapse border border-black text-[9pt]">
                        <thead>
                            <tr className="bg-amber-50 text-center"><th className="border border-black p-1 w-8">No</th><th className="border border-black p-1 w-20">Tanggal</th><th className="border border-black p-1">Keterangan</th><th className="border border-black p-1 w-12">Ubah</th><th className="border border-black p-1 w-12">Total</th><th className="border border-black p-1">Status</th></tr>
                        </thead>
                        <tbody>
                            {sanctionHistoryRows.map((row, i) => (
                                <tr key={i}>
                                    <td className="border border-black p-1 text-center">{i+1}</td>
                                    <td className="border border-black p-1 text-center">{formatIndoDate(row.date)}</td>
                                    <td className="border border-black p-1"><span className="text-[8pt] text-slate-500 uppercase block">{row.isViolation?'Pelanggaran':'Prestasi'}</span>{row.description}</td>
                                    <td className={`border border-black p-1 text-center font-bold ${row.isViolation?'text-red-600':'text-green-600'}`}>{row.isViolation?'+':'-'}{row.pointVal}</td>
                                    <td className="border border-black p-1 text-center font-bold">{row.currentBalance}</td>
                                    <td className="border border-black p-1 text-[8pt] text-center">{row.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* A. PELANGGARAN */}
            <div className="mb-6">
                <h3 className="font-bold text-[10pt] uppercase border-b border-black pb-1 mb-2 text-red-700">A. Catatan Pelanggaran</h3>
                <table className="w-full border-collapse border border-black text-[9pt]">
                    <thead>
                        <tr className="bg-slate-100 text-center"><th className="border border-black p-1 w-8">No</th><th className="border border-black p-1 w-24">Tanggal</th><th className="border border-black p-1">Uraian</th><th className="border border-black p-1 w-24">{isPasal ? 'Kategori' : 'Poin'}</th></tr>
                    </thead>
                    <tbody>
                        {violationLogs.length>0 ? violationLogs.map((log,i)=>(
                            <tr key={log.id}><td className="border border-black p-1 text-center">{i+1}</td><td className="border border-black p-1 text-center">{formatIndoDate(log.date)}</td><td className="border border-black p-1">{log.description}</td><td className="border border-black p-1 text-center font-bold text-red-600">{isPasal ? (KATEGORI_LABEL[log.kategori] || '-') : log.value}</td></tr>
                        )) : <tr><td colSpan="4" className="border border-black p-2 text-center italic">Nihil.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* B. PRESTASI */}
            <div className="mb-6">
                <h3 className="font-bold text-[10pt] uppercase border-b border-black pb-1 mb-2 text-green-700">B. Catatan Prestasi</h3>
                <table className="w-full border-collapse border border-black text-[9pt]">
                    <thead>
                        <tr className="bg-slate-100 text-center"><th className="border border-black p-1 w-8">No</th><th className="border border-black p-1 w-24">Tanggal</th><th className="border border-black p-1">Uraian</th><th className="border border-black p-1 w-24">{isPasal ? 'Bidang' : 'Poin'}</th></tr>
                    </thead>
                    <tbody>
                        {achievementLogs.length>0 ? achievementLogs.map((log,i)=>(
                            <tr key={log.id}><td className="border border-black p-1 text-center">{i+1}</td><td className="border border-black p-1 text-center">{formatIndoDate(log.date)}</td><td className="border border-black p-1">{log.description}</td><td className="border border-black p-1 text-center font-bold text-green-600">{isPasal ? (log.bidang || '-') : log.value}</td></tr>
                        )) : <tr><td colSpan="4" className="border border-black p-2 text-center italic">Nihil.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* C. KONSELING (MODIFIKASI: LEBIH RAPAT & KOLOM LEBAR) */}
            {showCounselingHistory && (
                <div className="mb-6">
                    <h3 className="font-bold text-[10pt] uppercase border-b border-black pb-1 mb-2 text-blue-800">C. Riwayat Layanan Bimbingan Konseling</h3>
                    {counselingPrivacy === 'mask' && <p className="text-[8pt] italic mb-1 text-slate-500">*Topik privasi disamarkan.</p>}
                    <table className="w-full border-collapse border border-black text-[9pt] compact-table">
                        <thead>
                            <tr className="bg-slate-100 text-center"><th className="border border-black p-1 w-8">No</th><th className="border border-black p-1 w-20">Tanggal</th><th className="border border-black p-1 w-56">Layanan</th><th className="border border-black p-1">Masalah</th><th className="border border-black p-1 w-32">TL</th></tr>
                        </thead>
                        <tbody>
                            {counselingHistory.length>0 ? counselingHistory.map((h,i)=>{
                                const isPrivate = h.isPrivate || (h.serviceType && h.serviceType.toLowerCase().includes('pribadi'));
                                const isMasked = isPrivate && counselingPrivacy==='mask';
                                return (
                                    <tr key={h.id}>
                                        {/* Padding dibuat sangat rapat: px-1 py-0.5 */}
                                        <td className="border border-black px-1 py-0.5 text-center">{i+1}</td>
                                        <td className="border border-black px-1 py-0.5 text-center">{formatIndoDate(h.date)}</td>
                                        {/* KOLOM GABUNGAN (JENIS LAYANAN & DETAIL) */}
                                        <td className="border border-black px-1 py-0.5 text-left align-top">
                                            {/* Margin bottom dikurangi */}
                                            <div className="font-bold underline mb-0 flex items-center gap-1">
                                                {h.serviceType}
                                                {/* Indikator gembok jika privasi */}
                                                {isPrivate && <Lock size={10} className="text-red-500" />}
                                            </div>
                                            {/* Line height dirapatkan, margin dihapus */}
                                            <div className="text-[8pt] leading-tight">
                                                <div><span className="font-bold">Bidang:</span> {h.skkpd || '-'}</div>
                                                <div><span className="font-bold">Kategori:</span> {h.category || '-'}</div>
                                                <div><span className="font-bold">Teknik:</span> {h.technique || '-'}</div>
                                            </div>
                                        </td>
                                        
                                        {/* KOLOM TOPIK (MASKING) */}
                                        <td className="border border-black px-1 py-0.5 text-left align-top">
                                            <div className={`text-sm ${isMasked ? 'italic text-gray-400' : ''} leading-tight`}>
                                                {isMasked ? '--- Privasi (Disamarkan) ---' : h.description}
                                            </div>
                                        </td>
                                        
                                        <td className="border border-black px-1 py-0.5 align-top leading-tight">{h.followUp}</td>
                                    </tr>
                                )
                            }) : <tr><td colSpan="5" className="border border-black p-2 text-center italic">Belum ada riwayat.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {/* TANDA TANGAN (DINAMIS) */}
            <SignatureBlocks items={buildSignerItems(settings, student, signOptions)} />
        </div>
    );
};

export default StudentPointBook;