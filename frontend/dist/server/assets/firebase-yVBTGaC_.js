import { t as apiClient } from "./client-CDls2Pz7.js";
import { getApp, getApps, initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
//#region src/lib/firebase.ts
var firebaseAuth = null;
var googleProvider = null;
var isInitialized = false;
async function initFirebase() {
	if (isInitialized) return;
	try {
		const config = (await apiClient.get("/api/firebase-config")).data;
		if (config && config.apiKey) {
			firebaseAuth = getAuth(getApps().length === 0 ? initializeApp(config) : getApp());
			googleProvider = new GoogleAuthProvider();
			isInitialized = true;
		}
	} catch (err) {
		console.warn("Failed to initialize Firebase:", err);
	}
}
async function signInWithGoogle() {
	if (!firebaseAuth || !googleProvider) throw new Error("Firebase is not initialized or unavailable.");
	const idToken = await (await signInWithPopup(firebaseAuth, googleProvider)).user.getIdToken();
	return (await apiClient.post("/api/auth/firebase", { idToken })).data;
}
//#endregion
export { signInWithGoogle as n, initFirebase as t };
