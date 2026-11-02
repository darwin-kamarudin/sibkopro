import { useState, useEffect } from 'react';
import { onSnapshot, query, where, doc } from 'firebase/firestore';
import { db, getCollectionRef } from '../config/firebase';
import { COLLECTION_PATHS } from '../utils/constants';

/**
 * Listener pengaturan sekolah, master data poin, dan aturan sanksi milik
 * user yang sedang login. Dipakai oleh role admin maupun guru.
 */
export function useSharedSettings(authUser, appUser) {
    const [mySettings, setMySettings] = useState({});
    const [masterPoints, setMasterPoints] = useState([]);
    const [sanctionRules, setSanctionRules] = useState([]);
    const [tataTertib, setTataTertib] = useState({ pasal: [], prestasi: [], spRules: [] });

    useEffect(() => {
        if (!authUser || !appUser) return;

        const qSettings = query(getCollectionRef(COLLECTION_PATHS.settings), where("teacherId", "==", appUser.id));
        const unsubSettings = onSnapshot(qSettings, snap => {
            setMySettings(!snap.empty ? { id: snap.docs[0].id, ...snap.docs[0].data() } : {});
        });

        const unsubMaster = onSnapshot(
            doc(db, 'settings', `master_points_${appUser.id}`),
            (docSnap) => setMasterPoints(docSnap.exists() ? docSnap.data().items : [])
        );

        const unsubSanctions = onSnapshot(
            doc(db, 'settings', `sanction_rules_${appUser.id}`),
            (docSnap) => setSanctionRules(docSnap.exists() ? docSnap.data().items : [])
        );

        const unsubTata = onSnapshot(
            doc(db, 'settings', `tata_tertib_${appUser.id}`),
            (docSnap) => setTataTertib(docSnap.exists()
                ? { pasal: docSnap.data().pasal || [], prestasi: docSnap.data().prestasi || [], spRules: docSnap.data().spRules || [] }
                : { pasal: [], prestasi: [], spRules: [] })
        );

        return () => {
            unsubSettings();
            unsubMaster();
            unsubSanctions();
            unsubTata();
        };
    }, [authUser, appUser]);

    return { mySettings, masterPoints, sanctionRules, tataTertib };
}
