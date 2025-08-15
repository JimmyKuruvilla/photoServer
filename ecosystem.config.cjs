module.exports = {
  apps: [
    {
      name: 'photoServer',
      script: './src/server.ts',
      interpreter: 'node',
      interpreterArgs: '--import tsx',
      env: {
        MEDIA_PATH: '/mnt/backup/media',
      }
    },
    {
      // SOURCE_PATH='/mnt/backup/media/__dropoff' TARGET_PATH='/mnt/backup/media' tsx scripts/runDropProcessor.ts
      name: 'dropProcessor',
      script: './scripts/processor/runDropProcessor.ts',
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