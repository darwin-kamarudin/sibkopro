import React from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';

// --- DATA KONSTANTA & HELPER ---
export const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const getAcademicPeriod = (monthIndex, year) => {
    if (monthIndex >= 6) { 
        return { semester: 'Ganjil', academicYear: `${year}/${year + 1}` };
    } else {
        return { semester: 'Genap', academicYear: `${year - 1}/${year}` };
    }
};

// --- KOMPONEN UI SHARED ---
export const KopSurat = ({ settings }) => (
    <div className="flex items-center justify-between border-b-4 border-double border-black pb-4 mb-6">
        <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
            {settings?.logo && <img src={settings.logo} className="h-full object-contain" alt="Logo" />}
        </div>
        <div className="flex-1 text-center px-4 min-w-0">
            <h3 className="font-bold text-black text-lg md:text-xl uppercase tracking-wide whitespace-nowrap leading-tight">
                {settings?.government || ''}
            </h3>
            <h3 className="font-bold text-black text-lg md:text-xl uppercase tracking-wide whitespace-nowrap leading-tight">
                {settings?.department || ''}
            </h3>
            <h1 className="font-extrabold text-black text-lg md:text-xl uppercase whitespace-nowrap leading-tight my-1">
                {settings?.name || 'NAMA SEKOLAH'}
            </h1>
            <div className="text-xs text-black font-serif italic leading-tight mt-1">
                <p>{settings?.address || 'Alamat Sekolah...'}</p>
                {settings?.address2 && <p>{settings.address2}</p>}
            </div>
        </div>
        <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
            {settings?.logo2 && <img src={settings.logo2} className="h-full object-contain" alt="Logo" />}
        </div>
    </div>
);

export const SignatureSection = ({ settings, dateLabel }) => (
    <div className="grid grid-cols-2 gap-10 mt-12 text-center text-sm font-serif signature-section">
        <div>
            <p>Mengetahui,</p>
            <p>Kepala Sekolah</p>
            <br/><br/><br/><br/>
            <p className="font-bold underline">{settings?.headmaster || '......................'}</p>
            <p>NIP. {settings?.nipHeadmaster || '......................'}</p>
        </div>
        <div>
            <p>{dateLabel || `${settings?.city || '...'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}</p>
            <p>Guru BK / Konselor</p>
            <br/><br/><br/><br/>
            <p className="font-bold underline">{settings?.counselor || '......................'}</p>
            <p>NIP. {settings?.nipCounselor || '......................'}</p>
        </div>
    </div>
);

export const PrintPreviewModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex flex-col animate-in fade-in duration-200 backdrop-blur-sm print:bg-white print:static">
            <style>{`
                @media print {
                    @page { size: auto; margin: 10mm; }
                    #root, .app-container, header, aside, nav { display: none !important; }
                    html, body { height: auto !important; overflow: visible !important; background-color: white !important; margin: 0 !important; padding: 0 !important; }
                    .print-portal-root { display: block !important; position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: auto !important; z-index: 9999 !important; background-color: white !important; }
                    .print-paper-content { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: none !important; }
                    .print-header-actions { display: none !important; }
                    .no-break { page-break-inside: avoid; }
                    table { width: 100% !important; border-collapse: collapse !important; }
                    tr { page-break-inside: avoid; }
                    td, th { border: 1px solid black !important; padding: 4px; color: black !important; }
                    .signature-section { page-break-inside: avoid; }
                }
            `}</style>

            <div className="bg-slate-800 text-white px-4 py-3 shadow-md flex justify-between items-center flex-shrink-0 border-b border-slate-700 print-header-actions">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                        <Printer size={20} className="text-blue-400"/> Pratinjau: {title}
                    </h2>
                    <p className="text-[10px] text-slate-400 hidden sm:block">
                        Pastikan orientasi kertas (Portrait/Landscape) sesuai kebutuhan di pengaturan printer.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">Tutup</button>
                    <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-blue-500/20 transition-all active:scale-95">
                        <Printer size={16}/> Cetak Sekarang
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-slate-900/50 print:bg-white print:p-0 print:overflow-visible print-portal-root">
                <div className="print-paper-content bg-white text-slate-900 shadow-2xl w-full max-w-[215mm] min-h-[297mm] p-10 md:p-14 origin-top h-fit mx-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};