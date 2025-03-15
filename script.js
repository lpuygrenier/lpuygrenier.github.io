let selectedVideo = null;
let videos = [];
let isLoading = false;
let videoCount = 0;
const volumeControl = document.getElementById('volume-control');
const timeline = document.getElementById('timeline');

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
    initializeVideo(video, timeline);

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


function goBack(seconds) {
    videos.forEach(video => video.currentTime = video.currentTime - seconds);
}

function goForward(seconds) {
    videos.forEach(video => video.currentTime = video.currentTime + seconds);
}

function initializeVideo(video, timeline) {
    video.addEventListener('loadedmetadata', () => {
        timeline.max = video.duration;
    });
}

function resetVolumes() {
    videos.forEach(video => video.volume = 0);
}

function updateFocus(clickedVideo) {
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

timeline.addEventListener('input', function() {
    if (selectedVideo) {
        selectedVideo.currentTime = (this.value / this.max) * selectedVideo.duration;
    }
});

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
    }
});
  