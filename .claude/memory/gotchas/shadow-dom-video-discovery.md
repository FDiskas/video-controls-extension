---
name: shadow-dom-video-discovery
description: Video discovery and the playing listener do not reach any shadow DOM, open or closed
keywords: [shadow-dom, video-finder, web-components, reddit, playing-event]
updated: 2026-11-01
---

### Rule / Fact

The content script does not find videos inside any shadow root, open or closed. The README names only closed shadow roots, so it understates the limit.

### Context & Why

- `video-finder.ts` uses `document.getElementsByTagName('video')`, which does not look into shadow roots.
- The capture `playing` listener in `src/content/index.ts` also misses these videos, because media events are not composed and do not cross the shadow boundary.
- Players that are web components (for example Reddit `shreddit-player`) get no bar and no shortcuts.

### Practical Impact

- If a site reports "no controls", check first if its `<video>` is in a shadow root.
- Support needs a walk of open shadow roots (`element.shadowRoot`) and a listener on each root for `playing`.
