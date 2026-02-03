import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: [
		'src/entrypoints/api.ts',
		'src/entrypoints/worker.ts',
		'src/entrypoints/cli.ts',
	],
	format: ['esm'],
	dts: true,
	clean: true,
	shims: true,
	splitting: false,
	banner: {
		js: '#!/usr/bin/env node',
	},
	outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
	outDir: 'dist',
	treeshake: true,
	platform: 'node',
	target: 'node24',
	minify: false, // Keep readable for debugging
	sourcemap: true,
});
