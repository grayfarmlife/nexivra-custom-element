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
        this._started = false;
        this._attachTimer = null;

        /*
         * Learner camera
         */

        this._cameraStream = null;
        this._cameraEnabled = false;

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

        this._visualMetrics = {
            samples: 0,
            faceDetectedSamples: 0,
            poseDetectedSamples: 0,
            facingForwardSamples: 0,
            inFrameSamples: 0,
            lookAwayEvents: 0,

            previousFacingForward: true,

            faceDetected: false,
            poseDetected: false,
            headOrientation: "Unknown",
            posture: "Unknown"
        };
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

            this._sessionToken =
                newValue;

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


                #avatarVideo {
                    width: 100%;
                    height: 100%;
                    min-height: 500px;
                    object-fit: contain;
                    background: #111;
                    display: block;
                }


                .learner-preview {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    width: 190px;
                    height: 140px;
                    border-radius: 10px;
                    overflow: hidden;
                    background: #222;
                    border: 2px solid rgba(255,255,255,.8);
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
                    z-index: 70;
                    flex-wrap: wrap;
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

                #cameraButton.camera-active {
                    background: #222;
                    color: white;
                    border: 1px solid white;
                }

                #visualSummaryButton {
                    background: #e8e8e8;
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

                <video
                    id="avatarVideo"
                    autoplay
                    playsinline>
                </video>


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
                    class="visual-panel"
                    id="visualPanel">

                    <div class="visual-title">
                        Visual Coaching Data
                    </div>

                    <div class="metric">
                        <span>Analysis:</span>
                        <span class="metric-value" id="analysisStatus">
                            Off
                        </span>
                    </div>

                    <div class="metric">
                        <span>Face detected:</span>
                        <span class="metric-value" id="faceDetected">
                            No
                        </span>
                    </div>

                    <div class="metric">
                        <span>Pose detected:</span>
                        <span class="metric-value" id="poseDetected">
                            No
                        </span>
                    </div>

                    <div class="metric">
                        <span>Head:</span>
                        <span class="metric-value" id="headOrientation">
                            Unknown
                        </span>
                    </div>

                    <div class="metric">
                        <span>Posture:</span>
                        <span class="metric-value" id="posture">
                            Unknown
                        </span>
                    </div>

                    <div class="metric">
                        <span>Facing forward:</span>
                        <span class="metric-value" id="facingForward">
                            0%
                        </span>
                    </div>

                    <div class="metric">
                        <span>In frame:</span>
                        <span class="metric-value" id="inFrame">
                            0%
                        </span>
                    </div>

                    <div class="metric">
                        <span>Look-away events:</span>
                        <span class="metric-value" id="lookAwayEvents">
                            0
                        </span>
                    </div>

                </div>


                <div class="debug" id="debug">
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

                    <button id="cameraButton">
                        Enable Camera
                    </button>

                    <button id="visualSummaryButton">
                        Send Visual Summary
                    </button>

                </div>


                <div class="status" id="status">
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

        const visualSummaryButton =
            this.shadowRoot.getElementById(
                "visualSummaryButton"
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


        visualSummaryButton.addEventListener(
            "click",
            () => this.sendVisualSummary()
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

                        this._attachTimer =
                            null;


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
     * VOICE CHAT
     * =====================================================
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

            voiceButton.disabled =
                true;


            this.setStatus(
                "Requesting microphone..."
            );


            const permissionStream =
                await navigator.mediaDevices
                    .getUserMedia({
                        audio: true
                    });


            permissionStream
                .getTracks()
                .forEach(
                    (track) =>
                        track.stop()
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


            voiceButton.disabled =
                false;


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
     * =====================================================
     * CAMERA
     * =====================================================
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

        const visualPanel =
            this.shadowRoot.getElementById(
                "visualPanel"
            );


        try {

            cameraButton.disabled =
                true;


            this.setStatus(
                "Requesting camera access..."
            );


            const stream =
                await navigator.mediaDevices
                    .getUserMedia({

                        video: {

                            facingMode:
                                "user",

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


            visualPanel.classList.add(
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
                "Camera is active. Starting visual analysis..."
            );


            await this.initializeVisualAnalysis();


            this.startVisualAnalysis();


            this.setDebug(
                "NEXIVRA VISUAL COACHING ACTIVE"
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

        this.stopVisualAnalysis();


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

        const visualPanel =
            this.shadowRoot.getElementById(
                "visualPanel"
            );


        if (this._cameraStream) {

            this._cameraStream
                .getTracks()
                .forEach(
                    (track) =>
                        track.stop()
                );


            this._cameraStream =
                null;
        }


        learnerVideo.srcObject =
            null;


        learnerPreview
            .classList
            .remove(
                "active"
            );


        visualPanel
            .classList
            .remove(
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


        try {

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


            this.setStatus(
                "Visual coaching engine ready."
            );


        } catch (error) {

            console.error(
                "NEXIVRA VISUAL ENGINE ERROR:",
                error
            );


            throw new Error(
                "Visual analysis could not start: " +
                (
                    error?.message ||
                    String(error)
                )
            );
        }
    }


    startVisualAnalysis() {

        if (
            this._visualAnalysisRunning
        ) {

            return;

        }


        this.resetVisualMetrics();


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


    resetVisualMetrics() {

        this._visualMetrics = {

            samples: 0,

            faceDetectedSamples: 0,

            poseDetectedSamples: 0,

            facingForwardSamples: 0,

            inFrameSamples: 0,

            lookAwayEvents: 0,

            previousFacingForward: true,

            faceDetected: false,

            poseDetected: false,

            headOrientation: "Unknown",

            posture: "Unknown"
        };
    }


    analyzeLearnerFrame() {

        if (
            !this._visualAnalysisRunning ||
            !this._cameraEnabled
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
     * VISUAL SUMMARY BRIDGE
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

Observable visual data from the learner's current practice session:

- Face detected in approximately ${faceDetectedPercent}% of visual samples.
- Upper-body pose detected in approximately ${poseDetectedPercent}% of visual samples.
- Learner remained within the central camera frame in approximately ${inFramePercent}% of samples.
- Learner was approximately forward-facing in ${facingPercent}% of samples.
- ${metrics.lookAwayEvents} transition(s) away from a forward-facing head orientation were observed.
- Current visible head orientation: ${metrics.headOrientation}.
- Current visible upper-body alignment: ${metrics.posture}.

VISUAL COACHING RULES:

Use this information only when it is relevant to the learner's communication practice.

Describe observable behavior only.

Do not infer or claim emotion, confidence, honesty, deception, personality, intent, motivation, disability, psychological state, medical condition, or attentiveness from camera data.

Do not treat looking away as inherently negative.

Do not treat any single visual metric as a score of hospitality or communication ability.

If visual behavior is relevant, explain how it could be experienced by another person in the specific interaction.

Use phrases such as:
- "I noticed..."
- "During that part of the interaction..."
- "That could come across as..."
- "One thing you could experiment with..."

Avoid absolute statements about what the learner was feeling or intending.

Do not announce these technical percentages unless the learner specifically asks for the measurements.

Use the observations naturally as coaching context.
        `.trim();
    }


    async sendVisualSummary() {

        if (!this._session) {

            this.setStatus(
                "Please wait for the coach to connect."
            );

            return;
        }


        if (
            !this._cameraEnabled ||
            !this._visualAnalysisRunning
        ) {

            this.setStatus(
                "Enable the camera before sending visual coaching data."
            );

            return;
        }


        try {

            const summary =
                this.buildVisualSummary();


            console.log(
                "NEXIVRA VISUAL SUMMARY:",
                summary
            );


            this.setStatus(
                "Sending visual coaching observations to NEXIVRA..."
            );


            this._session.message(
                summary
            );


            this.setStatus(
                "Visual coaching observations sent."
            );


        } catch (error) {

            console.error(
                "NEXIVRA VISUAL SUMMARY ERROR:",
                error
            );


            this.setStatus(
                "VISUAL SUMMARY ERROR: " +
                (
                    error?.message ||
                    String(error)
                )
            );
        }
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


        if (
            this._cameraStream
        ) {

            this._cameraStream
                .getTracks()
                .forEach(
                    (track) =>
                        track.stop()
                );


            this._cameraStream =
                null;
        }


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
