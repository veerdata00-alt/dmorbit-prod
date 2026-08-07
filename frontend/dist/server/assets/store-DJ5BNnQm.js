import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector";
//#region src/lib/store.ts
var KEY = "dmorbit_state_v1";
var defaultState = {
	user: null,
	isAuthLoaded: false,
	connected: false,
	igHandle: null,
	campaigns: [],
	leads: []
};
var state = load();
var listeners = /* @__PURE__ */ new Set();
function load() {
	if (typeof window === "undefined") return defaultState;
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return defaultState;
		const parsed = JSON.parse(raw);
		return {
			...defaultState,
			...parsed,
			isAuthLoaded: false
		};
	} catch {
		return defaultState;
	}
}
function persist() {
	if (typeof window === "undefined") return;
	const { isAuthLoaded: _drop, ...durable } = state;
	localStorage.setItem(KEY, JSON.stringify(durable));
}
function emit() {
	persist();
	listeners.forEach((l) => l());
}
var store = {
	get: () => state,
	subscribe(l) {
		listeners.add(l);
		return () => listeners.delete(l);
	},
	setUser(user) {
		state = {
			...state,
			user,
			isAuthLoaded: true,
			connected: user?.instagramConnected ?? false,
			igHandle: user?.igHandle ?? state.igHandle
		};
		emit();
	},
	connectInstagram(handle = "yourbrand") {
		state = {
			...state,
			connected: true,
			igHandle: handle
		};
		emit();
	},
	setIgHandle(handle) {
		state = {
			...state,
			igHandle: handle
		};
		emit();
	},
	disconnect() {
		state = {
			...state,
			connected: false,
			igHandle: null
		};
		emit();
	},
	addCampaign(c) {
		const id = Math.random().toString(36).slice(2, 9);
		const campaign = {
			...c,
			id,
			status: c.status ?? "active",
			createdAt: Date.now(),
			stats: {
				leads: 0,
				dms: 0,
				conversion: 0
			}
		};
		const seedLeads = Math.floor(20 + Math.random() * 120);
		const seedDms = seedLeads + Math.floor(Math.random() * 80);
		campaign.stats = {
			leads: seedLeads,
			dms: seedDms,
			conversion: Math.round(seedLeads / seedDms * 100)
		};
		const names = [
			"Maya R.",
			"Jordan K.",
			"Alex P.",
			"Sam L.",
			"Priya N.",
			"Chris D.",
			"Riley T.",
			"Noah S.",
			"Ava M.",
			"Liam B."
		];
		const newLeads = Array.from({ length: Math.min(8, seedLeads) }).map((_, i) => ({
			id: `${id}_${i}`,
			name: names[i % names.length],
			handle: "@" + names[i % names.length].toLowerCase().replace(/[^a-z]/g, ""),
			email: names[i % names.length].toLowerCase().replace(/[^a-z]/g, "") + "@example.com",
			campaignId: id,
			createdAt: Date.now() - i * 1e3 * 60 * 60 * 6
		}));
		state = {
			...state,
			campaigns: [campaign, ...state.campaigns],
			leads: [...newLeads, ...state.leads]
		};
		emit();
		return campaign;
	},
	updateCampaign(id, patch) {
		state = {
			...state,
			campaigns: state.campaigns.map((c) => c.id === id ? {
				...c,
				...patch
			} : c)
		};
		emit();
	},
	deleteCampaign(id) {
		state = {
			...state,
			campaigns: state.campaigns.filter((c) => c.id !== id),
			leads: state.leads.filter((l) => l.campaignId !== id)
		};
		emit();
	},
	duplicateCampaign(id) {
		const c = state.campaigns.find((x) => x.id === id);
		if (!c) return;
		const copy = {
			...c,
			id: Math.random().toString(36).slice(2, 9),
			name: c.name + " (Copy)",
			createdAt: Date.now()
		};
		state = {
			...state,
			campaigns: [copy, ...state.campaigns]
		};
		emit();
	},
	reset() {
		state = { ...defaultState };
		if (typeof window !== "undefined") localStorage.removeItem(KEY);
		listeners.forEach((l) => l());
	}
};
var getServerSnapshot = () => defaultState;
var getSnapshot = () => state;
function useStore(selector) {
	return useSyncExternalStoreWithSelector(store.subscribe, getSnapshot, getServerSnapshot, selector, shallowEqual);
}
function shallowEqual(a, b) {
	if (Object.is(a, b)) return true;
	if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return false;
	const ka = Object.keys(a);
	const kb = Object.keys(b);
	if (ka.length !== kb.length) return false;
	for (const k of ka) {
		if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
		if (!Object.is(a[k], b[k])) return false;
	}
	return true;
}
//#endregion
export { useStore as n, store as t };
