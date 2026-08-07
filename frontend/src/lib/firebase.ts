import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { apiClient } from "./api/client";

export let firebaseAuth: ReturnType<typeof getAuth> | null = null;
export let googleProvider: GoogleAuthProvider | null = null;

let isInitialized = false;

export async function initFirebase() {
  if (isInitialized) return;
  try {
    const res = await apiClient.get('/api/firebase-config');
    const config = res.data;
    if (config && config.apiKey) {
      const app = getApps().length === 0 ? initializeApp(config) : getApp();
      firebaseAuth = getAuth(app);
      googleProvider = new GoogleAuthProvider();
      isInitialized = true;
    }
  } catch (err) {
    console.warn("Failed to initialize Firebase:", err);
  }
}

export async function signInWithGoogle() {
  if (!firebaseAuth || !googleProvider) {
    throw new Error("Firebase is not initialized or unavailable.");
  }
  const result = await signInWithPopup(firebaseAuth, googleProvider);
  const idToken = await result.user.getIdToken();
  const res = await apiClient.post('/api/auth/firebase', { idToken });
  return res.data;
}
