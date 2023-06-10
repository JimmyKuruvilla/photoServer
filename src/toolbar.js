const home = `<a href="/" title="go home"><button>🏠↗</button></a>`;
const random = `<a href="/random" title="random photo"><button>🔀</button></a>`;
const slideshowAll = `<a href="/random/slideshow" title="slideshow"><button>📽️</button></a>`;
const fullscreen = `<button onclick="goFullScreen()" title="go fullscreen">⛰️</button>`;
const pause = `<button class="pause" onclick="pauseSlideShow()" title=
pause slideshow">⏸️</button>`; 
const favorite = o =>
  `<button class="favorite" onclick="toggleFavorite()" title="toggle favorite">${o.favorite ? "❤️" : "🖤"}</button>`;
const favorites = `<a href="/media/favorites" title="go to favorites"><button>❤️↗</button></a>`;
const mark = o =>
  `<button class="marked" onclick="toggleMarked()" title="toggle marked">${o.marked ? "💣" : "👍" }</button>`;
const marked = `<a href="/media/marked" title="go to marked"><button>💣↗</button></a>`;

const generalToolbar = o => `

  ${home}
  ${random}
  ${favorites}
  ${marked}
  ${slideshowAll}
  ${pause}
  ${o ? favorite(o) : ''}
  ${o ? mark(o) : ''}
  ${fullscreen}
  `;

module.exports = {
  generalToolbar
};
