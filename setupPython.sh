#!/bin/bash

cd ./python
rm -rf ./venv
python3 -m venv venv
python3 -m pip install -r requirements.txt