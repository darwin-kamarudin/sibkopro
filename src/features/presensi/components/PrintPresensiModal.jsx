import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
    X, Printer, Download, ChevronLeft, 
    FileText, Clock, FileImage, RectangleVertical, 
    RectangleHorizontal, Eye, Calendar, Laptop
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatIndoDate } from '../../../common/utils/helpers';

const MONTHS = [
    { v: '01', l: 'Januari' }, { v: '02', l: 'Februari' }, { v: '03', l: 'Maret' },
    { v: '04', l: 'April' }, { v: '05', l: 'Mei' }, { v: '06', l: 'Juni' },
    { v: '07', l: 'Juli' }, { v: '08', l: 'Agustus' }, { v: '09', l: 'September' },
    { v: '10', l: 'Oktober' }, { v: '11', l: 'November' }, { v: '12', l: 'Desember' }
];

const PrintPresensiModal = ({ isOpen, onClose, logs = [], settings, userName }) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    
    // --- STATE FILTER PERIODE ---
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const currentYear = new Date().getFullYear().toString();
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);

    // --- OPSI CETAK DINAMIS ---
    const [showLetterhead, setShowLetterhead] = useState(true);
    const [orientation, setOrientation] = useState('landscape'); 
    const [paperSize, setPaperSize] = useState('a4'); 
    const [signOptions, setSignOptions] = useState({ counselor: true, principal: true });

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setPreviewUrl(null);
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    useEffect(() => {
        return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
    }, [previewUrl]);

    // --- FILTER DATA ---
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const logDate = new Date(log.date);
            const m = (logDate.getMonth() + 1).toString().padStart(2, '0');
            const y = logDate.getFullYear().toString();
            return m === selectedMonth && y === selectedYear;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [logs, selectedMonth, selectedYear]);

    if (!isOpen) return null;

    // --- FUNGSI GENERATE PDF ---
    const createPDFDoc = () => {
        const format = paperSize === 'f4' ? [215, 330] : 'a4';
        const doc = new jsPDF({ orientation, unit: 'mm', format });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const centerX = pageWidth / 2;
        const margin = 14;
        
        // 1. KOP SEKOLAH
        let currentY = 20; 
        if (showLetterhead) {
            currentY = 12;
            doc.setFont('helvetica', 'normal').setFontSize(11);
            doc.text((settings?.government || 'PEMERINTAH PROVINSI ...').toUpperCase(), centerX, currentY, { align: 'center' });
            currentY += 6;
            doc.text((settings?.department || 'DINAS PENDIDIKAN').toUpperCase(), centerX, currentY, { align: 'center' });
            currentY += 7;
            doc.setFont('helvetica', 'bold').setFontSize(14);
            doc.text((settings?.name || 'NAMA SEKOLAH').toUpperCase(), centerX, currentY, { align: 'center' });
            currentY += 5;
            doc.setFont('helvetica', 'normal').setFontSize(9);
            doc.text(settings?.address || 'Alamat Sekolah...', centerX, currentY, { align: 'center' });
            
            if (settings?.logo) try { doc.addImage(settings.logo, 'PNG', 12, 10, 22, 22); } catch (e) {}
            if (settings?.logo2) try { doc.addImage(settings.logo2, 'PNG', pageWidth - 34, 10, 22, 22); } catch (e) {}

            currentY += 8;
            doc.setLineWidth(0.5).line(10, currentY, pageWidth - 10, currentY); 
            currentY += 10;
        } else {
            currentY = 20;
        }

        // 2. JUDUL DOKUMEN
        doc.setFont('helvetica', 'bold').setFontSize(12); 
        const titleText = 'LAPORAN REKAPAN PRESENSI DAN KEDISIPLINAN SISWA';
        doc.text(titleText, centerX, currentY, { align: 'center' });
        
        const titleWidth = doc.getTextWidth(titleText);
        doc.setLineWidth(0.3).line(centerX - titleWidth/2, currentY + 1.5, centerX + titleWidth/2, currentY + 1.5);
        
        currentY += 8;
        doc.setFontSize(10);
        const monthLabel = MONTHS.find(m => m.v === selectedMonth)?.l;
        doc.text(`PERIODE: ${monthLabel.toUpperCase()} ${selectedYear}`, centerX, currentY, { align: 'center' });
        
        currentY += 6;
        doc.setFont('helvetica', 'italic').setFontSize(8).setTextColor(100);
        doc.text(`Dicetak oleh: ${userName}`, centerX, currentY, { align: 'center' });
        doc.setTextColor(0); 
        
        currentY += 8;

        // 3. TABEL UTAMA (AUTOFIT OTOMATIS)
        autoTable(doc, {
            startY: currentY,
            head: [["No", "Hari / Tanggal", "Nama Siswa", "Kelas", "Status", "Waktu", "Keterangan"]],
            body: filteredLogs.map((log, index) => {
                const dateObj = new Date(log.date);
                const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                const dayName = days[dateObj.getDay()];
                const d = String(dateObj.getDate()).padStart(2, '0');
                const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                const y = dateObj.getFullYear();
                
                return [
                    index + 1,
                    `${dayName}, ${d}-${m}-${y}`, // Format permintaan: Hari, DD-MM-YYYY
                    log.studentName,
                    log.studentClass,
                    log.status,
                    `${log.jamMulai} ${log.jamSelesai ? 's/d ' + log.jamSelesai : ''}`,
                    log.keterangan || '-'
                ];
            }),
            theme: 'grid',
            headStyles: { 
                fillColor: [240, 240, 240], 
                textColor: [0, 0, 0], 
                fontStyle: 'bold', 
                halign: 'center', 
                valign: 'middle', 
                fontSize: 8.5, 
                lineWidth: 0.1 
            },
            styles: { 
                font: 'helvetica', 
                fontSize: 8, 
                cellPadding: 1.5, 
                lineWidth: 0.1,
                valign: 'middle' // Permintaan: Rata tengah vertikal
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 'wrap' }, // Nomor menyusut sesuai isi
                1: { cellWidth: 'auto' }, // Hari/Tanggal otomatis
                2: { cellWidth: 'auto' }, // Nama Siswa otomatis mengikuti panjang nama
                3: { halign: 'center', cellWidth: 'wrap' }, // Kelas menyusut sesuai isi
                4: { cellWidth: 'auto' },
                5: { cellWidth: 'auto' },
                6: { cellWidth: 'auto' }
            },
            margin: { left: margin, right: margin },
            tableWidth: 'auto', // Membiarkan library menghitung lebar total
        });

        // 4. TANDA TANGAN
        let finalY = doc.lastAutoTable.finalY + 15;
        if (finalY > pageHeight - 65) { doc.addPage(); finalY = 20; }

        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const city = settings?.city || 'Tempat';
        doc.setFontSize(10).setFont('helvetica', 'normal');

        const renderSigBlock = (title, name, nip, xPos, isRightSide) => {
            if (isRightSide) doc.text(`${city}, ${dateStr}`, xPos, finalY, { align: 'center' });
            doc.text(title, xPos, finalY + 5, { align: 'center' });
            doc.setFont('helvetica', 'bold');
            doc.text(name || '(....................................)', xPos, finalY + 28, { align: 'center' });
            const nWidth = doc.getTextWidth(name || '....................................');
            doc.line(xPos - (nWidth/2) - 2, finalY + 29, xPos + (nWidth/2) + 2, finalY + 29);
            doc.setFont('helvetica', 'normal');
            if(nip) doc.text(`NIP. ${nip}`, xPos, finalY + 34, { align: 'center' });
        };

        if (signOptions.principal && signOptions.counselor) {
            doc.text("Mengetahui,", 50, finalY, { align: 'center' });
            renderSigBlock('Kepala Sekolah', settings?.headmaster, settings?.nipHeadmaster, 50, false);
            renderSigBlock('Guru BK / Konselor', userName, settings?.nipCounselor, pageWidth - 50, true);
        } else if (signOptions.counselor) {
            renderSigBlock('Guru BK / Konselor', userName, settings?.nipCounselor, pageWidth - 50, true);
        }

        // 5. FOOTER
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(7).setTextColor(150).setFont('helvetica', 'italic');
            const now = new Date();
            const footerText = `Dicetak dengan (SIBKo Digital) pada tanggal ${formatIndoDate(now)}.`;
            doc.text(footerText, margin, pageHeight - 8);
            doc.text(`Hal. ${i} dari ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
        }

        return doc;
    };

    const handlePreview = () => {
        if (filteredLogs.length === 0) return alert("Tidak ada data pada periode ini.");
        const doc = createPDFDoc();
        setPreviewUrl(URL.createObjectURL(doc.output('blob')));
    };

    const years = Array.from({length: 5}, (_, i) => (parseInt(currentYear) - 2 + i).toString());

    return createPortal(
        <div className="fixed inset-0 z-[99999] bg-white flex flex-col h-screen w-screen overflow-hidden">
            {/* TOOLBAR */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-sm sticky top-0 z-[100] gap-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"><ChevronLeft size={28}/></button>
                    <div>
                        <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                            {previewUrl ? <FileText size={24} className="text-red-600"/> : <Printer size={24} className="text-blue-600"/>} 
                            {previewUrl ? 'Pratinjau Laporan PDF' : 'Daftar Data & Opsi Cetak'}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2"><Laptop size={14}/> SIBKo Digital v.1.0</p>
                    </div>
                </div>

                {!previewUrl && (
                    <div className="flex flex-wrap gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 items-center">
                        <div className="flex items-center gap-2 px-2 bg-white rounded border border-slate-200 shadow-sm">
                            <Calendar size={14} className="text-blue-500"/>
                            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="text-xs font-bold py-1.5 outline-none bg-transparent">
                                {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                            </select>
                            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="text-xs font-bold py-1.5 outline-none bg-transparent border-l pl-2 ml-1">
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="flex bg-white rounded border border-slate-200 p-1 gap-1 shadow-sm">
                            <button onClick={() => setOrientation('portrait')} className={`p-1 rounded ${orientation === 'portrait' ? 'bg-blue-100 text-blue-700' : 'text-slate-400'}`}><RectangleVertical size={14}/></button>
                            <button onClick={() => setOrientation('landscape')} className={`p-1 rounded ${orientation === 'landscape' ? 'bg-blue-100 text-blue-700' : 'text-slate-400'}`}><RectangleHorizontal size={14}/></button>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm"><input type="checkbox" checked={showLetterhead} onChange={() => setShowLetterhead(!showLetterhead)} className="rounded text-blue-600"/> Kop</label>
                        <div className="w-px h-6 bg-slate-300 mx-1"></div>
                        <label className="flex items-center gap-1 text-xs font-medium cursor-pointer"><input type="checkbox" checked={signOptions.counselor} onChange={() => setSignOptions(p => ({...p, counselor: !p.counselor}))} className="rounded text-blue-600"/> Guru BK</label>
                        <label className="flex items-center gap-1 text-xs font-medium cursor-pointer"><input type="checkbox" checked={signOptions.principal} onChange={() => setSignOptions(p => ({...p, principal: !p.principal}))} className="rounded text-blue-600"/> Kepsek</label>
                    </div>
                )}
                
                <div className="flex items-center gap-3">
                    {previewUrl ? (
                        <>
                            <button onClick={() => setPreviewUrl(null)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><ChevronLeft size={18}/> Kembali</button>
                            <button onClick={() => createPDFDoc().save(`Laporan_Presensi_${MONTHS.find(m=>m.v===selectedMonth).l}.pdf`)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md active:scale-95 transition-all"><Download size={18}/> Simpan PDF</button>
                        </>
                    ) : (
                        <button onClick={handlePreview} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all active:scale-95 shadow-sm border border-blue-200"><Printer size={18}/> Cetak Rekapan</button>
                    )}
                    <button onClick={onClose} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full transition-colors ml-2"><X size={28}/></button>
                </div>
            </div>

            {/* BODY KONTEN PREVIEW */}
            <div className="flex-1 overflow-hidden bg-slate-100">
                {previewUrl ? (
                    <iframe src={previewUrl} className="w-full h-full border-none shadow-inner" title="PDF Preview" />
                ) : (
                    <div className="h-full overflow-y-auto p-4 md:p-8 flex justify-center">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-full max-w-6xl h-fit">
                            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <h4 className="font-bold text-slate-700 flex items-center gap-2"><Eye size={18} className="text-blue-600"/> Data Terpilih ({filteredLogs.length})</h4>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-center">No</th>
                                        <th className="px-6 py-4">Tanggal</th>
                                        <th className="px-6 py-4">Nama Siswa</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Waktu</th>
                                        <th className="px-6 py-4">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredLogs.map((log, idx) => {
                                        const dateObj = new Date(log.date);
                                        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                                        const d = String(dateObj.getDate()).padStart(2, '0');
                                        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                                        return (
                                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                                                <td className="px-6 py-4 font-medium">{days[dateObj.getDay()]}, {d}-{m}-{dateObj.getFullYear()}</td>
                                                <td className="px-6 py-4 font-bold text-slate-800">{log.studentName} <br/><span className="text-[10px] text-slate-400 uppercase font-bold">{log.studentClass}</span></td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${log.status.includes('Bolos') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{log.jamMulai}</td>
                                                <td className="px-6 py-4 text-slate-500 italic text-xs leading-relaxed">{log.keterangan || '-'}</td>
                                            </tr>
                                        );
                                    })}
                                    {filteredLogs.length === 0 && (
                                        <tr><td colSpan="6" className="p-24 text-center">
                                            <div className="flex flex-col items-center gap-3 text-slate-400">
                                                <Calendar size={48} className="opacity-20"/>
                                                <p className="italic text-sm font-medium">Tidak ada data untuk periode ini.</p>
                                            </div>
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default PrintPresensiModal;