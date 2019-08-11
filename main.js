var audioPlayer;
var FFT;

window.onload = () => {
    createCanvas(1024, 768);
    init();
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

    window.requestAnimationFrame(loop);
}