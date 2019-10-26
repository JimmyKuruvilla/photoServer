#!/bin/bash
webpath=$(curl -s http://localhost:4000/randomUrl?type=image | jq --raw-output .webPath)
webpath=$(perl -MURI::Escape -e 'print uri_escape($ARGV[0]);' "$webpath") 
webpath=http://localhost:4000/$webpath 
curl -s -o tmp $webpath 
echo $webpath
