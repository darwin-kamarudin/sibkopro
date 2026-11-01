import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { query, where, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import { auth, getCollectionRef } from '../config/firebase';
import { COLLECTION_PATHS, INITIAL_ADMIN } from '../utils/constants';

const STORAGE_KEY = 'appUser_sibko';

/**
 * Mengelola sesi login: auth Firebase (anonymous), user aplikasi (appUser) yang
 * disimpan di localStorage, serta aksi login/logout/update password.
 */
export function useAuthSession() {
    const [authUser, setAuthUser] = useState(null);

    const [appUser, setAppUser] = useState(() => {
        const savedUser = localStorage.getItem(STORAGE_KEY);
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [loading, setLoading] = useState(true);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    const navigate = useNavigate();
    const location = useLocation();

    // Bootstrap Firebase anonymous auth (dijalankan sekali)
    useEffect(() => {
        signInAnonymously(auth).catch(console.error);

        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setAuthUser(u);

            // Jika firebase connect TAPI tidak ada user yang tersimpan di localStorage,
            // matikan loading agar halaman Login bisa muncul.
            if (u && !appUser) {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleLogin = async (u, p) => {
        setLoginLoading(true);
        setLoginError('');

        try {
            // Query langsung ke Firestore, jangan andalkan state allUsers yang mungkin kosong
            const q = query(
                getCollectionRef(COLLECTION_PATHS.users),
                where("username", "==", u),
                where("password", "==", p)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = { id: userDoc.id, ...userDoc.data() };

                setAppUser(userData);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

                const origin = location.state?.from?.pathname || '/';
                navigate(origin);
                return;
            }

            // Fallback untuk inisialisasi awal jika database benar-benar kosong
            if (u === INITIAL_ADMIN.username && p === INITIAL_ADMIN.password) {
                const allUsersSnap = await getDocs(getCollectionRef(COLLECTION_PATHS.users));
                if (allUsersSnap.empty) {
                    const docRef = await addDoc(getCollectionRef(COLLECTION_PATHS.users), INITIAL_ADMIN);
                    const newAdmin = { id: docRef.id, ...INITIAL_ADMIN };
                    setAppUser(newAdmin);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAdmin));
                    navigate('/');
                    return;
                }
            }

            setLoginError('Salah username atau password');
        } catch (error) {
            console.error("Login Error:", error);
            setLoginError('Terjadi kesalahan koneksi.');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleLogout = () => {
        if (!confirm("Keluar?")) return;
        setAppUser(null);
        localStorage.removeItem(STORAGE_KEY);
        navigate('/login');
    };

    const handleUpdatePassword = async (data) => {
        await updateDoc(doc(getCollectionRef(COLLECTION_PATHS.users), data.id), { password: data.password, fullName: data.fullName });
        const updatedUser = { ...appUser, password: data.password, fullName: data.fullName };
        setAppUser(updatedUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        alert("Profil berhasil diperbarui.");
    };

    return {
        authUser,
        appUser,
        loading,
        setLoading,
        loginLoading,
        loginError,
        handleLogin,
        handleLogout,
        handleUpdatePassword,
    };
}
