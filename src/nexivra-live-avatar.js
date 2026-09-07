import { LiveAvatarSession } from "@heygen/liveavatar-web-sdk";

import {
    FilesetResolver,
    FaceLandmarker,
    PoseLandmarker
} from "@mediapipe/tasks-vision";


class NexivraLiveAvatar extends HTMLElement {

    static get observedAttributes() {
        return ["session-token"];
    }

    constructor() {

        super();

        this.attachShadow({ mode: "open" });

        /*
         * LiveAvatar
         */

        this._session = null;
        this._sessionToken = null;
        this._avatarStarted = false;
        this._attachTimer = null;

        /*
         * Learner session
         */

        this._learnerSessionActive = false;
        this._cameraStream = null;

        /*
         * MediaPipe
         */

        this._visionFileset = null;
        this._faceLandmarker = null;
        this._poseLandmarker = null;
        this._visualAnalysisTimer = null;
        this._visualAnalysisRunning = false;

        /*
         * Visual coaching metrics
         */

        this._visualMetrics = this.createEmptyVisualMetrics();
    }


    /*
     * =====================================================
     * CUSTOM ELEMENT LIFECYCLE
     * =====================================================
     */

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


    /*
     * =====================================================
     * UI
     * =====================================================
     */

    render() {

        this.shadowRoot.innerHTML = `
            <style>

                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    min-height: 500px;
                    box-sizing: border-box;
                }

                * {
                    box-sizing: border-box;
                }

                .wrap {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    min-height: 500px;
                    background: #111;
                    overflow: hidden;
                    font-family: Arial, sans-serif;
                }


                /*
                 * NEXIVRA / Elenora
                 */

                #avatarVideo {
                    width: 100%;
                    height: 100%;
                    min-height: 500px;
                    object-fit: contain;
                    background: #111;
                    display: block;
                }


                /*
                 * Learner camera
                 */

                .learner-preview {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    width: 190px;
                    height: 140px;
                    border-radius: 10px;
                    overflow: hidden;
                    background: #222;
                    border: 2px solid rgba(255,255,255,.85);
                    box-shadow: 0 4px 14px rgba(0,0,0,.35);
                    display: none;
                    z-index: 60;
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
                    background: rgba(0,0,0,.68);
                    color: white;
                    font-size: 10px;
                }


                /*
                 * Temporary visual developer panel.
                 * We will hide/remove this in production.
                 */

                .visual-panel {
                    position: absolute;
                    top: 170px;
                    right: 16px;
                    width: 225px;
                    background: rgba(0,0,0,.84);
                    color: white;
                    border: 1px solid rgba(255,255,255,.35);
                    border-radius: 8px;
                    padding: 10px;
                    font-size: 11px;
                    line-height: 1.45;
                    display: none;
                    z-index: 60;
                }

                .visual-panel.active {
                    display: block;
                }

                .visual-title {
                    font-weight: 700;
                    font-size: 12px;
                    margin-bottom: 7px;
                }

                .metric {
                    display: flex;
                    justify-content: space-between;
                    gap: 8px;
                }

                .metric-value {
                    font-weight: 600;
                    text-align: right;
                }


                /*
                 * Debug
                 */

                .debug {
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    color: rgba(255,255,255,.45);
                    font-size: 11px;
                    z-index: 40;
                }


                /*
                 * Controls
                 */

                .controls {
                    position: absolute;
                    left: 16px;
                    right: 16px;
                    bottom: 60px;
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    z-index: 70;
                }

                input {
                    flex: 1;
                    min-width: 220px;
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

                #sessionButton.session-active {
                    background: #222;
                    color: white;
                    border: 1px solid white;
                }


                /*
                 * Status
                 */

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
                    z-index: 60;
                }


                @media (max-width: 700px) {

                    .learner-preview {
                        width: 125px;
                        height: 95px;
                    }

                    .visual-panel {
                        width: 180px;
                        top: 125px;
                    }

                    input {
                        flex-basis: 100%;
                    }
                }

            </style>


            <div class="wrap">

                <!-- NEXIVRA -->

                <video
                    id="avatarVideo"
                    autoplay
                    playsinline>
                </video>


                <!-- Learner camera -->

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


                <!-- Temporary visual metrics -->

                <div
                    class="visual-panel"
                    id="visualPanel">

                    <div class="visual-title">
                        Visual Coaching Data
                    </div>

                    <div class="metric">
                        <span>Analysis:</span>
                        <span
                            class="metric-value"
                            id="analysisStatus">
                            Off
                        </span>
                    </div>

                    <div class="metric">
                        <span>Face detected:</span>
                        <span
                            class="metric-value"
                            id="faceDetected">
                            No
                        </span>
                    </div>

                    <div class="metric">
                        <span>Pose detected:</span>
                        <span
                            class="metric-value"
                            id="poseDetected">
                            No
                        </span>
                    </div>

                    <div class="metric">
                        <span>Head:</span>
                        <span
                            class="metric-value"
                            id="headOrientation">
                            Unknown
                        </span>
                    </div>

                    <div class="metric">
                        <span>Posture:</span>
                        <span
                            class="metric-value"
                            id="posture">
                            Unknown
                        </span>
                    </div>

                    <div class="metric">
                        <span>Facing forward:</span>
                        <span
                            class="metric-value"
                            id="facingForward">
                            0%
                        </span>
                    </div>

                    <div class="metric">
                        <span>In frame:</span>
                        <span
                            class="metric-value"
                            id="inFrame">
                            0%
                        </span>
                    </div>

                    <div class="metric">
                        <span>Look-away events:</span>
                        <span
                            class="metric-value"
                            id="lookAwayEvents">
                            0
                        </span>
                    </div>

                </div>


                <div
                    class="debug"
                    id="debug">
                    NEXIVRA CUSTOM ELEMENT READY
                </div>


                <!-- Learner controls -->

                <div class="controls">

                    <input
                        id="messageInput"
                        type="text"
                        placeholder="Type to your coach..."
                    >

                    <button id="sendButton">
                        Send
                    </button>

                    <button id="sessionButton">
                        Start Session
                    </button>

                </div>


                <div
                    class="status"
                    id="status">
                    Waiting for NEXIVRA...
                </div>

            </div>
        `;
    }


