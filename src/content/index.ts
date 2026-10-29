import {
	loadKeyBindings,
	watchKeyBindings,
} from '../shared/keybindings-store.ts';
import { ControlsBar } from './controls-bar.ts';
import { trackFrames } from './frame-tracker.ts';
import { loadPlacement, savePlacement } from './placement-store.ts';
import { listenForShortcuts } from './shortcuts.ts';
import { VIDEO_ACTIONS } from './video-actions.ts';
import { findShortcutTarget, findVideoAt } from './video-finder.ts';

const IDLE_HIDE_DELAY_MS = 2500;

function mountContainer(): Element {
	const fullscreenElement = document.fullscreenElement;
	// A fullscreen <video> cannot hold children, so the bar cannot show there.
	return fullscreenElement && !(fullscreenElement instanceof HTMLVideoElement)
		? fullscreenElement
		: document.documentElement;
}

async function start(): Promise<void> {
	const [placement, initialKeyBindings] = await Promise.all([
		loadPlacement(),
		loadKeyBindings(),
	]);
	let keyBindings = initialKeyBindings;
	const bar = new ControlsBar(placement, savePlacement);
	bar.setShortcuts(keyBindings);
	const pointer = { x: -1, y: -1 };
	let pendingPointerCheck = 0;
	let renderLoop = 0;
	let idleTimer = 0;

	const mount = (): void => {
		const container = mountContainer();
		if (bar.host.parentNode !== container) container.append(bar.host);
	};

	const render = (): void => {
		if (!bar.isVisible || !bar.video?.isConnected) {
			bar.hide();
			renderLoop = 0;
			return;
		}
		bar.render();
		renderLoop = requestAnimationFrame(render);
	};

	const hideWhenIdle = (): void => {
		window.clearTimeout(idleTimer);
		idleTimer = window.setTimeout(() => {
			if (bar.isInteracting) hideWhenIdle();
			else bar.hide();
		}, IDLE_HIDE_DELAY_MS);
	};

	const reveal = (video: HTMLVideoElement): void => {
		trackFrames(video);
		mount();
		bar.show(video);
		hideWhenIdle();
		if (!renderLoop) render();
	};

	const checkPointer = (): void => {
		pendingPointerCheck = 0;
		if (bar.isInteracting) {
			hideWhenIdle();
			return;
		}
		const video = findVideoAt(pointer.x, pointer.y);
		if (video) reveal(video);
		else bar.hide();
	};

	const scheduleCheckPointer = (): void => {
		if (!pendingPointerCheck) {
			pendingPointerCheck = requestAnimationFrame(checkPointer);
		}
	};

	document.addEventListener(
		'pointermove',
		(event) => {
			pointer.x = event.clientX;
			pointer.y = event.clientY;
			scheduleCheckPointer();
		},
		{ capture: true, passive: true },
	);
	// Feeds like Shorts and Reels swap the video under a still pointer.
	document.addEventListener('scroll', scheduleCheckPointer, {
		capture: true,
		passive: true,
	});
	// Learn the frame rate while the video plays, before the first frame step.
	document.addEventListener(
		'playing',
		(event) => {
			if (event.target instanceof HTMLVideoElement) trackFrames(event.target);
		},
		{ capture: true },
	);
	document.addEventListener('fullscreenchange', mount);

	watchKeyBindings((next) => {
		keyBindings = next;
		bar.setShortcuts(next);
	});
	listenForShortcuts({
		bindings: () => keyBindings,
		target: () => findShortcutTarget(bar.video),
		run: (action, video) => {
			VIDEO_ACTIONS[action](video);
			reveal(video);
		},
	});
}

if (document.documentElement instanceof HTMLElement) void start();
