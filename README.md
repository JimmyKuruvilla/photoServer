## what?
It's a express server for browsing photo and video directories. It's a lot faster than reading network shares in Windows or Mac. 

## why?
My devices backup photos and videos onto a network drive every night. Many times I want to look at them or display them around the house but since there are so many files and directories file browsers seem to take forever to read each directory. So this photoServer makes that browsing fast and easy. I looked around for another solution to this problem and nothing came close enough to what I wanted. 

## options?
You can pass any directory as the root to serve by `node photoServer.js [PATH]`

## details
Currently `isMedia` and `isImg` check for `mp4` and `jpg`, but can easily be altered to be whatever is relevant. 

## running
`node photoServer.js` to serve the local directory. The service is made available on port `4000`. 

## todo
-- remove blocking code in directory scan
-- add mime types so files don't get sent as 'text-plain'
-- add a favicon.ico so that it doesn't get a 404

