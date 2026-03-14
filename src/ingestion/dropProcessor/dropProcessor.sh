# unused
set -euxo
#!/bin/bash
SOURCE_PATH=/mnt/backup/media/__dropoff TARGET_PATH=/mnt/backup/media env tsx /home/j/scripts/photoServer/src/ingestion/dropProcessor/runDropProcessor.ts
