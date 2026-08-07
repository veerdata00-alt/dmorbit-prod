

export type CampaignType = "comment_dm" | "comment_reply" | "story_reply" | "dm_keyword";
export type CampaignGoal =
  | "pdf"
  | "link"
  | "product"
  | "lead"
  | "webinar"
  | "course"
  | "public_reply";

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  goal: CampaignGoal;
  scope: "any" | "specific" | "multiple";
  trigger: "any" | "keywords";
  keywords: string[];
  resource: { kind: string; value: string; fileName?: string };
  followGate: boolean;
  publicReply: string;
  dmMessage: string;
  status: "active" | "paused" | "draft";
  createdAt: number;
  stats: { leads: number; dms: number; conversion: number };
}

export interface Lead {
  id: string;
  name: string;
  handle: string;
  email: string;
  campaignId: string;
  createdAt: number;
}

interface State {
  user: any | null;
  isAuthLoaded: boolean;
  connected: boolean;
  igHandle: string | null;
  campaigns: Campaign[];
  leads: Lead[];
}

const KEY = "dmorbit_state_v1";

const defaultState: State = {
  user: null,
  isAuthLoaded: false,
  connected: false,
  igHandle: null,
  campaigns: [],
  leads: [],
};

let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    // isAuthLoaded is a runtime-only flag — NEVER restore it from storage.
    // If we did, AppShell would skip the hydration spinner and make auth
    // decisions based on stale/empty state before /api/me returns.
    return { ...defaultState, ...parsed, isAuthLoaded: false };
  } catch {
    return defaultState;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  // Strip isAuthLoaded — it is a runtime flag, not durable state.
  // Persisting it would cause the next page load to skip the hydration
  // spinner and make auth decisions on stale localStorage data.
  const { isAuthLoaded: _drop, ...durable } = state;
  localStorage.setItem(KEY, JSON.stringify(durable));
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export const store = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  setUser(user: any | null) {
    state = { 
      ...state, 
      user, 
      isAuthLoaded: true,
      connected: user?.instagramConnected ?? false,
      igHandle: user?.igHandle ?? state.igHandle
    };
    emit();
  },
  // Called by OAuth callback — forces connected=true and sets handle.
  connectInstagram(handle = "yourbrand") {
    state = { ...state, connected: true, igHandle: handle };
    emit();
  },
  // Called by __root hydration when handle is missing but user is already
  // connected per /api/me — does NOT touch the connected flag.
  setIgHandle(handle: string) {
    state = { ...state, igHandle: handle };
    emit();
  },
  disconnect() {
    state = { ...state, connected: false, igHandle: null };
    emit();
  },
  addCampaign(c: Omit<Campaign, "id" | "createdAt" | "stats" | "status"> & { status?: Campaign["status"] }) {
    const id = Math.random().toString(36).slice(2, 9);
    const campaign: Campaign = {
      ...c,
      id,
      status: c.status ?? "active",
      createdAt: Date.now(),
      stats: { leads: 0, dms: 0, conversion: 0 },
    };
    // Seed some demo activity so analytics/CRM feel alive
    const seedLeads = Math.floor(20 + Math.random() * 120);
    const seedDms = seedLeads + Math.floor(Math.random() * 80);
    campaign.stats = {
      leads: seedLeads,
      dms: seedDms,
      conversion: Math.round((seedLeads / seedDms) * 100),
    };
    const names = ["Maya R.", "Jordan K.", "Alex P.", "Sam L.", "Priya N.", "Chris D.", "Riley T.", "Noah S.", "Ava M.", "Liam B."];
    const newLeads: Lead[] = Array.from({ length: Math.min(8, seedLeads) }).map((_, i) => ({
      id: `${id}_${i}`,
      name: names[i % names.length],
      handle: "@" + names[i % names.length].toLowerCase().replace(/[^a-z]/g, ""),
      email: names[i % names.length].toLowerCase().replace(/[^a-z]/g, "") + "@example.com",
      campaignId: id,
      createdAt: Date.now() - i * 1000 * 60 * 60 * 6,
    }));
    state = { ...state, campaigns: [campaign, ...state.campaigns], leads: [...newLeads, ...state.leads] };
    emit();
    return campaign;
  },
  updateCampaign(id: string, patch: Partial<Campaign>) {
    state = { ...state, campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
    emit();
  },
  deleteCampaign(id: string) {
    state = {
      ...state,
      campaigns: state.campaigns.filter((c) => c.id !== id),
      leads: state.leads.filter((l) => l.campaignId !== id),
    };
    emit();
  },
  duplicateCampaign(id: string) {
    const c = state.campaigns.find((x) => x.id === id);
    if (!c) return;
    const copy: Campaign = { ...c, id: Math.random().toString(36).slice(2, 9), name: c.name + " (Copy)", createdAt: Date.now() };
    state = { ...state, campaigns: [copy, ...state.campaigns] };
    emit();
  },
  reset() {
    state = { ...defaultState };
    // Clear storage directly — do NOT call emit()/persist() here because
    // that would write defaultState (user:null, isAuthLoaded:false) into
    // localStorage, which causes the next load() call to restore a null
    // user and potentially race with /api/me.
    if (typeof window !== "undefined") localStorage.removeItem(KEY);
    listeners.forEach((l) => l());
  },
};

import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector";

const getServerSnapshot = () => defaultState;
const getSnapshot = () => state;

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStoreWithSelector(
    store.subscribe,
    getSnapshot,
    getServerSnapshot,
    selector,
    shallowEqual,
  );
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return false;
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!Object.is((a as any)[k], (b as any)[k])) return false;
  }
  return true;
}
