
// interface PhotoItem {
//   id;
//   webPath;
//   fullPath;
//   favorite;
//   marked;
//   duration?;
//   html?;
// }

// interface ShareState {
//   rotation;
//   paused;
//   _resourceMode;
//   contentIntervalId?: NodeJS.Timeout;
//   contentInterval?;
//   photoItem?: PhotoItem;
//   set pause(pause);
//   get pause();
//   set resourceMode(mode);
//   get resourceMode();
// }

// // Global variables
// declare global {
//   interface Window {
//     $: (selector) => Element | null;
//     $$: (selector) => NodeListOf<Element>;
//     share: ShareState;
//     fatch: typeof fatch;
//     pauseSlideShow: typeof pauseSlideShow;
//     goFullScreen: typeof goFullScreen;
//     replaceOnInterval: typeof replaceOnInterval;
//     toggleFavorite: typeof toggleFavorite;
//     toggleMarked: typeof toggleMarked;
//     addTag: typeof addTag;
//     editTag: typeof editTag;
//     deleteTag: typeof deleteTag;
//     search: typeof search;
//     searchByTag: typeof searchByTag;
//     startSlideshowAll: typeof startSlideshowAll;
//     getRandomResource: typeof getRandomResource;
//     toggleResourceMode: typeof toggleResourceMode;
//     rotateRight: typeof rotateRight;
//   }
// }

// Utility functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Make them globally available
window.$ = $;
window.$$ = $$;

window.onpopstate = function (event) {
  if (share.contentIntervalId) {
    clearInterval(share.contentIntervalId);
  }
};

const share = {
  rotation: 0,
  paused: false,
  _resourceMode: 'image',
  set pause(pause) {
    this.paused = pause;
    const pauseButton = $('.toolbar button.pause');
    if (pauseButton) {
      pauseButton.textContent = this.pause ? "💀" : "⏸️";
    }
    if (this.contentIntervalId) {
      clearInterval(this.contentIntervalId);
    }
  },
  get pause() {
    return this.paused;
  },
  set resourceMode(mode) {
    this._resourceMode = mode;
    window.sessionStorage.resourceMode = mode;
    const toggleButton = $('.slideshow-mode-toggle');
    if (toggleButton) {
      if (mode === 'image') {
        toggleButton.innerHTML = "🖼️";
      } else {
        toggleButton.innerHTML = "📼";
      }
    }
  },
  get resourceMode() {
    return this._resourceMode;
  },
};

window.share = share;

const dispatchReadyEvent = () => {
  window.document.dispatchEvent(new Event("DOMContentLoaded", {
    bubbles: true,
    cancelable: true
  }));
};

function pauseSlideShow() {
  share.pause = true;
}

function goFullScreen() {
  const body = $('body');
  if (body && (body).requestFullscreen) {
    (body).requestFullscreen();
  }
}

function isVideo(name) {
  return /.+\.mp4$|avi$/i.test(name);
}

function replaceOnInterval(contentInterval, type) {
  if (share.contentIntervalId) {
    clearInterval(share.contentIntervalId);
  }
  share.contentIntervalId = setInterval(() => {
    share.pause = false;
    replaceContent(type);
  }, contentInterval);
}

async function replaceContent(type) {
  const url = `/randomUrl?type=${type}`;

  try {
    const item = await fatch(url);
    share.photoItem = item;
    replaceOnInterval(
      item.duration ? item.duration + 1000 : (share.contentInterval || 6000),
      type
    );

    const webpathElement = $('.webpath');
    const contentWrapper = $('.content-wrapper');

    if (webpathElement) {
      webpathElement.innerHTML = item.webPath;
    }
    if (contentWrapper) {
      contentWrapper.innerHTML = item.html || '';
    }

    dispatchReadyEvent();
    window.history.pushState(
      {},
      '',
      `/media?fullpath=${item.fullPath}`
    );
  } catch (error) {
    console.error('Error replacing content:', error);
  }
}

function toggleFavorite() {
  pauseSlideShow();
  if (!share.photoItem) return;

  fatch(`/media/${share.photoItem.id}/favorite`, 'patch', {
    favorite: !share.photoItem.favorite
  }).then((resp) => {
    if (share.photoItem) {
      share.photoItem.favorite = resp.favorite;
      updateFavoriteButton(resp);
    }
  });
}

function toggleMarked() {
  pauseSlideShow();
  if (!share.photoItem) return;

  fatch(`/media/${share.photoItem.id}/marked`, 'patch', {
    marked: !share.photoItem.marked
  }).then((resp) => {
    if (share.photoItem) {
      share.photoItem.marked = resp.marked;
      updateMarkedButton(resp);
    }
  });
}

