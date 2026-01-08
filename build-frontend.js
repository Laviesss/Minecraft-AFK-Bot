const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['public/index.tsx'],
  bundle: true,
  outfile: 'public/bundle.js',
  sourcemap: true,
  platform: 'browser',
  target: ['es2020'],
  loader: {
    '.ts': 'ts',
    '.tsx': 'tsx',
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
}).then(() => {
  console.log('[Build] Frontend built successfully');
}).catch(() => process.exit(1));
