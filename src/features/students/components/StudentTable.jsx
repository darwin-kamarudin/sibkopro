import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const StudentTable = ({ students, isMoveMode, selectedIds, onSelectAll, onSelectOne, onView, onEdit, onDelete }) => {
    return (
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                    <tr>
                        {isMoveMode && (
                            <th className="w-10 px-6 py-4">
                                <input type="checkbox" onChange={onSelectAll} className="w-4 h-4 rounded border-slate-300 cursor-pointer"/>
                            </th>
                        )}
                        <th className="px-6 py-4">Nama Siswa</th>
                        <th className="px-6 py-4">Kelas</th>
                        <th className="px-6 py-4">L/P</th>
                        <th className="px-6 py-4">Wali</th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {students.map((student) => (
                        <tr 
                            key={student.id} 
                            onClick={() => onView(student)} // <--- KLIK BARIS UNTUK DETAIL
                            className={`
                                hover:bg-slate-50 transition-colors cursor-pointer
                                ${selectedIds.includes(student.id) ? 'bg-orange-50/50' : ''}
                            `}
                        >
                            {isMoveMode && (
                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.includes(student.id)} 
                                        onChange={() => onSelectOne(student.id)} 
                                        className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                    />
                                </td>
                            )}
                            <td className="px-6 py-4 font-bold text-slate-700">
                                <div>{student.name}</div>
                                <div className="text-xs text-slate-400 font-medium">{student.nisn || 'NISN -'}</div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">{student.class || 'Belum Diatur'}</span>
                            </td>
                            <td className="px-6 py-4">{student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                            <td className="px-6 py-4">
                                <div className="font-semibold text-slate-700">{student.parent || '-'}</div>
                                <div className="text-xs text-slate-500">{student.phone}</div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                {/* MENGGUNAKAN e.stopPropagation() AGAR TIDAK MEMBUKA MODAL */}
                                <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        onClick={() => onEdit(student)} // MENGIRIM SELURUH DATA SISWA
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                                        title="Edit Data"
                                    >
                                        <Edit size={18}/>
                                    </button>
                                    <button 
                                        onClick={() => onDelete(student.id)} 
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                        title="Hapus Siswa"
                                    >
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {students.length === 0 && (
                        <tr><td colSpan={isMoveMode ? 6 : 5} className="p-8 text-center text-slate-400 italic">Data siswa tidak ditemukan.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default StudentTable;