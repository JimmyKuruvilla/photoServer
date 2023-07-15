$ = selector => document.querySelector(selector);
$$ = selector => document.querySelectorAll(selector);

window.onpopstate = function (event) {
  clearInterval(share.contentIntervalId);
};

const share = {
  rotation: 0,
  set pause(pause) {
    this.paused = pause;
    $('.toolbar button.pause').innerText = share.pause ? "💀" : "⏸️";
    clearInterval(share.contentIntervalId);
  },
  get pause() {
    return this.paused;
  },
  set resourceMode(mode) {
    this._resourceMode = mode;
    window.sessionStorage.resourceMode = mode;
    if (mode === 'image') {
      $('.slideshow-mode-toggle').innerHTML = "🖼️";
    } else {
      $('.slideshow-mode-toggle').innerHTML = "📼"
    }
  },
  get resourceMode() {
    return this._resourceMode;
  },
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

function addTag(evt) {
  console.log(share.photoItem.id, evt.currentTarget.dataset.tagId)
}

function editTag(evt) {
  console.log(share.photoItem.id, evt.currentTarget.dataset.tagId)
}

function deleteTag(evt) {
  console.log(share.photoItem.id, evt.currentTarget.dataset.tagId)
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
  window.location.href = `/random/slideshow?type=${share.resourceMode}`;
}

const getRandomResource = () => {
  window.location.href = `/random?type=${share.resourceMode}`;
}

const animateIn = () => {
  $('.pic')?.classList.add('transition-opacity');
  $('.video')?.classList.add('transition-opacity');
}

const initState = () => {
  share.resourceMode = window.sessionStorage.resourceMode ?? 'image';
  animateIn();
}

const toggleResourceMode = () => {
  share.resourceMode = share.resourceMode === 'image' ? 'video' : 'image';
}

const rotateRight = () => {
  share.rotation = share.rotation + 0.25;
  
  if ($('.pic')) {
    $('.pic').style.transform = `rotate(${share.rotation}turn)`;
  };

  if ($('.video')) {
    $('.video').style.transform = `rotate(${share.rotation}turn)`;
  };
}

if (document.readyState !== 'loading') {
  initState();
} else {
  document.addEventListener("DOMContentLoaded", (event) => {
    initState();
  })
};

