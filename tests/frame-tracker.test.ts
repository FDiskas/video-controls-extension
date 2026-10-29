import { describe, expect, test } from 'bun:test';
import { estimateFrameDuration } from '../src/content/frame-tracker.ts';

describe('estimateFrameDuration', () => {
	test('falls back to 30 fps without samples', () => {
		expect(estimateFrameDuration([])).toBeCloseTo(1 / 30);
	});

	test('snaps a measured rate to the nearest common rate', () => {
		expect(estimateFrameDuration([1 / 24.1, 1 / 23.9, 1 / 24])).toBeCloseTo(
			1 / 24,
		);
	});

	test('tells 29.97 fps apart from 30 fps', () => {
		expect(estimateFrameDuration([1001 / 30000])).toBeCloseTo(1001 / 30000, 6);
	});

	test('ignores outliers through the median', () => {
		expect(
			estimateFrameDuration([1 / 60, 1 / 60, 1 / 60, 2 / 60, 1 / 60]),
		).toBeCloseTo(1 / 60);
	});

	test('keeps an uncommon rate as measured', () => {
		expect(estimateFrameDuration([1 / 15])).toBeCloseTo(1 / 15);
	});
});
