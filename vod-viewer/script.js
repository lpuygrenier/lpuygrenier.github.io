let selectedVideo = null;
let videos = [];
let isLoading = false;
let videoCount = 1;
const volumeControl = document.getElementById("volume-control");
const timeline = document.getElementById("timeline-control");
const cloneVideo = document.getElementById('cloneVideo');
const INITIAL_VOLUME = 0.5;
let names = [];


class DrawingCanvas {
  constructor() {
    this.canvas = document.getElementById("drawingCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;

    this.setupCanvas();
    this.bindEvents();
    this.hideCanvas();
  }

  setupCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Set background opacity to 0.1
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Set pencil opacity to 1
    this.ctx.strokeStyle = "rgba(255, 255, 0, 1)";
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = "round";
  }

  bindEvents() {
    // Drawing events
    this.canvas.addEventListener("mousedown", (e) => {
      this.startDrawing(e);
    });
    this.canvas.addEventListener("mousemove", (e) => {
      this.draw(e);
    });
    this.canvas.addEventListener("mouseup", () => {
      this.stopDrawing();
    });
    this.canvas.addEventListener("mouseout", () => {
      this.stopDrawing();
    });
  }

  toggleCanvas() {
    const isVisible = this.canvas.style.display !== "none";
    this.canvas.style.display = isVisible ? "none" : "block";

    if (!isVisible) {
      this.setupCanvas();
    }

    // Update edit icon
    const edit_icon = document.querySelector("#edit");
    edit_icon.classList.toggle("contrast");

    // update all buttons to put them disabled except edit button
    const buttons = document.querySelectorAll("button:not(#edit)");
    buttons.forEach(button => button.disabled = !button.disabled);

    const inputs = document.querySelectorAll("input");
    inputs.forEach(input => input.disabled = !input.disabled);
  }

  hideCanvas() {
    this.canvas.style.display = "none";
    this.visible = false;
  }

  startDrawing(e) {
    this.isDrawing = true;
    [this.lastX, this.lastY] = this.getMousePos(e);
  }

  draw(e) {
    if (!this.isDrawing) return;

    const [currentX, currentY] = this.getMousePos(e);

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(currentX, currentY);
    this.ctx.stroke();

    [this.lastX, this.lastY] = [currentX, currentY];
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }
}

const drawingCanvas = new DrawingCanvas();

function removeHUDWelcome() {
  const videoLayout = document.querySelector(".video-layout");
  videoLayout.classList.remove("hide");

  const welcomeLayout = document.querySelector(".welcome-layout");
  welcomeLayout.classList.add("hide");
}

function importVideos() {
  const input = document.getElementById("video-import");
  const files = input.files;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const videoURL = URL.createObjectURL(file);
    const videoName = tryFindPlayerName(file.name);
    addVideo(videoURL, videoName);
  }

  removeHUDWelcome();
}

function addVideo(videoURL, videoName) {
  const video = document.createElement("video");
  video.src = videoURL;
  video.preload = "auto";
  video.controls = false;
  video.volume = 0;
  video.dataset.videoCount = videoCount;
  video.dataset.delay = 0;
  video.dataset.name = videoName;

  if (!cloneVideo.srcObject) {
    const stream = video.captureStream();
    cloneVideo.srcObject = stream;
    cloneVideo.play();
    cloneVideo.muted = true;
    updateSelectedVideo(video);
    video.volume = INITIAL_VOLUME;
  }

  const videoWrapper = document.createElement("div");
  videoWrapper.className = "video-wrapper unfocused";
  videoWrapper.style.position = "relative";
  videoWrapper.appendChild(video);

  const label = document.createElement("small");
  label.textContent = videoName;
  videoWrapper.appendChild(label);

  const numberLabel = document.createElement("div");
  numberLabel.className = "video-number";
  numberLabel.textContent = videoCount;
  videoWrapper.appendChild(numberLabel);

  const unfocused = document.querySelector(".unfocused-videos");
  unfocused.appendChild(videoWrapper);

  videos.push({
    video: video,
    videoCount: videoCount,
    delay: 0
  });

  videoCount++;


  video.addEventListener("loadstart", () => {
    isLoading = true;
    pauseOtherVideos(video);
  });

  video.addEventListener("canplay", () => {
    isLoading = false;
  });

  video.addEventListener("click", (event) => {
    updateFocus(event.target);
  });
}

function pauseOtherVideos(currentVideo) {
  videos.forEach((item) => {
    if (item.video !== currentVideo) {
      item.video.pause();
    }
  });
}

