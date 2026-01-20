import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, set, get, child, update, remove } from "firebase/database";
import { getAuth } from "firebase/auth";

// IMPORT SEMUA VARIABEL ENV
import {
    PUBLIC_FIREBASE_API_KEY,
    PUBLIC_FIREBASE_AUTH_DOMAIN,
    PUBLIC_FIREBASE_DB_URL,
    PUBLIC_FIREBASE_PROJECT_ID,
    PUBLIC_FIREBASE_STORAGE_BUCKET,
    PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    PUBLIC_FIREBASE_APP_ID
} from '$env/static/public';

// GUNAKAN DI SINI
const firebaseConfig = {
  apiKey: PUBLIC_FIREBASE_API_KEY,
  authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: PUBLIC_FIREBASE_DB_URL,
  projectId: PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);
export const auth = getAuth(app);
export { db };

// --- FUNGSI USER ---
export async function saveGift(slug, data) {
    const snapshot = await get(child(ref(db), `gifts/${slug}`));
    if (snapshot.exists()) {
        throw new Error("Slug already taken!");
    }

    const payload = {
        ...data,
        status: 'pending', 
        paymentPlan: 'standard',
        isActive: false, 
        createdAt: Date.now(),
        expiryDate: null 
    };
    
    // Gunakan set, tapi karena sudah dicek snapshot.exists(), ini aman.
    await set(ref(db, 'gifts/' + slug), payload);
}

export async function getGift(slug) {
    const snapshot = await get(child(ref(db), `gifts/${slug}`));
    if (snapshot.exists()) return snapshot.val();
    return null;
}

// --- FUNGSI ADMIN ---
export async function getAllGifts() {
    const snapshot = await get(ref(db, 'gifts'));
    if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(key => ({
            slug: key,
            ...data[key]
        }));
    }
    return [];
}

// Update Status: Sinkronkan isActive (boolean) dan status (string)
export async function updateGiftStatus(slug, isActive) {
    const updates = {
        isActive: isActive,
        status: isActive ? 'active' : 'pending' // Biar sinkron
    };
    if (isActive) {
        updates.expiryDate = Date.now() + (30 * 24 * 60 * 60 * 1000); 
    }
    await update(ref(db, 'gifts/' + slug), updates);
}

export async function updateGiftPlan(slug, newPlan) {
    const updates = {
        paymentPlan: newPlan
    };
    if (newPlan === 'lifetime') {
        updates.removeWatermark = true;
        updates.expiryDate = null;
    } else {
        updates.removeWatermark = false;
    }
    await update(ref(db, 'gifts/' + slug), updates);
}

export async function deleteGift(slug) {
    await remove(ref(db, 'gifts/' + slug));
}