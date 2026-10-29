import { type KeyBindings, normalizeKeyBindings } from './keybindings.ts';

const STORAGE_KEY = 'keyBindings';

export async function loadKeyBindings(): Promise<KeyBindings> {
	const stored = await chrome.storage.sync.get(STORAGE_KEY);
	return normalizeKeyBindings(stored[STORAGE_KEY]);
}

export function saveKeyBindings(bindings: KeyBindings): Promise<void> {
	return chrome.storage.sync.set({ [STORAGE_KEY]: bindings });
}

export function watchKeyBindings(
	onChange: (bindings: KeyBindings) => void,
): void {
	chrome.storage.onChanged.addListener((changes, areaName) => {
		const change = changes[STORAGE_KEY];
		if (areaName === 'sync' && change) {
			onChange(normalizeKeyBindings(change.newValue));
		}
	});
}
