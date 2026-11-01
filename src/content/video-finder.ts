import { isExcludedBySite } from './site-rules.ts';

const MIN_WIDTH = 160;
const MIN_HEIGHT = 90;
const MIN_VISIBLE_SHARE = 0.5;

const pageVideos = document.getElementsByTagName('video');

function containsPoint(rect: DOMRect, x: number, y: number): boolean {
	return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function areaInViewport(rect: DOMRect): number {
	const width =
		Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0);
	const height =
		Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
	return Math.max(width, 0) * Math.max(height, 0);
}

/**
 * Decorative background players are sometimes left without any source and only
 * show their poster, so there is nothing to control.
 */
function needsControls(video: HTMLVideoElement, rect: DOMRect): boolean {
	return (
		video.currentSrc !== '' &&
		rect.width >= MIN_WIDTH &&
		rect.height >= MIN_HEIGHT &&
		!video.controls &&
		!isExcludedBySite(video) &&
		video.checkVisibility({ opacityProperty: true, visibilityProperty: true })
	);
}

function isMostlyInViewport(rect: DOMRect): boolean {
	return areaInViewport(rect) >= MIN_VISIBLE_SHARE * rect.width * rect.height;
}

/**
 * Sites like Instagram cover the video with transparent layers, so hit-testing
 * by element does not work. Compare the pointer with each video's box instead
 * and prefer the smallest match, which is the most specific one.
 */
export function findVideoAt(x: number, y: number): HTMLVideoElement | null {
	let match: HTMLVideoElement | null = null;
	let matchArea = Number.POSITIVE_INFINITY;

	for (const video of pageVideos) {
		const rect = video.getBoundingClientRect();
		const area = rect.width * rect.height;
		if (
			area >= matchArea ||
			!containsPoint(rect, x, y) ||
			!needsControls(video, rect)
		) {
			continue;
		}
		match = video;
		matchArea = area;
	}
	return match;
}

/**
 * Keyboard shortcuts act on the video the controls last showed for while it
 * stays in view; otherwise on the largest video in view, such as the current
 * item of a Shorts or Reels feed.
 */
export function findShortcutTarget(
	preferred: HTMLVideoElement | null,
): HTMLVideoElement | null {
	if (preferred?.isConnected) {
		const rect = preferred.getBoundingClientRect();
		if (needsControls(preferred, rect) && isMostlyInViewport(rect)) {
			return preferred;
		}
	}

	let match: HTMLVideoElement | null = null;
	let matchArea = 0;
	for (const video of pageVideos) {
		const rect = video.getBoundingClientRect();
		const area = areaInViewport(rect);
		if (
			area <= matchArea ||
			!isMostlyInViewport(rect) ||
			!needsControls(video, rect)
		) {
			continue;
		}
		match = video;
		matchArea = area;
	}
	return match;
}
