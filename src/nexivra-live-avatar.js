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

        // LiveAvatar
        this._session = null;
        this._sessionToken = null;
        this._avatarStarted = false;
        this._attachTimer = null;

        // Learner session
        this._learnerSessionActive = false;
        this._cameraStream = null;
        this._endingSession = false;

        // MediaPipe
        this._visionFileset = null;
        this._faceLandmarker = null;
        this._poseLandmarker = null;
        this._visualAnalysisTimer = null;
        this._visualAnalysisRunning = false;

        // Visual metrics
        this._visualMetrics =
            this.createEmptyVisualMetrics();
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

            this._sessionToken =
                newValue;

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


                /*
                 * Learner self-view
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
                 * Learner controls
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


        let attempts = 0;


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


                        this.setStatus(
                            "NEXIVRA is ready. Click Start Session."
                        );


                        video.play().catch(
                            () => {}
                        );
                    }

                } catch (error) {

                    console.log(
                        "Waiting for NEXIVRA video..."
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
     * ONE-CLICK SESSION
     * =====================================================
     */

    async toggleLearnerSession() {

        if (
            this._endingSession
        ) {
            return;
        }


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


            /*
             * Request audio + video together.
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


            this._cameraStream =
                mediaStream;


            learnerVideo.srcObject =
                mediaStream;


            await learnerVideo.play();


            learnerPreview.classList.add(
                "active"
            );


            /*
             * Browser audio permission is established.
             * LiveAvatar uses its own mic stream.
             */

            mediaStream
                .getAudioTracks()
                .forEach(
                    (track) =>
                        track.stop()
                );


            /*
             * Visual analysis
             */

            this.setStatus(
                "Starting visual coaching..."
            );


            await this.initializeVisualAnalysis();


            this.startVisualAnalysis();


            /*
             * Voice
             */

            this.setStatus(
                "Starting voice conversation..."
            );


            await this._session
                .voiceChat
                .start();


            this._learnerSessionActive =
                true;


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


    /*
     * =====================================================
     * AUTOMATIC INTEGRATED FEEDBACK
     * =====================================================
     */

    async endLearnerSession() {

        if (
            this._endingSession
        ) {
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


        try {

            /*
             * Freeze visual measurements first.
             */

            this.stopVisualAnalysis();


            const visualSummary =
                this.buildVisualSummary();


            console.log(
                "NEXIVRA AUTOMATIC VISUAL SUMMARY:",
                visualSummary
            );


            /*
             * Send visual context automatically.
             */

            this.setStatus(
                "NEXIVRA is reviewing your practice..."
            );


            this._session.message(
                visualSummary
            );


            /*
             * Give the context message a moment to enter
             * the conversation before requesting feedback.
             */

            await this.delay(800);


            const feedbackRequest = `
COACHING REQUEST:

The learner has completed the current practice interaction.

Using:
1. the conversation you just had with the learner, and
2. the observable visual coaching context just provided,

give the learner concise, constructive, integrated feedback.

Begin with what the learner did effectively.

Then identify one or two useful opportunities for improvement.

When visual behavior is relevant, describe only what was observable and explain how that behavior could potentially affect another person's experience.

Do not infer emotions, confidence, honesty, deception, personality, intent, motivation, attentiveness, disability, medical condition, or psychological state from visual information.

Do not read technical percentages aloud unless the learner specifically asks for the measurements.

Do not say that the learner failed.

Use Legacy Edge Partners coaching language such as:
- "That's a good start."
- "One thing I'd work on..."
- "One thing you could experiment with..."
- "Here's another way to approach it..."
- "This is an area we can strengthen."

Speak directly to the learner as their hospitality coach.
            `.trim();


            this._session.message(
                feedbackRequest
            );


            this.setStatus(
                "NEXIVRA is preparing your coaching feedback..."
            );


            /*
             * Prototype behavior:
             *
             * Keep the session alive long enough for
             * NEXIVRA to generate and speak feedback.
             *
             * Later we will replace this fixed window
             * with actual avatar speaking events.
             */

            await this.delay(
                18000
            );


        } catch (error) {

            console.error(
                "NEXIVRA FEEDBACK ERROR:",
                error
            );


            this.setStatus(
                "NEXIVRA could not complete the coaching review."
            );
        }


        /*
         * Shut down learner camera and visual layer
         * after the feedback window.
         */

        this.stopCameraOnly();


        /*
         * Stop voice if supported.
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


        this._endingSession =
            false;


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


    delay(milliseconds) {

        return new Promise(
            (resolve) =>
                setTimeout(
                    resolve,
                    milliseconds
                )
        );
    }


    /*
     * =====================================================
     * TEXT
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
     * CAMERA CLEANUP
     * =====================================================
     */

    stopCameraOnly() {

        const learnerVideo =
            this.shadowRoot.getElementById(
                "learnerVideo"
            );

        const learnerPreview =
            this.shadowRoot.getElementById(
                "learnerPreview"
            );


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

        if (
            this._visualAnalysisRunning
        ) {
            return;
        }


        /*
         * Every learner session starts with
         * fresh visual observations.
         */

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


        console.log(
            "NEXIVRA visual analysis started."
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


        console.log(
            "NEXIVRA visual analysis stopped."
        );
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
         * =================================================
         * FACE OBSERVATIONS
         * =================================================
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


            /*
             * Count a look-away event when the
             * learner transitions from forward
             * orientation to another orientation.
             *
             * This is an observable movement event.
             * It is NOT interpreted as distraction,
             * nervousness, avoidance, etc.
             */

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
                "No face detected";


            metrics.previousFacingForward =
                false;
        }


        /*
         * =================================================
         * UPPER-BODY OBSERVATIONS
         * =================================================
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
    }


    evaluateFace(
        landmarks
    ) {

        /*
         * MediaPipe face landmark references:
         *
         * 1   = nose region
         * 33  = eye corner
         * 263 = opposite eye corner
         *
         * These measurements describe visible
         * orientation only.
         */

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


        /*
         * Intentionally broad thresholds.
         *
         * We are identifying approximate visible
         * head orientation, not eye contact,
         * attention, emotion, or intent.
         */

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

        /*
         * MediaPipe Pose landmarks:
         *
         * 11 = left shoulder
         * 12 = right shoulder
         *
         * We describe only visible upper-body
         * alignment.
         */

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


    /*
     * =====================================================
     * AUTOMATIC VISUAL COACHING SUMMARY
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

The following information contains observable visual measurements from the learner's current practice interaction.

OBSERVATIONS:

- Face was detected in approximately ${faceDetectedPercent}% of analyzed visual samples.
- Upper-body pose was detected in approximately ${poseDetectedPercent}% of analyzed visual samples.
- Learner remained within the central camera frame in approximately ${inFramePercent}% of analyzed samples.
- Learner's visible head orientation was approximately forward-facing in ${facingPercent}% of analyzed samples.
- ${metrics.lookAwayEvents} transition(s) from a forward-facing head orientation to another visible orientation were observed.
- Final visible head orientation: ${metrics.headOrientation}.
- Final visible upper-body alignment: ${metrics.posture}.

IMPORTANT VISUAL COACHING RULES:

Treat these measurements only as supplemental observations about visible behavior.

Do not infer or claim:
- emotion
- confidence
- nervousness
- honesty
- deception
- personality
- intent
- motivation
- attentiveness
- disability
- psychological state
- medical condition

Do not describe the learner as distracted simply because they looked away.

Do not treat looking toward the camera as equivalent to eye contact with another person.

Do not treat any percentage or count above as a score of hospitality, professionalism, communication ability, or performance.

Natural conversation includes head movement and looking away.

Use visual observations only when they are meaningfully relevant to the interaction.

When an observation is relevant, describe the visible behavior and explain how that behavior could potentially be experienced by another person.

Prefer coaching language such as:

"I noticed..."

"During part of that interaction..."

"One thing you could experiment with..."

"That could potentially come across as..."

"One thing I'd work on..."

Do not read the technical percentages or raw measurements aloud unless the learner specifically asks for them.

Combine this visual information with the actual conversation and the learner's verbal performance.

Do not let visual observations override stronger evidence from what the learner actually said or did.
        `.trim();
    }


    /*
     * =====================================================
     * AUTOMATIC FEEDBACK REQUEST
     * =====================================================
     */

    buildIntegratedFeedbackRequest() {

        return `
COACHING REQUEST:

The learner has completed the current hospitality practice interaction.

Provide integrated coaching based on:

1. The conversation you just had with the learner.
2. The learner's verbal response and decisions.
3. The observable visual coaching context supplied immediately before this request.

COACHING STRUCTURE:

First, briefly identify what the learner did effectively.

Next, identify one or two meaningful opportunities to strengthen the interaction.

If an observable visual behavior is genuinely relevant, incorporate it naturally into the coaching.

Do not force visual feedback into the response if it would not be useful.

Explain how communication choices or visible behaviors could potentially affect another person's experience.

Use Legacy Edge Partners coaching language.

Do not say the learner failed.

Use language such as:

"That's a good start."

"One thing I'd work on..."

"One thing you could experiment with..."

"Here's another way to approach it..."

"This is an area we can strengthen."

Keep the coaching conversational and concise.

Do not mention that you received a system message, visual data packet, MediaPipe measurements, percentages, or technical telemetry.

Speak directly to the learner as their NEXIVRA hospitality coach.
        `.trim();
    }


    /*
     * =====================================================
     * SEND AUTOMATIC COACHING CONTEXT
     * =====================================================
     */

    async sendAutomaticCoachingContext() {

        if (
            !this._session
        ) {

            return;
        }


        const visualSummary =
            this.buildVisualSummary();


        const feedbackRequest =
            this.buildIntegratedFeedbackRequest();


        console.log(
            "NEXIVRA AUTOMATIC VISUAL SUMMARY:",
            visualSummary
        );


        /*
         * First provide the observations.
         */

        this._session.message(
            visualSummary
        );


        /*
         * Small separation so the agent receives
         * the context before the coaching request.
         */

        await this.delay(
            800
        );


        /*
         * Then request integrated feedback.
         */

        this._session.message(
            feedbackRequest
        );


        console.log(
            "NEXIVRA integrated feedback requested."
        );
    }

    /*
     * =====================================================
     * HELPER
     * =====================================================
     */

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
     * CLEANUP
     * =====================================================
     */

    disconnectedCallback() {

        /*
         * Stop avatar attach timer.
         */

        if (
            this._attachTimer
        ) {

            clearInterval(
                this._attachTimer
            );

            this._attachTimer =
                null;
        }


        /*
         * Stop visual analysis.
         */

        this.stopVisualAnalysis();


        /*
         * Stop learner camera.
         */

        this.stopCameraOnly();


        /*
         * Close MediaPipe Face Landmarker.
         */

        if (
            this._faceLandmarker
        ) {

            try {

                this._faceLandmarker
                    .close();

            } catch (error) {

                console.warn(
                    "NEXIVRA FACE LANDMARKER CLOSE WARNING:",
                    error
                );
            }


            this._faceLandmarker =
                null;
        }


        /*
         * Close MediaPipe Pose Landmarker.
         */

        if (
            this._poseLandmarker
        ) {

            try {

                this._poseLandmarker
                    .close();

            } catch (error) {

                console.warn(
                    "NEXIVRA POSE LANDMARKER CLOSE WARNING:",
                    error
                );
            }


            this._poseLandmarker =
                null;
        }


        /*
         * Stop LiveAvatar session.
         */

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


        this._session =
            null;


        this._learnerSessionActive =
            false;


        this._endingSession =
            false;
    }
}


/*
 * =========================================================
 * REGISTER NEXIVRA CUSTOM ELEMENT
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
