function pauseSlideShow() {
  clearInterval(window.contentIntervalId);
}

function goFullScreen() {
  document.querySelector('body').requestFullscreen();
}

function isVideo(name) {
  return /.+\.mp4$|avi$/i.test(name);
}

function replaceOnInterval(contentInterval, directory) {
  clearInterval(window.contentIntervalId);
  window.contentIntervalId = setInterval(() => {
    replaceContent(directory);
  }, contentInterval);
}

function replaceContent(directory) {
  const url = directory ? `/${directory}/randomUrl` : '/randomUrl';
  fetch(url)
    .then(response => response.json())
    .then(item => {
      replaceOnInterval(
        item.duration ? item.duration + 1000 : window.contentInterval,
        directory
      );
      document.querySelector('.filename').innerHTML = item.name;
      document.querySelector('.content-wrapper').innerHTML = item.html;
    });
}

const fatch = async (
  url,
  method = 'get',
  body,
  headers = { 'Content-Type': 'application/json; charset=utf-8' }
) => {
  const patch = (url, body, headers) => {
    return fetch(url, {
      headers,
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  };
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
