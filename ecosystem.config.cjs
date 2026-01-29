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
      // SOURCE_PATH='/mnt/backup/media/__dropoff' TARGET_PATH='/mnt/backup/media' tsx watch ./src/ingestion/dropProcessor/runDropProcessor.ts
      name: 'dropProcessor',
      script: './src/ingestion/dropProcessor/runDropProcessor.ts',
      interpreter: 'node',
      interpreterArgs: '--import tsx',
      log_file: '/mnt/backup/media/__logs/dropProcessor.log',
      env: {
        SOURCE_PATH: '/mnt/backup/media/__dropoff',
        TARGET_PATH: '/mnt/backup/media'
      }
    },
    {
      name: 'emailbot',
      script: './src/emailbot/emailbot.ts',
      interpreter: 'node',
      interpreterArgs: '--import tsx',
      env: {
        MAIL_STATE_FILE_PATH: '/home/j/scripts/photoServer/src/emailbot/mail.state.json'
      }
    },
  ],
};