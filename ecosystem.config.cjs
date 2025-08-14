module.exports = {
  apps: [
    {
      name: 'photoServer',
      script: './src/photoServer.ts',
      interpreter: 'node',
      interpreterArgs: '--import tsx',
      env: {
        MEDIA_PATH: '/mnt/backup/media',
      }
    },
    {
      name: 'dropProcessor',
      script: './scripts/runDropProcessor.ts',
      interpreter: 'node',
      interpreterArgs: '--import tsx',
      log_file: '/mnt/backup/media/__logs/dropProcessor.log',
      env: {
        SOURCE_PATH: '/mnt/backup/media/__dropoff',
        TARGET_PATH: '/mnt/backup/media'
      }
    },
  ],
};