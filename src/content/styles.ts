export const BAR_HEIGHT = 36;

export const CONTROLS_CSS = `
.bar {
	position: fixed;
	top: 0;
	left: 0;
	z-index: 2147483647;
	box-sizing: border-box;
	height: ${BAR_HEIGHT}px;
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 4px 6px;
	border-radius: 8px;
	background: rgb(15 15 15 / 0.78);
	backdrop-filter: blur(6px);
	color: #fff;
	font: 500 12px/1 system-ui, -apple-system, sans-serif;
	user-select: none;
	opacity: 0;
	pointer-events: none;
	transition: opacity 0.15s;
}

.bar[data-visible] {
	opacity: 1;
	pointer-events: auto;
}

button {
	all: unset;
	flex: none;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 1px;
	min-width: 28px;
	height: 28px;
	padding: 0 2px;
	box-sizing: border-box;
	border-radius: 6px;
	cursor: pointer;
}

button:hover {
	background: rgb(255 255 255 / 0.16);
}

button:focus-visible {
	outline: 2px solid #fff;
}

svg {
	width: 18px;
	height: 18px;
	fill: currentColor;
}

.scrubber {
	flex: 1;
	min-width: 48px;
	margin: 0 4px;
	accent-color: #fff;
	cursor: pointer;
}

.time {
	flex: none;
	padding: 0 4px;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}

.bar[data-size="compact"] .time,
.bar[data-size="tiny"] .time,
.bar[data-size="tiny"] .scrubber {
	display: none;
}

.bar[data-size="tiny"] {
	justify-content: center;
}
`;
