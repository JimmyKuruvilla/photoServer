const home = `<a href="/"><button>Home</button></a>`;
const random = `<a href="/random"><button>Random</button></a>`;
const slideshowAll = `<a href="/random/slideshow"><button>Slideshow All</button></a>`;
const fullscreen = `<button onclick="goFullScreen()">Fullscreen</button>`;
const pause = `<button class="pause" onclick="pauseSlideShow()">Pause</button>`;
const favorite = o =>
  `<button class="favorite" onclick="toggleFavorite()">Favorite: ${o.favorite}</button>`;

const favorites = `<a href="/media/favorites"><button>Favorites</button></a>`;
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
