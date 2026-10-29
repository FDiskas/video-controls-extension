import {
	ACTION_LABELS,
	ACTIONS,
	type ActionId,
	formatBinding,
	isMacPlatform,
	type KeyBindings,
	SEEK_STEP_SECONDS,
} from '../shared/keybindings.ts';
import { formatTime } from './format-time.ts';
import { createIcon, type IconName } from './icons.ts';
import type { Placement } from './placement-store.ts';
import { BAR_HEIGHT, CONTROLS_CSS } from './styles.ts';
import {
	seekableRange,
	seekTo,
	VIDEO_ACTIONS,
	type VideoAction,
} from './video-actions.ts';

const EDGE_GAP = 8;
const COMPACT_BELOW_WIDTH = 400;
const TINY_BELOW_WIDTH = 290;

// Stops the page from treating clicks on the bar as clicks on its own player.
const PAGE_ISOLATED_EVENTS = [
	'pointerdown',
	'pointerup',
	'mousedown',
	'mouseup',
	'click',
	'dblclick',
	'contextmenu',
	'touchstart',
	'touchend',
	'keydown',
	'keyup',
] as const;

function createButton(
	label: string,
	content: (Node | string)[],
	onPress: () => void,
): HTMLButtonElement {
	const button = document.createElement('button');
	button.type = 'button';
	button.title = label;
	button.setAttribute('aria-label', label);
	button.append(...content);
	button.addEventListener('click', onPress);
	return button;
}

function barSize(width: number): string {
	if (width < TINY_BELOW_WIDTH) return 'tiny';
	if (width < COMPACT_BELOW_WIDTH) return 'compact';
	return 'full';
}

export class ControlsBar {
	readonly host = document.createElement('video-frame-controls');
	readonly #bar = document.createElement('div');
	readonly #actionButtons: Record<ActionId, HTMLButtonElement>;
	readonly #scrubber = document.createElement('input');
	readonly #time = document.createElement('span');
	readonly #onPlacementChange: (placement: Placement) => void;
	#placement: Placement;
	#video: HTMLVideoElement | null = null;
	#shownPlayIcon: IconName | null = null;
	#isPointerOver = false;
	#isScrubbing = false;

