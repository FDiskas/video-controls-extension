export const SEEK_STEP_SECONDS = 10;

export const ACTIONS = [
	'togglePlay',
	'seekBack',
	'seekForward',
	'previousFrame',
	'nextFrame',
] as const;

export type ActionId = (typeof ACTIONS)[number];

export const ACTION_LABELS: Record<ActionId, string> = {
	togglePlay: 'Play / pause',
	seekBack: `Back ${SEEK_STEP_SECONDS} seconds`,
	seekForward: `Forward ${SEEK_STEP_SECONDS} seconds`,
	previousFrame: 'Previous frame',
	nextFrame: 'Next frame',
};

/** Uses the physical key (`code`) so Option/Alt combos on macOS still match. */
export interface KeyBinding {
	code: string;
	alt: boolean;
	ctrl: boolean;
	meta: boolean;
	shift: boolean;
}

export type KeyBindings = Record<ActionId, KeyBinding | null>;

type KeyEventLike = Pick<
	KeyboardEvent,
	'code' | 'key' | 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'
>;

const plainKey = (code: string): KeyBinding => ({
	code,
	alt: false,
	ctrl: false,
	meta: false,
	shift: false,
});

// Same keys YouTube uses for the same actions.
export const DEFAULT_KEY_BINDINGS: KeyBindings = {
	togglePlay: plainKey('KeyK'),
	seekBack: plainKey('KeyJ'),
	seekForward: plainKey('KeyL'),
	previousFrame: plainKey('Comma'),
	nextFrame: plainKey('Period'),
};

const MODIFIER_KEYS = new Set([
	'Alt',
	'AltGraph',
	'CapsLock',
	'Control',
	'Fn',
	'Meta',
	'Shift',
]);

const CODE_LABELS: Record<string, string> = {
	ArrowDown: '↓',
	ArrowLeft: '←',
	ArrowRight: '→',
	ArrowUp: '↑',
	Backquote: '`',
	Backslash: '\\',
	BracketLeft: '[',
	BracketRight: ']',
	Comma: ',',
	Equal: '=',
	Minus: '-',
	Period: '.',
	Quote: "'",
	Semicolon: ';',
	Slash: '/',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null;

function parseBinding(value: unknown): KeyBinding | null {
	if (!isRecord(value) || typeof value.code !== 'string') return null;
	return {
		code: value.code,
		alt: value.alt === true,
		ctrl: value.ctrl === true,
		meta: value.meta === true,
		shift: value.shift === true,
	};
}

/** Fills actions missing from storage with defaults; a stored `null` stays cleared. */
export function normalizeKeyBindings(stored: unknown): KeyBindings {
	const record = isRecord(stored) ? stored : {};
	const bindings = { ...DEFAULT_KEY_BINDINGS };
	for (const action of ACTIONS) {
		if (action in record) bindings[action] = parseBinding(record[action]);
	}
	return bindings;
}

export function bindingFromEvent(event: KeyEventLike): KeyBinding | null {
	if (MODIFIER_KEYS.has(event.key) || event.code === '') return null;
	return {
		code: event.code,
		alt: event.altKey,
		ctrl: event.ctrlKey,
		meta: event.metaKey,
		shift: event.shiftKey,
	};
}

function isSameBinding(a: KeyBinding | null, b: KeyBinding | null): boolean {
	return (
		a !== null &&
		b !== null &&
		a.code === b.code &&
		a.alt === b.alt &&
		a.ctrl === b.ctrl &&
		a.meta === b.meta &&
		a.shift === b.shift
	);
}

export function findBoundAction(
	bindings: KeyBindings,
	event: KeyEventLike,
): ActionId | null {
	const pressed = bindingFromEvent(event);
	return (
		ACTIONS.find((action) => isSameBinding(bindings[action], pressed)) ?? null
	);
}

/** Gives the binding to `action` and takes it away from any other action. */
export function assignBinding(
	bindings: KeyBindings,
	action: ActionId,
	binding: KeyBinding | null,
): { bindings: KeyBindings; displaced: ActionId | null } {
	const displaced =
		ACTIONS.find(
			(other) => other !== action && isSameBinding(bindings[other], binding),
		) ?? null;
	const next = { ...bindings, [action]: binding };
	if (displaced) next[displaced] = null;
	return { bindings: next, displaced };
}

export function formatBinding(binding: KeyBinding, isMac: boolean): string {
	const key =
		CODE_LABELS[binding.code] ?? binding.code.replace(/^(Key|Digit)/, '');
	if (isMac) {
		const modifiers = [
			binding.ctrl && '⌃',
			binding.alt && '⌥',
			binding.shift && '⇧',
			binding.meta && '⌘',
		];
		return `${modifiers.filter(Boolean).join('')}${key}`;
	}
	const modifiers = [
		binding.ctrl && 'Ctrl',
		binding.alt && 'Alt',
		binding.shift && 'Shift',
		binding.meta && 'Meta',
	];
	return [...modifiers.filter(Boolean), key].join('+');
}

export const isMacPlatform = (): boolean =>
	/Mac|iPhone|iPad/.test(navigator.platform);
