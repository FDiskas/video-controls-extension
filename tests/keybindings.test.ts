import { describe, expect, test } from 'bun:test';
import {
	assignBinding,
	bindingFromEvent,
	DEFAULT_KEY_BINDINGS,
	findBoundAction,
	formatBinding,
	type KeyBinding,
	normalizeKeyBindings,
} from '../src/shared/keybindings.ts';

const keyEvent = (
	code: string,
	key: string,
	modifiers: Partial<
		Record<'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey', boolean>
	> = {},
) => ({
	code,
	key,
	altKey: false,
	ctrlKey: false,
	metaKey: false,
	shiftKey: false,
	...modifiers,
});

const shiftArrowLeft: KeyBinding = {
	code: 'ArrowLeft',
	alt: false,
	ctrl: false,
	meta: false,
	shift: true,
};

describe('normalizeKeyBindings', () => {
	test('uses the defaults when nothing is stored', () => {
		expect(normalizeKeyBindings(undefined)).toEqual(DEFAULT_KEY_BINDINGS);
	});

	test('keeps a stored binding and a cleared action', () => {
		const bindings = normalizeKeyBindings({
			seekBack: shiftArrowLeft,
			nextFrame: null,
		});
		expect(bindings.seekBack).toEqual(shiftArrowLeft);
		expect(bindings.nextFrame).toBeNull();
		expect(bindings.togglePlay).toEqual(DEFAULT_KEY_BINDINGS.togglePlay);
	});

	test('treats a malformed stored binding as cleared', () => {
		expect(
			normalizeKeyBindings({ togglePlay: { key: 'k' } }).togglePlay,
		).toBeNull();
	});
});

describe('bindingFromEvent', () => {
	test('ignores a modifier pressed alone', () => {
		expect(
			bindingFromEvent(keyEvent('ShiftLeft', 'Shift', { shiftKey: true })),
		).toBeNull();
	});

	test('records the physical key and the modifiers', () => {
		expect(
			bindingFromEvent(keyEvent('ArrowLeft', 'ArrowLeft', { shiftKey: true })),
		).toEqual(shiftArrowLeft);
	});
});

describe('findBoundAction', () => {
	test('finds the default action for a plain key', () => {
		expect(findBoundAction(DEFAULT_KEY_BINDINGS, keyEvent('Period', '.'))).toBe(
			'nextFrame',
		);
	});

	test('does not match when an extra modifier is held', () => {
		expect(
			findBoundAction(
				DEFAULT_KEY_BINDINGS,
				keyEvent('KeyK', 'k', { metaKey: true }),
			),
		).toBeNull();
	});

	test('matches macOS Option combos by physical key', () => {
		const { bindings } = assignBinding(DEFAULT_KEY_BINDINGS, 'togglePlay', {
			code: 'KeyP',
			alt: true,
			ctrl: false,
			meta: false,
			shift: false,
		});
		expect(
			findBoundAction(bindings, keyEvent('KeyP', 'π', { altKey: true })),
		).toBe('togglePlay');
	});
});

describe('assignBinding', () => {
	test('moves a shortcut that another action already uses', () => {
		const { bindings, displaced } = assignBinding(
			DEFAULT_KEY_BINDINGS,
			'seekBack',
			DEFAULT_KEY_BINDINGS.togglePlay,
		);
		expect(displaced).toBe('togglePlay');
		expect(bindings.togglePlay).toBeNull();
		expect(bindings.seekBack).toEqual(DEFAULT_KEY_BINDINGS.togglePlay);
	});

	test('clears an action without touching the others', () => {
		const { bindings, displaced } = assignBinding(
			DEFAULT_KEY_BINDINGS,
			'nextFrame',
			null,
		);
		expect(displaced).toBeNull();
		expect(bindings.nextFrame).toBeNull();
		expect(bindings.previousFrame).toEqual(DEFAULT_KEY_BINDINGS.previousFrame);
	});
});

describe('formatBinding', () => {
	const binding: KeyBinding = {
		code: 'KeyJ',
		alt: true,
		ctrl: false,
		meta: false,
		shift: true,
	};

	test('uses modifier symbols on macOS', () => {
		expect(formatBinding(binding, true)).toBe('⌥⇧J');
	});

	test('uses modifier names on other systems', () => {
		expect(formatBinding(binding, false)).toBe('Alt+Shift+J');
	});

	test('shows punctuation and arrows as symbols', () => {
		expect(
			formatBinding(DEFAULT_KEY_BINDINGS.previousFrame as KeyBinding, false),
		).toBe(',');
		expect(formatBinding(shiftArrowLeft, true)).toBe('⇧←');
	});
});
