const path = require('path');
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
      <div class="toolbar">
        ${generalToolbar()}
        </div>
        <div class="dir section">
        ${locals.dirs
          .reverse()
          .map(
            i =>
              `<div class="dir"><a href="${i.webPath}"><label>📁${i.name}</label></div>`
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
              `<div class="media"><a href="/media?fullpath=${
                i.fullPath
              }"><label>${i.name}</label>${
                isVideo(i.name)
                  ? "🎞️"
                  : i.thumbnail ? `<img src="${i.thumbnail}" class="thumbnail">` : "⚪"
              }</div>`
          )
          .join('')}
        </div>
    </body>
  </html>`;
}

function getMediaHtmlFragment(item, interval, beforeItem, afterItem) {
  let html;
  if (isVideo(item.webPath)) {
    html = `<video controls autoplay class="video"><source src="${interval ? path.join('..', item.webPath) : item.webPath
      }" type="video/mp4"></video>`;
  } else {
    html =
      `<img src="${interval ? path.join('..', item.webPath) : item.webPath
      }" class="pic">`
  }

  return `
  <div class="content-and-controls">
    <a class="left arrow" href="/media?fullpath=${beforeItem?.fullPath}"> << </a>
    ${html}
    <a class="right arrow" href="/media?fullpath=${afterItem?.fullPath}"> >> </a>
  </div>`
}

function imgVidTemplate(item, type, interval, beforeItem, afterItem) {
  const nameSection = `/${item.name}`;
  return `
    <html>
      <head>
        ${cssAndJs()}
      </head>

      <body>
        <div class="toolbar">
          ${generalToolbar(item)}
        </div>

        <a href="${item.webPath.replace(nameSection, '')}"> 
          <h6 class="webpath">${item.webPath} ↗</h6>
        </a>
      
        <div class="content-wrapper">
          ${getMediaHtmlFragment(item, interval, beforeItem, afterItem)}
        </div>

        <script>
          if(${interval}){
            share.contentInterval = ${interval};
            replaceOnInterval(${interval}, "${type}");
          }
          share.photoItem = ${JSON.stringify(item)};

          window.history.replaceState({}, '', '/media?fullpath=${item.fullPath}');

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
