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
         * =================================================
         * LIVEAVATAR
         * =================================================
         */

        this._session = null;
        this._sessionToken = null;
        this._avatarStarted = false;
        this._attachTimer = null;


        /*
         * =================================================
         * LEARNER SESSION
         * =================================================
         */

        this._learnerSessionActive = false;
        this._endingSession = false;
        this._cameraStream = null;

        this._trainingState = "READY";


        /*
         * =================================================
         * MEDIAPIPE
         * =================================================
         */

        this._visionFileset = null;
        this._faceLandmarker = null;
        this._poseLandmarker = null;

        this._visualAnalysisTimer = null;
        this._visualAnalysisRunning = false;

        this._visualMetrics =
            this.createEmptyVisualMetrics();


        /*
         * =================================================
         * LIVE VISUAL EVENTS
         * =================================================
         */

        this._absenceStartedAt = null;
        this._returnStartedAt = null;

        this._turnedAwayStartedAt = null;
        this._postureIssueStartedAt = null;

        this._visualCorrectionStartedAt = null;

        this._waitingForOrientationCorrection = false;
        this._waitingForPostureCorrection = false;

        this._lastVisualCoachingAt = 0;
        this._lastPostureCoachingAt = 0;

        this._thresholds = {
            absent: 3000,
            returned: 2000,

            turnedAway: 6000,
            posture: 8000,

            orientationCorrection: 2000,
            postureCorrection: 3000,

            visualCooldown: 30000,
            postureCooldown: 30000
        };


        /*
         * =================================================
         * AUDIO / INTERRUPTION DETECTION
         * =================================================
         */

        this._learnerAudioContext = null;
        this._learnerMicSource = null;
        this._learnerAnalyser = null;
        this._learnerAudioTimer = null;

        this._avatarAudioContext = null;
        this._avatarAudioSource = null;
        this._avatarAnalyser = null;
        this._avatarAudioTimer = null;

        this._learnerSpeaking = false;
        this._avatarSpeaking = false;

        this._overlapStartedAt = null;
        this._interruptionEvents = [];
        this._lastInterruptionCoachingAt = 0;

        this._interruptionThresholds = {
            learnerSpeechRms: 0.045,
            avatarSpeechRms: 0.018,

            minimumOverlap: 900,
            rollingWindow: 30000,
            eventsBeforeCoaching: 2,
            coachingCooldown: 45000
        };
    }


    /*
     * =====================================================
     * CUSTOM ELEMENT
     * =====================================================
     */

    connectedCallback() {
        this.render();
        this.bindControls();

        this._sessionToken =
            this.getAttribute("session-token");

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

                    border: 2px solid rgba(255,255,255,.85);

                    box-shadow:
                        0 4px 14px rgba(0,0,0,.35);

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

                .session-indicator {
                    position: absolute;

                    top: 16px;
                    left: 16px;

                    display: none;
                    align-items: center;

                    gap: 7px;

                    padding: 7px 10px;

                    border-radius: 999px;

                    background: rgba(0,0,0,.72);

                    color: white;

                    font-size: 12px;

                    z-index: 65;
                }

                .session-indicator.active {
                    display: flex;
                }

                .indicator-dot {
                    width: 8px;
                    height: 8px;

                    border-radius: 50%;

                    background: white;
                }

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
                    class="session-indicator"
                    id="sessionIndicator">

                    <div class="indicator-dot">
                    </div>

                    <span id="sessionIndicatorText">
                        Session Active
                    </span>

                </div>


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
                    Connecting to NEXIVRA...
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


    setTrainingState(state) {

        this._trainingState =
            state;


        console.log(
            "NEXIVRA TRAINING STATE:",
            state
        );


        const indicator =
            this.shadowRoot.getElementById(
                "sessionIndicator"
            );

        const indicatorText =
            this.shadowRoot.getElementById(
                "sessionIndicatorText"
            );


        if (
            !indicator ||
            !indicatorText
        ) {
            return;
        }


        if (state === "READY") {

            indicator.classList.remove(
                "active"
            );

            return;
        }


        indicator.classList.add(
            "active"
        );


        const labels = {

            ACTIVE:
                "Session Active",

            PAUSED_ABSENT:
                "Session Paused",

            COACHING_VISUAL:
                "Visual Coaching",

            COACHING_INTERRUPTION:
                "Listening Coaching",

            WAITING_FOR_CORRECTION:
                "Practice Adjustment",

            ENDING:
                "Reviewing Practice"
        };


        indicatorText.textContent =
            labels[state] ||
            "Session Active";
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


        try {

            this.setStatus(
                "Starting AI Hospitality Coach..."
            );


            this._session =
                new LiveAvatarSession(
                    this._sessionToken,
                    {
                        voiceChat: false
                    }
                );


            await this._session.start();


            this.waitForVideo();


        } catch (error) {

            this._avatarStarted =
                false;


            console.error(
                "NEXIVRA SESSION ERROR:",
                error
            );


            this.setStatus(
                "Unable to start NEXIVRA: " +
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


        let attempts =
            0;


        if (this._attachTimer) {

            clearInterval(
                this._attachTimer
            );
        }


        this._attachTimer =
            setInterval(
                () => {

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


                            this.setStatus(
                                "NEXIVRA is ready. Click Start Session."
                            );


                            video.play()
                                .catch(
                                    () => {}
                                );


                            /*
                             * Monitor NEXIVRA's own audio
                             * so we know when the trainer
                             * is actually speaking.
                             */

                            this.startAvatarAudioMonitor(
                                video.srcObject
                            );
                        }

                    } catch (error) {

                        console.log(
                            "Waiting for NEXIVRA video..."
                        );

                    }


                    if (
                        attempts >= 60
                    ) {

                        clearInterval(
                            this._attachTimer
                        );


                        this._attachTimer =
                            null;


                        this.setStatus(
                            "Avatar stream timed out."
                        );
                    }

                },
                500
            );
    }


    /*
     * =====================================================
     * ONE-CLICK SESSION
     * =====================================================
     */

    async toggleLearnerSession() {

        if (this._endingSession) {
            return;
        }


        if (this._learnerSessionActive) {

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


        if (!this._session) {

            this.setStatus(
                "Please wait for NEXIVRA to connect."
            );

            return;
        }


        try {

            sessionButton.disabled =
                true;


            this.setStatus(
                "Connecting microphone and camera..."
            );


            const mediaStream =
                await navigator.mediaDevices
                    .getUserMedia({

                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        },

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


            this._cameraStream =
                mediaStream;


            learnerVideo.srcObject =
                mediaStream;


            await learnerVideo.play();


            learnerPreview.classList.add(
                "active"
            );


            /*
             * Start learner microphone activity
             * monitoring before LiveAvatar opens
             * its own microphone connection.
             */

            await this.startLearnerAudioMonitor(
                mediaStream
            );


            /*
             * Start visual engine.
             */

            this.setStatus(
                "Starting live coaching awareness..."
            );


            await this.initializeVisualAnalysis();


            this.startVisualAnalysis();


            /*
             * Start LiveAvatar voice.
             */

            this.setStatus(
                "Starting voice conversation..."
            );


            await this._session
                .voiceChat
                .start();


            this._learnerSessionActive =
                true;


            this.resetLiveEventTracking();


            this.setTrainingState(
                "ACTIVE"
            );


            sessionButton.disabled =
                false;


            sessionButton.textContent =
                "End Session";


            sessionButton.classList.add(
                "session-active"
            );


            this.setStatus(
                "Session active."
            );


        } catch (error) {

            console.error(
                "NEXIVRA SESSION START ERROR:",
                error
            );


            sessionButton.disabled =
                false;


            this.stopVisualAnalysis();

            this.stopLearnerAudioMonitor();

            this.stopCameraOnly();


            this.setTrainingState(
                "READY"
            );


            this.setStatus(
                "SESSION START ERROR: " +
                (
                    error?.message ||
                    String(error)
                )
            );
        }
    }


    resetLiveEventTracking() {

        this._absenceStartedAt =
            null;

        this._returnStartedAt =
            null;

        this._turnedAwayStartedAt =
            null;

        this._postureIssueStartedAt =
            null;

        this._visualCorrectionStartedAt =
            null;

        this._waitingForOrientationCorrection =
            false;

        this._waitingForPostureCorrection =
            false;

        this._interruptionEvents =
            [];

        this._overlapStartedAt =
            null;
    }


    /*
     * =====================================================
     * MEDIAPIPE
     * =====================================================
     */

    async initializeVisualAnalysis() {

        if (
            this._faceLandmarker &&
            this._poseLandmarker
        ) {
            return;
        }


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

        if (this._visualAnalysisRunning) {
            return;
        }


        this._visualMetrics =
            this.createEmptyVisualMetrics();


        this._visualAnalysisRunning =
            true;


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


        if (this._visualAnalysisTimer) {

            clearInterval(
                this._visualAnalysisTimer
            );


            this._visualAnalysisTimer =
                null;
        }
    }


    createEmptyVisualMetrics() {

        return {

            samples:
                0,

            faceDetectedSamples:
                0,

            poseDetectedSamples:
                0,

            facingForwardSamples:
                0,

            inFrameSamples:
                0,

            lookAwayEvents:
                0,

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
            !this._visualAnalysisRunning ||
            !this._learnerSessionActive
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
         * -------------------------
         * FACE
         * -------------------------
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


        let faceData = {

            orientation:
                "No face detected",

            facingForward:
                false,

            inFrame:
                false
        };


        if (faceDetected) {

            metrics.faceDetectedSamples++;


            faceData =
                this.evaluateFace(
                    faceLandmarks
                );


            metrics.headOrientation =
                faceData.orientation;


            if (faceData.facingForward) {

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


            if (faceData.inFrame) {

                metrics.inFrameSamples++;

            }

        } else {

            metrics.headOrientation =
                "No face detected";


            metrics.previousFacingForward =
                false;
        }


        /*
         * -------------------------
         * POSE
         * -------------------------
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


        let postureData = {

            label:
                "Not detected",

            needsCoaching:
                false
        };


        if (poseDetected) {

            metrics.poseDetectedSamples++;


            postureData =
                this.evaluatePosture(
                    poseLandmarks
                );


            metrics.posture =
                postureData.label;

        } else {

            metrics.posture =
                "Not detected";
        }


        this.evaluateLiveVisualEvents(
            {
                faceDetected,
                poseDetected,
                faceData,
                postureData
            }
        );
    }


    evaluateFace(landmarks) {

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


        return {

            orientation,

            facingForward:
                orientation === "Forward",

            inFrame:
                (
                    nose.x > 0.08 &&
                    nose.x < 0.92 &&
                    nose.y > 0.08 &&
                    nose.y < 0.92
                )
        };
    }


    evaluatePosture(landmarks) {

        const leftShoulder =
            landmarks[11];

        const rightShoulder =
            landmarks[12];

        const leftHip =
            landmarks[23];

        const rightHip =
            landmarks[24];


        if (
            !leftShoulder ||
            !rightShoulder
        ) {

            return {

                label:
                    "Unknown",

                needsCoaching:
                    false
            };
        }


        const shoulderTilt =
            Math.abs(
                leftShoulder.y -
                rightShoulder.y
            );


        if (
            shoulderTilt > 0.075
        ) {

            return {

                label:
                    "Noticeable lean",

                needsCoaching:
                    true
            };
        }


        if (
            leftHip &&
            rightHip
        ) {

            const shoulderCenterY =
                (
                    leftShoulder.y +
                    rightShoulder.y
                ) / 2;


            const hipCenterY =
                (
                    leftHip.y +
                    rightHip.y
                ) / 2;


            const torsoHeight =
                Math.abs(
                    hipCenterY -
                    shoulderCenterY
                );


            if (
                torsoHeight < 0.18
            ) {

                return {

                    label:
                        "Compressed upper-body posture",

                    needsCoaching:
                        true
                };
            }
        }


        return {

            label:
                "Open / mostly level",

            needsCoaching:
                false
        };
    }


    /*
     * =====================================================
     * LIVE VISUAL EVENT ENGINE
     * =====================================================
     */

    evaluateLiveVisualEvents(
        observation
    ) {

        if (
            !this._learnerSessionActive ||
            this._endingSession
        ) {
            return;
        }


        const now =
            Date.now();


        const learnerVisible =
            (
                observation.faceDetected ||
                observation.poseDetected
            );


        /*
         * -------------------------
         * ABSENT
         * -------------------------
         */

        if (!learnerVisible) {

            this._returnStartedAt =
                null;


            if (!this._absenceStartedAt) {

                this._absenceStartedAt =
                    now;
            }


            if (
                this._trainingState !==
                    "PAUSED_ABSENT" &&
                (
                    now -
                    this._absenceStartedAt
                ) >=
                    this._thresholds.absent
            ) {

async handleLearnerAbsent() {

    if (
        this._trainingState ===
        "PAUSED_ABSENT"
    ) {
        return;
    }


    this.setTrainingState(
        "PAUSED_ABSENT"
    );


    this.setStatus(
        "Training paused while you are away."
    );


    await this.speakLiveCoach(
        "It looks like you've stepped away. I'll pause here and wait for you to come back.",
        {
            resumeListening: false
        }
    );
}
            }


            return;
        }


        this._absenceStartedAt =
            null;


        /*
         * -------------------------
         * RETURNED
         * -------------------------
         */

        if (
            this._trainingState ===
            "PAUSED_ABSENT"
        ) {

            if (!this._returnStartedAt) {

                this._returnStartedAt =
                    now;
            }


            if (
                (
                    now -
                    this._returnStartedAt
                ) >=
                    this._thresholds.returned
            ) {

                this.handleLearnerReturned();
            }


            return;
        }


        this._returnStartedAt =
            null;


        /*
         * -------------------------
         * ORIENTATION CORRECTION
         * -------------------------
         */

        if (
            this._waitingForOrientationCorrection
        ) {

            if (
                observation.faceData
                    .facingForward
            ) {

                if (
                    !this._visualCorrectionStartedAt
                ) {

                    this._visualCorrectionStartedAt =
                        now;
                }


                if (
                    (
                        now -
                        this._visualCorrectionStartedAt
                    ) >=
                    this._thresholds
                        .orientationCorrection
                ) {

                    this.handleOrientationCorrected();
                }

            } else {

                this._visualCorrectionStartedAt =
                    null;
            }


            return;
        }


        /*
         * -------------------------
         * POSTURE CORRECTION
         * -------------------------
         */

        if (
            this._waitingForPostureCorrection
        ) {

            if (
                !observation.postureData
                    .needsCoaching
            ) {

                if (
                    !this._visualCorrectionStartedAt
                ) {

                    this._visualCorrectionStartedAt =
                        now;
                }


                if (
                    (
                        now -
                        this._visualCorrectionStartedAt
                    ) >=
                    this._thresholds
                        .postureCorrection
                ) {

                    this.handlePostureCorrected();
                }

            } else {

                this._visualCorrectionStartedAt =
                    null;
            }


            return;
        }


        if (
            this._trainingState !==
            "ACTIVE"
        ) {
            return;
        }


        /*
         * -------------------------
         * TURNED AWAY
         * -------------------------
         */

        if (
            observation.faceDetected &&
            !observation.faceData
                .facingForward
        ) {

            if (!this._turnedAwayStartedAt) {

                this._turnedAwayStartedAt =
                    now;
            }


            const cooldownComplete =
                (
                    now -
                    this._lastVisualCoachingAt
                ) >=
                    this._thresholds
                        .visualCooldown;


            if (
                cooldownComplete &&
                (
                    now -
                    this._turnedAwayStartedAt
                ) >=
                    this._thresholds
                        .turnedAway
            ) {

async handleSustainedOrientationAway(
    orientation
) {

    this._lastVisualCoachingAt =
        Date.now();


    this._turnedAwayStartedAt =
        null;


    this._waitingForOrientationCorrection =
        true;


    this._visualCorrectionStartedAt =
        null;


    this.setTrainingState(
        "WAITING_FOR_CORRECTION"
    );


    this.setStatus(
        "NEXIVRA is coaching visual presence."
    );


    await this.speakLiveCoach(
        "I'm going to pause us for a moment. I've noticed you've been turned away from our interaction for a little while. In face-to-face hospitality, appropriate eye contact and visual engagement can help another person feel heard and respected. You don't need to stare at someone constantly, but try turning back toward the interaction and staying visually present.",
        {
            resumeListening: true
        }
    );
}
                    observation.faceData
                        .orientation
                );
            }

        } else {

            this._turnedAwayStartedAt =
                null;
        }


        /*
         * -------------------------
         * POSTURE
         * -------------------------
         */

        if (
            observation.poseDetected &&
            observation.postureData
                .needsCoaching
        ) {

            if (
                !this._postureIssueStartedAt
            ) {

                this._postureIssueStartedAt =
                    now;
            }


            const cooldownComplete =
                (
                    now -
                    this._lastPostureCoachingAt
                ) >=
                    this._thresholds
                        .postureCooldown;


            if (
                cooldownComplete &&
                (
                    now -
                    this._postureIssueStartedAt
                ) >=
                    this._thresholds.posture
            ) {

                this.handlePostureConcern(
                    observation.postureData
                        .label
                );
            }

        } else {

            this._postureIssueStartedAt =
                null;
        }
    }


    /*
     * =====================================================
     * LIVE VISUAL COACHING
     * =====================================================
     */

    async handleLearnerAbsent() {

        if (
            this._trainingState ===
            "PAUSED_ABSENT"
        ) {
            return;
        }


        this.setTrainingState(
            "PAUSED_ABSENT"
        );


        this.setStatus(
            "Training paused while you are away."
        );


        try {

            if (
                typeof this._session
                    ?.interrupt ===
                "function"
            ) {

                await this._session
                    .interrupt();
            }

        } catch (error) {

            console.warn(
                "NEXIVRA INTERRUPT WARNING:",
                error
            );
        }


        this.sendLiveCoachInstruction(`
LIVE TRAINING EVENT:

The learner has not been visibly present for several seconds.

Pause the current training interaction.

Briefly tell the learner that you will wait for them to return.

Do not continue teaching, questioning, role-play, evaluation, or scenario progression until a LEARNER RETURNED event is received.

Do not speculate about why the learner stepped away.
        `);
    }

async handleLearnerReturned() {

    if (
        this._trainingState !==
        "PAUSED_ABSENT"
    ) {
        return;
    }


    this._returnStartedAt =
        null;


    this.setTrainingState(
        "ACTIVE"
    );


    this.setStatus(
        "Session active."
    );


    await this.speakLiveCoach(
        "Welcome back. Let's pick up where we left off.",
        {
            resumeListening: true
        }
    );
}

        if (
            this._trainingState !==
            "PAUSED_ABSENT"
        ) {
            return;
        }


        this._returnStartedAt =
            null;


        this.setTrainingState(
            "ACTIVE"
        );


        this.setStatus(
            "Session active."
        );


        this.sendLiveCoachInstruction(`
LIVE TRAINING EVENT:

The learner has returned and has remained visibly present again for a stable period.

Briefly welcome them back.

Resume the training from the point where it was paused.

Do not restart the entire lesson unless necessary.
        `);
    }


    handleSustainedOrientationAway(
        orientation
    ) {

        this._lastVisualCoachingAt =
            Date.now();


        this._turnedAwayStartedAt =
            null;


        this._waitingForOrientationCorrection =
            true;


        this._visualCorrectionStartedAt =
            null;


        this.setTrainingState(
            "WAITING_FOR_CORRECTION"
        );


        this.setStatus(
            "NEXIVRA is coaching visual presence."
        );


        this.sendLiveCoachInstruction(`
LIVE VISUAL COACHING EVENT:

The learner has maintained a visible head orientation away from the interaction for a sustained period.

Current observed orientation: ${orientation}.

Pause the current training point briefly.

Teach the importance of visual engagement during face-to-face hospitality interactions.

Explain that appropriate eye contact can help another person feel heard, respected, and attended to.

Do not demand constant eye contact.

Natural conversation includes looking away.

Do not claim the learner is distracted, nervous, uninterested, dishonest, or inattentive.

Explain that sustained orientation away from someone can affect how the interaction is experienced.

Ask the learner to reorient toward the interaction.

Wait for a VISUAL CORRECTION event before continuing.
        `);
    }


async handleOrientationCorrected() {

    this._waitingForOrientationCorrection =
        false;


    this._visualCorrectionStartedAt =
        null;


    this.setTrainingState(
        "ACTIVE"
    );


    this.setStatus(
        "Session active."
    );


    await this.speakLiveCoach(
        "There you go. That's a more visually engaged presence. Let's continue.",
        {
            resumeListening: true
        }
    );
}

        this._waitingForOrientationCorrection =
            false;


        this._visualCorrectionStartedAt =
            null;


        this.setTrainingState(
            "ACTIVE"
        );


        this.setStatus(
            "Session active."
        );


        this.sendLiveCoachInstruction(`
LIVE VISUAL COACHING EVENT:

The learner has maintained a more forward-facing orientation for a stable period after visual-presence coaching.

Briefly acknowledge the adjustment positively.

Then continue the training from where it paused.

Keep the acknowledgment natural and brief.
        `);
    }


async handlePostureConcern(
    postureLabel
) {

    this._lastPostureCoachingAt =
        Date.now();


    this._postureIssueStartedAt =
        null;


    this._waitingForPostureCorrection =
        true;


    this._visualCorrectionStartedAt =
        null;


    this.setTrainingState(
        "WAITING_FOR_CORRECTION"
    );


    this.setStatus(
        "NEXIVRA is coaching physical presence."
    );


    await this.speakLiveCoach(
        "Let's pause for a second and work on physical presence. Try moving into a comfortable, more open and upright position. In hospitality, our posture can influence how engaged and approachable we appear to another person. Find a position that feels natural and professional for you.",
        {
            resumeListening: true
        }
    );
}
        postureLabel
    ) {

        this._lastPostureCoachingAt =
            Date.now();


        this._postureIssueStartedAt =
            null;


        this._waitingForPostureCorrection =
            true;


        this._visualCorrectionStartedAt =
            null;


        this.setTrainingState(
            "WAITING_FOR_CORRECTION"
        );


        this.setStatus(
            "NEXIVRA is coaching physical presence."
        );


        this.sendLiveCoachInstruction(`
LIVE VISUAL COACHING EVENT:

A sustained visible upper-body pattern has been observed that may reduce an open, engaged professional presence.

Observed pattern: ${postureLabel}.

Pause the training briefly.

Coach the learner on maintaining an open, engaged, professional posture appropriate to their abilities and circumstances.

Explain that physical presence can influence how another person experiences our communication.

Do not diagnose any medical, physical, emotional, or psychological reason.

Do not demand a rigid posture.

Invite the learner to adjust into a comfortable, more open professional position.

Wait for a POSTURE CORRECTION event before continuing.
        `);
    }


async handlePostureCorrected() {

    this._waitingForPostureCorrection =
        false;


    this._visualCorrectionStartedAt =
        null;


    this.setTrainingState(
        "ACTIVE"
    );


    this.setStatus(
        "Session active."
    );


    await this.speakLiveCoach(
        "That's better. Notice how that creates a more open presence. Let's keep going.",
        {
            resumeListening: true
        }
    );
}

        this._waitingForPostureCorrection =
            false;


        this._visualCorrectionStartedAt =
            null;


        this.setTrainingState(
            "ACTIVE"
        );


        this.setStatus(
            "Session active."
        );


        this.sendLiveCoachInstruction(`
LIVE VISUAL COACHING EVENT:

The learner has maintained a more open and level visible upper-body position for a stable period after posture coaching.

Briefly acknowledge the adjustment.

Then resume the training.
        `);
    }


async speakLiveCoach(
    text,
    {
        resumeListening = true
    } = {}
) {

    if (!this._session) {
        return;
    }

    try {

        /*
         * Stop NEXIVRA from listening while
         * she delivers the coaching intervention.
         */

        if (
            typeof this._session
                .stopListening ===
            "function"
        ) {

            this._session
                .stopListening();
        }


        /*
         * Stop anything she may currently
         * be saying.
         */

        if (
            typeof this._session
                .interrupt ===
            "function"
        ) {

            try {

                this._session
                    .interrupt();

            } catch (error) {

                console.warn(
                    "NEXIVRA INTERRUPT WARNING:",
                    error
                );
            }
        }


        /*
         * Speak exact coaching text immediately.
         */

        this._session.repeat(
            text.trim()
        );


        console.log(
            "NEXIVRA LIVE COACHING SPOKEN:",
            text.trim()
        );


        /*
         * Estimate how long the spoken message
         * will take before listening resumes.
         *
         * Roughly 155 words per minute.
         */

        const words =
            text
                .trim()
                .split(/\s+/)
                .length;


        const estimatedDuration =
            Math.max(
                2500,
                (
                    words /
                    155
                ) *
                60000 +
                750
            );


        if (resumeListening) {

            setTimeout(
                () => {

                    try {

                        if (
                            this._session &&
                            typeof this._session
                                .startListening ===
                            "function"
                        ) {

                            this._session
                                .startListening();
                        }

                    } catch (error) {

                        console.warn(
                            "NEXIVRA LISTENING RESUME WARNING:",
                            error
                        );
                    }

                },
                estimatedDuration
            );
        }


    } catch (error) {

        console.error(
            "NEXIVRA LIVE COACHING ERROR:",
            error
        );
    }
}

        if (!this._session) {
            return;
        }


        try {

            this._session.message(
                instruction.trim()
            );


            console.log(
                "NEXIVRA LIVE EVENT SENT:",
                instruction.trim()
            );


        } catch (error) {

            console.error(
                "NEXIVRA LIVE EVENT ERROR:",
                error
            );
        }
    }


    /*
     * =====================================================
     * LEARNER AUDIO MONITOR
     * =====================================================
     */

    async startLearnerAudioMonitor(
        mediaStream
    ) {

        try {

            const AudioContextClass =
                window.AudioContext ||
                window.webkitAudioContext;


            if (!AudioContextClass) {
                return;
            }


            this._learnerAudioContext =
                new AudioContextClass();


            if (
                this._learnerAudioContext
                    .state ===
                "suspended"
            ) {

                await this._learnerAudioContext
                    .resume();
            }


            this._learnerMicSource =
                this._learnerAudioContext
                    .createMediaStreamSource(
                        mediaStream
                    );


            this._learnerAnalyser =
                this._learnerAudioContext
                    .createAnalyser();


            this._learnerAnalyser.fftSize =
                1024;


            this._learnerAnalyser
                .smoothingTimeConstant =
                0.65;


            this._learnerMicSource.connect(
                this._learnerAnalyser
            );


            const samples =
                new Float32Array(
                    this._learnerAnalyser
                        .fftSize
                );


            this._learnerAudioTimer =
                setInterval(
                    () => {

                        if (
                            !this._learnerAnalyser ||
                            !this._learnerSessionActive
                        ) {
                            return;
                        }


                        this._learnerAnalyser
                            .getFloatTimeDomainData(
                                samples
                            );


                        const rms =
                            this.calculateRms(
                                samples
                            );


                        this._learnerSpeaking =
                            rms >
                            this._interruptionThresholds
                                .learnerSpeechRms;


                        this.evaluateSpeechOverlap();


                    },
                    100
                );


        } catch (error) {

            console.warn(
                "NEXIVRA LEARNER AUDIO MONITOR ERROR:",
                error
            );
        }
    }


    /*
     * =====================================================
     * AVATAR AUDIO MONITOR
     * =====================================================
     */

    async startAvatarAudioMonitor(
        avatarStream
    ) {

        try {

            if (
                this._avatarAudioContext
            ) {
                return;
            }


            const audioTracks =
                avatarStream
                    ?.getAudioTracks?.();


            if (
                !audioTracks ||
                !audioTracks.length
            ) {

                /*
                 * Sometimes audio arrives shortly
                 * after video. Retry once.
                 */

                setTimeout(
                    () => {

                        if (
                            !this._avatarAudioContext &&
                            this._session
                        ) {

                            const avatarVideo =
                                this.shadowRoot
                                    .getElementById(
                                        "avatarVideo"
                                    );


                            if (
                                avatarVideo?.srcObject
                            ) {

                                this.startAvatarAudioMonitor(
                                    avatarVideo.srcObject
                                );
                            }
                        }

                    },
                    1500
                );


                return;
            }


            const AudioContextClass =
                window.AudioContext ||
                window.webkitAudioContext;


            if (!AudioContextClass) {
                return;
            }


            this._avatarAudioContext =
                new AudioContextClass();


            this._avatarAudioSource =
                this._avatarAudioContext
                    .createMediaStreamSource(
                        avatarStream
                    );


            this._avatarAnalyser =
                this._avatarAudioContext
                    .createAnalyser();


            this._avatarAnalyser.fftSize =
                1024;


            this._avatarAnalyser
                .smoothingTimeConstant =
                0.65;


            this._avatarAudioSource.connect(
                this._avatarAnalyser
            );


            const samples =
                new Float32Array(
                    this._avatarAnalyser
                        .fftSize
                );


            this._avatarAudioTimer =
                setInterval(
                    () => {

                        if (!this._avatarAnalyser) {
                            return;
                        }


                        this._avatarAnalyser
                            .getFloatTimeDomainData(
                                samples
                            );


                        const rms =
                            this.calculateRms(
                                samples
                            );


                        this._avatarSpeaking =
                            rms >
                            this._interruptionThresholds
                                .avatarSpeechRms;


                        this.evaluateSpeechOverlap();


                    },
                    100
                );


        } catch (error) {

            console.warn(
                "NEXIVRA AVATAR AUDIO MONITOR ERROR:",
                error
            );
        }
    }


    calculateRms(samples) {

        let sum =
            0;


        for (
            let i = 0;
            i < samples.length;
            i++
        ) {

            sum +=
                samples[i] *
                samples[i];
        }


        return Math.sqrt(
            sum /
            samples.length
        );
    }


    /*
     * =====================================================
     * INTERRUPTION ENGINE
     * =====================================================
     */

    evaluateSpeechOverlap() {

        if (
            !this._learnerSessionActive ||
            this._endingSession
        ) {
            return;
        }


        const overlap =
            (
                this._learnerSpeaking &&
                this._avatarSpeaking
            );


        if (overlap) {

            if (!this._overlapStartedAt) {

                this._overlapStartedAt =
                    Date.now();
            }


            return;
        }


        if (this._overlapStartedAt) {

            this.finishPossibleInterruption();
        }
    }


    finishPossibleInterruption() {

        if (!this._overlapStartedAt) {
            return;
        }


        const now =
            Date.now();


        const duration =
            now -
            this._overlapStartedAt;


        this._overlapStartedAt =
            null;


        if (
            duration <
            this._interruptionThresholds
                .minimumOverlap
        ) {
            return;
        }


        this._interruptionEvents.push(
            {
                time: now,
                duration
            }
        );


        const cutoff =
            now -
            this._interruptionThresholds
                .rollingWindow;


        this._interruptionEvents =
            this._interruptionEvents
                .filter(
                    (event) =>
                        event.time >= cutoff
                );


        this.evaluateInterruptionPattern();
    }


    evaluateInterruptionPattern() {

        const now =
            Date.now();


        if (
            this._interruptionEvents.length <
            this._interruptionThresholds
                .eventsBeforeCoaching
        ) {
            return;
        }


        if (
            (
                now -
                this._lastInterruptionCoachingAt
            ) <
            this._interruptionThresholds
                .coachingCooldown
        ) {
            return;
        }


        if (
            this._trainingState !==
            "ACTIVE"
        ) {
            return;
        }


        this._lastInterruptionCoachingAt =
            now;


        this._interruptionEvents =
            [];


        this.handleRepeatedInterruption();
    }


