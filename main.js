var audioPlayer;
var FFT;
var reloaded = false;

window.onload = () => {
    createCanvas(window.innerWidth, window.innerHeight - document.getElementById('nav-area').clientHeight);
    init();
    initUI();
};

function init() {

    audioPlayer = new Audio();
    FFT = new fft(audioPlayer);

    // Hide canvas at startup
    let canvas = document.getElementById('canvasArea');
    canvas.style.display = 'none';

    document.getElementById('AudioFile').addEventListener('change', e => {

        // Can read as ArrayBuffer
        const fileReader = new FileReader();

        // Wait for to ArrayBuffer to finish
        fileReader.onload = function () {

            // Loads the ArrayBuffer => this.result
            FFT.init(this.result);

            canvas.style.display = 'block';
            document.getElementById('audioInput').style.display = 'none';
            window.requestAnimationFrame(loop);
        };

        // Read as ArrayBuffer
        fileReader.readAsArrayBuffer(e.target.files[0]);

        // Load audioFile
        audioPlayer.src = URL.createObjectURL(e.target.files[0]);
    });
}

function loop() {

    // Render the visualization
    if (FFT.SplitChannels) {
        FFT.render2Channels();
    } else if (FFT.circleMode) {
        FFT.renderCircleMode();
    } else {
        FFT.render();
    }

    // Draw Audio Time / PlayingOffset
    const mark = toInt(audioPlayer.currentTime);
    const total = toInt(audioPlayer.duration);
    //drawFillText(`Time: ${mark}s - ${total}s`, 16, 48, 32, 'white');

    // Setup current time
    const cur_time = toInt(audioPlayer.currentTime);
    let cur_minutes = toInt(cur_time / 60);
    let cur_seconds = toInt(cur_time % 60);

    // Move slider-time
    // Check if the user is changing the position
    // If he is stop updating
    if (!$("#slider-time").data('clicked')) {
        $("#slider-time").attr('max', toInt(audioPlayer.duration));
        $("#slider-time").val(cur_time);
    }

    // Add the extra 0 infront if lower then 10
    if (cur_minutes < 10) {
        cur_minutes = '0' + cur_minutes.toString();
    }
    if (cur_seconds < 10) {
        cur_seconds = '0' + cur_seconds.toString();
    }

    document.getElementById("current-time").textContent = `${cur_minutes}:${cur_seconds}`;

    // Calculate total time
    const total_time = audioPlayer.duration;
    let end_minutes = toInt(total_time / 60);
    let end_seconds = toInt(total_time % 60);

    // Add the extra 0 infront if lower then 10
    if (end_minutes < 10) {
        end_minutes = '0' + end_minutes.toString();
    }
    if (end_seconds < 10) {
        end_seconds = '0' + end_seconds.toString();
    }

    document.getElementById("end-time").textContent = `${end_minutes}:${end_seconds}`;

    // Check if the song has ended
    if (mark == total && !reloaded && !audioPlayer.loop) {
        location.reload();
        reloaded = true;
    }

    // Create infinite loop
    window.requestAnimationFrame(loop);
}

