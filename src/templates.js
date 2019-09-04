const path = require('path');
const { videoSvg, folderSvg } = require('./svgs.js');
const { isVideo } = require('./guards');

const home = `<button><a href="/">Home</a></button>`;
const random = `<button><a href="/random">Random</a></button>`;
const slideshowAll = `<button><a href="/random/slideshow">Slideshow All</a></button>`
const generalToolbar = `
<div class="buttons">
  ${home}
  ${random}
  ${slideshowAll}
</div>`
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
    .pic, svg.video {
      width: 200px;
      border-radius: 5px;
      transition: transform 200ms;
    }
    .pic:hover, svg.video:hover{
      border: 3px solid white; 
      transform: scale(1.5);
    }
    .pic.fullscreen, video.fullscreen {
      width: 75vw;
      max-height: calc(100vh - 100px);
      margin: 0 auto;
    }
    .pic.fullscreen:hover, video.fullscreen:hover {
      border:none;
      transform: none;
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
    </style>`
    
function dirTemplate(locals) {
  return `
  <html>
    <head> 
      ${style}
    </head>
    
    <body>
    ${generalToolbar}  
    ${
      locals.currentDir
        ? `<button><a href="/${
            locals.currentDir
          }/slideshow">Slideshow Here</a></button>`
        : ''
    }
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

const randomScript = (url, interval) => `
  <script defer="defer">
  setInterval(()=>{
    window.location.href = "${url}" 
    }, ${interval})
  </script>`;

function imgTemplate(item, url, interval = 3000, random = false) {
  return `
  <html>
    <head>
      ${style}
    </head>
    <body>
      ${generalToolbar}
      <h6>${item.name}</h6>
      <img src="${random ? path.join('..', item.webPath) : item.webPath}" class="pic fullscreen">
      ${ url ? randomScript(url, interval): ''}
    </body>
  </html>`;
}

function videoTemplate(item, url, interval = 3000) {
  return `
  <html>
    <head>
      ${style}
    </head>
    <body>
      ${generalToolbar}
      <h6>${item.name}</h6>
      <video controls autoplay class="fullscreen" >
        <source src="${random ? path.join('..', item.webPath) : item.webPath}" type="video/mp4">
      </video>
      ${ url ? randomScript(url, interval) : ''}
    </body>
  </html>`;
}

module.exports = {
  dirTemplate,
  imgTemplate,
  videoTemplate
};
