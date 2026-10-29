import { describe, expect, test } from 'bun:test';
import { formatTime } from '../src/content/format-time.ts';

describe('formatTime', () => {
	test('formats minutes and seconds', () => {
		expect(formatTime(75)).toBe('1:15');
	});

	test('adds hours for long videos', () => {
		expect(formatTime(3725)).toBe('1:02:05');
	});

	test('shows the requested fraction digits', () => {
		expect(formatTime(5.29, 2)).toBe('0:05.29');
	});

	test('truncates instead of rounding up to the next second', () => {
		expect(formatTime(59.999, 2)).toBe('0:59.99');
	});

	test('treats negative times as zero', () => {
		expect(formatTime(-3)).toBe('0:00');
	});

	test('shows a placeholder for an unknown or live duration', () => {
		expect(formatTime(Number.NaN)).toBe('--:--');
		expect(formatTime(Number.POSITIVE_INFINITY)).toBe('--:--');
	});
});
