import { useState, useEffect } from 'react';
import { onSnapshot, query, where, collection } from 'firebase/firestore';
import { db, getCollectionRef } from '../config/firebase';
import { COLLECTION_PATHS } from '../utils/constants';

/**
 * Listener data operasional guru: siswa, jurnal konseling, dan riwayat poin.
 * Tidak berjalan untuk role admin.
 * @param {() => void} onReady - dipanggil segera setelah listener terpasang
 */
export function useGuruRecords(authUser, appUser, onReady) {
    const [students, setStudents] = useState([]);
    const [journals, setJournals] = useState([]);
    const [pointLogs, setPointLogs] = useState([]);

    useEffect(() => {
        if (!authUser || !appUser || appUser.role === 'admin') {
            setStudents([]);
            setJournals([]);
            setPointLogs([]);
            return;
        }

        const qStudents = query(getCollectionRef(COLLECTION_PATHS.students), where("teacherId", "==", appUser.id));
        const unsubStudents = onSnapshot(qStudents, snap => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        const qJournals = query(getCollectionRef(COLLECTION_PATHS.journals), where("teacherId", "==", appUser.id));
        const unsubJournals = onSnapshot(qJournals, snap => setJournals(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        const qPoints = query(collection(db, 'point_logs'), where("teacherId", "==", appUser.id));
        const unsubPoints = onSnapshot(qPoints, snap => setPointLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        onReady?.();

        return () => {
            unsubStudents();
            unsubJournals();
            unsubPoints();
        };
    }, [authUser, appUser]);

    return { students, journals, pointLogs };
}
