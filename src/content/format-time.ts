const FLOATING_POINT_TOLERANCE = 1e-6;

const twoDigits = (value: number): string => String(value).padStart(2, '0');

export function formatTime(totalSeconds: number, fractionDigits = 0): string {
	if (!Number.isFinite(totalSeconds)) return '--:--';

	const scale = 10 ** fractionDigits;
	const units = Math.floor(
		Math.max(0, totalSeconds) * scale + FLOATING_POINT_TOLERANCE,
	);
	const wholeSeconds = Math.floor(units / scale);
	const hours = Math.floor(wholeSeconds / 3600);
	const minutes = Math.floor((wholeSeconds % 3600) / 60);
	const seconds = twoDigits(wholeSeconds % 60);
	const fraction =
		fractionDigits > 0
			? `.${String(units % scale).padStart(fractionDigits, '0')}`
			: '';

	return hours > 0
		? `${hours}:${twoDigits(minutes)}:${seconds}${fraction}`
		: `${minutes}:${seconds}${fraction}`;
}
