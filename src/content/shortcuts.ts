import {
	type ActionId,
	findBoundAction,
	type KeyBindings,
} from '../shared/keybindings.ts';

const NON_TEXT_INPUT_TYPES = new Set([
	'button',
	'checkbox',
	'color',
	'file',
	'image',
	'radio',
	'range',
	'reset',
	'submit',
]);

function isTypingInto(target: EventTarget | undefined): boolean {
	if (!(target instanceof HTMLElement)) return false;
	if (target instanceof HTMLInputElement) {
		return !NON_TEXT_INPUT_TYPES.has(target.type);
	}
	return (
		target.isContentEditable ||
		target instanceof HTMLTextAreaElement ||
		target instanceof HTMLSelectElement
	);
}

interface ShortcutHandlers {
	bindings: () => KeyBindings;
	target: () => HTMLVideoElement | null;
	run: (action: ActionId, video: HTMLVideoElement) => void;
}

/**
 * Listens in the capture phase on window so a handled key does not also reach
 * the page; YouTube would otherwise run its own J/K/L action a second time.
 */
export function listenForShortcuts({
	bindings,
	target,
	run,
}: ShortcutHandlers): void {
	window.addEventListener(
		'keydown',
		(event) => {
			if (isTypingInto(event.composedPath()[0])) return;
			const action = findBoundAction(bindings(), event);
			if (!action) return;
			const video = target();
			if (!video) return;

			event.preventDefault();
			event.stopImmediatePropagation();
			if (event.repeat && action === 'togglePlay') return;
			run(action, video);
		},
		{ capture: true },
	);
}
