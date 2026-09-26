import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/mouse-practice/',
  test: {
    environment: 'jsdom',
  },
});
