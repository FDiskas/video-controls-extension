import { sitePlacement } from './site-rules.ts';

export type Placement = 'top' | 'bottom';

const storageKey = `placement:${location.hostname}`;

export async function loadPlacement(): Promise<Placement> {
	const stored = (await chrome.storage.local.get(storageKey))[storageKey];
	return stored === 'top' || stored === 'bottom' ? stored : sitePlacement;
}

export function savePlacement(placement: Placement): void {
	void chrome.storage.local.set({ [storageKey]: placement });
}
