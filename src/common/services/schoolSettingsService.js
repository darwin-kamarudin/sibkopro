import { addDoc, updateDoc, setDoc, doc } from 'firebase/firestore';
import { db, getCollectionRef } from '../config/firebase';
import { COLLECTION_PATHS } from '../utils/constants';

export const saveSchoolSettings = (mySettings, teacherId, data) =>
    mySettings.id
        ? updateDoc(doc(getCollectionRef(COLLECTION_PATHS.settings), mySettings.id), data).then(() => alert("Tersimpan"))
        : addDoc(getCollectionRef(COLLECTION_PATHS.settings), { ...data, teacherId }).then(() => alert("Tersimpan"));

export const saveMasterPoints = (teacherId, items) =>
    setDoc(doc(db, 'settings', `master_points_${teacherId}`), { items }).then(() => alert("Tersimpan"));

export const saveTataTertib = (teacherId, data) =>
    setDoc(doc(db, 'settings', `tata_tertib_${teacherId}`), {
        pasal: data.pasal || [], prestasi: data.prestasi || [], spRules: data.spRules || []
    }).then(() => alert("Tersimpan"));

export const saveSanctionRules = (teacherId, items) =>
    setDoc(doc(db, 'settings', `sanction_rules_${teacherId}`), { items }).then(() => alert("Tersimpan"));
