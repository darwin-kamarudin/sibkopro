import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const StudentMobileList = ({ students, isMoveMode, selectedIds, onSelectOne, onView, onEdit, onDelete }) => {
    return (
        <div className="md:hidden space-y-3">
            {students.map((student) => (
                <div 
                    key={student.id} 
                    onClick={() => onView(student)} // <--- KLIK KARTU UNTUK DETAIL
                    className={`
                        bg-white p-4 rounded-xl shadow-sm border active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden
                        ${selectedIds.includes(student.id) ? 'border-orange-400 bg-orange-50' : 'border-slate-200'}
                    `}
                >
                    <div className="flex items-start justify-between relative z-10">
                        <div className="flex gap-3 items-start">
                            {isMoveMode && (
                                <div onClick={(e) => e.stopPropagation()} className="pt-1 pr-2">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.includes(student.id)} 
                                        onChange={() => onSelectOne(student.id)} 
                                        className="w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                    />
                                </div>
                            )}
                            <div>
                                <h3 className="font-bold text-slate-800 leading-tight mb-1">{student.name}</h3>
                                <p className="text-xs text-slate-400 mb-2 font-medium">NISN: {student.nisn || '-'}</p>
                                <div className="flex flex-wrap gap-2 text-[10px]">
                                    <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-1 rounded font-bold">Kls {student.class || '?'}</span>
                                    <span className="bg-slate-100 px-2 py-1 rounded font-bold text-slate-600">{student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                                    {student.phone && <span className="bg-slate-100 px-2 py-1 rounded flex items-center gap-1">📞 {student.phone}</span>}
                                </div>
                            </div>
                        </div>
                        
                        {/* MENGGUNAKAN e.stopPropagation() AGAR TIDAK MEMBUKA MODAL */}
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <button 
                                onClick={() => onEdit(student)} // MENGIRIM SELURUH DATA SISWA
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                                title="Edit"
                            >
                                <Edit size={18}/>
                            </button>
                            <button 
                                onClick={() => onDelete(student.id)} 
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                title="Hapus"
                            >
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
            
            {students.length === 0 && (
                <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    <p className="text-sm">Tidak ada data siswa.</p>
                </div>
            )}
        </div>
    );
};

export default StudentMobileList;