export interface TimeRange {
	start: number;
	end: number;
}

export type FrameDirection = 1 | -1;

interface FrameStepInput {
	currentTime: number;
	presentedTime: number | null;
	frameDuration: number;
	direction: FrameDirection;
}

export function clampTime(time: number, range: TimeRange): number {
	return Math.min(Math.max(time, range.start), range.end);
}

/**
 * When the last presented frame is known, its timestamp is the exact frame
 * start, so the target is the middle of the neighbour frame. Landing mid-frame
 * keeps the step stable even if the estimated frame rate is slightly off.
 */
export function frameStepTarget({
	currentTime,
	presentedTime,
	frameDuration,
	direction,
}: FrameStepInput): number {
	const isFrameAligned =
		presentedTime !== null &&
		Math.abs(currentTime - presentedTime) < frameDuration;

	if (!isFrameAligned) return currentTime + direction * frameDuration;
	return presentedTime + direction * frameDuration + frameDuration / 2;
}