function togglePlay() {
  const allPaused = videos.every((item) => item.video.paused);

  videos.forEach((item) => (allPaused ? item.video.play() : item.video.pause()));
  if (allPaused) {
    cloneVideo.play();
  } else {
    cloneVideo.pause();
  }

}

function pauseAllVideos() {
  videos.forEach((item) => item.video.pause());
  cloneVideo.pause();
}

function playAllVideos() {
  videos.forEach((item) => item.video.play());
  cloneVideo.play();
}

function seek(isForward, seconds) {
  if (!Number.isFinite(seconds)) {
    throw new Error('Seconds must be a valid number');
  }

  const wasPlaying = !cloneVideo.paused;
  if (wasPlaying) {
    pauseAllVideos();
  }

  const seekPromises = videos.map(video => {
    return new Promise((resolve, reject) => {
      video.video.addEventListener('seeked', () => resolve(), { once: true });

      try {
        const newTime = isForward ?
          Math.min(video.video.currentTime + seconds, video.video.duration) :
          Math.max(0, video.video.currentTime - seconds);

        video.video.currentTime = newTime;
      } catch (error) {
        reject(new Error(`Failed to seek video: ${error.message}`));
      }
    });
  });

  Promise.all(seekPromises)
    .then(() => {
      if (wasPlaying) {
        playAllVideos();
      }
    })
    .catch(error => {
      console.error('Video seek failed:', error);
    });
}

function resetVolumes() {
  videos.forEach((item) => (item.video.volume = 0));
  cloneVideo.volume = 0;
}

function updateFocus(clickedVideo) {
  resetZoom();

  if (typeof clickedVideo === "number") {
    const videoToFocus = videos.find(
      (item) => item.videoCount == clickedVideo
    );
    if (videoToFocus) {
      clickedVideo = videoToFocus.video;
    } else {
      return;
    }
  }

  const stream = clickedVideo.captureStream();
  cloneVideo.srcObject = stream;
  cloneVideo.currentTime = clickedVideo.currentTime;
  cloneVideo[clickedVideo.paused ? 'pause' : 'play']();

  const volume = selectedVideo ? selectedVideo.volume : 0.5;
  resetVolumes();
  updateSelectedVideo(clickedVideo);
  selectedVideo.volume = volume;
  volumeControl.value = volume;
}

volumeControl.addEventListener("input", (event) => {
  if (selectedVideo) {
    selectedVideo.volume = parseFloat(event.target.value);
  }
});

function toggleZoom() {
  const zoom = document.querySelector("#zoom");

  let currentScale = parseFloat(
    getComputedStyle(cloneVideo).transform.split("(")[1]
  );
  const newScale = currentScale === 1 ? 2.3 : 1;

  // update icon
  zoom.innerHTML = currentScale === 1 ? "zoom_out" : "zoom_in";

  cloneVideo.style.transformOrigin = "left top";
  cloneVideo.style.transform = `scale(${newScale})`;
}

function resetZoom() {
  cloneVideo.style.transformOrigin = "left top";
  cloneVideo.style.transform = `scale(1)`;

  // Update icon
  const zoom = document.querySelector("#zoom");
  zoom.innerHTML = "zoom_in";
}

function syncVideo() {
  const videosElements = document.querySelectorAll('.unfocused.video-wrapper video');
  videosElements.forEach((video) => {
    const delay = parseInt(video.dataset.delay);
    video.currentTime = selectedVideo.currentTime + delay;
  }
  );
}

function addSyncInput(videoWrapper) {
  const delayInput = document.createElement('input');
  delayInput.type = 'number';
  delayInput.name = 'delay';
  delayInput.placeholder = 'Delay (s)';
  delayInput.setAttribute('aria-label', 'Delay (s)');

  if (videoWrapper.querySelector('video').dataset.delay !== '0') {
    delayInput.value = parseInt(videoWrapper.querySelector('video').dataset.delay)
  }

  const syncInputBgDiv = document.createElement('div');
  syncInputBgDiv.classList.add('sync-input-bg');

  const videoElement = videoWrapper.querySelector('video');

  videoWrapper.insertBefore(delayInput, videoElement);
  videoWrapper.insertBefore(syncInputBgDiv, videoElement);

  delayInput.addEventListener('input', function (event) {
    handleDelayChange(event, videoElement);
  });

  delayInput.addEventListener('change', function (event) {
    handleDelayChange(event, videoElement);
  });
}

