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

        // Learner camera
        this._cameraStream = null;
        this._cameraEnabled = false;
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
                    min-height: 420px;
                    box-sizing: border-box;
                }

                * {
                    box-sizing: border-box;
                }

                .wrap {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    min-height: 420px;
                    background: #111;
                    overflow: hidden;
                    font-family: Arial, sans-serif;
                }

                #avatarVideo {
                    width: 100%;
                    height: 100%;
                    min-height: 420px;
                    object-fit: contain;
                    background: #111;
                    display: block;
                }

                /*
                 * Learner camera preview
                 */

                .learner-preview {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    width: 170px;
                    height: 125px;
                    border-radius: 10px;
                    overflow: hidden;
                    background: #222;
                    border: 2px solid rgba(255,255,255,.8);
                    box-shadow: 0 4px 14px rgba(0,0,0,.35);
                    display: none;
                    z-index: 50;
                }

                .learner-preview.active {
                    display: block;
                }

                #learnerVideo {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transform: scaleX(-1);
                    background: #222;
                    display: block;
                }

                .preview-label {
                    position: absolute;
                    left: 6px;
                    bottom: 5px;
                    padding: 3px 6px;
                    border-radius: 4px;
                    background: rgba(0,0,0,.65);
                    color: white;
                    font-size: 10px;
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
                    z-index: 60;
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
                    padding: 10px 14px;
                    background: white;
                    color: #111;
                    font-weight: 600;
                    cursor: pointer;
                    white-space: nowrap;
                }

                button:hover {
                    opacity: .9;
                }

                button:disabled {
                    opacity: .5;
                    cursor: not-allowed;
                }

                #cameraButton.camera-active {
                    background: #222;
                    color: white;
                    border: 1px solid white;
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
                    z-index: 50;
                }

                @media (max-width: 700px) {

                    .controls {
                        flex-wrap: wrap;
                    }

                    input {
                        flex-basis: 100%;
                    }

                    .learner-preview {
                        width: 125px;
                        height: 95px;
                    }
                }

            </style>

            <div class="wrap">

                <!-- NEXIVRA / Elenora -->

                <video
                    id="avatarVideo"
                    autoplay
                    playsinline>
                </video>


                <!-- Learner camera preview -->

                <div
                    class="learner-preview"
                    id="learnerPreview">

                    <video
                        id="learnerVideo"
                        autoplay
                        muted
                        playsinline>
                    </video>

                    <div class="preview-label">
                        You
                    </div>

                </div>


                <div
                    class="debug"
                    id="debug">
                    NEXIVRA CUSTOM ELEMENT READY
                </div>


                <!-- Controls -->

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

                    <button id="cameraButton">
                        Enable Camera
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

        const cameraButton =
            this.shadowRoot.getElementById(
                "cameraButton"
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


        cameraButton.addEventListener(
            "click",
            () => this.toggleCamera()
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


    /*
     * -----------------------------------------------------
     * NEXIVRA / LIVEAVATAR
     * -----------------------------------------------------
     */

    async startNexivra() {

        if (
            this._started ||
            !this._sessionToken
        ) {
            return;
        }

        this._started = true;

        let stage =
            "creating LiveAvatar session";

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

            stage =
                "storing LiveAvatar session";

            this._session =
                newSession;

            stage =
                "starting LiveAvatar session";

            this.setStatus(
                "Starting AI Hospitality Coach..."
            );

            await this._session.start();

            stage =
                "waiting for avatar video";

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


    /*
     * -----------------------------------------------------
     * TEXT CHAT
     * -----------------------------------------------------
     */

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


    /*
     * -----------------------------------------------------
     * VOICE CHAT
     * -----------------------------------------------------
     */

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

            /*
             * Establish microphone permission
             * directly from learner interaction.
             */

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


    /*
     * -----------------------------------------------------
     * LEARNER CAMERA
     * Prototype 1.1
     * -----------------------------------------------------
     */

    async toggleCamera() {

        if (this._cameraEnabled) {

            this.stopCamera();

        } else {

            await this.startCamera();

        }
    }


    async startCamera() {

        const cameraButton =
            this.shadowRoot.getElementById(
                "cameraButton"
            );

        const learnerVideo =
            this.shadowRoot.getElementById(
                "learnerVideo"
            );

        const learnerPreview =
            this.shadowRoot.getElementById(
                "learnerPreview"
            );


        try {

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {

                throw new Error(
                    "This browser does not provide camera access."
                );
            }


            cameraButton.disabled = true;

            this.setStatus(
                "Requesting camera access..."
            );


            const stream =
                await navigator.mediaDevices
                    .getUserMedia({
                        video: {
                            facingMode: "user",
                            width: {
                                ideal: 1280
                            },
                            height: {
                                ideal: 720
                            }
                        },
                        audio: false
                    });


            this._cameraStream =
                stream;

            learnerVideo.srcObject =
                stream;


            await learnerVideo.play();


            learnerPreview.classList.add(
                "active"
            );


            this._cameraEnabled =
                true;


            cameraButton.disabled =
                false;

            cameraButton.textContent =
                "Disable Camera";

            cameraButton.classList.add(
                "camera-active"
            );


            this.setStatus(
                "Camera is active."
            );


            this.setDebug(
                "NEXIVRA CAMERA CONNECTED"
            );


            console.log(
                "NEXIVRA learner camera started."
            );

        } catch (error) {

            console.error(
                "NEXIVRA CAMERA ERROR:",
                error
            );


            cameraButton.disabled =
                false;


            this.setStatus(
                "CAMERA ERROR: " +
                (
                    error?.message ||
                    String(error)
                )
            );
        }
    }


    stopCamera() {

        const cameraButton =
            this.shadowRoot.getElementById(
                "cameraButton"
            );

        const learnerVideo =
            this.shadowRoot.getElementById(
                "learnerVideo"
            );

        const learnerPreview =
            this.shadowRoot.getElementById(
                "learnerPreview"
            );


        if (this._cameraStream) {

            this._cameraStream
                .getTracks()
                .forEach(
                    (track) => {

                        track.stop();

                    }
                );

            this._cameraStream =
                null;
        }


        learnerVideo.srcObject =
            null;


        learnerPreview.classList.remove(
            "active"
        );


        this._cameraEnabled =
            false;


        cameraButton.textContent =
            "Enable Camera";

        cameraButton.classList.remove(
            "camera-active"
        );


        this.setStatus(
            "Camera is off."
        );


        console.log(
            "NEXIVRA learner camera stopped."
        );
    }


    /*
     * -----------------------------------------------------
     * CLEANUP
     * -----------------------------------------------------
     */

    disconnectedCallback() {

        if (this._attachTimer) {

            clearInterval(
                this._attachTimer
            );

            this._attachTimer = null;
        }


        /*
         * Stop learner camera.
         */

        if (this._cameraStream) {

            this._cameraStream
                .getTracks()
                .forEach(
                    (track) => track.stop()
                );

            this._cameraStream =
                null;
        }


        /*
         * Stop LiveAvatar session.
         */

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


/*
 * Register Custom Element once.
 */

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
