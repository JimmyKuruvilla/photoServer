const path = require('path');
const { videoSvg, folderSvg } = require('./svgs.js');
const { isVideo } = require('./guards');
const { generalToolbar } = require('./toolbar');

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
        ${generalToolbar()}
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
              `<div class="media"><a href="/media/path?fullpath=${
                i.fullPath
              }"><label>${i.name}</label>${
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
    return `<video controls autoplay class="video wide"><source src="${
      interval ? path.join('..', item.webPath) : item.webPath
    }" type="video/mp4"></video>`;
  } else {
    return `<img src="${
      interval ? path.join('..', item.webPath) : item.webPath
    }" class="pic wide">`;
  }
}

function imgVidTemplate(item, type, interval, directory) {
  return `
    <html>
      <head>
      ${cssAndJs()}
      </head>

      <body>
        <div class="toolbar">
          ${generalToolbar(item)}
        </div>

        <h6 class="webpath">${item.webPath}</h6>
      
        <div class="content-wrapper">
          ${getMediaHtmlFragment(item, interval)}
        </div>

        <script>
        if(${interval}){
          share.contentInterval = ${interval};
          replaceOnInterval(${interval}, ${type}, "${directory || ''}");
        }
        share.photoItem = ${JSON.stringify(item)};
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
