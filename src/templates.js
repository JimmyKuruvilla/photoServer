const path = require('path');
const { videoSvg, folderSvg } = require('./svgs.js');
const { isVideo } = require('./guards');

const home = `<button><a href="/">Home</a></button>`;
const random = `<button><a href="/random">Random</a></button>`;
const slideshowAll = `<button><a href="/random/slideshow">Slideshow All</a></button>`;
const fullscreen = `<button onclick="goFullScreen()">Fullscreen</button>`;

const generalToolbar = `
  ${home}
  ${random}
  ${slideshowAll}
  ${fullscreen}`;
  
const style = `
  <style>
    body{
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 16px;
      background-color: black;
      display: flex;
      flex-flow: column nowrap;
    }
    a{
      text-decoration: none;
    }
    h1,h2,h3,h4,h5,h6 {
      color: white;
    }
    li {
      margin: 5px 5px;
    }
    label {
      cursor: pointer;
      display:block;
      color: white;
    }
    label:hover {
      background-color: rebeccapurple;
    }
    svg {
      vertical-align: middle;
      background-color: white;
      border-radius: 10px;
      margin-right: 20px;
    }
    svg.folder {
      width: 40px;
      height: 40px;
    }
    .hidden {
      display: none;
    }
    .shown {
      display: initial;
    }
    .pic, svg.video {
      width: 200px;
      border-radius: 5px;
      transition: transform 200ms;
    }
    .pic:hover, svg.video:hover{
      border: 3px solid white; 
      transform: scale(1.5);
    }
    .pic.wide, video.wide {
      width: 75vw;
      max-height: calc(100vh - 100px);
      margin: 0 auto;
    }
    .pic.wide:hover, video.wide:hover {
      border:none;
      transform: none;
    }
    @media all and (display-mode: fullscreen) {
      body {
        background: blue;
      }
      .pic.wide, .video.wide{
        max-width: 100vw;
        width: initial;
      }
    }
    .section {
      margin: 20px 0;
    }
    .dir {
      margin: 5px 0;
    }
    .media {
      margin: 20 px 0;
    }
    .media.section {
      display:flex;
      flex-flow: row wrap;
      justify-content: space-evenly;
    }
    </style>`;

const generalScripts = () => `
    <script>

    function goFullScreen() {
      document.querySelector('body').requestFullscreen();
    }

    function isVideo(name) {
      return /.+\.mp4$|avi$/i.test(name);
    }

    function replaceOnInterval (contentInterval, directory) {
      clearInterval(window.contentIntervalId)
      window.contentIntervalId = setInterval(()=>{
        replaceContent(directory);
      }, contentInterval)
    }

    function replaceContent(directory) {
      const url  = directory ? \`/\${directory}/randomUrl\` : '/randomUrl';
      fetch(url)
      .then((response) => response.json())  
      .then((item)=> {
        replaceOnInterval(item.duration ? item.duration + 1000 : window.contentInterval, directory);
        document.querySelector('.filename').innerHTML = item.name;
        document.querySelector('.content-wrapper').innerHTML = item.html;
      });
    }

    </script>
  `;

function dirTemplate(locals) {
  return `
  <html>
    <head> 
      ${style}
      ${ generalScripts() }
    </head>
    
    <body>
      <div class="buttons">
        ${generalToolbar}
        ${
          locals.currentDir
            ? `<button><a href="/${
                locals.currentDir
              }/slideshow">Slideshow Here</a></button>`
            : ''
        }
        </div>
        <div class="dir section">
        ${locals.dirs
          .map(
            i =>
              `<div class="dir"><a href="${i.webPath}"><label>${folderSvg}${
                i.name
              }</label></div>`
          )
          .join('')}
        </div>

        <div class="file section">
        ${locals.files
          .map(
            i =>
              `<div class="file"><a href="${i.webPath}"><label>${
                i.name
              }</label></div>`
          )
          .join('')}
        </div>

        <div class="media section">
        ${locals.media
          .map(
            i =>
              `<div class="media"><a href="${i.webPath}"><label>${
                i.name
              }</label>${
                isVideo(i.name)
                  ? videoSvg
                  : `<img src="${i.webPath}" class="pic">`
              }</div>`
          )
          .join('')}
        </div>
    </body>
  </html>`;
}

function getMediaHtml(item, interval) {
  if (isVideo(item.webPath)) {
    return `<video controls autoplay class="video content wide"><source src="${interval ? path.join('..', item.webPath): item.webPath}" type="video/mp4"></video>`
  } else {
    return `<img src="${interval ? path.join('..', item.webPath) : item.webPath}" class="pic content wide">`
  }
}

function imgVidTemplate(item, interval, directory) {
  return `
    <html>
      <head>
        ${style}
        ${ generalScripts() }
      </head>

      <body>
        <div class="buttons">
          ${generalToolbar}
        </div>

        <h6 class="filename">${item.name}</h6>
      
        <div class="content-wrapper">
          ${ getMediaHtml(item, interval) }
        </div>

        <script>
        if(${interval}){
          window.contentInterval = ${interval};
          replaceOnInterval(${interval}, "${directory || ''}");
        }
        </script>

      </body>
    </html>
    `;
}

module.exports = {
  dirTemplate,
  imgVidTemplate,
  getMediaHtml
};