    bindControls() {

        const sendButton =
            this.shadowRoot.getElementById(
                "sendButton"
            );

        const sessionButton =
            this.shadowRoot.getElementById(
                "sessionButton"
            );

        const messageInput =
            this.shadowRoot.getElementById(
                "messageInput"
            );


        sendButton.addEventListener(
            "click",
            () => this.sendMessage()
        );


        sessionButton.addEventListener(
            "click",
            () => this.toggleLearnerSession()
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

            status.textContent =
                message;

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

            debug.textContent =
                message;

        }
    }


    /*
     * =====================================================
     * LIVEAVATAR
     * =====================================================
     */

    async startNexivra() {

        if (
            this._avatarStarted ||
            !this._sessionToken
        ) {

            return;

        }

        this._avatarStarted =
            true;


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

            this._avatarStarted =
                false;


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


        let attempts =
            0;


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


                        this._attachTimer =
                            null;


                        this.setDebug(
                            "NEXIVRA VIDEO CONNECTED"
                        );


                        this.setStatus(
                            "AI Hospitality Coach is ready. Click Start Session."
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


                    this._attachTimer =
                        null;


                    this.setStatus(
                        "Avatar stream timed out."
                    );
                }

            }, 500);
    }


    /*
     * =====================================================
     * ONE-CLICK LEARNER SESSION
     * =====================================================
     */

    async toggleLearnerSession() {

        if (
            this._learnerSessionActive
        ) {

            await this.endLearnerSession();

        } else {

            await this.startLearnerSession();

        }
    }


    async startLearnerSession() {

        const sessionButton =
            this.shadowRoot.getElementById(
                "sessionButton"
            );

        const learnerVideo =
            this.shadowRoot.getElementById(
                "learnerVideo"
            );

        const learnerPreview =
            this.shadowRoot.getElementById(
                "learnerPreview"
            );

        const visualPanel =
            this.shadowRoot.getElementById(
                "visualPanel"
            );


        if (!this._session) {

            this.setStatus(
                "Please wait for NEXIVRA to finish connecting."
            );

            return;
        }


        try {

            sessionButton.disabled =
                true;


            this.setStatus(
                "Connecting microphone and camera..."
            );


            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {

                throw new Error(
                    "This browser does not provide camera and microphone access."
                );
            }


            /*
             * Ask for both permissions in ONE learner action.
             */

            const mediaStream =
                await navigator.mediaDevices
                    .getUserMedia({

                        audio: true,

                        video: {

                            facingMode:
                                "user",

                            width: {
                                ideal: 1280
                            },

                            height: {
                                ideal: 720
                            }
                        }
                    });


            /*
             * Keep the camera stream.
             */

            this._cameraStream =
                mediaStream;


            learnerVideo.srcObject =
                mediaStream;


            await learnerVideo.play();


            learnerPreview.classList.add(
                "active"
            );


            visualPanel.classList.add(
                "active"
            );


            /*
             * Browser permission for audio has now
             * been established.
             *
             * LiveAvatar will manage its own microphone
             * stream for voice chat, so stop only the
             * temporary audio tracks from this stream.
             */

            mediaStream
                .getAudioTracks()
                .forEach(
                    (track) => {

                        track.stop();

                    }
                );


            /*
             * Start visual coaching engine.
             */

            this.setStatus(
                "Starting visual coaching..."
            );


            await this.initializeVisualAnalysis();


            this.startVisualAnalysis();


            /*
             * Start LiveAvatar voice conversation.
             */

            this.setStatus(
                "Starting voice conversation..."
            );


            await this._session
                .voiceChat
                .start();


            /*
             * Session is fully active.
             */

            this._learnerSessionActive =
                true;


            sessionButton.disabled =
                false;


            sessionButton.textContent =
                "End Session";


            sessionButton.classList.add(
                "session-active"
            );


            this.setDebug(
                "NEXIVRA AUDIO + VISUAL ACTIVE"
            );


            this.setStatus(
                "Session active. NEXIVRA can hear and visually observe your practice."
            );


            console.log(
                "NEXIVRA learner session started."
            );

        } catch (error) {

            console.error(
                "NEXIVRA LEARNER SESSION ERROR:",
                error
            );


            sessionButton.disabled =
                false;


            /*
             * Clean up partial camera connection
             * if something failed.
             */

            this.stopCameraOnly();


            this.setStatus(
                "SESSION START ERROR: " +
                (
                    error?.message ||
                    String(error)
                )
            );
        }
    }


    async endLearnerSession() {

        const sessionButton =
            this.shadowRoot.getElementById(
                "sessionButton"
            );


        sessionButton.disabled =
            true;


        /*
         * Before shutting down the visual layer,
         * create the final observation summary.
         *
         * For now we log it.
         * Next step: automatically connect this
         * to role-play feedback.
         */

        if (
            this._visualAnalysisRunning
        ) {

            const finalSummary =
                this.buildVisualSummary();


            console.log(
                "NEXIVRA FINAL VISUAL SUMMARY:",
                finalSummary
            );
        }


        /*
         * Stop local visual analysis + camera.
         */

        this.stopVisualAnalysis();

        this.stopCameraOnly();


        /*
         * Stop voice chat if SDK supports stop().
         */

        try {

            if (
                this._session &&
                this._session.voiceChat &&
                typeof this._session
                    .voiceChat
                    .stop === "function"
            ) {

                await this._session
                    .voiceChat
                    .stop();

            }

        } catch (error) {

            console.warn(
                "NEXIVRA voice stop warning:",
                error
            );
        }


        this._learnerSessionActive =
            false;


        sessionButton.disabled =
            false;


        sessionButton.textContent =
            "Start Session";


        sessionButton.classList.remove(
            "session-active"
        );


        this.setStatus(
            "Practice session ended."
        );


        this.setDebug(
            "NEXIVRA SESSION READY"
        );


        console.log(
            "NEXIVRA learner session ended."
        );
    }


    stopCameraOnly() {

        const learnerVideo =
            this.shadowRoot.getElementById(
                "learnerVideo"
            );

        const learnerPreview =
            this.shadowRoot.getElementById(
                "learnerPreview"
            );

        const visualPanel =
            this.shadowRoot.getElementById(
                "visualPanel"
            );


        if (
            this._cameraStream
        ) {

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


        if (learnerVideo) {

            learnerVideo.srcObject =
                null;

        }


        if (learnerPreview) {

            learnerPreview
                .classList
                .remove(
                    "active"
                );

        }


        if (visualPanel) {

            visualPanel
                .classList
                .remove(
                    "active"
                );

        }
    }


    /*
     * =====================================================
     * TEXT CHAT
     * =====================================================
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
                "Please wait for NEXIVRA to connect."
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


            input.value =
                "";


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
     * =====================================================
     * MEDIAPIPE VISUAL ANALYSIS
     * =====================================================
     */

    async initializeVisualAnalysis() {

        if (
            this._faceLandmarker &&
            this._poseLandmarker
        ) {

            return;

        }


        this.setStatus(
            "Loading visual coaching engine..."
        );


        this._visionFileset =
            await FilesetResolver
                .forVisionTasks(

                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"

                );


        this._faceLandmarker =
            await FaceLandmarker
                .createFromOptions(

                    this._visionFileset,

                    {

                        baseOptions: {

                            modelAssetPath:
                                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"

                        },

                        runningMode:
                            "VIDEO",

                        numFaces:
                            1,

                        outputFaceBlendshapes:
                            false,

                        outputFacialTransformationMatrixes:
                            false
                    }
                );


        this._poseLandmarker =
            await PoseLandmarker
                .createFromOptions(

                    this._visionFileset,

                    {

                        baseOptions: {

                            modelAssetPath:
                                "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"

                        },

                        runningMode:
                            "VIDEO",

                        numPoses:
                            1,

                        outputSegmentationMasks:
                            false
                    }
                );
    }


    startVisualAnalysis() {

        if (
            this._visualAnalysisRunning
        ) {

            return;

        }


        this._visualMetrics =
            this.createEmptyVisualMetrics();


        this._visualAnalysisRunning =
            true;


        this.updateMetric(
            "analysisStatus",
            "Active"
        );


        this._visualAnalysisTimer =
            setInterval(
                () => {

                    this.analyzeLearnerFrame();

                },
                500
            );
    }


    stopVisualAnalysis() {

        this._visualAnalysisRunning =
            false;


        if (
            this._visualAnalysisTimer
        ) {

            clearInterval(
                this._visualAnalysisTimer
            );


            this._visualAnalysisTimer =
                null;
        }


        this.updateMetric(
            "analysisStatus",
            "Off"
        );
    }


    createEmptyVisualMetrics() {

        return {

            samples: 0,

            faceDetectedSamples: 0,

            poseDetectedSamples: 0,

            facingForwardSamples: 0,

            inFrameSamples: 0,

            lookAwayEvents: 0,

            previousFacingForward:
                true,

            faceDetected:
                false,

            poseDetected:
                false,

            headOrientation:
                "Unknown",

            posture:
                "Unknown"
        };
    }


    analyzeLearnerFrame() {

        if (
            !this._visualAnalysisRunning
        ) {

            return;

        }


        const video =
            this.shadowRoot.getElementById(
                "learnerVideo"
            );


        if (
            !video ||
            video.readyState < 2
        ) {

            return;

        }


        const timestamp =
            performance.now();


        try {

            const faceResult =
                this._faceLandmarker
                    .detectForVideo(
                        video,
                        timestamp
                    );


            const poseResult =
                this._poseLandmarker
                    .detectForVideo(
                        video,
                        timestamp
                    );


            this.processVisualResults(
                faceResult,
                poseResult
            );


        } catch (error) {

            console.warn(
                "NEXIVRA VISUAL FRAME ERROR:",
                error
            );
        }
    }


    processVisualResults(
        faceResult,
        poseResult
    ) {

        const metrics =
            this._visualMetrics;


        metrics.samples++;


        /*
         * FACE
         */

        const faceLandmarks =
            faceResult?.faceLandmarks?.[0];


        const faceDetected =
            Boolean(
                faceLandmarks &&
                faceLandmarks.length
            );


        metrics.faceDetected =
            faceDetected;


        if (faceDetected) {

            metrics.faceDetectedSamples++;


            const faceData =
                this.evaluateFace(
                    faceLandmarks
                );


            metrics.headOrientation =
                faceData.orientation;


            if (
                faceData.facingForward
            ) {

                metrics.facingForwardSamples++;

            }


            if (
                metrics.previousFacingForward &&
                !faceData.facingForward
            ) {

                metrics.lookAwayEvents++;

            }


            metrics.previousFacingForward =
                faceData.facingForward;


            if (
                faceData.inFrame
            ) {

                metrics.inFrameSamples++;

            }

        } else {

            metrics.headOrientation =
                "No face";


            metrics.previousFacingForward =
                false;
        }


        /*
         * POSE
         */

        const poseLandmarks =
            poseResult?.landmarks?.[0];


        const poseDetected =
            Boolean(
                poseLandmarks &&
                poseLandmarks.length
            );


        metrics.poseDetected =
            poseDetected;


        if (poseDetected) {

            metrics.poseDetectedSamples++;


            metrics.posture =
                this.evaluatePosture(
                    poseLandmarks
                );

        } else {

            metrics.posture =
                "Not detected";

        }


        this.updateVisualPanel();
    }


    evaluateFace(
        landmarks
    ) {

        const nose =
            landmarks[1];

        const eyeA =
            landmarks[33];

        const eyeB =
            landmarks[263];


        if (
            !nose ||
            !eyeA ||
            !eyeB
        ) {

            return {

                orientation:
                    "Unknown",

                facingForward:
                    false,

                inFrame:
                    false
            };
        }


        const eyeCenterX =
            (
                eyeA.x +
                eyeB.x
            ) / 2;


        const eyeCenterY =
            (
                eyeA.y +
                eyeB.y
            ) / 2;


        const horizontalOffset =
            nose.x -
            eyeCenterX;


        const verticalOffset =
            nose.y -
            eyeCenterY;


        let orientation =
            "Forward";


        if (
            horizontalOffset > 0.035
        ) {

            orientation =
                "Right";

        } else if (
            horizontalOffset < -0.035
        ) {

            orientation =
                "Left";

        } else if (
            verticalOffset < 0.035
        ) {

            orientation =
                "Up";

        } else if (
            verticalOffset > 0.12
        ) {

            orientation =
                "Down";

        }


        const facingForward =
            orientation ===
            "Forward";


        const inFrame =
            nose.x > 0.08 &&
            nose.x < 0.92 &&
            nose.y > 0.08 &&
            nose.y < 0.92;


        return {

            orientation,

            facingForward,

            inFrame
        };
    }


    evaluatePosture(
        landmarks
    ) {

        const leftShoulder =
            landmarks[11];

        const rightShoulder =
            landmarks[12];


        if (
            !leftShoulder ||
            !rightShoulder
        ) {

            return "Unknown";

        }


        const shoulderDifference =
            Math.abs(
                leftShoulder.y -
                rightShoulder.y
            );


        if (
            shoulderDifference < 0.045
        ) {

            return "Mostly level";

        }


        return "Leaning";
    }


    updateVisualPanel() {

        const metrics =
            this._visualMetrics;


        const sampleCount =
            Math.max(
                metrics.samples,
                1
            );


        const facingPercent =
            Math.round(
                (
                    metrics.facingForwardSamples /
                    sampleCount
                ) *
                100
            );


        const inFramePercent =
            Math.round(
                (
                    metrics.inFrameSamples /
                    sampleCount
                ) *
                100
            );


        this.updateMetric(
            "faceDetected",
            metrics.faceDetected
                ? "Yes"
                : "No"
        );


        this.updateMetric(
            "poseDetected",
            metrics.poseDetected
                ? "Yes"
                : "No"
        );


        this.updateMetric(
            "headOrientation",
            metrics.headOrientation
        );


        this.updateMetric(
            "posture",
            metrics.posture
        );


        this.updateMetric(
            "facingForward",
            facingPercent + "%"
        );


        this.updateMetric(
            "inFrame",
            inFramePercent + "%"
        );


        this.updateMetric(
            "lookAwayEvents",
            String(
                metrics.lookAwayEvents
            )
        );
    }


    updateMetric(
        elementId,
        value
    ) {

        const element =
            this.shadowRoot
                .getElementById(
                    elementId
                );


        if (element) {

            element.textContent =
                value;

        }
    }


    /*
     * =====================================================
     * VISUAL COACHING SUMMARY
     * =====================================================
     */

    buildVisualSummary() {

        const metrics =
            this._visualMetrics;


        const sampleCount =
            Math.max(
                metrics.samples,
                1
            );


        const faceDetectedPercent =
            Math.round(
                (
                    metrics.faceDetectedSamples /
                    sampleCount
                ) *
                100
            );


        const poseDetectedPercent =
            Math.round(
                (
                    metrics.poseDetectedSamples /
                    sampleCount
                ) *
                100
            );


        const facingPercent =
            Math.round(
                (
                    metrics.facingForwardSamples /
                    sampleCount
                ) *
                100
            );


        const inFramePercent =
            Math.round(
                (
                    metrics.inFrameSamples /
                    sampleCount
                ) *
                100
            );


        return `
SYSTEM COACHING CONTEXT:

Observable visual data from the learner's practice session:

- Face was detected in approximately ${faceDetectedPercent}% of samples.
- Upper-body pose was detected in approximately ${poseDetectedPercent}% of samples.
- Learner remained within the central camera frame in approximately ${inFramePercent}% of samples.
- Learner was approximately forward-facing in ${facingPercent}% of samples.
- ${metrics.lookAwayEvents} transition(s) away from forward-facing orientation were observed.
- Final visible head orientation: ${metrics.headOrientation}.
- Final visible upper-body alignment: ${metrics.posture}.

COACHING RULES:

Use these observations only when relevant.

Describe observable behavior only.

Do not infer emotion, confidence, honesty, deception, personality, intent, motivation, disability, medical condition, psychological state, or attentiveness.

Do not treat looking away as inherently negative.

Do not use these technical percentages as a hospitality score.

When relevant, explain how an observable behavior could be experienced by another person during the interaction.

Do not announce the raw percentages unless the learner specifically asks for them.
        `.trim();
    }


    /*
     * =====================================================
     * CLEANUP
     * =====================================================
     */

    disconnectedCallback() {

        if (
            this._attachTimer
        ) {

            clearInterval(
                this._attachTimer
            );


            this._attachTimer =
                null;
        }


        this.stopVisualAnalysis();


        this.stopCameraOnly();


        if (
            this._faceLandmarker
        ) {

            try {

                this._faceLandmarker
                    .close();

            } catch (error) {

                console.warn(
                    error
                );

            }


            this._faceLandmarker =
                null;
        }


        if (
            this._poseLandmarker
        ) {

            try {

                this._poseLandmarker
                    .close();

            } catch (error) {

                console.warn(
                    error
                );

            }


            this._poseLandmarker =
                null;
        }


        if (
            this._session
        ) {

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
 * Register component once.
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
