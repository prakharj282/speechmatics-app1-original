export class SpeechmaticsClient {
    constructor(url = "wss://eu2.rt.speechmatics.com/v2") {
        this.baseUrl = url;
        this.ws = null;
        this.onTranscript = null;
        this.onError = null;
        this.seqNos = {};
    }

    connect(apiKey, options = {}) {
        return new Promise((resolve, reject) => {
            const urlWithAuth = `${this.baseUrl}?jwt=${apiKey}&sm-sdk=js-manual`;
            let handshakeComplete = false;

            try {
                this.ws = new WebSocket(urlWithAuth);
            } catch (e) {
                reject(e);
                return;
            }

            this.seqNos = {};

            this.ws.onopen = () => {
                console.log("WebSocket connected");

                const startRecognitionMessage = {
                    message: "StartRecognition",
                    audio_format: {
                        type: "raw",
                        encoding: "pcm_s16le",
                        sample_rate: options.sampleRate || 44100,
                    },
                    transcription_config: {
                        language: options.language || "en",
                        diarization: options.diarization || "channel",
                        channel_diarization_labels: options.channelLabels || ["Channel 1", "Channel 2"],
                        enable_partials: true,
                        operating_point: "enhanced",
                        max_delay: 0.7,
                        max_delay_mode: "flexible",
                        ...options.transcriptionConfig // Merge extra config if needed
                    },
                };

                this.ws.send(JSON.stringify(startRecognitionMessage));
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.message === "RecognitionStarted") {
                    console.log("Recognition started", data);
                    handshakeComplete = true;
                    resolve(data);
                } else if (data.message === "AddTranscript" || data.message === "AddPartialTranscript") {
                    if (this.onTranscript) {
                        this.onTranscript(data);
                    }
                } else if (data.message === "Error") {
                    console.error("Speechmatics Error:", data);
                    if (this.onError) this.onError(data);
                    if (!handshakeComplete) reject(new Error(data.reason || "Speechmatics Error"));
                } else if (data.message === "Warning") {
                    console.warn("Speechmatics Warning:", data);
                }
            };

            this.ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                if (this.onError) this.onError(error);
                if (!handshakeComplete) reject(new Error("WebSocket connection error"));
            };

            this.ws.onclose = (event) => {
                console.log("WebSocket closed", event.code);
                if (!handshakeComplete) {
                    reject(new Error(`Connection closed before handshake. Code: ${event.code}`));
                }
            };
        });
    }

    sendAudio(channelLabel, int16Data) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const base64Data = this.arrayBufferToBase64(int16Data.buffer);

        const message = {
            message: "AddChannelAudio",
            channel: channelLabel,
            data: base64Data,
        };

        this.ws.send(JSON.stringify(message));
    }

    disconnect() {
        if (this.ws) {
            try {
                this.ws.close();
            } catch (e) {
                console.error("Error closing websocket", e);
            }
        }
    }

    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
}
