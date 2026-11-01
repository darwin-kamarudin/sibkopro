import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, or } from 'firebase/firestore';
import { db } from '../../common/config/firebase';
import { FileText, Settings } from 'lucide-react';

// Import Komponen Pecahan
import LetterCreator from './components/LetterCreator';
import TemplateEditor from './components/TemplateEditor';

export default function LetterManager({ students, user, settings, pointLogs, masterPoints, sanctionRules }) {
    const [activeTab, setActiveTab] = useState('create'); 
    const [templates, setTemplates] = useState([]);

    // --- FETCH TEMPLATES (GABUNGAN GLOBAL & PRIBADI) ---
    useEffect(() => {
        if (!user) return;

        let q;
        
        if (user.role === 'admin') {
            // Admin melihat SEMUA template (Global + Punya Semua Guru - Opsional, 
            // tapi biasanya Admin fokus ke Global. Di sini kita ambil Global saja atau Semua)
            // Untuk simpel: Admin mengambil semua template yang isGlobal=true ATAU miliknya sendiri
            q = query(
                collection(db, 'letter_templates'), 
                or(
                    where("isGlobal", "==", true),
                    where("teacherId", "==", user.id)
                )
            );
        } else {
            // Guru mengambil: Template Global (isGlobal == true) GABUNG Template Pribadi (teacherId == user.id)
            q = query(
                collection(db, 'letter_templates'), 
                or(
                    where("isGlobal", "==", true),
                    where("teacherId", "==", user.id)
                )
            );
        }

        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
            
            // Urutkan: Global dulu, baru Pribadi
            const sortedData = data.sort((a, b) => {
                if (a.isGlobal === b.isGlobal) return a.title.localeCompare(b.title);
                return a.isGlobal ? -1 : 1;
            });
            
            setTemplates(sortedData);
        });

        return () => unsub();
    }, [user]);

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-blue-600"/> Persuratan Digital
                    </h1>
                    <p className="text-slate-500 text-sm">Buat dan kelola surat resmi BK dengan editor profesional.</p>
                </div>
                
                {/* Tab Navigation */}
                <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200">
                    <button 
                        onClick={() => setActiveTab('create')}
                        className={`px-5 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${activeTab === 'create' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <FileText size={16}/> Buat Surat
                    </button>
                    <button 
                        onClick={() => setActiveTab('templates')}
                        className={`px-5 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${activeTab === 'templates' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Settings size={16}/> Template Editor
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'create' && (
                <LetterCreator 
                    students={students} 
                    templates={templates} 
                    settings={settings} 
                    pointLogs={pointLogs} 
                    sanctionRules={sanctionRules} 
                    user={user}
                />
            )}

            {activeTab === 'templates' && (
                <TemplateEditor 
                    templates={templates} 
                    user={user} 
                    settings={settings} 
                />
            )}
        </div>
    );
}