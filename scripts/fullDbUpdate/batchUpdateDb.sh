set -euxo
#!/bin/bash
SOURCE_PATH=/mnt/backup/media env tsx /home/j/scripts/photoServer/scripts/fullDbUpdate/runUpdateDb.ts
