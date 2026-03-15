#!/usr/bin/env bash

TEST_DIR="/home/j/scripts/photoServer/test"

# setup source
rm -rf $TEST_DIR/source
mkdir $TEST_DIR/source
cp -r $TEST_DIR/files/* $TEST_DIR/source

# setup target
mkdir $TEST_DIR/target

# run test
export IS_TEST=true 
export SHOULD_MOVE=true 
export SHOULD_AI=false 
export SOURCE_PATH=$TEST_DIR/source 
export TARGET_PATH=$TEST_DIR/target 
tsx ./src/ingestion/runIngest.ts