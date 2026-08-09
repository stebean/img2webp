# img2webp

> Convert PNG/JPEG images to WebP and automatically update every reference in your source code — in one command.

[![npm version](https://img.shields.io/npm/v/img2webp)](https://www.npmjs.com/package/img2webp)
[![node](https://img.shields.io/node/v/img2webp)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/img2webp)](./LICENSE)

WebP images are **25–80% smaller** than PNG/JPEG with the same visual quality. The problem is that converting images is only half the work — you also have to hunt down every `src`, `url()`, and `import` in your code and update them manually.

`img2webp` does both in seconds.

---

## Features

- ✅ Converts `.png`, `.jpg`, and `.jpeg` images to `.webp` recursively
- ✅ Replaces all image references in your source code automatically
- ✅ Works with **any language or framework** (HTML, CSS, JS, TS, Vue, Svelte, PHP, Python, Ruby, Go, Markdown, YAML, and more)
- ✅ `--dry-run` mode to preview every change before it happens
- ✅ `--backup` mode to keep originals as `.bak` files
- ✅ Shows file size savings per image (e.g. `5.6 KB → 652 B  -88.7%`)
- ✅ Confirmation prompt before destructive operations
- ✅ `--yes` flag for CI/CD and scripting use

---

## Requirements

- **Node.js** >= 18.0.0

---

## Installation

```bash
# Install globally with npm
npm install -g img2webp

# Or with pnpm
pnpm add -g img2webp
```

---

## Usage

### `convert` — Convert images to WebP

```
img2webp convert <directory> [options]
```

Recursively finds all `.png`, `.jpg`, and `.jpeg` files in `<directory>` and converts them to `.webp`.

| Option | Alias | Description | Default |
|---|---|---|---|
| `--quality <number>` | `-q` | WebP quality (1–100) | `80` |
| `--backup` | `-b` | Keep originals as `.bak` instead of deleting | `false` |
| `--dry-run` | `-d` | Preview what would be converted, no changes made | `false` |
| `--yes` | `-y` | Skip the confirmation prompt (for scripts / CI) | `false` |

```bash
# Preview what would be converted
img2webp convert ./src/images --dry-run

# Convert at quality 90, keep originals as .bak
img2webp convert ./src/images --quality 90 --backup

# Convert and skip the confirmation prompt (for CI/CD)
img2webp convert ./assets --yes
```

**Example output:**

```
  img2webp — Convert Images
    Directory : /my-project/src/images
    Quality   : 80
    Backup    : false
  Found 3 image(s) to convert.

  ✔ src/images/hero.png    →  src/images/hero.webp
    5.6 KB → 652 B  -88.7%
  ✔ src/images/banner.jpg  →  src/images/banner.webp
    3.0 KB → 940 B  -69.5%
  ✔ src/images/icon.png    →  src/images/icon.webp
    1.2 KB → 310 B  -74.2%

  ✔ 3 image(s) converted.  9.8 KB → 1.9 KB  -81% saved
```

---

### `replace` — Update code references

```
img2webp replace <directory> [options]
```

Recursively scans source code files in `<directory>` and replaces every `.png`, `.jpg`, and `.jpeg` reference with `.webp`.

| Option | Alias | Description | Default |
|---|---|---|---|
| `--ext <extensions>` | `-e` | Comma-separated file extensions to scan | `html,css,js,jsx,ts,tsx,vue,svelte` |
| `--dry-run` | `-d` | Preview what would be replaced, no changes made | `false` |

```bash
# Preview all references that would be updated
img2webp replace ./src --dry-run

# Replace in default extensions (html, css, js, jsx, ts, tsx, vue, svelte)
img2webp replace ./src

# Replace in specific extensions including PHP and Python
img2webp replace ./src --ext html,css,php,py
```

**Example output:**

```
  img2webp — Replace Code References
  ⚠ Dry-run mode enabled. No files will be modified.
    Directory  : /my-project/src
    Extensions : html, css, js

  Found 3 file(s) to scan.

  src/index.html  (2 reference(s) found)
      assets/hero.png  →  assets/hero.webp
      assets/banner.jpg  →  assets/banner.webp
  src/styles.css  (1 reference(s) found)
      ./images/bg.jpg  →  ./images/bg.webp

  Dry run complete. 3 reference(s) would be replaced across 2 file(s).
```

---

## Recommended workflow

Run both commands together for a complete migration:

```bash
# Step 1 — preview the image conversion
img2webp convert ./src/images --dry-run

# Step 2 — preview the code changes
img2webp replace ./src --dry-run

# Step 3 — convert images (with backup, just in case)
img2webp convert ./src/images --backup

# Step 4 — update all code references
img2webp replace ./src

# Step 5 — verify your app looks correct, then clean up backups
find ./src/images -name "*.bak" -delete
```

---

## Language & Framework Compatibility

`img2webp replace` works on any **text-based file** that contains image path strings.

| ✅ Works out of the box | Example |
|---|---|
| HTML | `<img src="assets/hero.png">` |
| CSS / SCSS / LESS | `url('images/bg.jpg')` |
| JavaScript / TypeScript | `import logo from './logo.png'` |
| JSX / TSX (React) | `<img src="./banner.jpeg" />` |
| Vue / Svelte | `<img src="./hero.png" />` |
| PHP / Laravel Blade | `<img src="{{ asset('img/hero.jpg') }}">` |
| Python / Django / Jinja | `{% static 'images/logo.png' %}` |
| Ruby / ERB | `image_tag 'banner.png'` |
| Go templates | `<img src="/static/hero.jpeg">` |
| Markdown | `![alt](images/screenshot.png)` |
| YAML / JSON | `"splash": "assets/splash.jpg"` |

> **Note:** The tool replaces **static string references**. Dynamic paths built at runtime (e.g. `` `images/${name}.png` ``) or assets managed by a build tool like Next.js `<Image>` with auto-optimization may need manual review.

---

## License

[MIT](./LICENSE) — built by [stebean](https://github.com/stebean)
