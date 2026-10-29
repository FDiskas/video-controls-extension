import {
	ACTION_LABELS,
	ACTIONS,
	type ActionId,
	assignBinding,
	bindingFromEvent,
	DEFAULT_KEY_BINDINGS,
	formatBinding,
	isMacPlatform,
	type KeyBinding,
	type KeyBindings,
} from '../shared/keybindings.ts';
import {
	loadKeyBindings,
	saveKeyBindings,
} from '../shared/keybindings-store.ts';

interface ShortcutRow {
	keyField: HTMLButtonElement;
	clearButton: HTMLButtonElement;
}

function requireElement<T extends HTMLElement>(selector: string): T {
	const element = document.querySelector<T>(selector);
	if (!element) throw new Error(`Missing ${selector} in settings.html`);
	return element;
}

const list = requireElement<HTMLUListElement>('#shortcuts');
const status = requireElement<HTMLParagraphElement>('#status');
const resetButton = requireElement<HTMLButtonElement>('#reset');
const isMac = isMacPlatform();

let bindings: KeyBindings = DEFAULT_KEY_BINDINGS;
let recordingAction: ActionId | null = null;

function showStatus(message: string, tone: 'info' | 'warn' = 'info'): void {
	status.textContent = message;
	status.dataset.tone = tone;
}

function setRecording(action: ActionId | null): void {
	recordingAction = action;
	render();
}

async function commit(
	next: KeyBindings,
	message: string,
	tone?: 'warn',
): Promise<void> {
	bindings = next;
	setRecording(null);
	await saveKeyBindings(next);
	showStatus(message, tone);
}

function assign(action: ActionId, binding: KeyBinding | null): void {
	const { bindings: next, displaced } = assignBinding(
		bindings,
		action,
		binding,
	);
	if (displaced) {
		void commit(
			next,
			`Saved. Removed the same shortcut from "${ACTION_LABELS[displaced]}".`,
			'warn',
		);
	} else {
		void commit(next, 'Saved.');
	}
}

function createButton(
	className: string,
	onClick: () => void,
): HTMLButtonElement {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = className;
	button.addEventListener('click', onClick);
	return button;
}

function createRow(action: ActionId): ShortcutRow {
	const label = document.createElement('span');
	label.className = 'shortcut-label';
	label.textContent = ACTION_LABELS[action];

	const keyField = createButton('key', () =>
		setRecording(recordingAction === action ? null : action),
	);
	keyField.setAttribute('aria-label', `Shortcut for ${ACTION_LABELS[action]}`);
	keyField.addEventListener('blur', () => {
		if (recordingAction === action) setRecording(null);
	});

	const clearButton = createButton('clear', () => assign(action, null));
	clearButton.textContent = 'Clear';

	const row = document.createElement('li');
	row.className = 'shortcut';
	row.append(label, keyField, clearButton);
	list.append(row);
	return { keyField, clearButton };
}

const rows = Object.fromEntries(
	ACTIONS.map((action) => [action, createRow(action)]),
) as Record<ActionId, ShortcutRow>;

function keyFieldText(action: ActionId): string {
	if (recordingAction === action) return 'Press keys…';
	const binding = bindings[action];
	return binding ? formatBinding(binding, isMac) : 'Not set';
}

function render(): void {
	for (const action of ACTIONS) {
		const { keyField, clearButton } = rows[action];
		const isRecording = recordingAction === action;
		keyField.textContent = keyFieldText(action);
		keyField.toggleAttribute('data-recording', isRecording);
		keyField.toggleAttribute('data-empty', !isRecording && !bindings[action]);
		clearButton.disabled = bindings[action] === null;
	}
}

document.addEventListener('keydown', (event) => {
	if (!recordingAction || event.key === 'Tab') return;
	event.preventDefault();
	if (event.key === 'Escape') {
		setRecording(null);
		return;
	}
	const binding = bindingFromEvent(event);
	if (binding) assign(recordingAction, binding);
});

resetButton.addEventListener('click', () => {
	void commit(DEFAULT_KEY_BINDINGS, 'Restored the default shortcuts.');
});

render();
void loadKeyBindings().then((stored) => {
	bindings = stored;
	render();
});
