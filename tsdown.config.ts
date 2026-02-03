import { defineConfig } from 'tsdown';

export default defineConfig([
	// CLI entry with shebang
	{
		entry: ['src/entrypoints/cli.ts'],
		format: ['esm'],
		dts: true,
		shims: true,
		banner: {
			js: '#!/usr/bin/env node',
		},
		outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
		outDir: 'dist',
		treeshake: true,
		platform: 'node',
		target: 'node24',
		minify: false,
		sourcemap: true,
		clean: false, // Don't clean (second config will handle it)
	},
	// API and Worker without shebang
	{
		entry: ['src/entrypoints/api.ts', 'src/entrypoints/worker.ts'],
		format: ['esm'],
		dts: true,
		shims: true,
		outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
		outDir: 'dist',
		treeshake: true,
		platform: 'node',
		target: 'node24',
		minify: false,
		sourcemap: true,
		clean: true, // Clean dist before build
	},
]);
