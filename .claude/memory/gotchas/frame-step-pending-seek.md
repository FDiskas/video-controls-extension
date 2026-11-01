---
name: frame-step-pending-seek
description: requestVideoFrameCallback presentedTime lags currentTime during a pending seek; rapid back-steps stall
keywords: [frame-step, seek, requestVideoFrameCallback, presentedTime, keyboard-repeat]
updated: 2026-11-01
---

### Rule / Fact

After `video.currentTime = x`, `currentTime` changes at once, but `FrameTracker.presentedTime` keeps the old frame until the browser shows the new frame. Frame-step logic must not trust `presentedTime` while a seek is pending (`video.seeking`).

### Context & Why

`frameStepTarget` in `src/content/seek.ts` treats the step as frame-aligned when `|currentTime - presentedTime| < frameDuration`. A back step moves `currentTime` to `presentedTime - 0.5 * frameDuration`, which still counts as aligned. The next back press before the frame shows gives the same target, so held `,` presses are lost. Forward steps do not have this problem: the gap grows to `1.5 * frameDuration`, which is more than one frame. Unit tests with large gaps (5 s vs 1 s) do not show the problem.

### Practical Impact

- When you change frame stepping, test with `currentTime = presentedTime - 0.5 * frameDuration`.
- To fix, use `currentTime` when `video.seeking` is true, or remember the last target.