function removeSyncInput(videoWrapper) {
  const delayInput = videoWrapper.querySelector('input[name="delay"]');
  const syncBgDiv = videoWrapper.querySelector('.sync-input-bg');

  if (delayInput && syncBgDiv) {
    videoWrapper.removeChild(delayInput);
    videoWrapper.removeChild(syncBgDiv);
  }
}

function handleDelayChange(event, videoElement) {
  const delayValue = parseInt(event.target.value);
  videoElement.dataset.delay = delayValue;
  syncVideo();
}

function toggleSync() {
  const videoWrappers = document.querySelectorAll('.unfocused.video-wrapper');

  const hasExistingInputs = Array.from(videoWrappers).some(
    wrapper => wrapper.querySelector('input[name="delay"]')
  );

  if (hasExistingInputs) {
    videoWrappers.forEach(videoWrapper => { removeSyncInput(videoWrapper) });
  } else {
    videoWrappers.forEach(videoWrapper => addSyncInput(videoWrapper));
  }

  const syncIcon = document.querySelector("#sync-mode");
  syncIcon.classList.toggle("contrast");
}
window.addEventListener("keydown", function (event) {
  if (event.code === "Space") {
    event.preventDefault();
    togglePlay();
  } else if (event.code === "ArrowRight") {
    event.preventDefault();
    goForward(10);
  } else if (event.code === "ArrowLeft") {
    event.preventDefault();
    goBack(10);
  } else if (
    event.code.startsWith("Digit") ||
    event.code.startsWith("Numpad")
  ) {
    const digit = parseInt(event.key);
    if (digit >= 0 && digit <= 9) {
      event.preventDefault();
      updateFocus(digit);
    }
  } else if (event.code === "KeyD") {
    drawingCanvas.toggleCanvas();
  } else if (event.code === "KeyZ") {
    toggleZoom();
  } else if (event.code === "KeyS") {
    syncVideo();
  }
});

cloneVideo.addEventListener('timeupdate', () => {
  const progress = (selectedVideo.currentTime / selectedVideo.duration) * 100;
  timeline.value = progress;
});

timeline.addEventListener('input', () => {
  const time = (timeline.value / 100) * selectedVideo.duration;

  new Promise((resolve, reject) => {
    selectedVideo.addEventListener('seeked', () => {
      resolve();
    }, { once: true });

    try {
      selectedVideo.currentTime = time;
    } catch (error) {
      reject(new Error(`Failed to seek video: ${error.message}`));
    }
  })
    .then(() => {
      return syncVideo();
    })
    .catch(error => {
      console.error('Timeline seek failed:', error);
    });
});

const nameInputs = document.getElementById('nameInputs');
const addNameBtn = document.getElementById('addName');

// Load names from local storage on page load
document.addEventListener('DOMContentLoaded', loadNames);

addNameBtn.addEventListener('click', addNameField);

function loadNames() {
  const storedNames = localStorage.getItem('names');
  if (storedNames) {
    names = JSON.parse(storedNames);
    names.forEach(name => addNameField(name));
  } else {
    addNameField(); // Add one empty field if no stored names
  }
}

function addNameField(name = '') {
  const div = document.createElement('div');
  div.classList.add('input-container');
  const index = nameInputs.children.length;
  div.innerHTML = `
      <fieldset role="group">
        <input type="text" placeholder="Enter name" value="${name}" oninput="updateName(${index}, this.value)">
        <button onclick="removeName(${index})">Remove</button>
      </fieldset>
    `;
  nameInputs.appendChild(div);
  if (name && !names.includes(name)) {
    names.push(name);
    syncLocalStorage();
  }
}

function updateName(index, value) {
  names[index] = value;
  syncLocalStorage();
}

function removeName(index) {
  nameInputs.children[index].remove();
  names.splice(index, 1);
  syncLocalStorage();
  // Update oninput attributes for remaining inputs
  Array.from(nameInputs.children).forEach((child, i) => {
    child.querySelector('input').setAttribute('oninput', `updateName(${i}, this.value)`);
    child.querySelector('.remove-btn').setAttribute('onclick', `removeName(${i})`);
  });
}

function syncLocalStorage() {
  localStorage.setItem('names', JSON.stringify(names));
}

function tryFindPlayerName(filename) {
  for (const name of names) {
    if (filename.toLowerCase().includes(name.toLowerCase())) {
      return name;
    }
  }
  return filename;
}

function updateSelectedVideo(video) {
  selectedVideo = video;
  // update small label
  document.querySelector('#cloneVideo').parentElement.querySelector('small').textContent = video.dataset.name;
}