	constructor(
		placement: Placement,
		onPlacementChange: (placement: Placement) => void,
	) {
		this.#placement = placement;
		this.#onPlacementChange = onPlacementChange;
		this.#actionButtons = {
			togglePlay: this.#createActionButton('togglePlay', []),
			seekBack: this.#createActionButton('seekBack', [
				createIcon('rewind'),
				String(SEEK_STEP_SECONDS),
			]),
			previousFrame: this.#createActionButton('previousFrame', [
				createIcon('previousFrame'),
			]),
			nextFrame: this.#createActionButton('nextFrame', [
				createIcon('nextFrame'),
			]),
			seekForward: this.#createActionButton('seekForward', [
				String(SEEK_STEP_SECONDS),
				createIcon('fastForward'),
			]),
		};
		this.#buildDom();
	}

	get video(): HTMLVideoElement | null {
		return this.#video;
	}

	get isVisible(): boolean {
		return this.#bar.hasAttribute('data-visible');
	}

	get isInteracting(): boolean {
		return this.#isPointerOver || this.#isScrubbing;
	}

	show(video: HTMLVideoElement): void {
		this.#video = video;
		this.#bar.toggleAttribute('data-visible', true);
	}

	hide(): void {
		this.#bar.removeAttribute('data-visible');
		this.#isPointerOver = false;
		this.#isScrubbing = false;
	}

	setShortcuts(bindings: KeyBindings): void {
		const isMac = isMacPlatform();
		for (const action of ACTIONS) {
			const label = ACTION_LABELS[action];
			const binding = bindings[action];
			this.#actionButtons[action].title = binding
				? `${label} (${formatBinding(binding, isMac)})`
				: label;
		}
	}

	render(): void {
		const video = this.#video;
		if (!video) return;
		this.#renderPosition(video.getBoundingClientRect());
		this.#renderPlayButton(video.paused ? 'play' : 'pause');
		this.#renderProgress(video);
	}

	#buildDom(): void {
		const shadow = this.host.attachShadow({ mode: 'closed' });
		const styleSheet = new CSSStyleSheet();
		styleSheet.replaceSync(CONTROLS_CSS);
		shadow.adoptedStyleSheets = [styleSheet];

		this.#scrubber.type = 'range';
		this.#scrubber.step = 'any';
		this.#scrubber.className = 'scrubber';
		this.#scrubber.setAttribute('aria-label', 'Seek');
		this.#scrubber.addEventListener('input', () => {
			this.#isScrubbing = true;
			this.#withVideo((video) => seekTo(video, this.#scrubber.valueAsNumber))();
		});
		this.#scrubber.addEventListener('change', () => {
			this.#isScrubbing = false;
		});

		this.#time.className = 'time';

		this.#bar.className = 'bar';
		this.#bar.append(
			this.#actionButtons.togglePlay,
			this.#actionButtons.seekBack,
			this.#actionButtons.previousFrame,
			this.#actionButtons.nextFrame,
			this.#actionButtons.seekForward,
			this.#scrubber,
			this.#time,
			createButton(
				'Move controls to the other edge',
				[createIcon('swapPlacement')],
				() => this.#togglePlacement(),
			),
		);
		this.#bar.addEventListener('pointerenter', () => {
			this.#isPointerOver = true;
		});
		this.#bar.addEventListener('pointerleave', () => {
			this.#isPointerOver = false;
		});
		for (const type of PAGE_ISOLATED_EVENTS) {
			this.#bar.addEventListener(type, (event) => event.stopPropagation());
		}
		shadow.append(this.#bar);
	}

	#createActionButton(
		action: ActionId,
		content: (Node | string)[],
	): HTMLButtonElement {
		return createButton(
			ACTION_LABELS[action],
			content,
			this.#withVideo(VIDEO_ACTIONS[action]),
		);
	}

	#withVideo(action: VideoAction): () => void {
		return () => {
			if (!this.#video) return;
			action(this.#video);
			this.render();
		};
	}

	#togglePlacement(): void {
		this.#placement = this.#placement === 'top' ? 'bottom' : 'top';
		this.#onPlacementChange(this.#placement);
		this.render();
	}

	#renderPosition(videoRect: DOMRect): void {
		const visibleLeft = Math.max(videoRect.left, 0);
		const visibleRight = Math.min(videoRect.right, window.innerWidth);
		const visibleTop = Math.max(videoRect.top, 0);
		const visibleBottom = Math.min(videoRect.bottom, window.innerHeight);

		const width = Math.max(visibleRight - visibleLeft - 2 * EDGE_GAP, 0);
		const top =
			this.#placement === 'top'
				? visibleTop + EDGE_GAP
				: visibleBottom - BAR_HEIGHT - EDGE_GAP;

		this.#bar.style.transform = `translate(${visibleLeft + EDGE_GAP}px, ${top}px)`;
		this.#bar.style.width = `${width}px`;
		this.#bar.dataset.size = barSize(width);
	}

	#renderPlayButton(icon: IconName): void {
		if (this.#shownPlayIcon === icon) return;
		this.#shownPlayIcon = icon;
		this.#actionButtons.togglePlay.replaceChildren(createIcon(icon));
	}

	#renderProgress(video: HTMLVideoElement): void {
		const { start, end } = seekableRange(video);
		this.#scrubber.min = String(start);
		this.#scrubber.max = String(end);
		if (!this.#isScrubbing) this.#scrubber.value = String(video.currentTime);

		const time = `${formatTime(video.currentTime, 2)} / ${formatTime(video.duration)}`;
		if (this.#time.textContent !== time) this.#time.textContent = time;
	}
}
