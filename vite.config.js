import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const pages = [
  'index.html',
  'items-available.html',
  'total-items.html',
  '50-gsm.html',
  '80-gsm.html',
  'medical-paper.html',
  'cake-box.html',
  'payments.html',
  'bill.html',
];

export default defineConfig({
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((page) => [page.replace(/\.html$/, ''), resolve(__dirname, page)]),
      ),
    },
  },
});
