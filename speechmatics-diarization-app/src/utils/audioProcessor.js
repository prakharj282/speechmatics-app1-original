export class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.streams = new Map();
        this.processors = new Map();
        this.inputs = new Map();
    }

    async start(deviceId1, deviceId2, onAudioData) {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
        }
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        if (deviceId1) {
            await this.setupChannel('Speaker 1', deviceId1, onAudioData);
        }
        if (deviceId2) {
            await this.setupChannel('Speaker 2', deviceId2, onAudioData);
        }
    }

    async startSingle(deviceId, label, onAudioData) {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
        }
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        if (deviceId) {
            await this.setupChannel(label, deviceId, onAudioData);
        }
    }

    async setupChannel(label, deviceId, onAudioData) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    channelCount: 1,
                    sampleRate: 44100,
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                }
            });

            const source = this.audioContext.createMediaStreamSource(stream);
            // Smaller buffer size (2048) for lower latency (~46ms)
            const processor = this.audioContext.createScriptProcessor(2048, 1, 1);

            source.connect(processor);

            const mute = this.audioContext.createGain();
            mute.gain.value = 0;
            processor.connect(mute);
            mute.connect(this.audioContext.destination);

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const int16Data = this.floatTo16BitPCM(inputData);
                onAudioData(label, int16Data);
            };

            this.streams.set(label, stream);
            this.processors.set(label, processor);
            this.inputs.set(label, source);
            console.log(`Channel ${label} setup complete`);

        } catch (err) {
            console.error("Error setting up channel " + label, err);
            throw err;
        }
    }

    floatTo16BitPCM(input) {
        const output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return output;
    }

    stop() {
        this.streams.forEach(s => s.getTracks().forEach(t => t.stop()));
        this.processors.forEach(p => {
            p.disconnect();
            p.onaudioprocess = null;
        });
        this.inputs.forEach(i => i.disconnect());

        this.streams.clear();
        this.processors.clear();
        this.inputs.clear();

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}