async handleRepeatedInterruption() {

    this.setTrainingState(
        "COACHING_INTERRUPTION"
    );


    this.setStatus(
        "NEXIVRA is coaching listening skills."
    );


    await this.speakLiveCoach(
        "I'm going to pause us for a second. You've started responding before I've finished speaking a few times. In hospitality, allowing someone to finish helps them feel heard and gives us the chance to fully understand before we respond. Brief acknowledgments are perfectly natural, but let's practice allowing the speaker to finish their thought before beginning our full response.",
        {
            resumeListening: true
        }
    );


    setTimeout(
        () => {

            if (
                this._trainingState ===
                "COACHING_INTERRUPTION"
            ) {

                this.setTrainingState(
                    "ACTIVE"
                );


                this.setStatus(
                    "Session active."
                );
            }

        },
        9000
    );
}

        this.setTrainingState(
            "COACHING_INTERRUPTION"
        );


        this.setStatus(
            "NEXIVRA is coaching listening skills."
        );


        this.sendLiveCoachInstruction(`
LIVE LISTENING COACHING EVENT:

The learner has produced multiple sustained speech-overlap events while the trainer was still speaking.

Treat this as a possible interruption pattern.

Pause the current training point briefly.

Explain that allowing another person to finish speaking helps them feel heard and respected and helps us fully understand before responding.

Do not criticize normal short acknowledgments such as "yes," "okay," "right," or "I understand."

Explain the importance of listening through the end of another person's thought before beginning a full response.

Keep the coaching constructive and non-punitive.

Then continue the interaction naturally.

Do not mention microphone monitoring or automated detection.
        `);


        setTimeout(
            () => {

                if (
                    this._trainingState ===
                    "COACHING_INTERRUPTION"
                ) {

                    this.setTrainingState(
                        "ACTIVE"
                    );


                    this.setStatus(
                        "Session active."
                    );
                }

            },
            7000
        );
    }


    /*
     * =====================================================
     * END SESSION
     * =====================================================
     */

    async endLearnerSession() {

        if (this._endingSession) {
            return;
        }


        this._endingSession =
            true;


        const sessionButton =
            this.shadowRoot.getElementById(
                "sessionButton"
            );


        sessionButton.disabled =
            true;


        this.setTrainingState(
            "ENDING"
        );


        try {

            this.stopVisualAnalysis();


            const visualSummary =
                this.buildVisualSummary();


            this.setStatus(
                "NEXIVRA is reviewing your practice..."
            );


            this._session.message(
                visualSummary
            );


            await this.delay(
                800
            );


            this._session.message(
                this.buildIntegratedFeedbackRequest()
            );


            this.setStatus(
                "NEXIVRA is preparing your coaching feedback..."
            );


            /*
             * Prototype feedback window.
             */

            await this.delay(
                18000
            );


        } catch (error) {

            console.error(
                "NEXIVRA FINAL FEEDBACK ERROR:",
                error
            );


            this.setStatus(
                "NEXIVRA could not complete the final coaching review."
            );
        }


        this.stopLearnerAudioMonitor();

        this.stopCameraOnly();


        try {

            if (
                this._session?.voiceChat &&
                typeof this._session
                    .voiceChat.stop ===
                    "function"
            ) {

                await this._session
                    .voiceChat
                    .stop();
            }

        } catch (error) {

            console.warn(
                "NEXIVRA VOICE STOP WARNING:",
                error
            );
        }


        this._learnerSessionActive =
            false;


        this._endingSession =
            false;


        this.resetLiveEventTracking();


        this.setTrainingState(
            "READY"
        );


        sessionButton.disabled =
            false;


        sessionButton.textContent =
            "Start Session";


        sessionButton.classList.remove(
            "session-active"
        );


        this.setStatus(
            "Practice session complete."
        );
    }


    /*
     * =====================================================
     * FINAL VISUAL SUMMARY
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


        const facePercent =
            Math.round(
                (
                    metrics.faceDetectedSamples /
                    sampleCount
                ) *
                100
            );


        const posePercent =
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


        const framePercent =
            Math.round(
                (
                    metrics.inFrameSamples /
                    sampleCount
                ) *
                100
            );


        return `
SYSTEM COACHING CONTEXT:

Observable visual information from the completed learner practice:

- Face detected in approximately ${facePercent}% of analyzed samples.
- Upper-body pose detected in approximately ${posePercent}% of analyzed samples.
- Learner remained within the central camera frame in approximately ${framePercent}% of analyzed samples.
- Learner was approximately forward-facing in ${facingPercent}% of analyzed samples.
- ${metrics.lookAwayEvents} transition(s) away from forward-facing orientation were observed.
- Final visible head orientation: ${metrics.headOrientation}.
- Final visible upper-body alignment: ${metrics.posture}.

Use these observations only as supplemental coaching context.

Do not infer emotion, confidence, nervousness, honesty, deception, personality, intent, motivation, attentiveness, disability, psychological state, or medical condition.

Do not equate camera-facing behavior with perfect eye contact.

Do not treat looking away as inherently negative.

Natural human conversation includes looking away.

Do not use these measurements as a performance score.

When visual behavior is relevant, describe only what was observable and explain how it could potentially affect another person's experience.

Do not read raw percentages aloud unless the learner asks for them.
        `.trim();
    }


    buildIntegratedFeedbackRequest() {

        return `
COACHING REQUEST:

The learner has completed the current hospitality practice interaction.

Provide concise integrated coaching using:

1. The conversation.
2. The learner's verbal responses and decisions.
3. Any live visual-presence coaching that occurred.
4. Any listening/interruption coaching that occurred.
5. The final observable visual context.

Begin with what the learner did effectively.

Then identify one or two meaningful opportunities to strengthen.

If interruption coaching was relevant, reinforce the importance of allowing another person to finish speaking and listening before responding.

If visual presence was relevant, explain how observable behavior could potentially affect another person's experience.

Do not mention MediaPipe, telemetry, camera percentages, microphone monitoring, automated event detection, or system messages.

Do not say the learner failed.

Use supportive Legacy Edge Partners coaching language.

Keep the feedback conversational, specific, constructive, and concise.
        `.trim();
    }


    /*
     * =====================================================
     * TEXT FALLBACK
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

            this._session.message(
                message
            );


            input.value =
                "";


            this.setStatus(
                "NEXIVRA is responding..."
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
     * CLEANUP HELPERS
     * =====================================================
     */

    stopLearnerAudioMonitor() {

        if (this._learnerAudioTimer) {

            clearInterval(
                this._learnerAudioTimer
            );

            this._learnerAudioTimer =
                null;
        }


        if (this._learnerMicSource) {

            try {

                this._learnerMicSource
                    .disconnect();

            } catch (error) {}

            this._learnerMicSource =
                null;
        }


        this._learnerAnalyser =
            null;


        if (this._learnerAudioContext) {

            try {

                this._learnerAudioContext
                    .close();

            } catch (error) {}

            this._learnerAudioContext =
                null;
        }


        this._learnerSpeaking =
            false;


        this._overlapStartedAt =
            null;
    }


    stopAvatarAudioMonitor() {

        if (this._avatarAudioTimer) {

            clearInterval(
                this._avatarAudioTimer
            );

            this._avatarAudioTimer =
                null;
        }


        if (this._avatarAudioSource) {

            try {

                this._avatarAudioSource
                    .disconnect();

            } catch (error) {}

            this._avatarAudioSource =
                null;
        }


        this._avatarAnalyser =
            null;


        if (this._avatarAudioContext) {

            try {

                this._avatarAudioContext
                    .close();

            } catch (error) {}

            this._avatarAudioContext =
                null;
        }


        this._avatarSpeaking =
            false;
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


        if (learnerVideo) {

            learnerVideo.srcObject =
                null;
        }


        if (learnerPreview) {

            learnerPreview.classList.remove(
                "active"
            );
        }
    }


    delay(milliseconds) {

        return new Promise(
            (resolve) => {

                setTimeout(
                    resolve,
                    milliseconds
                );

            }
        );
    }


    /*
     * =====================================================
     * COMPONENT CLEANUP
     * =====================================================
     */

    disconnectedCallback() {

        if (this._attachTimer) {

            clearInterval(
                this._attachTimer
            );

            this._attachTimer =
                null;
        }


        this.stopVisualAnalysis();

        this.stopLearnerAudioMonitor();

        this.stopAvatarAudioMonitor();

        this.stopCameraOnly();


        if (this._faceLandmarker) {

            try {

                this._faceLandmarker
                    .close();

            } catch (error) {}


            this._faceLandmarker =
                null;
        }


        if (this._poseLandmarker) {

            try {

                this._poseLandmarker
                    .close();

            } catch (error) {}


            this._poseLandmarker =
                null;
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


        this._session =
            null;


        this._learnerSessionActive =
            false;


        this._endingSession =
            false;


        this.setTrainingState(
            "READY"
        );
    }
}


/*
 * =========================================================
 * REGISTER CUSTOM ELEMENT
 * =========================================================
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
