const home = `<a href="/" title="go home"><button>🏠↗</button></a>`;
const random = `<button class="get-random" onclick="getRandomResource()" title="random resource">🔄</button>`;
const slideshowAll = `<button onclick="startSlideshowAll()">📽️</button>`;
const fullscreen = `<button onclick="goFullScreen()" title="go fullscreen">⛰️</button>`;
const pause = `<button class="pause" onclick="pauseSlideShow()" title=
pause slideshow">⏸️</button>`;
const favorite = o =>
  `<button class="favorite" onclick="toggleFavorite()" title="toggle favorite">${o.favorite ? "❤️" : "🖤"}</button>`;
const favorites = `<a href="/media/favorites" title="go to favorites"><button>❤️↗</button></a>`;
const mark = o =>
  `<button class="marked" onclick="toggleMarked()" title="toggle marked">${o.marked ? "💣" : "👍"}</button>`;
const marked = `<a href="/media/marked" title="go to marked"><button>💣↗</button></a>`;
const resourceMode = `<button class="slideshow-mode-toggle" onclick="toggleResourceMode()" title="toggle slideshow mode"></button>`;
const searchByTag = `<button class="toolbar-search-by-tag" onclick="searchByTag('.toolbar-search-tag-input')">🔎</button>
<input class="toolbar-search-tag-input" type="text" placeholder="search by tag"></input>`
const faceCount = (o) => {
  let faceValue;
  
  if (o.faceCount === null) {
    faceValue = 'In Progress'
  } else if (o.faceCount === undefined) {
    faceValue = 'Unprocessable'
  } else {
    faceValue = o.faceCount
  }
  
  return `<div class="toolbar-face-count">😅s: ${faceValue}</div>`
}

const generalToolbar = o => `
  ${home}
  ${favorites}
  ${marked}
  ${random}
  ${slideshowAll}
  ${resourceMode}
  ${pause}
  ${o ? favorite(o) : ''}
  ${o ? mark(o) : ''}
  ${fullscreen}
  ${searchByTag}
  ${o ? faceCount(o): ''}
  `

module.exports = {
  generalToolbar
};
