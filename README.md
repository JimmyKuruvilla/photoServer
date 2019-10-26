## what?
It's a express server for browsing photo and video directories. It's a lot faster than reading network shares in Windows or Mac. 

## why?
My devices backup photos and videos onto a network drive every night. Many times I want to look at them or display them around the house but since there are so many files and directories file browsers seem to take forever to read each directory. So this photoServer makes that browsing fast and easy. I looked around for another solution to this problem and nothing came close enough to what I wanted. 

## details
Currently `isMedia` and `isImg` check for `mp4` and `jpg`, but can easily be altered to be whatever is relevant. 

## running
You can pass any directory as the root to serve by `node photoServer.js [PATH]`. This will start the webserver and will allow browsing, however to use `random`/`slideshow` functionality you will have to populate the database:

run `docker-compose up` to bring up the db and the webserver. 
run `node updateDb.js YOURFILES_DIR` to populate the db with the file paths. YOURFILES_DIR must be an absolute path, and must *also* be passed as a volume to docker-compose. 
The web server is made available on port `4000`.

## Clients
Any browser can be used to view the media by navigating to the url. However low power devices like raspberry pis can also use the framebuffer to display slideshow images using the `slideshow.sh` script. It pulls a random file, using `fim` to show it and then kills the process on a loop. 

## NOTE
If you have a remote share, docker will refuse to make it available as a volume so you will have to bind-mount it first:
`sudo mount --bind /mnt/backup/share/Photos/ ./share` -- now it's "local."
Then alter the docker.compose file to mount the share volume at the same path as files will be in the db:
```
command: sh -c "npm run migrate && node photoServer.js YOURFILES_DIR"
volumes:
./share:YOURFILES_DIR
```


## todo
-- spacebar to be pause start and then stop. 
-- read EXIF data and rotate photos accoringly. 
-- update exif buttons.
// remove media html `content` classes
