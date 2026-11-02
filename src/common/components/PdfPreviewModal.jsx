import React, { useEffect, useState } from 'react';
import { Printer, Download, X, FileText } from 'lucide-react';

// ============================================================================
// PRATINJAU PDF (dipakai Buku Siswa & Buku Prestasi Siswa)
// buildDoc  : fungsi yang mengembalikan dokumen jsPDF
// fileName  : nama berkas saat diunduh
// guard     : fungsi (opsional) yang mengembalikan true jika boleh mencetak
// ============================================================================
const PdfPreviewModal = ({ isOpen, onClose, title, subtitle, buildDoc, fileName, guard, accent = 'blue' }) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setPreviewUrl(null);
            setError('');
            return;
        }
        if (guard && !guard()) {
            onClose();
            return;
        }
        try {
            const doc = buildDoc();
            setPreviewUrl(URL.createObjectURL(doc.output('blob')));
        } catch (e) {
            setError(e.message || 'Gagal membuat PDF');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
    }, [previewUrl]);

    const handleDownload = () => {
        try {
            if (guard && !guard()) return;
            const doc = buildDoc();
            doc.save(fileName);
        } catch (e) {
            alert('Gagal mengunduh PDF: ' + e.message);
        }
    };

    if (!isOpen) return null;

    const btn = accent === 'green' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700';

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex flex-col backdrop-blur-sm">
            <div className="bg-white border-b px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-3 flex-shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-red-50 p-2 rounded-lg text-red-600"><FileText size={20} /></div>
                    <div>
                        <h2 className="text-base font-bold text-slate-800 leading-tight">Pratinjau Dokumen PDF</h2>
                        <p className="text-xs text-slate-500">{title}{subtitle ? ` · ${subtitle}` : ''}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold flex items-center gap-2">
                        <X size={16} /> Tutup
                    </button>
                    <button onClick={handleDownload} className={`px-4 py-2 ${btn} text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-md`}>
                        <Download size={16} /> Unduh PDF
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden bg-slate-200 relative flex flex-col items-center">
                {error ? (
                    <div className="m-auto text-center text-red-600 font-bold p-6">{error}</div>
                ) : previewUrl ? (
                    <iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview" />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 font-bold animate-pulse flex-col gap-2">
                        <Printer size={32} className="opacity-50" /><span>Memproses PDF...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PdfPreviewModal;
