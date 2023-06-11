$ = selector => document.querySelector(selector);
$$ = selector => document.querySelectorAll(selector);

window.onpopstate = function (event) {
  clearInterval(share.contentIntervalId);
};

const dispatchReadyEvent = () => {
  window.document.dispatchEvent(new Event("DOMContentLoaded", {
    bubbles: true,
    cancelable: true
  }));
}


function pauseSlideShow() {
  share.pause = true;
}

function goFullScreen() {
  $('body').requestFullscreen();
}

function isVideo(name) {
  return /.+\.mp4$|avi$/i.test(name);
}

function replaceOnInterval(contentInterval, type) {
  clearInterval(share.contentIntervalId);
  share.contentIntervalId = setInterval(() => {
    share.pause = false;
    replaceContent(type);
  }, contentInterval);
}

function replaceContent(type) {
  const url = `/randomUrl?type=${type}`;

  fatch(url).then(item => {
    share.photoItem = item;
    replaceOnInterval(
      item.duration ? item.duration + 1000 : share.contentInterval,
      type
    );
    $('.webpath').innerHTML = item.webPath;
    $('.content-wrapper').innerHTML = item.html;
    dispatchReadyEvent();
    window.history.pushState(
      {},
      '',
      `/media?fullpath=${item.fullPath}`
    );
  });
}

function toggleFavorite() {
  pauseSlideShow();
  fatch(`/media/${share.photoItem.id}/favorite`, 'patch', {
    favorite: !share.photoItem.favorite
  }).then(resp => {
    share.photoItem.favorite = resp.favorite;
    updateFavoriteButton(resp);
  });
}

function toggleMarked() {
  pauseSlideShow();
  fatch(`/media/${share.photoItem.id}/marked`, 'patch', {
    marked: !share.photoItem.marked
  }).then(resp => {
    share.photoItem.marked = resp.marked;
    updateMarkedButton(resp);
  });
}

function updateFavoriteButton(o) {
  $('.toolbar button.favorite').innerText = o.favorite ? "❤️" : "🖤";
}

function updateMarkedButton(o) {
  $('.toolbar button.marked').innerText = o.marked ? "💣" : "👍";
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
      fetchFn = () => fetch(url);
    }
    if (method === 'patch') {
      fetchFn = () => patch(url, body, headers);
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
  }
};

const patch = (url, body, headers) => {
  return fetch(url, {
    headers,
    method: 'PATCH',
    body: JSON.stringify(body)
  });
};

const startSlideshowAll = () => {
  window.location.href = `/random/slideshow?type=${share.slideshowMode}`;
}

const animateIn = () => {
  $('.pic')?.classList.add('transition-opacity');
  $('.video')?.classList.add('transition-opacity');
}

const initState = () => {
  share.slideshowMode = window.sessionStorage.slideshowMode ?? 'image';
  animateIn();
}

const toggleSlideshowMode = () => {
  share.slideshowMode = share.slideshowMode === 'image' ? 'video' : 'image';
}

const share = {
  set pause(pause) {
    this.paused = pause;
    $('.toolbar button.pause').innerText = share.pause ? "💀" : "⏸️";
    clearInterval(share.contentIntervalId);
  },
  get pause() {
    return this.paused;
  },
  set slideshowMode(mode) {
    this._slideshowMode = mode;
    window.sessionStorage.slideshowMode = mode;
    if (mode === 'image') {
      $('.slideshow-mode-toggle').innerHTML = "🖼️";
    } else {
      $('.slideshow-mode-toggle').innerHTML = "📼"
    }
  },
  get slideshowMode() {
    return this._slideshowMode;
  },
};

if (document.readyState !== 'loading') {
  initState();
} else {
  document.addEventListener("DOMContentLoaded", (event) => {
    initState();
  })
};
