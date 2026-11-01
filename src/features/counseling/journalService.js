import { addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, getCollectionRef } from '../../common/config/firebase';
import { COLLECTION_PATHS } from '../../common/utils/constants';

export const addJournal = (teacherId, data) =>
    addDoc(getCollectionRef(COLLECTION_PATHS.journals), { ...data, teacherId });

export const updateJournal = (id, data) =>
    updateDoc(doc(db, COLLECTION_PATHS.journals, id), data);

export const deleteJournal = (id) =>
    deleteDoc(doc(db, COLLECTION_PATHS.journals, id));
