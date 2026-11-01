import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';

const LetterPrintModal = ({ isOpen, onClose, contentRef }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm print:p-0 print:bg-white print:static print:block">
            
            <div className="bg-white w-full max-w-[215mm] h-[90vh] md:h-auto md:aspect-[210/297] shadow-2xl rounded-xl overflow-hidden flex flex-col print:shadow-none print:rounded-none print:w-auto print:h-auto print:max-w-none print:block print:overflow-visible">
                
                <div className="bg-slate-800 text-white p-4 flex justify-between items-center print:hidden flex-shrink-0">
                    <div>
                        <h2 className="font-bold flex items-center gap-2 text-lg"><Printer size={20}/> Pratinjau Cetak</h2>
                        <p className="text-xs text-slate-400 mt-1">Halaman kosong di awal sudah diperbaiki.</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose} 
                            className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <X size={16}/> Tutup
                        </button>
                        <button 
                            onClick={handlePrint} 
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/50 flex items-center gap-2 transition-all active:scale-95"
                        >
                            <Printer size={18}/> Cetak Sekarang
                        </button>
                    </div>
                </div>

                <div className="flex-1 bg-white overflow-y-auto print:overflow-visible print:h-auto print:block">
                    
                    <style>{`
                        /* CSS untuk Tampilan Layar (Konsisten dengan Editor) */
                        .letter-content {
                            padding: 2.5cm; 
                            color: black;
                            line-height: 1.15; /* Sesuai Editor */
                            font-size: 12pt;
                        }

                        /* RESET LIST & MARGIN (Wajib agar numbering muncul) */
                        .letter-content ul { list-style-type: disc !important; padding-left: 2rem !important; margin-bottom: 0.5rem; margin-top: 0; }
                        .letter-content ol { list-style-type: decimal !important; padding-left: 2rem !important; margin-bottom: 0.5rem; margin-top: 0; }
                        .letter-content li { margin-bottom: 0; }
                        .letter-content table { border-collapse: collapse; width: 100%; }
                        .letter-content p { margin-bottom: 0.5rem; margin-top: 0; }

                        /* --- CSS KHUSUS CETAK --- */
                        @media print {
                            /* Sembunyikan Aplikasi Utama */
                            #root, #main-app, .no-print {
                                display: none !important;
                            }

                            /* Reset Body & HTML */
                            html, body {
                                height: auto !important;
                                overflow: visible !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                background: white !important;
                            }

                            /* Reset Modal Wrapper */
                            div[class*="fixed"] {
                                position: static !important;
                                display: block !important;
                                background: white !important;
                                height: auto !important;
                                width: auto !important;
                                margin: 0 !important;
                                padding: 0 !important;
                            }

                            /* Atur Area Cetak */
                            #print-area {
                                position: relative !important;
                                display: block !important;
                                width: 100% !important;
                                height: auto !important;
                                left: 0 !important;
                                top: 0 !important;
                                margin: 0 !important;
                                padding: 0 !important;
                            }

                            /* Hapus padding konten agar margin kertas yang mengatur */
                            .letter-content {
                                padding: 0 !important; 
                                margin: 0 !important;
                                width: 100% !important;
                            }

                            /* Aturan Kertas Dinamis */
                            @page {
                                size: auto;   
                                margin: 2cm;  
                            }
                        }
                    `}</style>
                    
                    <div id="print-area">
                        <div 
                            className="letter-content font-serif"
                            dangerouslySetInnerHTML={{ __html: contentRef }} 
                        />
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
};

export default LetterPrintModal;