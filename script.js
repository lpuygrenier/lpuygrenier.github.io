let selectedVideo = null;
let videos = [];
let isLoading = false;
let videoCount = 1;
const volumeControl = document.getElementById('volume-control');
const timeline = document.getElementById('timeline');

class DrawingCanvas {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        
        this.setupCanvas();
        this.bindEvents();
        this.toggleCanvas();
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Set background opacity to 0.1
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set pencil opacity to 1
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 1)';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
    }

    bindEvents() {
        // Toggle canvas visibility with 'd' key


        // Drawing events
        this.canvas.addEventListener('mousedown', (e) => {
            this.startDrawing(e);
        });
        this.canvas.addEventListener('mousemove', (e) => {
            this.draw(e);
        });
        this.canvas.addEventListener('mouseup', () => {
            this.stopDrawing();
        });
        this.canvas.addEventListener('mouseout', () => {
            this.stopDrawing();
        });
    }

    toggleCanvas() {
        const isVisible = this.canvas.style.display !== 'none';
        this.canvas.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            this.setupCanvas();
        }
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
        return [
            e.clientX - rect.left,
            e.clientY - rect.top
        ];
    }
}

const drawingCanvas = new DrawingCanvas();

function removeHUDWelcome() {
    const videoLayout = document.querySelector('.video-layout');
    videoLayout.classList.remove('hide');

    const welcomeLayout = document.querySelector('.welcome-layout');
    welcomeLayout.classList.add('hide');
}

function importVideos() {
    const input = document.getElementById('video-import');
    const files = input.files;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const videoURL = URL.createObjectURL(file);
        addVideo(videoURL);
    }

    removeHUDWelcome();
}

function addVideo(videoURL) {
    const video = document.createElement('video');
    video.src = videoURL;
    video.preload = 'auto';
    video.controls = true;

    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container unfocused';
    videoContainer.style.position = 'relative';
    videoContainer.appendChild(video);

    const numberLabel = document.createElement('div');
    numberLabel.className = 'video-number';
    numberLabel.textContent = videoCount;
    videoContainer.appendChild(numberLabel);
    videoCount++;

    updateFocus(video);

    videos.push(video);

    video.addEventListener('loadstart', () => {
        isLoading = true;
        pauseOtherVideos(video);
    });

    video.addEventListener('canplay', () => {
        isLoading = false;
    });
}

function pauseOtherVideos(currentVideo) {
    videos.forEach(video => {
        if (video !== currentVideo) {
            video.pause();
        }
    });
}

function togglePlay() {
    const allPaused = videos.every(video => video.paused);
    videos.forEach(video => allPaused ? video.play() : video.pause());
}


function pauseAllVideos() {
    videos.forEach(video => video.pause());
}

function goBack(seconds) {
    pauseAllVideos();
    videos.forEach(video => video.currentTime = video.currentTime - seconds);
}

function goForward(seconds) {
    pauseAllVideos();
    videos.forEach(video => video.currentTime = video.currentTime + seconds);
}

function resetVolumes() {
    videos.forEach(video => video.volume = 0);
}

function updateFocus(clickedVideo) {
    resetZoom();
    if (typeof clickedVideo === 'number') {
        const videoToFocus = videos.find((video, index) => 
            video.closest('.video-container').querySelector('.video-number').textContent == clickedVideo
        );
        if (videoToFocus) {
            clickedVideo = videoToFocus;
        } else {
            return;
        }
    }

    const focusedVideoContainer = document.querySelector('.focused-video');
    const unfocusedVideosContainer = document.querySelector('.unfocused-videos');

    videos.forEach(video => {
        const videoContainer = video.closest('.video-container') || video.parentElement;
        if (videoContainer.parentElement !== unfocusedVideosContainer) {
            unfocusedVideosContainer.appendChild(videoContainer);
        }
        videoContainer.classList.remove('focused');
        videoContainer.classList.add('unfocused');
    });

    const clickedVideoContainer = clickedVideo.closest('.video-container') || clickedVideo.parentElement;
    focusedVideoContainer.innerHTML = '';
    focusedVideoContainer.appendChild(clickedVideoContainer);
    clickedVideoContainer.classList.remove('unfocused');
    clickedVideoContainer.classList.add('focused');

    const volume = selectedVideo ? selectedVideo.volume : 0.5;
    resetVolumes();
    selectedVideo = clickedVideo;
    selectedVideo.volume = volume;
    volumeControl.value = volume;
}

volumeControl.addEventListener('input', (event) => {
    if (selectedVideo) {
        selectedVideo.volume = parseFloat(event.target.value);
    }
});

function toggleZoom () {
    const container = document.querySelector('.focused');
    const video = container.querySelector('video');

    const currentScale = parseFloat(getComputedStyle(video).transform.split('(')[1]);
    const newScale = currentScale === 1 ? 2.3 : 1;

    video.style.transformOrigin = 'left top';

    video.style.transform = `scale(${newScale})`;
}

function resetZoom () {
    const container = document.querySelector('.focused');
    if (null != container) {
        const video = container.querySelector('video');
        if (null != video) {
            video.style.transformOrigin = 'left top';
            video.style.transform = `scale(1)`;
        }
    }
}

window.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        event.preventDefault();
        togglePlay();
    } else if (event.code === 'ArrowRight') {
        event.preventDefault();
        goForward(10);
    } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        goBack(10);
    } else if (event.code.startsWith('Digit') || event.code.startsWith('Numpad')) {
        const digit = parseInt(event.key);
        if (digit >= 0 && digit <= 9) {
            event.preventDefault();
            updateFocus(digit);
        }
    } else if (event.code === 'KeyD') {
        drawingCanvas.toggleCanvas();
    } else if (event.code === 'KeyZ') {
        toggleZoom();
    }
});