
// interface PhotoItem {
//   id;
//   viewPath;
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

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

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
  const url = `/random?type=${type}`;

  try {
    const item = await fatch(url);
    share.mediaItem = item;
    replaceOnInterval(
      item.duration ? item.duration + 1000 : (share.contentInterval || 6000),
      type
    );

    const contentWrapper = $('.content-wrapper');

    if (contentWrapper) {
      contentWrapper.innerHTML = item.html || '';
    }

    dispatchReadyEvent();
    window.history.pushState(
      {},
      '',
      item.viewPath
    );
  } catch (error) {
    console.error('Error replacing content:', error);
  }
}

const FAVORITE = 'favorite'
const MARKED = 'marked'

function toggleTag(name) {
  if (!share.mediaItem) return;
  pauseSlideShow();

  const tag = share.mediaItem?.tags.find(tag => tag.value === name)
  const action = tag ? deleteTagById(tag.id) : createTagOnItem(name, share.mediaItem.id)
  action.then(() => {
    location.reload();
  })
}

const toggleFavorite = () => toggleTag(FAVORITE)
const toggleMarked = () => toggleTag(MARKED)

function createTagOnItem(tagValue, itemId) {
  return fatch(`/media/tags`, 'post', {
    tagValue,
    mediaId: itemId
  })
}

function deleteTagById(tagId) {
  return fatch(`/media/tags/${tagId}`, 'delete')
}

function addTag() {
  if (!share.mediaItem) return;

  const input = $('.add-tag-input')
  if (!input) return;

  createTagOnItem(input.value, share.mediaItem.id).then(() => {
    location.reload();
  });
}

function editTag(evt) {
  const target = evt.currentTarget;
  const tagId = target.dataset.tagId;
  const input = $('.add-tag-input');

  if (!tagId || !input) return;

  fatch(`/media/tags/${tagId}`, 'patch', {
    tagValue: input.value
  }).then(() => {
    location.reload();
  });
}

function deleteTag(evt) {
  const target = evt.currentTarget;
  const tagId = target.dataset.tagId;

  if (!tagId) return;

  deleteTagById(tagId).then(() => {
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

function searchAll(query) {
  /**
   * 1. show a thing on ~
   * get the metadata -- send the metadata on pageload
   * 2. make a search json
   * 3. send it
   * 4. return the html and show it. 
   */
  const formdata = new URLSearchParams({
    'first-name': 'Frida',
    'last-name': 'Kahlo',
    'location': 'Mexico City, Mexico',
    'favorite-number': 8
  })

  fatch(`/metadata?${formdata}`, 'get')
    .then((metadata) => {
      console.log(metadata)
      // make a form with this. 
    })

  // TODO  temp disabled, put back
  // fatch(`/media/tags?search=${query}`).then((data) => {
  //   const htmlElement = $('html');
  //   if (htmlElement) {
  //     htmlElement.innerHTML = data.html;
  //   }
  // }).catch((e) => {
  //   console.log(e);
  // });
}

function searchByTag(inputLocator) {
  const input = $(inputLocator);
  if (input) {
    search(input.value);
  }
}

const fatch = async (
  url,
  method = 'get',
  body,
  headers = { 'Content-Type': 'application/json; charset=utf-8' }
) => {
  let fetchFn;

  try {
    if (method === 'get') {
      fetchFn = () => fetch(url, body);
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
  window.location.href = `${window.location.origin}/random/slideshow?type=${share.resourceMode}`;
};

const getRandomResource = () => {
  window.location.href = `${window.location.origin}/randomView?type=${share.resourceMode}`;
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

const hasTag = (o, name) => !!o.tags.find(tag => tag.value === name)

window.addEventListener('keydown', (e) => {
  if (e.shiftKey && e.key === '?') {
    e.preventDefault();
    window.location = `${share.mediaItem.viewPath}?isDev=1`
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === '`') {
    e.preventDefault();
    const searchDialog = $('.searchbox');
    if (searchDialog.classList.contains('shown')) {
      searchDialog.classList.remove('shown')
    } else {
      searchDialog.classList.add('shown');
    }
  }
});

// Make functions globally available
window.pauseSlideShow = pauseSlideShow;
window.goFullScreen = goFullScreen;
window.replaceOnInterval = replaceOnInterval;
window.toggleFavorite = toggleFavorite;
window.toggleMarked = toggleMarked;
window.hasTag = hasTag;
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
