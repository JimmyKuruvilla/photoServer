#!/bin/bash
# deps: perl + URI:Escape, jq, fim, curl
HOST=192.168.2.123
DELAY=15
while [ true ]
do
 webpath=$(curl -s http://$HOST:4000/randomUrl?type=image | jq --raw-output .webPath)
 webpath=$(perl -MURI::Escape -e 'print uri_escape($ARGV[0]);' "$webpath") 
 webpath=http://$HOST:4000/$webpath 
 curl -s -o tmp $webpath 
 echo $webpath
 (fim -a tmp) & PID=$!
 (sleep $DELAY && kill -9 $PID) 
 clear	
done
