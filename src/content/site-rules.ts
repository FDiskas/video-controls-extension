import type { Placement } from './placement-store.ts';

const isYouTube = /(^|\.)youtube(-nocookie)?\.com$/.test(location.hostname);

/** YouTube's main player and embeds have their own controls; only Shorts lack them. */
export function isExcludedBySite(video: HTMLVideoElement): boolean {
	return isYouTube && !video.closest('ytd-shorts');
}

/** Shorts show YouTube's own play and mute buttons at the top of the video. */
export const sitePlacement: Placement = isYouTube ? 'bottom' : 'top';
