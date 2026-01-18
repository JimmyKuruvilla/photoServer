#!/bin/bash
set -euxo
source ./python/venv/bin/activate

SOURCE_PATH=/mnt/backup/media env tsx /home/j/scripts/photoServer/scripts/updateFaces/runUpdateDbWithFaces.ts