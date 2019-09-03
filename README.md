## what?
It's a express server for browsing photo and video directories. It's a lot faster than reading network shares in Windows or Mac. 

## why?
My devices backup photos and videos onto a network drive every night. Many times I want to look at them or display them around the house but since there are so many files and directories file browsers seem to take forever to read each directory. So this photoServer makes that browsing fast and easy. I looked around for another solution to this problem and nothing came close enough to what I wanted. 

## options?
You can pass any directory as the root to serve by `node photoServer.js [PATH]`

## details
Currently `isMedia` and `isImg` check for `mp4` and `jpg`, but can easily be altered to be whatever is relevant. 

## running
`./photoServer.js [ABSPATH]` to serve [ABSPATH] directory. The service is made available on port `4000`. 
To start as a simple service on ubuntu:
0. clone down repo and `npm install`
1. `crontab -e`
2. add entry: `@reboot [path to photoServer.js] [path to files to serve] &`

## todo
-- add bias for random directory walk or maybe resevoir sampling
-- random interval for videos should change based on the video's length so that it doesn't get interupted
-- remove blocking code in directory scan
-- add a rotate pic icon 
-- videoTemplate should support other formats than mp4
-- add mime types so files don't get sent as 'text-plain'
-- stop and resume slideshow buttons