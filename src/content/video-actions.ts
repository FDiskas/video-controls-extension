import { type ActionId, SEEK_STEP_SECONDS } from '../shared/keybindings.ts';
import { trackFrames } from './frame-tracker.ts';
import {
	clampTime,
	type FrameDirection,
	frameStepTarget,
	type TimeRange,
} from './seek.ts';

export function seekableRange(video: HTMLVideoElement): TimeRange {
	const { seekable } = video;
	if (seekable.length > 0) {
		return { start: seekable.start(0), end: seekable.end(seekable.length - 1) };
	}
	return {
		start: 0,
		end: Number.isFinite(video.duration) ? video.duration : 0,
	};
}

export function seekTo(video: HTMLVideoElement, time: number): void {
	video.currentTime = clampTime(time, seekableRange(video));
}

function seekBy(video: HTMLVideoElement, seconds: number): void {
	seekTo(video, video.currentTime + seconds);
}

function stepFrame(video: HTMLVideoElement, direction: FrameDirection): void {
	video.pause();
	const frames = trackFrames(video);
	seekTo(
		video,
		frameStepTarget({
			currentTime: video.currentTime,
			presentedTime: frames.presentedTime,
			frameDuration: frames.frameDuration,
			direction,
		}),
	);
}

function togglePlay(video: HTMLVideoElement): void {
	if (!video.paused) {
		video.pause();
		return;
	}
	// Autoplay policy or a quick pause can reject play(); the button state
	// follows video.paused on the next render, so there is nothing to recover.
	video.play().catch(() => undefined);
}

export type VideoAction = (video: HTMLVideoElement) => void;

export const VIDEO_ACTIONS: Record<ActionId, VideoAction> = {
	togglePlay,
	seekBack: (video) => seekBy(video, -SEEK_STEP_SECONDS),
	seekForward: (video) => seekBy(video, SEEK_STEP_SECONDS),
	previousFrame: (video) => stepFrame(video, -1),
	nextFrame: (video) => stepFrame(video, 1),
};
