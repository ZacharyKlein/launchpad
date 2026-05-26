# Launchpad

A simple GitHub Pages launcher for web apps and project experiments.

## Add An App

Edit `apps.json`:

```json
{
  "name": "Project Name",
  "description": "A short description of the app.",
  "url": "https://example.com",
  "status": "Live",
  "initials": "PN",
  "tags": ["Category", "Tool"],
  "colors": {
    "background": "#e4f5ed",
    "foreground": "#0a5f49"
  }
}
```

Then refresh the app's favicon and Open Graph metadata:

```sh
node tools/refresh-metadata.mjs
```

## Publish With GitHub Pages

1. Push this repository to GitHub.
2. Open the repository settings.
3. Go to **Pages**.
4. Set the source to your default branch and the repository root.

GitHub Pages can serve these files directly; no build step is required.
