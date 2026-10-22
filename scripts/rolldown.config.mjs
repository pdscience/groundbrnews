import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)))

export default {
  input: path.join(root, 'scripts/ingest.ts'),
  resolve: {
    alias: {
      '@': path.join(root, 'src'),
    },
  },
  external: [/^node:/],
  output: {
    dir: path.join(root, '.ingest'),
    format: 'esm',
    entryFileNames: 'ingest.js',
  },
}
