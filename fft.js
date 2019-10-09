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

        this.SplitChannels = false;
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

            // SplitChannels option
            if (this.SplitChannels) {
                if (this.source.buffer.getChannelData(1) == undefined) {
                    this.SplitChannels = false;
                } else {
                    this.data2 = this.source.buffer.getChannelData(1);
                    console.log(this.data2);
                }
            }

            // Start player
            this.audioPlayer.play();

            console.log(this.N);
        });
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
            /* Only half of the data is useful */
            for (let i = 0; i < (this.N / 2) + 1; i++) {

                let freq = i * this.source.buffer.sampleRate / this.N;
                let magnitude = output[i].magnitude();

                // Extract the peaks from defined frequency ranges
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

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    render2Channels() {

        // Only if this.audioPlayer has started run
        if (!this.audioPlayer.paused || this.audioPlayer.currentTime) {

            const mark = Number.parseInt((this.audioPlayer.currentTime * this.source.buffer.sampleRate).toString());

            let input1 = Array();
            let input2 = Array();

            // Fill in input
            /* Each channel gets half of the sampleCount */
            for (let i = 0; i < (this.N / 2); i++) {

                let index = i + mark;

                // Hamming window the input
                let sample = this.data[index] * (0.54 - (0.46 * Math.cos(2.0 * Math.PI * (i / (((this.N / 2) - 1) * 1.0)))));

                // Windowed sample / signal
                input1.push(sample);
            }

            // Input for second channel
            for (let i = 0; i < (this.N / 2); i++) {

                let index = i + mark;

                // Hamming window the input
                let sample = this.data2[index] * (0.54 - (0.46 * Math.cos(2.0 * Math.PI * (i / (((this.N / 2) - 1) * 1.0)))));

                // Windowed sample / signal
                input2.push(sample);
            }

            // Calculate fft
            const output1 = this.cfft(input1);
            const output2 = this.cfft(input2);

            let peakmaxArray1 = [];
            let peakmaxArray2 = [];

            // Calculate the magnitudes
            /* Only half of the magnitudes are valuable data
               since we have 2 channels we have to divide N by 2 and 
               then divide by 2 again to get the valuable data */
            for (let i = 0; i < (this.N / 4) + 1; i++) {

                let freq = i * this.source.buffer.sampleRate / (this.N / 2);
                let magnitude = output1[i].magnitude();

                for (let j = 0; j < this.freq_bin.length - 1; j++) {
                    if ((freq > this.freq_bin[j]) && (freq <= this.freq_bin[j + 1])) {
                        peakmaxArray1.push(magnitude);
                    }
                }
            }

            for (let i = 0; i < (this.N / 4) + 1; i++) {

                let freq = i * this.source.buffer.sampleRate / (this.N / 2);
                let magnitude = output2[i].magnitude();

                for (let j = 0; j < this.freq_bin.length - 1; j++) {
                    if ((freq > this.freq_bin[j]) && (freq <= this.freq_bin[j + 1])) {
                        peakmaxArray2.push(magnitude);
                    }
                }
            }

            // Clear screen
            clear('rgb(51,51,51)');

            // Visualize the magnitudes
            for (let i = 0; i < peakmaxArray1.length; i++) {

                const x = i * this.QUAD_SIZE + ((WIDTH / 2) - ((peakmaxArray1.length + peakmaxArray2.length) * this.QUAD_SIZE / 2));
                const y = HEIGHT;

                const height = peakmaxArray1[i] * 0.25;

                drawFillRect(x, y, this.QUAD_SIZE, -height, 'red');
            }

            for (let i = peakmaxArray1.length; i < peakmaxArray1.length + peakmaxArray2.length; i++) {

                const x = i * this.QUAD_SIZE + ((WIDTH / 2) - ((peakmaxArray1.length + peakmaxArray2.length) * this.QUAD_SIZE / 2));
                const y = HEIGHT;

                const height = peakmaxArray2[i - peakmaxArray1.length] * 0.25;

                drawFillRect(x, y, this.QUAD_SIZE, -height, 'cyan');
            }
        }
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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