const FALLBACK_FRAME_DURATION = 1 / 30;
const MAX_SAMPLES = 31;
const MIN_FRAME_DURATION = 1 / 240;
const MAX_FRAME_DURATION = 1 / 10;
const COMMON_FRAME_RATES = [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60, 120];
const SNAP_TOLERANCE = 0.02;

function nearestCommonFrameRate(rate: number): number {
	const nearest = COMMON_FRAME_RATES.reduce((best, candidate) =>
		Math.abs(candidate - rate) < Math.abs(best - rate) ? candidate : best,
	);
	return Math.abs(nearest - rate) / nearest < SNAP_TOLERANCE ? nearest : rate;
}

export function estimateFrameDuration(samples: readonly number[]): number {
	const sorted = samples.toSorted((a, b) => a - b);
	const median = sorted[Math.floor(sorted.length / 2)];
	if (median === undefined) return FALLBACK_FRAME_DURATION;
	return 1 / nearestCommonFrameRate(1 / median);
}

/** Learns a video's frame rate from the frames the browser presents. */
class FrameTracker {
	presentedTime: number | null = null;
	readonly #video: HTMLVideoElement;
	readonly #samples: number[] = [];
	#previousFrame: VideoFrameCallbackMetadata | null = null;

	constructor(video: HTMLVideoElement) {
		this.#video = video;
		this.#watchNextFrame();
	}

	get frameDuration(): number {
		return estimateFrameDuration(this.#samples);
	}

	#watchNextFrame(): void {
		this.#video.requestVideoFrameCallback(this.#recordFrame);
	}

	readonly #recordFrame = (
		_now: DOMHighResTimeStamp,
		frame: VideoFrameCallbackMetadata,
	): void => {
		const previous = this.#previousFrame;
		if (previous && frame.presentedFrames - previous.presentedFrames === 1) {
			this.#addSample(frame.mediaTime - previous.mediaTime);
		}
		this.#previousFrame = frame;
		this.presentedTime = frame.mediaTime;
		this.#watchNextFrame();
	};

	#addSample(frameDuration: number): void {
		if (
			frameDuration < MIN_FRAME_DURATION ||
			frameDuration > MAX_FRAME_DURATION
		) {
			return;
		}
		this.#samples.push(frameDuration);
		if (this.#samples.length > MAX_SAMPLES) this.#samples.shift();
	}
}

const trackers = new WeakMap<HTMLVideoElement, FrameTracker>();

export function trackFrames(video: HTMLVideoElement): FrameTracker {
	let tracker = trackers.get(video);
	if (!tracker) {
		tracker = new FrameTracker(video);
		trackers.set(video, tracker);
	}
	return tracker;
}