function addTag() {
  if (!share.photoItem) return;

  const input = $('.add-tag-input')
  if (!input) return;

  fatch(`/media/tags`, 'post', {
    tagValue: input.value,
    mediaId: share.photoItem.id
  }).then(() => {
    location.reload();
  });
}

function editTag(evt) {
  const target = evt.currentTarget;
  const tagId = target.dataset.tagId;
  const input = $('.add-tag-input');

  if (!tagId || !input) return;

  fatch(`/media/tags/${tagId}`, 'patch', {
    "tagValue": input.value
  }).then(() => {
    location.reload();
  });
}

function deleteTag(evt) {
  const target = evt.currentTarget;
  const tagId = target.dataset.tagId;

  if (!tagId) return;

  fatch(`/media/tags/${tagId}`, 'delete').then(() => {
    location.reload();
  });
}

function search(query) {
  fatch(`/media/tags?search=${query}`).then((data) => {
    const htmlElement = $('html');
    if (htmlElement) {
      htmlElement.innerHTML = data.html;
    }
  }).catch((e) => {
    console.log(e);
  });
}

function searchByTag(inputLocator) {
  const input = $(inputLocator);
  if (input) {
    search(input.value);
  }
}

function updateFavoriteButton(o) {
  const favoriteButton = $('.toolbar button.favorite');
  if (favoriteButton) {
    favoriteButton.textContent = o.favorite ? "❤️" : "🖤";
  }
}

function updateMarkedButton(o) {
  const markedButton = $('.toolbar button.marked');
  if (markedButton) {
    markedButton.textContent = o.marked ? "💣" : "👍";
  }
}

const fatch = async (
  url,
  method,
  body,
  headers = { 'Content-Type': 'application/json; charset=utf-8' }
) => {
  let fetchFn;

  try {
    if (method === 'get') {
      fetchFn = () => fetch(url);
    } else if (method === 'patch') {
      fetchFn = () => patch(url, body, headers);
    } else if (method === 'post') {
      fetchFn = () => post(url, body, headers);
    } else if (method === 'delete') {
      fetchFn = () => del(url, headers);
    } else {
      throw new Error(`Unsupported method: ${method}`);
    }

    const response = await fetchFn();
    if (!response.ok) {
      throw new Error('Network response was not ok.');
    }
    return response.json();
  } catch (error) {
    console.log(
      'There has been a problem with your fetch operation: ',
      error.message
    );
    throw error;
  }
};

// Make fatch globally available
window.fatch = fatch;

const patch = (url, body, headers) => {
  return fetch(url, {
    headers,
    method: 'PATCH',
    body: JSON.stringify(body)
  });
};

const post = (url, body, headers) => {
  return fetch(url, {
    headers,
    method: 'POST',
    body: JSON.stringify(body)
  });
};

const del = (url, headers) => {
  return fetch(url, {
    headers,
    method: 'DELETE'
  });
};

const startSlideshowAll = () => {
  window.location.href = `/random/slideshow?type=${share.resourceMode}`;
};

const getRandomResource = () => {
  window.location.href = `/random?type=${share.resourceMode}`;
};

const animateIn = () => {
  const pic = $('.pic');
  const video = $('.video');

  if (pic) {
    pic.classList.add('transition-opacity');
  }
  if (video) {
    video.classList.add('transition-opacity');
  }
};

const initState = () => {
  share.resourceMode = window.sessionStorage.resourceMode ?? 'image';
  animateIn();
};

const toggleResourceMode = () => {
  share.resourceMode = share.resourceMode === 'image' ? 'video' : 'image';
};

const rotateRight = () => {
  share.rotation = share.rotation + 0.25;

  const pic = $('.pic');
  const video = $('.video');

  if (pic) {
    pic.style.transform = `rotate(${share.rotation}turn)`;
  }

  if (video) {
    video.style.transform = `rotate(${share.rotation}turn)`;
  }
};

// Make functions globally available
window.pauseSlideShow = pauseSlideShow;
window.goFullScreen = goFullScreen;
window.replaceOnInterval = replaceOnInterval;
window.toggleFavorite = toggleFavorite;
window.toggleMarked = toggleMarked;
window.addTag = addTag;
window.editTag = editTag;
window.deleteTag = deleteTag;
window.search = search;
window.searchByTag = searchByTag;
window.startSlideshowAll = startSlideshowAll;
window.getRandomResource = getRandomResource;
window.toggleResourceMode = toggleResourceMode;
window.rotateRight = rotateRight;

if (document.readyState !== 'loading') {
  initState();
} else {
  document.addEventListener("DOMContentLoaded", (event) => {
    initState();
  });
}
