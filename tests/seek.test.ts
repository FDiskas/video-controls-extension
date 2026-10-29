import { describe, expect, test } from 'bun:test';
import { clampTime, frameStepTarget } from '../src/content/seek.ts';

const FRAME = 1 / 30;

describe('clampTime', () => {
	const range = { start: 0, end: 60 };

	test('keeps a time inside the range', () => {
		expect(clampTime(12.5, range)).toBe(12.5);
	});

	test('stops at the range start', () => {
		expect(clampTime(-4, range)).toBe(0);
	});

	test('stops at the range end', () => {
		expect(clampTime(75, range)).toBe(60);
	});
});

describe('frameStepTarget', () => {
	test('lands in the middle of the next frame when the frame is known', () => {
		const target = frameStepTarget({
			currentTime: 1.01,
			presentedTime: 1,
			frameDuration: FRAME,
			direction: 1,
		});
		expect(target).toBeCloseTo(1 + 1.5 * FRAME);
	});

	test('lands in the middle of the previous frame when the frame is known', () => {
		const target = frameStepTarget({
			currentTime: 1,
			presentedTime: 1,
			frameDuration: FRAME,
			direction: -1,
		});
		expect(target).toBeCloseTo(1 - 0.5 * FRAME);
	});

	test('steps from the current time when no frame was presented', () => {
		const target = frameStepTarget({
			currentTime: 2,
			presentedTime: null,
			frameDuration: FRAME,
			direction: 1,
		});
		expect(target).toBeCloseTo(2 + FRAME);
	});

	test('steps from the current time when the presented frame is stale', () => {
		const target = frameStepTarget({
			currentTime: 5,
			presentedTime: 1,
			frameDuration: FRAME,
			direction: -1,
		});
		expect(target).toBeCloseTo(5 - FRAME);
	});
});