function initUI() {

    // Change canvas size on window resize
    window.onresize = function () {
        const canvas = document.getElementById('canvas');

        // Get navbar height in pixels
        const navBarHeight = document.getElementById('nav-area').clientHeight;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - navBarHeight;

        WIDTH = canvas.width;
        HEIGHT = canvas.height;
    }

    // Setup volume slider
    const slider = document.getElementById('volume-slider');

    slider.addEventListener('change', function () {
        audioPlayer.volume = slider.value / 100;
    });

    // Setup play-pause
    const playButton = document.getElementById('play-pause-button');
    const icon = document.getElementById('play-pause-icon');

    playButton.addEventListener('click', () => {
        if (playButton.dataset.playing === 'true') {
            playButton.dataset.playing = 'false'
            icon.className = 'fa fa-play';
            if (audioPlayer.src != '')
                audioPlayer.pause();
        } else {
            playButton.dataset.playing = 'true';
            icon.className = 'fa fa-pause';
            if (audioPlayer.src != '')
                audioPlayer.play();
        }
    });

    // Setup Options Modal
    const splitChannel = document.getElementById('SplitChannelsButton');
    const loopMusic = document.getElementById('LoopMusicButton');
    const circleMode = document.getElementById('Circle-Button');
    const samplingCount = document.getElementById('SamplingCountButton');
    const quadSize = document.getElementById('QuadSizeButton');

    // Check if localstorage exists and load settings if it does
    const SplitChannelsStorage = window.localStorage.getItem('SplitChannels');
    const AudioLoopStorage = window.localStorage.getItem('AudioLoop');
    const CircleModeStorage = window.localStorage.getItem('CircleMode');

    // Undefined = false
    if (toBoolean(SplitChannelsStorage)) {
        FFT.SplitChannels = toBoolean(SplitChannelsStorage);
        splitChannel.checked = toBoolean(SplitChannelsStorage);

        circleMode.disabled = true;
    }

    if (toBoolean(AudioLoopStorage)) {
        audioPlayer.loop = toBoolean(AudioLoopStorage);
        loopMusic.checked = toBoolean(AudioLoopStorage);
    }

    if (toBoolean(CircleModeStorage)) {
        FFT.circleMode = toBoolean(CircleModeStorage);
        circleMode.checked = toBoolean(CircleModeStorage);

        splitChannel.disabled = true;
    }

    console.log(window.localStorage);

    // Add eventListeners to the Options
    splitChannel.addEventListener('change', () => {
        FFT.SplitChannels = splitChannel.checked;

        // Save in localStorage
        window.localStorage.setItem('SplitChannels', splitChannel.checked);
    });

    loopMusic.addEventListener('change', () => {
        if (loopMusic.checked) {
            audioPlayer.loop = true;
        } else audioPlayer.loop = false;

        window.localStorage.setItem('AudioLoop', audioPlayer.loop);
    });

    circleMode.addEventListener('change', () => {
        FFT.circleMode = circleMode.checked;

        window.localStorage.setItem('CircleMode', circleMode.checked);
    });

    samplingCount.addEventListener('change', () => {
        if (Number.isInteger(Math.log2(samplingCount.value))) {
            FFT.N = samplingCount.value;
        } else alert('The samplingCount must be a power of 2!');
    });

    quadSize.addEventListener('change', () => {
        FFT.QUAD_SIZE = quadSize.value;
    });

    // Disable splitChannel button if song is running
    audioPlayer.addEventListener('playing', () => {
        splitChannel.disabled = true;
    });

    // Disable splitChannel button if circleMode is activated and turn it off if it's on
    circleMode.addEventListener('change', () => {
        if (circleMode.checked) {
            splitChannel.disabled = true;
            splitChannel.checked = false;
        } else {
            splitChannel.disabled = false;
        }

        // Fix error when music is playing and you untick circleMode it enables you to tick SplitChannel
        if (!audioPlayer.paused) {
            splitChannel.disabled = true;
        }
    });

    // Disable circleMode if splitChannel mode is running
    splitChannel.addEventListener('change', () => {
        if (splitChannel.checked) {
            circleMode.disabled = true;
            circleMode.checked = false;
        } else {
            circleMode.disabled = false;
        }
    });

    // Start on Zero / NULL
    $("#slider-time").val(0);

    // Moving the slide-time changes song current position
    $("#slider-time").bind('change', () => {
        audioPlayer.currentTime = $("#slider-time").val();
    });

    // Check if mouse is pressed and released so the loop doesn't take over
    $("#slider-time").mousedown(function () {
        $(this).data('clicked', true);
    });

    $("#slider-time").mouseup(function () {
        $(this).data('clicked', false);
    });
}