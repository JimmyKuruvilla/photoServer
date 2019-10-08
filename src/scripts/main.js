$ = selector => document.querySelector(selector);
$$ = selector => document.querySelectorAll(selector);

const share = {
  set pause(pause) {
    this.paused = pause;
    $('.toolbar button.pause').innerText = share.pause ? 'Paused' : 'Pause';
    clearInterval(share.contentIntervalId);
  },
  get pause() {
    return this.paused;
  }
};

function pauseSlideShow() {
  share.pause = true;
}

function goFullScreen() {
  $('body').requestFullscreen();
}

function isVideo(name) {
  return /.+\.mp4$|avi$/i.test(name);
}

function replaceOnInterval(contentInterval, directory) {
  clearInterval(share.contentIntervalId);
  share.contentIntervalId = setInterval(() => {
    share.pause = false;
    replaceContent(directory);
  }, contentInterval);
}

function replaceContent(directory) {
  const url = directory ? `/${directory}/randomUrl` : '/randomUrl';

  fatch(url).then(item => {
    share.photoItem = item;
    replaceOnInterval(
      item.duration ? item.duration + 1000 : share.contentInterval,
      directory
    );
    $('.webpath').innerHTML = item.webPath;
    $('.content-wrapper').innerHTML = item.html;
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

function updateFavoriteButton(o) {
  $('.toolbar button.favorite').innerText = `Favorite: ${o.favorite}`;
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
