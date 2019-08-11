var audioPlayer;
var FFT;

window.onload = () => {
    createCanvas(1024, 768);
    init();
};

// TODO design
// TODO SOUND PAUSE, LOWER SOUND ETC
// TODO OPTION FOR stereo sound, half load left channel colour red, half load right channel colour blue

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
    FFT.render();

    // Draw Audio Time / PlayingOffset
    const mark = toInt(audioPlayer.currentTime);
    const total = toInt(audioPlayer.duration);
    drawFillText(`Time: ${mark}s - ${total}s`, 16, 48, 32, 'white');

    if (mark == total) {
        location.reload();
    }

    // Create infinite loop
    window.requestAnimationFrame(loop);
}