const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const ICON_PATHS = {
	play: 'M8 5v14l11-7z',
	pause: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z',
	rewind: 'M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z',
	fastForward: 'M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z',
	previousFrame: 'M6 6h2v12H6zm3.5 6l8.5 6V6z',
	nextFrame: 'M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z',
	swapPlacement:
		'M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z',
} as const;

export type IconName = keyof typeof ICON_PATHS;

// Built with DOM calls, not innerHTML, because YouTube enforces Trusted Types.
export function createIcon(name: IconName): SVGSVGElement {
	const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
	svg.setAttribute('viewBox', '0 0 24 24');
	svg.setAttribute('aria-hidden', 'true');
	const path = document.createElementNS(SVG_NAMESPACE, 'path');
	path.setAttribute('d', ICON_PATHS[name]);
	svg.append(path);
	return svg;
}
