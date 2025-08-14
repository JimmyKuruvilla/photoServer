#!/bin/bash

cd ./python
rm -rf ./venv
python3 -m venv venv
# source venv/bin/activate
# spawning a subshell during the face detection during normal processing. This is only required if testing locally
python3 -m pip install -r requirements.txt