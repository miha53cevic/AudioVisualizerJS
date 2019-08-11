class fft {
    /**
     * 
     * @param {Audio} audioPlayer 
     */
    constructor(audioPlayer) {
        this.audioPlayer = audioPlayer;

        this.N = 16384;
        this.QUAD_SIZE = 8;
        this.freq_bin = [20, 60, 250, 500];
    }

    init(arrayBuffer) {

        // init forom here because of autoplay policy
        this.audioContext = new AudioContext();

        // BufferSource will hold audio data
        this.source = this.audioContext.createBufferSource();

        // Decode audio
        this.audioContext.decodeAudioData(arrayBuffer).then(buffer => {
            this.source.buffer = buffer;
            this.source.connect(this.audioContext.destination);

            console.log(buffer);

            // Audio Samples
            this.data = this.source.buffer.getChannelData(0);
            console.log(this.data);

            // Start player
            this.audioPlayer.play();
        });
    }

    render() {

        // Only if this.audioPlayer has started run
        if (!this.audioPlayer.paused || this.audioPlayer.currentTime) {

            const mark = Number.parseInt((this.audioPlayer.currentTime * this.source.buffer.sampleRate).toString());

            let input = Array();

            // Fill in input
            for (let i = 0; i < this.N; i++) {

                let index = i + mark;

                // Hamming window the input
                let sample = this.data[index] * (0.54 - (0.46 * Math.cos(2.0 * Math.PI * (i / ((this.N - 1) * 1.0)))));

                // Windowed sample / signal
                input.push(sample);
            }

            // Calculate fft
            const output = this.cfft(input);

            let peakmaxArray = [];

            // Calculate the magnitudes
            for (let i = 0; i < (this.N / 2) + 1; i++) {

                let freq = i * this.source.buffer.sampleRate / this.N;
                let magnitude = output[i].magnitude();

                for (let j = 0; j < this.freq_bin.length - 1; j++) {
                    if ((freq > this.freq_bin[j]) && (freq <= this.freq_bin[j + 1])) {
                        peakmaxArray.push(magnitude);
                    }
                }
            }

            clear('rgb(51,51,51)');
            // Visualize the magnitudes
            for (let i = 0; i < peakmaxArray.length; i++) {

                const x = i * this.QUAD_SIZE + ((WIDTH / 2) - (peakmaxArray.length * this.QUAD_SIZE / 2));
                const y = HEIGHT;

                const height = peakmaxArray[i] * 0.25;

                drawFillRect(x, y, this.QUAD_SIZE, -height, 'red');
            }
        }
    }

    cfft(amplitudes) {
        var N = amplitudes.length;
        if (N <= 1)
            return amplitudes;

        var hN = N / 2;
        var even = [];
        var odd = [];
        even.length = hN;
        odd.length = hN;
        for (var i = 0; i < hN; ++i) {
            even[i] = amplitudes[i * 2];
            odd[i] = amplitudes[i * 2 + 1];
        }
        even = this.cfft(even);
        odd = this.cfft(odd);

        var a = -2 * Math.PI;
        for (var k = 0; k < hN; ++k) {
            if (!(even[k] instanceof Complex))
                even[k] = new Complex(even[k], 0);
            if (!(odd[k] instanceof Complex))
                odd[k] = new Complex(odd[k], 0);
            var p = k / N;
            var t = new Complex(0, a * p);
            t.cexp(t).mul(odd[k], t);
            amplitudes[k] = even[k].add(t, odd[k]);
            amplitudes[k + hN] = even[k].sub(t, even[k]);
        }
        return amplitudes;
    }
}