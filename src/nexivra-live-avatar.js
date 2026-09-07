import { LiveAvatarSession } from "@heygen/liveavatar-web-sdk";

class NexivraLiveAvatar extends HTMLElement {

    static get observedAttributes() {
        return ["session-token"];
    }

    constructor() {
        super();

        this.attachShadow({ mode: "open" });

        this._session = null;
        this._sessionToken = null;
        this._started = false;
        this._attachTimer = null;
    }

    connectedCallback() {

        this.render();
        this.bindControls();

        this._sessionToken =
            this.getAttribute("session-token");

        this.setDebug(
            "NEXIVRA CUSTOM ELEMENT READY"
        );

        if (this._sessionToken) {
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

            this._sessionToken = newValue;

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

                #avatarVideo {
                    width: 100%;
                    height: 100%;
                    min-height: 380px;
                    object-fit: contain;
                    background: #111;
                    display: block;
                }

                .debug {
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    color: rgba(255,255,255,.45);
                    font-size: 11px;
                    z-index: 40;
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

                .status {
                    position: absolute;
                    left: 16px;
                    bottom: 16px;
                    max-width: calc(100% - 32px);
                    background: rgba(0,0,0,.82);
                    color: white;
                    padding: 9px 12px;
                    border-radius: 6px;
                    font-size: 14px;
                    line-height: 1.25;
                    z-index: 20;
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

        voiceButton.addEventListener(
            "click",
            () => this.startVoice()
        );

        messageInput.addEventListener(
            "keydown",
            (event) => {

                if (event.key === "Enter") {
                    this.sendMessage();
                }

            }
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

    async startNexivra() {

        if (
            this._started ||
            !this._sessionToken
        ) {
            return;
        }

        this._started = true;

        let stage = "creating LiveAvatar session";

        try {

            this.setStatus(
                "Creating LiveAvatar session..."
            );

            const newSession =
                new LiveAvatarSession(
                    this._sessionToken,
                    {
                        voiceChat: false
                    }
                );

            stage = "storing LiveAvatar session";

            this._session =
                newSession;

            stage = "starting LiveAvatar session";

            this.setStatus(
                "Starting AI Hospitality Coach..."
            );

            await this._session.start();

            stage = "waiting for avatar video";

            this.setDebug(
                "LiveAvatar session started."
            );

            this.waitForVideo();

        } catch (error) {

            this._started = false;

            console.error(
                "NEXIVRA SESSION ERROR:",
                stage,
                error
            );

            this.setStatus(
                "ERROR AT " +
                stage +
                ": " +
                (
                    error?.message ||
                    String(error)
                )
            );

            this.setDebug(
                "NEXIVRA SESSION ERROR"
            );
        }
    }

    waitForVideo() {

        const video =
            this.shadowRoot.getElementById(
                "avatarVideo"
            );

        let attempts = 0;

        if (this._attachTimer) {

            clearInterval(
                this._attachTimer
            );

        }

        this._attachTimer =
            setInterval(() => {

                attempts++;

                try {

                    this._session.attach(
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
                            this._attachTimer
                        );

                        this._attachTimer = null;

                        this.setDebug(
                            "NEXIVRA VIDEO CONNECTED"
                        );

                        this.setStatus(
                            "AI Hospitality Coach is ready."
                        );

                        video.play().catch(
                            (error) => {

                                console.warn(
                                    "NEXIVRA VIDEO PLAYBACK WARNING:",
                                    error
                                );

                            }
                        );
                    }

                } catch (error) {

                    console.log(
                        "NEXIVRA waiting for avatar stream..."
                    );

                }

                if (attempts >= 60) {

                    clearInterval(
                        this._attachTimer
                    );

                    this._attachTimer = null;

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

        if (!this._session) {

            this.setStatus(
                "Please wait for the coach to connect."
            );

            return;
        }

        try {

            this.setStatus(
                "NEXIVRA is thinking..."
            );

            this._session.message(
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

        if (!this._session) {

            this.setStatus(
                "Please wait for the coach to connect."
            );

            return;
        }

        try {

            voiceButton.disabled = true;

            this.setStatus(
                "Requesting microphone..."
            );

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {

                throw new Error(
                    "This browser does not provide microphone access."
                );
            }

            const permissionStream =
                await navigator.mediaDevices
                    .getUserMedia({
                        audio: true
                    });

            permissionStream
                .getTracks()
                .forEach(
                    (track) => track.stop()
                );

            this.setStatus(
                "Starting NEXIVRA voice chat..."
            );

            await this._session
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

        if (this._attachTimer) {

            clearInterval(
                this._attachTimer
            );

            this._attachTimer = null;
        }

        if (this._session) {

            this._session
                .stop()
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

if (
    !customElements.get(
        "nexivra-live-avatar"
    )
) {

    customElements.define(
        "nexivra-live-avatar",
        NexivraLiveAvatar
    );

}
