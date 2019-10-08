const path = require('path');
const { videoSvg, folderSvg } = require('./svgs.js');
const { isVideo } = require('./guards');

const home = `<button><a href="/">Home</a></button>`;
const random = `<button><a href="/random">Random</a></button>`;
const slideshowAll = `<button><a href="/random/slideshow">Slideshow All</a></button>`;
const fullscreen = `<button onclick="goFullScreen()">Fullscreen</button>`;
const pause = `<button onclick="pauseSlideShow()">Pause</button>`;

const generalToolbar = `
  ${home}
  ${random}
  ${slideshowAll}
  ${fullscreen}
  ${pause}`;

const cssAndJs = () => `
  <link rel="stylesheet" type="text/css" href="main.css">
  <script src="main.js"></script>
  `;

function dirTemplate(locals) {
  return `
  <html>
    <head> 
      ${cssAndJs()}
    </head>
    
    <body>
      <div class="buttons">
        ${generalToolbar}
        ${
          locals.currentDir
            ? `<button><a href="/${locals.currentDir}/slideshow">Slideshow Here</a></button>`
            : ''
        }
        </div>
        <div class="dir section">
        ${locals.dirs
          .map(
            i =>
              `<div class="dir"><a href="${i.webPath}"><label>${folderSvg}${i.name}</label></div>`
          )
          .join('')}
        </div>

        <div class="file section">
        ${locals.files
          .map(
            i =>
              `<div class="file"><a href="${i.webPath}"><label>${i.name}</label></div>`
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

function getMediaHtmlFragment(item, interval) {
  if (isVideo(item.webPath)) {
    return `<video controls autoplay class="video content wide"><source src="${
      interval ? path.join('..', item.webPath) : item.webPath
    }" type="video/mp4"></video>`;
  } else {
    return `<img src="${
      interval ? path.join('..', item.webPath) : item.webPath
    }" class="pic content wide">`;
  }
}

function imgVidTemplate(item, interval, directory) {
  return `
    <html>
      <head>
      ${cssAndJs()}
      </head>

      <body>
        <div class="buttons">
          ${generalToolbar}
        </div>

        <h6 class="filename">${item.name}</h6>
        <h6 class="favorite">${item.favorite}</h6>
      
        <div class="content-wrapper">
          ${getMediaHtmlFragment(item, interval)}
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
  getMediaHtmlFragment
};
