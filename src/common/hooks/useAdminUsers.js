import { useState, useEffect } from 'react';
import { query, onSnapshot, addDoc } from 'firebase/firestore';
import { getCollectionRef } from '../config/firebase';
import { COLLECTION_PATHS, INITIAL_ADMIN } from '../utils/constants';

/**
 * Listener daftar user (khusus role admin). Otomatis membuat admin pertama
 * jika koleksi user masih kosong (first run).
 * @param {object} authUser - user Firebase (anonymous auth)
 * @param {object} appUser - user aplikasi yang sedang login
 * @param {() => void} onReady - dipanggil setiap kali snapshot pertama/berikutnya diterima
 */
export function useAdminUsers(authUser, appUser, onReady) {
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        if (!authUser || appUser?.role !== 'admin') {
            setAllUsers([]);
            return;
        }

        const q = query(getCollectionRef(COLLECTION_PATHS.users));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setAllUsers(data);

            // Auto-create admin jika kosong (First Run)
            if (data.length === 0) {
                addDoc(getCollectionRef(COLLECTION_PATHS.users), INITIAL_ADMIN);
            }
            onReady?.();
        });

        return () => unsub();
    }, [authUser, appUser]);

    return allUsers;
}
