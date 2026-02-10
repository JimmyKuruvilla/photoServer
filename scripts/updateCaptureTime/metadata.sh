#!/bin/bash
set -euxo

# live
SOURCE_PATH=/mnt/backup/media env tsx /home/j/scripts/photoServer/scripts/updateMetadata/runUpdateDbWithLlmMetadata.ts

# test
# IS_TEST=true SOURCE_PATH=/home/j/scripts/photoServer/test/source tsx /home/j/scripts/photoServer/scripts/updateMetadata/runUpdateDbWithLlmMetadata.ts