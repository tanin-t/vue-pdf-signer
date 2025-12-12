# vue-pdf-signer

A Vue 2 component for signing and annotating PDFs and images.

## ⚠️ Breaking Changes in v1.0.0

Version 1.0.0 is a major rewrite for modern bundler compatibility:

- **Vue is now a peer dependency** - You must have Vue 2 installed in your project
- **New module format** - ESM, CommonJS, and UMD builds
- **Build system changed** - From Vue CLI to Vite
- **File names changed** - `vue-pdf-signer.es.js`, `vue-pdf-signer.cjs.js`

If you need the old behavior (Vue bundled inside), use version `0.2.x`.

## Installation

```bash
npm install vue-pdf-signer
# or
yarn add vue-pdf-signer
```

## Usage

```vue
<template>
  <PdfSigner :src="pdfUrl" @ready="onReady" />
</template>

<script>
import PdfSigner from 'vue-pdf-signer'
import 'vue-pdf-signer/style.css'

export default {
  components: { PdfSigner },
  data() {
    return {
      pdfUrl: '/path/to/document.pdf'
    }
  },
  methods: {
    onReady() {
      console.log('PDF loaded and ready')
    }
  }
}
</script>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `src` | `string` | Generic source URL (PDF or image) |
| `pdfUrl` | `string` | URL to a PDF file |
| `imageUrl` | `string` | URL to an image file |

### Events

| Event | Description |
|-------|-------------|
| `ready` | Emitted when the PDF/image is loaded and ready |

## Bundler Compatibility

This library is compatible with modern bundlers including:
- **Webpack** (CommonJS/ESM)
- **Vite** (ESM)
- **Rsbuild** (ESM)
- **Rollup** (ESM)
- **esbuild** (ESM)

The package provides:
- ESM build (`vue-pdf-signer.es.js`)
- CommonJS build (`vue-pdf-signer.cjs.js`)
- UMD build (`vue-pdf-signer.umd.js`)
- TypeScript declarations

## Development

### Start Dev Server (Vite)
```bash
yarn dev
```

### Build Library
```bash
yarn build
```

### Available Scripts
| Script | Description |
|--------|-------------|
| `yarn dev` | Start Vite dev server |
| `yarn build` | Build library for npm distribution |
| `yarn build-app` | Build demo app |
| `yarn preview` | Preview built app |
| `yarn lint` | Run ESLint |
| `yarn dev:legacy` | Start Vue CLI dev server (legacy) |
| `yarn build-lib:legacy` | Build with Vue CLI (legacy) |

## Publish Updates

1. Update version number in package.json

2. Build and publish to NPM
```bash
yarn build
npm publish
```

3. Commit to github
```bash
git add .
git commit -m "<message>"
git push

git tag -a <version-number> -m "<message>"
git push --tags
```