const home = `<button><a href="/">Home</a></button>`;
const random = `<button><a href="/random">Random</a></button>`;
const slideshowAll = `<button><a href="/random/slideshow">Slideshow All</a></button>`;
const fullscreen = `<button onclick="goFullScreen()">Fullscreen</button>`;
const pause = `<button class="pause" onclick="pauseSlideShow()">Pause</button>`;
const favorite = o =>
  `<button class="favorite" onclick="toggleFavorite()">Favorite: ${o.favorite}</button>`;

const favorites = `<button><a href="/media/favorites">Favorites</a></button>`;
const generalToolbar = o => `
  ${fullscreen}
  ${home}
  ${random}
  ${favorites}
  ${slideshowAll}
  ${pause}
  ${o ? favorite(o) : ''}
  `;

module.exports = {
  generalToolbar
};
