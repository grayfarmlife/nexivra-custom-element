class NexivraLiveAvatar extends HTMLElement {

    static get observedAttributes() {
        return ["session-token"];
    }

    constructor() {
        super();

        this.session = null;
        this.sessionToken = null;
        this.sdk = null;
        this.started = false;
        this.attachTimer = null;

        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {

        this.render();

        this.sessionToken =
            this.getAttribute("session-token");

        this.bindControls();

        this.dispatchEvent(
            new CustomEvent("nexivra-ready", {
                bubbles: true,
                composed: true
            })
        );

        if (this.sessionToken) {
            this.startNexivra();
        }
    }

    attributeChangedCallback(
        name,
        oldValue,
        newValue
    ) {

        if (
            name === "session-token" &&
            newValue &&
            newValue !== oldValue
        ) {

            this.sessionToken = newValue;

            if (this.isConnected) {
                this.startNexivra();
            }
        }
    }

    render() {

        this.shadowRoot.innerHTML = `
            <style>

                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    min-height: 380px;
                    box-sizing: border-box;
                }

                * {
                    box-sizing: border-box;
                }

                .wrap {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    min-height: 380px;
                    background: #111;
                    overflow: hidden;
                    font-family: Arial, sans-serif;
                }

                video {
                    width: 100%;
                    height: 100%;
                    min-height: 380px;
                    object-fit: contain;
                    background: #111;
                    display: block;
                }

                .status {
                    position: absolute;
                    left: 16px;
                    bottom: 16px;
                    background: rgba(0,0,0,.78);
                    color: white;
                    padding: 9px 12px;
                    border-radius: 6px;
                    font-size: 14px;
                    z-index: 20;
                }

                .controls {
                    position: absolute;
                    left: 16px;
                    right: 16px;
                    bottom: 60px;
                    display: flex;
                    gap: 8px;
                    z-index: 30;
                }

                input {
                    flex: 1;
                    min-width: 0;
                    padding: 11px 12px;
                    border: none;
                    border-radius: 6px;
                    font-size: 15px;
                    outline: none;
                }

                button {
                    border: none;
                    border-radius: 6px;
                    padding: 10px 15px;
                    background: white;
                    color: #111;
                    font-weight: 600;
                    cursor: pointer;
                }

                button:hover {
                    opacity: .9;
                }

                button:disabled {
                    opacity: .5;
                    cursor: not-allowed;
                }

                .debug {
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    color: rgba(255,255,255,.45);
                    font-size: 11px;
                    z-index: 40;
                }

            </style>

            <div class="wrap">

                <video
                    id="avatarVideo"
                    autoplay
                    playsinline>
                </video>

                <div
                    class="debug"
                    id="debug">
                    NEXIVRA CUSTOM ELEMENT READY
                </div>

                <div class="controls">

                    <input
                        id="messageInput"
                        type="text"
                        placeholder="Talk to your coach..."
                    >

                    <button id="sendButton">
                        Send
                    </button>

                    <button id="voiceButton">
                        Start Voice
                    </button>

                </div>

                <div
                    class="status"
                    id="status">
                    Waiting for NEXIVRA session...
                </div>

            </div>
        `;
    }

    bindControls() {

        const sendButton =
            this.shadowRoot.getElementById(
                "sendButton"
            );

        const voiceButton =
            this.shadowRoot.getElementById(
                "voiceButton"
            );

        const messageInput =
            this.shadowRoot.getElementById(
                "messageInput"
            );

        sendButton.addEventListener(
            "click",
            () => this.sendMessage()
        );

        messageInput.addEventListener(
            "keydown",
            (event) => {

                if (event.key === "Enter") {
                    this.sendMessage();
                }
            }
        );

        voiceButton.addEventListener(
            "click",
            () => this.startVoice()
        );
    }

    setStatus(message) {

        console.log(
            "NEXIVRA STATUS:",
            message
        );

        const status =
            this.shadowRoot.getElementById(
                "status"
            );

        if (status) {
            status.textContent = message;
        }
    }

    setDebug(message) {

        console.log(
            "NEXIVRA DEBUG:",
            message
        );

        const debug =
            this.shadowRoot.getElementById(
                "debug"
            );

        if (debug) {
            debug.textContent = message;
        }
    }

    async loadSDK() {

        if (this.sdk) {
            return;
        }

        this.setStatus(
            "Loading LiveAvatar..."
        );

        this.setDebug(
            "Loading LiveAvatar SDK..."
        );

        const sdk = await import(
            "https://esm.sh/@heygen/liveavatar-web-sdk@0.0.18?bundle"
        );

        if (
            !sdk ||
            !sdk.LiveAvatarSession
        ) {

            throw new Error(
                "LiveAvatarSession was not found."
            );
        }

        this.sdk = sdk;

        this.setDebug(
            "LiveAvatar SDK loaded."
        );
    }

    async startNexivra() {

        if (
            this.started ||
            !this.sessionToken
        ) {
            return;
        }

        this.started = true;

        try {

            await this.loadSDK();

            this.setStatus(
                "Starting AI Hospitality Coach..."
            );

            this.session =
                new this.sdk.LiveAvatarSession(
                    this.sessionToken,
                    {
                        voiceChat: false
                    }
                );

            await this.session.start();

            this.setDebug(
                "LiveAvatar session started."
            );

            this.waitForVideo();

        } catch (error) {

            this.started = false;

            console.error(
                "NEXIVRA SESSION ERROR:",
                error
            );

            this.setStatus(
                "SESSION ERROR: " +
                (
                    error?.message ||
                    String(error)
                )
            );
        }
    }

    waitForVideo() {

        const video =
            this.shadowRoot.getElementById(
                "avatarVideo"
            );

        let attempts = 0;

        this.attachTimer =
            setInterval(() => {

                attempts++;

                try {

                    this.session.attach(
                        video
                    );

                    if (
                        video.srcObject &&
                        video.srcObject.getTracks &&
                        video.srcObject
                            .getTracks()
                            .length > 0
                    ) {

                        clearInterval(
                            this.attachTimer
                        );

                        this.attachTimer = null;

                        this.setDebug(
                            "NEXIVRA VIDEO CONNECTED"
                        );

                        this.setStatus(
                            "AI Hospitality Coach is ready."
                        );

                        video.play().catch(
                            (error) => {

                                console.warn(
                                    "NEXIVRA playback warning:",
                                    error
                                );
                            }
                        );
                    }

                } catch (error) {

                    console.log(
                        "Waiting for avatar stream..."
                    );
                }

                if (attempts >= 60) {

                    clearInterval(
                        this.attachTimer
                    );

                    this.attachTimer = null;

                    this.setStatus(
                        "Avatar stream timed out."
                    );
                }

            }, 500);
    }

    async sendMessage() {

        const input =
            this.shadowRoot.getElementById(
                "messageInput"
            );

        const message =
            input.value.trim();

        if (!message) {
            return;
        }

        if (!this.session) {

            this.setStatus(
                "Please wait for the coach to connect."
            );

            return;
        }

        try {

            this.setStatus(
                "NEXIVRA is thinking..."
            );

            this.session.message(
                message
            );

            input.value = "";

            this.setStatus(
                "AI Hospitality Coach is responding..."
            );

        } catch (error) {

            console.error(
                "NEXIVRA TEXT ERROR:",
                error
            );

            this.setStatus(
                "TEXT ERROR: " +
                (
                    error?.message ||
                    String(error)
                )
            );
        }
    }

    async startVoice() {

        const voiceButton =
            this.shadowRoot.getElementById(
                "voiceButton"
            );

        if (!this.session) {

            this.setStatus(
                "Please wait for the coach to connect."
            );

            return;
        }

        try {

            voiceButton.disabled = true;

            this.setStatus(
                "Starting microphone..."
            );

            await this.session
                .voiceChat
                .start();

            voiceButton.textContent =
                "Voice Active";

            this.setStatus(
                "AI Hospitality Coach is listening."
            );

        } catch (error) {

            console.error(
                "NEXIVRA MIC ERROR:",
                error
            );

            voiceButton.disabled = false;

            this.setStatus(
                "MIC ERROR: " +
                (
                    error?.message ||
                    String(error)
                )
            );
        }
    }

    disconnectedCallback() {

        if (this.attachTimer) {

            clearInterval(
                this.attachTimer
            );
        }

        if (this.session) {

            this.session.stop()
                .catch(
                    (error) => {

                        console.error(
                            "NEXIVRA STOP ERROR:",
                            error
                        );
                    }
                );
        }
    }
}

customElements.define(
    "nexivra-live-avatar",
    NexivraLiveAvatar
);
