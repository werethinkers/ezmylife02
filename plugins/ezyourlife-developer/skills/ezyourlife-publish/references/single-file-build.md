# Building one HTML file

EzYourLife needs the whole app in ONE `.html` file: HTML, CSS and JavaScript inline, small images as data URIs. Up to 10 MB; under 2 MB loads well on phones.

## Vite apps (React, Vue, Svelte, Solid, vanilla)

1. Install the plugin:
   ```
   npm install vite-plugin-singlefile --save-dev
   ```
2. Add it to `vite.config.*`:
   ```ts
   import { defineConfig } from "vite";
   import react from "@vitejs/plugin-react"; // keep whatever framework plugin is already there
   import { viteSingleFile } from "vite-plugin-singlefile";

   export default defineConfig({
     plugins: [react(), viteSingleFile()],
   });
   ```
3. Remove lazy routes and `import()` calls, or make them static imports. Chunks that are not inlined will not load.
4. Run `npm run build`. The result is `dist/index.html`. Check that `dist/` holds no other `.js` or `.css` files. If it does, something is still code-split; fix it and rebuild.
5. Files from `public/` (favicon, images used by path) are copied next to `index.html`, not inlined. Run the inliner on `dist` once more to pull them in: `node ${CLAUDE_PLUGIN_ROOT}/skills/ezyourlife-publish/scripts/inline-html.mjs dist index.html ezyourlife-app.html`, and send `ezyourlife-app.html`.

Don't commit this config change to the developer's main branch unless they want it. Building on a separate branch (for example `ezyourlife-build`) keeps their normal build untouched.

## Other build tools (Create React App, webpack, Parcel, Next.js static export, plain HTML)

Build normally, then inline the output with the bundled script:

```
node ${CLAUDE_PLUGIN_ROOT}/skills/ezyourlife-publish/scripts/inline-html.mjs <build-folder> [entry.html] [out.html]
```

For example:
```
node .../inline-html.mjs build index.html ezyourlife-app.html
```

What the script does:
- Inlines local stylesheets, including their `url(...)` fonts and images.
- Inlines local scripts.
- Inlines local `<img>` and icon files as data URIs.
- Leaves `http(s)` links (CDNs) as they are.
- Warns when a script still imports other local chunks; those need a single-bundle build.

Settings for each tool:
- **Next.js**: set `output: 'export'`, and use client-side pages only (no API routes, no server actions). Next.js usually splits code into chunks, so prefer moving the app to Vite. Otherwise turn off code splitting in the webpack config before inlining.
- **Create React App**: set `"homepage": "."` in package.json before building, so asset paths are relative.
- **Plain HTML projects**: run the script on the project folder directly.

## Check the result

- One file, at most 10 MB: `ls -l <file>`.
- No secrets or AI calls: use the grep in SKILL.md.
- It opens and works as a local file, or under `npx vite preview` before inlining.
