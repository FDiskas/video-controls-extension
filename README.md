# Video Frame Controls

Chrome extension that adds a control bar to web videos without native controls, such as YouTube Shorts, Instagram Reels and custom site players.

## Controls

The bar shows when you move the pointer over a video and hides after 2.5 seconds without movement.

- Play / pause
- Back 10 seconds, forward 10 seconds
- Previous frame, next frame (pauses the video first)
- Scrub bar with the current time (hundredths of a second) and the duration
- Move the bar to the top or bottom edge of the video. The choice is saved per site. Default: bottom on YouTube, so the bar does not cover YouTube's own play, mute and CC buttons on Shorts; top on other sites, so it does not cover the captions of Reels.

On YouTube, only Shorts get the bar and the keyboard shortcuts. The main player and embedded players have their own controls, so the extension leaves them alone, and YouTube's own keys work there as usual.

## Keyboard shortcuts

| Action | Default |
| --- | --- |
| Play / pause | `K` |
| Back 10 seconds | `J` |
| Forward 10 seconds | `L` |
| Previous frame | `,` |
| Next frame | `.` |

The defaults are the same keys YouTube uses for the same actions.

- To change a shortcut, click the extension icon in the toolbar (or right-click it → **Options**). Click a shortcut, then press the new key combination. Esc cancels. **Clear** removes a shortcut. **Reset to defaults** restores all of them.
- If you choose a combination that another action uses, that action loses it. The page tells you which action.
- Changes apply at once in open tabs. The bar's button tooltips show the current keys.
- Shortcuts control the video under the pointer. If no video is under the pointer, they control the largest video that is at least half in view.
- Shortcuts do nothing while focus is in a text field. A key the extension handles does not reach the page, so YouTube does not run the same action twice.
- Shortcuts are saved in `chrome.storage.sync`, so they follow your Chrome profile.

## How it works

- `src/content/index.ts` tracks the pointer. Sites like Instagram cover the video with transparent layers, so the extension compares the pointer with each `<video>` box instead of the element under the pointer (`video-finder.ts`).
- The bar is a fixed element in a closed shadow root at the document root, so page CSS and the page's click handlers do not affect it (`controls-bar.ts`).
- `src/content/shortcuts.ts` listens for keys. `src/shared/keybindings.ts` holds the binding model. The settings page is `settings/settings.html` with `src/settings/settings.ts`.
- Frame steps use `requestVideoFrameCallback` to learn the frame rate and the timestamp of the shown frame. Each step seeks to the middle of the neighbour frame (`frame-tracker.ts`, `seek.ts`). Without samples, the frame rate falls back to 30 fps.
- Videos with the native `controls` attribute and videos smaller than 160 × 90 px get no bar. Site rules are in `site-rules.ts`.

## Limits

- A video element that is itself fullscreen cannot show the bar. Player containers that go fullscreen (YouTube, most sites) work.
- Videos inside closed shadow roots are not found.
- The extension has no icon yet. Chrome shows a default letter icon.

## Development

```sh
bun install
bun run build        # writes dist/
bun test
bun run typecheck
bun run lint
bun run unused:check
```

Load `dist/` at `chrome://extensions` → Developer mode → **Load unpacked**. After each build, click the reload button on the extension card and reload the page.

## Chrome Web Store deployment

The workflow at `.github/workflows/publish-chrome-webstore.yml` builds, packages and publishes the extension.

### Triggers

- Create a GitHub release, or push a tag, named after the version (`0.2.0` or `v0.2.0`)
- Manual run from the **Actions** tab via `workflow_dispatch`, with a `version` input

The version comes from the tag or the input and is written into `dist/manifest.json`. It must be higher than the published version. The `version` in the repository `manifest.json` is not used.

### Required GitHub settings

Secrets:

- `CWS_CLIENT_SECRET`
- `CWS_REFRESH_TOKEN`
- `CRX_PRIVATE_KEY` (optional) — PEM private key that signs the `.crx`. Without it, the workflow skips the `.crx`. Create one with `openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out crx-key.pem` and keep the same key for every release.

Variables:

- `CWS_CLIENT_ID`
- `CWS_EXTENSION_ID`

The workflow runs typecheck, lint and tests, then packages `dist/` into `video-frame-controls-<version>.zip` and, when `CRX_PRIVATE_KEY` is set, a signed `video-frame-controls-<version>.crx`. On tag runs it attaches both to the GitHub release before it publishes the zip with `mobilefirstllc/cws-publish` (`action: publish`), so the release gets the packages even when the store rejects the upload.

The `.crx` is signed with your own key, so its extension ID is different from the Chrome Web Store ID. Chrome on Windows and macOS blocks `.crx` files from outside the store; use the zip for a manual install there.

### Manual install from a GitHub release

1. Download `video-frame-controls-<version>.zip` from the release and unzip it.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the unzipped folder.
