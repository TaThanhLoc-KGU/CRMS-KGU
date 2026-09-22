import { vi } from "./vi";

// Only "vi" ships in P0/P1. Swapping locales later means adding an `en.ts`
// dictionary with the same shape and selecting it here (e.g. from a user
// preference or browser locale) — call sites just use `t.rooms.title` etc.
export const t = vi;
