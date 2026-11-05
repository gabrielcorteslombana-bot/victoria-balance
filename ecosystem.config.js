module.exports = {
  apps: [
    {
      name: 'vb-server',
      script: 'node_modules/tsx/dist/cli.mjs',
      cwd: 'C:/Users/jesus.cortes/Downloads/victoria-balance/server',
      args: 'src/index.ts',
      watch: false,
    },
    {
      name: 'vb-client',
      script: 'node_modules/vite/bin/vite.js',
      cwd: 'C:/Users/jesus.cortes/Downloads/victoria-balance/client',
      args: '--host 0.0.0.0 --port 5173',
      watch: false,
    },
  ],
};
