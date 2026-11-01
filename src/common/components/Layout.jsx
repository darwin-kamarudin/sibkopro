import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; 
import { 
    Home, Users, BookOpen, Printer, Settings, UserCog, LogOut, 
    X, List, Trophy, Database, ChevronDown, ChevronRight, School,
    BookUser, Gavel, ClipboardList, Briefcase, Mail, Clock 
} from 'lucide-react';

const Layout = ({ children, userRole, userName, onLogout }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true); 
    const [expandedMenu, setExpandedMenu] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Reset Sidebar saat resize layar
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setSidebarOpen(false); 
            } else {
                setSidebarOpen(true);  
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSubMenu = (menuId) => {
        if (!sidebarOpen && window.innerWidth >= 768) {
            setSidebarOpen(true);
            setExpandedMenu(menuId);
        } else {
            // Logika Accordion: Ganti menu yang aktif, atau tutup jika diklik lagi
            setExpandedMenu(expandedMenu === menuId ? null : menuId);
        }
    };

    // --- DEFINISI MENU (DIPERBARUI) ---
    const menuItems = userRole === 'admin' 
        ? [
            { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
            { id: 'users', label: 'Manajemen User', icon: Users, path: '/users' },
            // [UPDATE] Menambahkan Menu Surat untuk Admin agar bisa buat Template Global
            { id: 'letters', label: 'Manajemen Surat', icon: Mail, path: '/letters' },
            { id: 'account', label: 'Profil Admin', icon: UserCog, path: '/account' } 
          ]
        : [
            { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
            { id: 'journal', label: 'Catat Layanan', icon: BookOpen, path: '/journal' },
            { id: 'students', label: 'Data Siswa', icon: Users, path: '/students' },
            
            // GROUP LAYANAN BK
            { 
                id: 'bk_services', label: 'BK Tools', icon: Briefcase, 
                children: [
                    { id: 'presensi', label: 'Presensi Siswa', icon: Clock, path: '/presensi' },
                    { id: 'points', label: 'Catat Poin Siswa', icon: Trophy, path: '/points' }, 
                    { id: 'point_book', label: 'Buku Poin Siswa', icon: BookUser, path: '/point-book' },
                    { id: 'sanction_book', label: 'Buku Sanksi Siswa', icon: Gavel, path: '/sanction-book' },
                    { id: 'counseling_history', label: 'Riwayat Konseling', icon: ClipboardList, path: '/counseling-history' },
                    { id: 'letters', label: 'Pembuatan Surat', icon: Mail, path: '/letters' },
                ]
            },
            
            { id: 'reports', label: 'Cetak Laporan', icon: Printer, path: '/reports' },

            // GROUP MASTER DATA
            { 
                id: 'master_data', label: 'Master Data', icon: Database, 
                children: [
                    { id: 'master_points', label: 'Master Poin & Sanksi', icon: List, path: '/master-points' }, 
                ]
            }, 

            { id: 'settings', label: 'Pengaturan Sekolah', icon: School, path: '/settings' },
            { id: 'account', label: 'Profil Saya', icon: UserCog, path: '/account' },
          ];

    const handleMenuClick = (item) => {
        if (item.children) {
            toggleSubMenu(item.id);
        } else {
            navigate(item.path);
            
            // Jika kita mengklik menu biasa (bukan grup), tutup semua dropdown grup yang sedang terbuka
            setExpandedMenu(null); 
            
            if (window.innerWidth < 768) setSidebarOpen(false); 
        }
    };

    const isActive = (path) => location.pathname === path;

    const getCurrentTitle = () => {
        const activeItem = menuItems.find(i => i.path === location.pathname) || 
                           menuItems.flatMap(i => i.children || []).find(c => c.path === location.pathname);
        return activeItem ? activeItem.label : 'Dashboard';
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
            {/* SIDEBAR */}
            <aside 
                className={`
                    fixed inset-y-0 left-0 z-40 bg-slate-900 text-white shadow-xl flex flex-col 
                    transition-all duration-300 ease-in-out
                    ${sidebarOpen ? 'w-64' : 'w-64 md:w-20'} 
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
            >
                {/* HEADER */}
                <div className="h-16 flex items-center justify-between px-0 md:px-0 bg-slate-950 shadow-md relative overflow-hidden">
                    <div className={`flex items-center gap-3 transition-all duration-300 w-full ${sidebarOpen ? 'px-6' : 'px-0 justify-center'}`}>
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/30">S</div>
                        <span className={`font-bold text-lg tracking-tight whitespace-nowrap transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                            SIBKO <span className="text-blue-400">App</span>
                        </span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden absolute right-4 text-slate-400 hover:text-white"><X size={24} /></button>
                </div>

                {/* MENU LIST */}
                <div className="flex-1 overflow-y-auto py-6 space-y-1 custom-scrollbar overflow-x-hidden">
                    {sidebarOpen && <div className="px-6 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider animate-in fade-in">Menu Utama</div>}
                    
                    {menuItems.map((item) => (
                        <div key={item.id} className="px-3">
                            <button
                                onClick={() => handleMenuClick(item)}
                                className={`
                                    w-full flex items-center relative py-2.5 rounded-lg mb-1 transition-all duration-200 group
                                    ${!sidebarOpen ? 'justify-center' : 'justify-between px-3'}
                                    ${isActive(item.path) || (item.children && expandedMenu === item.id)
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                                `}
                                title={!sidebarOpen ? item.label : ''}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={20} className={`flex-shrink-0 ${isActive(item.path) ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} ${!sidebarOpen && expandedMenu === item.id ? 'text-blue-400' : ''}`} />
                                    <span className={`font-medium text-sm whitespace-nowrap transition-all duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                                        {item.label}
                                    </span>
                                </div>
                                {item.children && sidebarOpen && (
                                    (expandedMenu === item.id) ? <ChevronDown size={16}/> : <ChevronRight size={16}/>
                                )}
                            </button>

                            {/* SUBMENU RENDER */}
                            {item.children && expandedMenu === item.id && sidebarOpen && (
                                <div className="ml-9 space-y-1 mb-2 border-l border-slate-700 pl-2 animate-in slide-in-from-top-2">
                                    {item.children.map((sub) => (
                                        <button
                                            key={sub.id}
                                            onClick={() => { navigate(sub.path); if(window.innerWidth < 768) setSidebarOpen(false); }}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                                isActive(sub.path) ? 'text-blue-400 font-bold bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${isActive(sub.path) ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                                            {sub.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t border-slate-800 bg-slate-900">
                    <button onClick={onLogout} className={`w-full flex items-center gap-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white py-2.5 rounded-lg transition-all duration-200 font-bold text-sm border border-red-900/30 hover:border-red-600 ${!sidebarOpen ? 'justify-center px-0' : 'justify-center px-4'}`} title="Keluar Aplikasi">
                        <LogOut size={18} />
                        <span className={`transition-all duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>Keluar</span>
                    </button>
                </div>
            </aside>

            {/* CONTENT */}
            <main className={`flex-1 flex flex-col h-screen overflow-hidden relative w-full transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0 print:hidden z-30">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"><List size={24}/></button>
                        <h2 className="font-bold text-lg text-slate-800 hidden sm:block">{getCurrentTitle()}</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold text-slate-700">{userName}</p>
                            <p className="text-xs text-slate-500 capitalize">{userRole === 'admin' ? 'Administrator' : 'Guru BK'}</p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm border border-blue-200 shadow-sm">{userName.charAt(0)}</div>
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-0 md:p-0 print:overflow-visible w-full relative bg-slate-50/50">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;