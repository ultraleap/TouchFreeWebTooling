require('esbuild').build({
    entryPoints: ['src/TouchFree_Tooling.js', 'Plugins/SnappingPlugin/src/SnappingPlugin.ts'],
    bundle: true,
    minify: false,
    sourcemap: true,
    outdir: 'dist',
  });