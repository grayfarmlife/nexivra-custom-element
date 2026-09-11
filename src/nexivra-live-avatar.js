import {
  LiveAvatarSession,
  AgentEventsEnum
} from "@heygen/liveavatar-web-sdk";

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
    this.session = null;
    this.sessionToken = null;
    this.avatarStarted = false;
    this.attachTimer = null;

    // Learner session
    this.sessionActive = false;
    this.sessionEnding = false;
    this.trainingState = "READY";

    // Camera
    this.cameraStream = null;

    // MediaPipe
    this.visionFileset = null;
    this.faceLandmarker = null;
    this.poseLandmarker = null;
    this.visualTimer = null;
    this.visualRunning = false;

    // Visual metrics
    this.metrics = this.emptyMetrics();

    // Live visual state
    this.absentSince = null;
    this.returnedSince = null;
    this.turnedAwaySince = null;
    this.postureIssueSince = null;
    this.correctionSince = null;

    this.waitingForOrientationCorrection = false;
    this.waitingForPostureCorrection = false;

    this.lastOrientationCoach = 0;
    this.lastPostureCoach = 0;

    // Live intervention control
    this.coachIntervening = false;

    // Audio monitoring
    this.learnerAudioContext = null;
    this.learnerSource = null;
    this.learnerAnalyser = null;
    this.learnerAudioTimer = null;

    this.avatarAudioContext = null;
    this.avatarSource = null;
    this.avatarAnalyser = null;
    this.avatarAudioTimer = null;

    this.learnerSpeaking = false;
    this.learnerMicSpeaking = false;
    this.avatarSpeaking = false;

    // Adaptive learner speech detection
    this.learnerNoiseFloor = 0.006;
    this.learnerSpeechStartThreshold = 0.018;
    this.learnerSpeechStopThreshold = 0.012;
    this.learnerCalibrationSamples = [];
    this.learnerCalibrationComplete = false;
    this.learnerSpeechAboveSince = null;
    this.learnerSpeechBelowSince = null;

    // Interruption tracking
    this.overlapSince = null;
    this.interruptionCandidateSince = null;
    this.interruptionEvents = [];
    this.lastInterruptionCoach = 0;

    // Thresholds
    this.thresholds = {
      absentMs: 3000,
      returnedMs: 2000,

      turnedAwayMs: 6000,
      postureMs: 8000,

      orientationCorrectionMs: 2000,
      postureCorrectionMs: 3000,

      orientationCooldownMs: 30000,
      postureCooldownMs: 30000,

      learnerSpeechRms: 0.018,
      avatarSpeechRms: 0.018,

      learnerCalibrationMs: 1500,
      learnerSpeechStartHoldMs: 120,
      learnerSpeechStopHoldMs: 260,
      learnerSpeechThresholdFloor: 0.012,
      learnerSpeechThresholdCeiling: 0.030,

      minimumOverlapMs: 900,
      interruptionWindowMs: 30000,
      interruptionsBeforeCoach: 2,
      interruptionCooldownMs: 45000
    };
  }


  /*
   * =========================================================
   * CUSTOM ELEMENT
   * =========================================================
   */

  connectedCallback() {
    this.render();
    this.bindControls();

    this.sessionToken =
      this.getAttribute("session-token");

    if (this.sessionToken) {
      this.startNexivra();
    }
  }


  attributeChangedCallback(name, oldValue, newValue) {
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


  /*
   * =========================================================
   * UI
   * =========================================================
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

          <div class="indicator-dot"></div>

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
      () => this.sendTextMessage()
    );


    sessionButton.addEventListener(
      "click",
      () => this.toggleSession()
    );


    messageInput.addEventListener(
      "keydown",
      (event) => {

        if (event.key === "Enter") {
          this.sendTextMessage();
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


  setTrainingState(state) {

    this.trainingState = state;

    console.log(
      "NEXIVRA STATE:",
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


    if (!indicator || !indicatorText) {
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

      VISUAL_COACHING:
        "Visual Coaching",

      LISTENING_COACHING:
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
   * =========================================================
   * LIVEAVATAR
   * =========================================================
   */

  async startNexivra() {

    if (
      this.avatarStarted ||
      !this.sessionToken
    ) {
      return;
    }


    this.avatarStarted = true;


    try {

      this.setStatus(
        "Starting AI Hospitality Coach..."
      );


      this.session =
        new LiveAvatarSession(
          this.sessionToken,
          {
            voiceChat: false
          }
        );


      /*
       * Use HeyGen's actual avatar speaking events
       * so interruption detection knows reliably
       * when Elenora is speaking.
       *
       * Learner speaking detection remains on the
       * microphone monitor below.
       */

      this.session.on(
        AgentEventsEnum.AVATAR_SPEAK_STARTED,
        () => {

          this.avatarSpeaking = true;


          console.log(
            "NEXIVRA SPEECH EVENT: Elenora started speaking"
          );

        }
      );


      this.session.on(
        AgentEventsEnum.AVATAR_SPEAK_ENDED,
        () => {

          this.avatarSpeaking = false;


          console.log(
            "NEXIVRA SPEECH EVENT: Elenora stopped speaking"
          );

        }
      );


      await this.session.start();


      this.waitForAvatarVideo();


    } catch (error) {

      this.avatarStarted = false;


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


  waitForAvatarVideo() {

    const video =
      this.shadowRoot.getElementById(
        "avatarVideo"
      );


    let attempts = 0;


    if (this.attachTimer) {
      clearInterval(
        this.attachTimer
      );
    }


    this.attachTimer =
      setInterval(
        () => {

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


              this.setStatus(
                "NEXIVRA is ready. Click Start Session."
              );


              video.play()
                .catch(
                  () => {}
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

        },
        500
      );
  }


  /*
   * =========================================================
   * START / END SESSION
   * =========================================================
   */

  async toggleSession() {

    if (this.sessionEnding) {
      return;
    }


    if (this.sessionActive) {

      await this.endSession();

    } else {

      await this.startSession();
    }
  }


  async startSession() {

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


    if (!this.session) {

      this.setStatus(
        "Please wait for NEXIVRA to connect."
      );

      return;
    }


    try {

      sessionButton.disabled = true;


      this.setStatus(
        "Connecting microphone and camera..."
      );


      const stream =
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


      this.cameraStream = stream;


      learnerVideo.srcObject =
        stream;


      await learnerVideo.play();


      learnerPreview.classList.add(
        "active"
      );


      await this.startLearnerAudioMonitor(
        stream
      );


      this.setStatus(
        "Starting visual coaching..."
      );


      await this.initializeVision();


      this.startVisualAnalysis();


      this.setStatus(
        "Starting voice conversation..."
      );


      await this.session
        .voiceChat
        .start();


      this.sessionActive = true;


      this.resetLiveState();


      this.setTrainingState(
        "ACTIVE"
      );


      sessionButton.disabled = false;


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


      sessionButton.disabled = false;


      this.stopVisualAnalysis();

      this.stopLearnerAudioMonitor();

      this.stopCamera();


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


  async endSession() {

    if (this.sessionEnding) {
      return;
    }


    this.sessionEnding = true;


    const sessionButton =
      this.shadowRoot.getElementById(
        "sessionButton"
      );


    sessionButton.disabled = true;


    this.setTrainingState(
      "ENDING"
    );


    try {

      this.stopVisualAnalysis();


      const summary =
        this.buildVisualSummary();


      this.setStatus(
        "NEXIVRA is reviewing your practice..."
      );


      this.session.message(
        summary
      );


      await this.delay(
        800
      );


      this.session.message(
        this.buildFinalFeedbackPrompt()
      );


      this.setStatus(
        "NEXIVRA is preparing your coaching feedback..."
      );


      await this.delay(
        18000
      );


    } catch (error) {

      console.error(
        "NEXIVRA FINAL FEEDBACK ERROR:",
        error
      );
    }


    this.stopLearnerAudioMonitor();

    this.stopCamera();


    try {

      if (
        this.session?.voiceChat &&
        typeof this.session
          .voiceChat
          .stop ===
          "function"
      ) {

        await this.session
          .voiceChat
          .stop();
      }

    } catch (error) {

      console.warn(
        "VOICE STOP WARNING:",
        error
      );
    }


    this.sessionActive = false;

    this.sessionEnding = false;


    this.resetLiveState();


    this.setTrainingState(
      "READY"
    );


    sessionButton.disabled = false;


    sessionButton.textContent =
      "Start Session";


    sessionButton.classList.remove(
      "session-active"
    );


    this.setStatus(
      "Practice session complete."
    );
  }


  resetLiveState() {

    this.absentSince = null;
    this.returnedSince = null;
    this.turnedAwaySince = null;
    this.postureIssueSince = null;
    this.correctionSince = null;

    this.waitingForOrientationCorrection =
      false;

    this.waitingForPostureCorrection =
      false;

    this.overlapSince = null;

    this.interruptionCandidateSince = null;

    this.interruptionEvents = [];

    this.learnerSpeaking = false;

    this.learnerMicSpeaking = false;

    this.avatarSpeaking = false;

    this.learnerNoiseFloor = 0.006;

    this.learnerSpeechStartThreshold = 0.018;

    this.learnerSpeechStopThreshold = 0.012;

    this.learnerCalibrationSamples = [];

    this.learnerCalibrationComplete = false;

    this.learnerSpeechAboveSince = null;

    this.learnerSpeechBelowSince = null;
  }


  /*
   * =========================================================
   * VISUAL ANALYSIS
   * =========================================================
   */

  async initializeVision() {

    if (
      this.faceLandmarker &&
      this.poseLandmarker
    ) {
      return;
    }


    this.visionFileset =
      await FilesetResolver
        .forVisionTasks(

          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"

        );


    this.faceLandmarker =
      await FaceLandmarker
        .createFromOptions(

          this.visionFileset,

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


    this.poseLandmarker =
      await PoseLandmarker
        .createFromOptions(

          this.visionFileset,

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

    if (this.visualRunning) {
      return;
    }


    this.metrics =
      this.emptyMetrics();


    this.visualRunning = true;


    this.visualTimer =
      setInterval(
        () => this.analyzeFrame(),
        500
      );
  }


  stopVisualAnalysis() {

    this.visualRunning = false;


    if (this.visualTimer) {

      clearInterval(
        this.visualTimer
      );


      this.visualTimer = null;
    }
  }


  emptyMetrics() {

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


  analyzeFrame() {

    if (
      !this.visualRunning ||
      !this.sessionActive
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
        this.faceLandmarker
          .detectForVideo(
            video,
            timestamp
          );


      const poseResult =
        this.poseLandmarker
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
        "VISUAL FRAME ERROR:",
        error
      );
    }
  }


  processVisualResults(
    faceResult,
    poseResult
  ) {

    const m =
      this.metrics;


    m.samples++;


    const faceLandmarks =
      faceResult?.faceLandmarks?.[0];


    const faceDetected =
      Boolean(
        faceLandmarks &&
        faceLandmarks.length
      );


    m.faceDetected =
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

      m.faceDetectedSamples++;


      faceData =
        this.evaluateFace(
          faceLandmarks
        );


      m.headOrientation =
        faceData.orientation;


      if (faceData.facingForward) {

        m.facingForwardSamples++;
      }


      if (
        m.previousFacingForward &&
        !faceData.facingForward
      ) {

        m.lookAwayEvents++;
      }


      m.previousFacingForward =
        faceData.facingForward;


      if (faceData.inFrame) {

        m.inFrameSamples++;
      }


    } else {

      m.headOrientation =
        "No face detected";


      m.previousFacingForward =
        false;
    }


    const poseLandmarks =
      poseResult?.landmarks?.[0];


    const poseDetected =
      Boolean(
        poseLandmarks &&
        poseLandmarks.length
      );


    m.poseDetected =
      poseDetected;


    let postureData = {

      label:
        "Not detected",

      needsCoaching:
        false
    };


    if (poseDetected) {

      m.poseDetectedSamples++;


      postureData =
        this.evaluatePosture(
          poseLandmarks
        );


      m.posture =
        postureData.label;


    } else {

      m.posture =
        "Not detected";
    }


    this.evaluateLiveEvents(
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
        orientation ===
        "Forward",

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
   * =========================================================
   * LIVE VISUAL EVENT ENGINE
   * =========================================================
   */

  evaluateLiveEvents(observation) {

    if (
      !this.sessionActive ||
      this.sessionEnding
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
     * Learner absent
     */

    if (!learnerVisible) {

      this.returnedSince =
        null;


      if (!this.absentSince) {

        this.absentSince =
          now;
      }


      if (
        this.trainingState !==
          "PAUSED_ABSENT" &&
        (
          now -
          this.absentSince
        ) >=
          this.thresholds.absentMs
      ) {

        this.handleLearnerAbsent();
      }


      return;
    }


    this.absentSince =
      null;


    /*
     * Learner returned
     */

    if (
      this.trainingState ===
      "PAUSED_ABSENT"
    ) {

      if (!this.returnedSince) {

        this.returnedSince =
          now;
      }


      if (
        (
          now -
          this.returnedSince
        ) >=
          this.thresholds.returnedMs
      ) {

        this.handleLearnerReturned();
      }


      return;
    }


    this.returnedSince =
      null;


    /*
     * Waiting for eye/orientation correction
     */

    if (
      this.waitingForOrientationCorrection
    ) {

      if (
        observation.faceData
          .facingForward
      ) {

        if (!this.correctionSince) {

          this.correctionSince =
            now;
        }


        if (
          (
            now -
            this.correctionSince
          ) >=
            this.thresholds
              .orientationCorrectionMs
        ) {

          this.handleOrientationCorrected();
        }


      } else {

        this.correctionSince =
          null;
      }


      return;
    }


    /*
     * Waiting for posture correction
     */

    if (
      this.waitingForPostureCorrection
    ) {

      if (
        !observation.postureData
          .needsCoaching
      ) {

        if (!this.correctionSince) {

          this.correctionSince =
            now;
        }


        if (
          (
            now -
            this.correctionSince
          ) >=
            this.thresholds
              .postureCorrectionMs
        ) {

          this.handlePostureCorrected();
        }


      } else {

        this.correctionSince =
          null;
      }


      return;
    }


    if (
      this.trainingState !==
      "ACTIVE"
    ) {
      return;
    }


    /*
     * Sustained orientation away
     */

    if (
      observation.faceDetected &&
      !observation.faceData
        .facingForward
    ) {

      if (!this.turnedAwaySince) {

        this.turnedAwaySince =
          now;
      }


      const cooldownComplete =
        (
          now -
          this.lastOrientationCoach
        ) >=
          this.thresholds
            .orientationCooldownMs;


      if (
        cooldownComplete &&
        (
          now -
          this.turnedAwaySince
        ) >=
          this.thresholds
            .turnedAwayMs
      ) {

        this.handleOrientationAway(
          observation.faceData
            .orientation
        );
      }


    } else {

      this.turnedAwaySince =
        null;
    }


    /*
     * Sustained posture issue
     */

    if (
      observation.poseDetected &&
      observation.postureData
        .needsCoaching
    ) {

      if (!this.postureIssueSince) {

        this.postureIssueSince =
          now;
      }


      const cooldownComplete =
        (
          now -
          this.lastPostureCoach
        ) >=
          this.thresholds
            .postureCooldownMs;


      if (
        cooldownComplete &&
        (
          now -
          this.postureIssueSince
        ) >=
          this.thresholds
            .postureMs
      ) {

        this.handlePostureConcern();
      }


    } else {

      this.postureIssueSince =
        null;
    }
  }


  /*
   * =========================================================
   * LIVE COACHING ACTIONS
   * =========================================================
   */

  async handleLearnerAbsent() {

    if (
      this.trainingState ===
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


    await this.speakImmediateCoach(
      "It looks like you've stepped away. I'll pause here and wait for you to come back.",
      false
    );
  }


  async handleLearnerReturned() {

    if (
      this.trainingState !==
      "PAUSED_ABSENT"
    ) {
      return;
    }


    this.returnedSince =
      null;


    this.setTrainingState(
      "ACTIVE"
    );


    this.setStatus(
      "Session active."
    );


    await this.speakImmediateCoach(
      "Welcome back. Let's pick up where we left off.",
      true
    );
  }


  async handleOrientationAway(
    orientation
  ) {

    if (this.coachIntervening) {
      return;
    }


    this.lastOrientationCoach =
      Date.now();


    this.turnedAwaySince =
      null;


    this.waitingForOrientationCorrection =
      true;


    this.correctionSince =
      null;


    this.setTrainingState(
      "WAITING_FOR_CORRECTION"
    );


    this.setStatus(
      "NEXIVRA is coaching visual presence."
    );


    await this.speakImmediateCoach(
      "I'm going to pause us for a moment. You've been turned away from our interaction for a little while. In face-to-face hospitality, appropriate eye contact and visual engagement can help another person feel heard and respected. You don't need to stare at someone constantly, but try turning back toward the interaction and staying visually present.",
      true
    );


    console.log(
      "Observed orientation:",
      orientation
    );
  }


  async handleOrientationCorrected() {

    this.waitingForOrientationCorrection =
      false;


    this.correctionSince =
      null;


    this.setTrainingState(
      "ACTIVE"
    );


    this.setStatus(
      "Session active."
    );


    await this.speakImmediateCoach(
      "There you go. That's a more visually engaged presence. Let's continue.",
      true
    );
  }


  async handlePostureConcern() {

    if (this.coachIntervening) {
      return;
    }


    this.lastPostureCoach =
      Date.now();


    this.postureIssueSince =
      null;


    this.waitingForPostureCorrection =
      true;


    this.correctionSince =
      null;


    this.setTrainingState(
      "WAITING_FOR_CORRECTION"
    );


    this.setStatus(
      "NEXIVRA is coaching physical presence."
    );


    await this.speakImmediateCoach(
      "Let's pause for a moment and work on physical presence. Try moving into a comfortable, more open and upright position. In hospitality, posture can influence how engaged and approachable we appear to another person. Find a position that feels natural and professional for you.",
      true
    );
  }


  async handlePostureCorrected() {

    this.waitingForPostureCorrection =
      false;


    this.correctionSince =
      null;


    this.setTrainingState(
      "ACTIVE"
    );


    this.setStatus(
      "Session active."
    );


    await this.speakImmediateCoach(
      "That's better. Notice how that creates a more open presence. Let's keep going.",
      true
    );
  }


  /*
   * =========================================================
   * DIRECT LIVE COACHING BRIDGE
   * =========================================================
   */

async speakImmediateCoach(
  text,
  resumeVoice = true
) {

  if (
    !this.session ||
    this.coachIntervening
  ) {
    return;
  }


  this.coachIntervening =
    true;


  try {

    /*
     * Stop whatever Elenora is currently saying.
     *
     * Do NOT stop voiceChat here. Keeping voiceChat active
     * prevents the learner microphone from being shut down
     * during live coaching.
     */

    if (
      typeof this.session.interrupt ===
      "function"
    ) {

      try {

        this.session.interrupt();


        console.log(
          "NEXIVRA LIVE COACH: interrupt command sent"
        );

      } catch (error) {

        console.warn(
          "AVATAR INTERRUPT WARNING:",
          error
        );
      }
    }


    /*
     * Give the avatar a short moment to clear the current
     * response before sending the deterministic coaching line.
     *
     * session.interrupt() does not return a Promise in the
     * current HeyGen SDK, so awaiting it would not actually
     * wait for the speech to clear.
     */

    await this.delay(
      500
    );


    /*
     * Speak the exact coaching text.
     */

    if (
      typeof this.session.repeat ===
      "function"
    ) {

      this.session.repeat(
        text
      );


      console.log(
        "NEXIVRA LIVE COACH SPOKEN:",
        text
      );

    } else {

      console.error(
        "NEXIVRA LIVE COACH ERROR: session.repeat is unavailable"
      );
    }


    /*
     * Allow enough time for the coaching message to be
     * delivered before releasing the live-coaching lock.
     *
     * Voice chat remains active throughout.
     */

    const words =
      text
        .trim()
        .split(/\s+/)
        .length;


    const speechMs =
      Math.max(
        3000,
        (
          words /
          150
        ) *
        60000 +
        1200
      );


    await this.delay(
      speechMs
    );


  } catch (error) {

    console.error(
      "LIVE COACHING ERROR:",
      error
    );


  } finally {

    this.coachIntervening =
      false;
  }
}


  /*
   * =========================================================
   * LEARNER AUDIO MONITOR
   * =========================================================
   */

  async startLearnerAudioMonitor(
    stream
  ) {

    try {

      const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;


      if (!AudioContextClass) {
        return;
      }


      this.learnerAudioContext =
        new AudioContextClass();


      if (
        this.learnerAudioContext
          .state ===
        "suspended"
      ) {

        await this.learnerAudioContext
          .resume();
      }


      this.learnerSource =
        this.learnerAudioContext
          .createMediaStreamSource(
            stream
          );


      this.learnerAnalyser =
        this.learnerAudioContext
          .createAnalyser();


      this.learnerAnalyser.fftSize =
        1024;


      this.learnerAnalyser
        .smoothingTimeConstant =
        0.55;


      this.learnerSource.connect(
        this.learnerAnalyser
      );


      const samples =
        new Float32Array(
          this.learnerAnalyser
            .fftSize
        );


      const monitorStartedAt =
        Date.now();


      this.learnerCalibrationSamples = [];

      this.learnerCalibrationComplete = false;

      this.learnerSpeechAboveSince = null;

      this.learnerSpeechBelowSince = null;


      this.learnerAudioTimer =
        setInterval(
          () => {

            if (!this.learnerAnalyser) {
              return;
            }


            this.learnerAnalyser
              .getFloatTimeDomainData(
                samples
              );


            const rms =
              this.calculateRms(
                samples
              );


            const now =
              Date.now();


            /*
             * Calibrate against the learner's actual microphone
             * and room instead of depending on one hard-coded
             * RMS value for every computer.
             */

            if (!this.learnerCalibrationComplete) {

              this.learnerCalibrationSamples.push(
                rms
              );


              if (
                (
                  now -
                  monitorStartedAt
                ) >=
                  this.thresholds
                    .learnerCalibrationMs
              ) {

                const sorted =
                  [
                    ...this.learnerCalibrationSamples
                  ].sort(
                    (a, b) => a - b
                  );


                const quietCount =
                  Math.max(
                    1,
                    Math.floor(
                      sorted.length * 0.6
                    )
                  );


                const quietSamples =
                  sorted.slice(
                    0,
                    quietCount
                  );


                const quietAverage =
                  quietSamples.reduce(
                    (sum, value) =>
                      sum + value,
                    0
                  ) /
                  quietSamples.length;


                this.learnerNoiseFloor =
                  Math.max(
                    0.002,
                    quietAverage
                  );


                const adaptiveStart =
                  Math.max(
                    this.thresholds
                      .learnerSpeechThresholdFloor,
                    this.learnerNoiseFloor *
                      2.4 +
                      0.004
                  );


                this.learnerSpeechStartThreshold =
                  Math.min(
                    this.thresholds
                      .learnerSpeechThresholdCeiling,
                    adaptiveStart
                  );


                this.learnerSpeechStopThreshold =
                  Math.max(
                    this.learnerNoiseFloor *
                      1.7 +
                      0.002,
                    this.learnerSpeechStartThreshold *
                      0.65
                  );


                this.learnerCalibrationComplete =
                  true;


                console.log(
                  "NEXIVRA LEARNER AUDIO: calibrated",
                  {
                    noiseFloor:
                      this.learnerNoiseFloor
                        .toFixed(4),
                    startThreshold:
                      this.learnerSpeechStartThreshold
                        .toFixed(4),
                    stopThreshold:
                      this.learnerSpeechStopThreshold
                        .toFixed(4)
                  }
                );
              }


              return;
            }


            /*
             * While quiet, require a short sustained rise above
             * the adaptive threshold before calling it speech.
             * This avoids reacting to tiny clicks and bumps.
             */

            if (!this.learnerMicSpeaking) {

              if (
                rms >=
                this.learnerSpeechStartThreshold
              ) {

                if (!this.learnerSpeechAboveSince) {

                  this.learnerSpeechAboveSince =
                    now;
                }


                if (
                  (
                    now -
                    this.learnerSpeechAboveSince
                  ) >=
                    this.thresholds
                      .learnerSpeechStartHoldMs
                ) {

                  this.learnerMicSpeaking =
                    true;

                  this.learnerSpeaking =
                    true;

                  this.learnerSpeechAboveSince =
                    null;

                  this.learnerSpeechBelowSince =
                    null;


                  console.log(
                    "NEXIVRA LEARNER AUDIO: speaking started",
                    "rms",
                    rms.toFixed(4),
                    "threshold",
                    this.learnerSpeechStartThreshold
                      .toFixed(4)
                  );


                  this.startInterruptionCandidate();
                }


              } else {

                this.learnerSpeechAboveSince =
                  null;
              }


              return;
            }


            /*
             * Once speech has started, use a lower stop threshold
             * and a brief hold time so normal pauses between words
             * do not chop one response into several fake events.
             */

            if (
              rms <=
              this.learnerSpeechStopThreshold
            ) {

              if (!this.learnerSpeechBelowSince) {

                this.learnerSpeechBelowSince =
                  now;
              }


              if (
                (
                  now -
                  this.learnerSpeechBelowSince
                ) >=
                  this.thresholds
                    .learnerSpeechStopHoldMs
              ) {

                this.learnerMicSpeaking =
                  false;

                this.learnerSpeaking =
                  false;

                this.learnerSpeechBelowSince =
                  null;

                this.learnerSpeechAboveSince =
                  null;


                console.log(
                  "NEXIVRA LEARNER AUDIO: speaking stopped",
                  "rms",
                  rms.toFixed(4)
                );


                this.finishInterruptionCandidate();
              }


            } else {

              this.learnerSpeechBelowSince =
                null;
            }

          },
          50
        );


    } catch (error) {

      console.warn(
        "LEARNER AUDIO MONITOR ERROR:",
        error
      );
    }
  }


  /*
   * =========================================================
   * AVATAR AUDIO MONITOR
   * =========================================================
   */

  async startAvatarAudioMonitor(
    stream
  ) {

    try {

      if (this.avatarAudioContext) {
        return;
      }


      const audioTracks =
        stream
          ?.getAudioTracks?.();


      if (
        !audioTracks ||
        !audioTracks.length
      ) {

        setTimeout(
          () => {

            if (
              !this.avatarAudioContext
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


      this.avatarAudioContext =
        new AudioContextClass();


      this.avatarSource =
        this.avatarAudioContext
          .createMediaStreamSource(
            stream
          );


      this.avatarAnalyser =
        this.avatarAudioContext
          .createAnalyser();


      this.avatarAnalyser.fftSize =
        1024;


      this.avatarAnalyser
        .smoothingTimeConstant =
        0.65;


      this.avatarSource.connect(
        this.avatarAnalyser
      );


      const samples =
        new Float32Array(
          this.avatarAnalyser
            .fftSize
        );


      this.avatarAudioTimer =
        setInterval(
          () => {

            if (!this.avatarAnalyser) {
              return;
            }


            this.avatarAnalyser
              .getFloatTimeDomainData(
                samples
              );


            const rms =
              this.calculateRms(
                samples
              );


            this.avatarSpeaking =
              rms >
              this.thresholds
                .avatarSpeechRms;


            this.evaluateSpeechOverlap();

          },
          100
        );


    } catch (error) {

      console.warn(
        "AVATAR AUDIO MONITOR ERROR:",
        error
      );
    }
  }


  calculateRms(samples) {

    let sum = 0;


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
   * =========================================================
   * INTERRUPTION DETECTION
   * =========================================================
   */

  startInterruptionCandidate() {

    if (
      !this.sessionActive ||
      this.sessionEnding ||
      this.coachIntervening ||
      this.trainingState !==
        "ACTIVE"
    ) {
      return;
    }


    /*
     * A possible interruption begins only when the learner
     * STARTS speaking while Elenora is already speaking.
     *
     * After that moment, we measure how long the learner keeps
     * talking. We do NOT require Elenora to keep talking too,
     * because LiveAvatar may naturally stop her as soon as the
     * learner begins speaking.
     */

    if (!this.avatarSpeaking) {
      return;
    }


    if (this.interruptionCandidateSince) {
      return;
    }


    this.interruptionCandidateSince =
      Date.now();


    console.log(
      "NEXIVRA INTERRUPTION: candidate started"
    );
  }


  finishInterruptionCandidate() {

    if (!this.interruptionCandidateSince) {
      return;
    }


    const now =
      Date.now();


    const duration =
      now -
      this.interruptionCandidateSince;


    this.interruptionCandidateSince =
      null;


    console.log(
      "NEXIVRA INTERRUPTION: learner response duration",
      duration
    );


    /*
     * Short acknowledgments should normally finish below this
     * threshold and are ignored. A sustained learner response
     * that began before Elenora finished counts as one
     * interruption event.
     */

    if (
      duration <
      this.thresholds
        .minimumOverlapMs
    ) {

      console.log(
        "NEXIVRA INTERRUPTION: ignored as brief acknowledgment"
      );

      return;
    }


    this.interruptionEvents.push(
      {
        time: now,
        duration
      }
    );


    const cutoff =
      now -
      this.thresholds
        .interruptionWindowMs;


    this.interruptionEvents =
      this.interruptionEvents.filter(
        (event) =>
          event.time >= cutoff
      );


    console.log(
      "NEXIVRA INTERRUPTION: qualifying interruption",
      this.interruptionEvents.length
    );


    this.checkInterruptionPattern();
  }


  checkInterruptionPattern() {

    const now =
      Date.now();


    if (
      this.interruptionEvents.length <
      this.thresholds
        .interruptionsBeforeCoach
    ) {
      return;
    }


    if (
      (
        now -
        this.lastInterruptionCoach
      ) <
      this.thresholds
        .interruptionCooldownMs
    ) {
      return;
    }


    if (
      this.trainingState !==
      "ACTIVE"
    ) {
      return;
    }


    this.lastInterruptionCoach =
      now;


    this.interruptionEvents =
      [];


    this.handleInterruptionCoaching();
  }


  async handleInterruptionCoaching() {

    this.setTrainingState(
      "LISTENING_COACHING"
    );


    this.setStatus(
      "NEXIVRA is coaching listening skills."
    );


    await this.speakImmediateCoach(
      "I'm going to pause us for a second. You've started responding before I've finished speaking a few times. In hospitality, allowing another person to finish helps them feel heard and gives us the chance to fully understand before we respond. Brief acknowledgments are perfectly natural, but let's practice allowing the speaker to finish their thought before beginning our full response.",
      true
    );


    this.setTrainingState(
      "ACTIVE"
    );


    this.setStatus(
      "Session active."
    );
  }


  /*
   * =========================================================
   * FINAL VISUAL SUMMARY
   * =========================================================
   */

  buildVisualSummary() {

    const m =
      this.metrics;


    const samples =
      Math.max(
        m.samples,
        1
      );


    const facePercent =
      Math.round(
        (
          m.faceDetectedSamples /
          samples
        ) *
        100
      );


    const posePercent =
      Math.round(
        (
          m.poseDetectedSamples /
          samples
        ) *
        100
      );


    const facingPercent =
      Math.round(
        (
          m.facingForwardSamples /
          samples
        ) *
        100
      );


    const framePercent =
      Math.round(
        (
          m.inFrameSamples /
          samples
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
- ${m.lookAwayEvents} transition(s) away from forward-facing orientation were observed.
- Final visible head orientation: ${m.headOrientation}.
- Final visible upper-body alignment: ${m.posture}.

Use these observations only as supplemental coaching context.

Do not infer emotion, confidence, nervousness, honesty, deception, personality, intent, motivation, attentiveness, disability, psychological state, or medical condition.

Do not equate camera-facing behavior with perfect eye contact.

Do not treat looking away as inherently negative.

Natural conversation includes looking away.

Do not use these measurements as a score.

When visual behavior is relevant, describe only what was observable and how it could potentially affect another person's experience.

Do not read technical percentages aloud unless the learner specifically asks.
    `.trim();
  }


  buildFinalFeedbackPrompt() {

    return `
COACHING REQUEST:

The learner has completed the current hospitality practice.

Give concise integrated coaching based on:

1. The conversation.
2. The learner's verbal responses.
3. Any visual-presence coaching that occurred.
4. Any listening or interruption coaching that occurred.
5. The final visual observations.

Begin with what the learner did effectively.

Then identify one or two meaningful opportunities to strengthen.

Do not mention technical monitoring, MediaPipe, camera percentages, microphone detection, automated events, or system messages.

Do not say the learner failed.

Use supportive Legacy Edge Partners coaching language.

Keep the feedback conversational, specific, constructive, and concise.
    `.trim();
  }


  /*
   * =========================================================
   * TEXT FALLBACK
   * =========================================================
   */

  async sendTextMessage() {

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
        "Please wait for NEXIVRA to connect."
      );

      return;
    }


    try {

      this.session.message(
        message
      );


      input.value =
        "";


      this.setStatus(
        "NEXIVRA is responding..."
      );


    } catch (error) {

      console.error(
        "TEXT ERROR:",
        error
      );
    }
  }


  /*
   * =========================================================
   * CLEANUP
   * =========================================================
   */

  stopLearnerAudioMonitor() {

    if (this.learnerAudioTimer) {

      clearInterval(
        this.learnerAudioTimer
      );

      this.learnerAudioTimer =
        null;
    }


    if (this.learnerSource) {

      try {
        this.learnerSource.disconnect();
      } catch (error) {}

      this.learnerSource = null;
    }


    this.learnerAnalyser = null;


    if (this.learnerAudioContext) {

      try {
        this.learnerAudioContext.close();
      } catch (error) {}

      this.learnerAudioContext = null;
    }


    this.learnerSpeaking =
      false;


    this.learnerMicSpeaking =
      false;


    this.learnerSpeechAboveSince =
      null;


    this.learnerSpeechBelowSince =
      null;


    this.learnerCalibrationSamples =
      [];


    this.learnerCalibrationComplete =
      false;
  }


  stopAvatarAudioMonitor() {

    if (this.avatarAudioTimer) {

      clearInterval(
        this.avatarAudioTimer
      );

      this.avatarAudioTimer =
        null;
    }


    if (this.avatarSource) {

      try {
        this.avatarSource.disconnect();
      } catch (error) {}

      this.avatarSource = null;
    }


    this.avatarAnalyser = null;


    if (this.avatarAudioContext) {

      try {
        this.avatarAudioContext.close();
      } catch (error) {}

      this.avatarAudioContext = null;
    }


    this.avatarSpeaking =
      false;
  }


  stopCamera() {

    const learnerVideo =
      this.shadowRoot.getElementById(
        "learnerVideo"
      );

    const learnerPreview =
      this.shadowRoot.getElementById(
        "learnerPreview"
      );


    if (this.cameraStream) {

      this.cameraStream
        .getTracks()
        .forEach(
          (track) =>
            track.stop()
        );


      this.cameraStream =
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


  delay(ms) {

    return new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          ms
        )
    );
  }


  disconnectedCallback() {

    if (this.attachTimer) {

      clearInterval(
        this.attachTimer
      );

      this.attachTimer =
        null;
    }


    this.stopVisualAnalysis();

    this.stopLearnerAudioMonitor();

    this.stopAvatarAudioMonitor();

    this.stopCamera();


    if (this.faceLandmarker) {

      try {
        this.faceLandmarker.close();
      } catch (error) {}

      this.faceLandmarker =
        null;
    }


    if (this.poseLandmarker) {

      try {
        this.poseLandmarker.close();
      } catch (error) {}

      this.poseLandmarker =
        null;
    }


    if (this.session) {

      this.session
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


    this.session =
      null;


    this.sessionActive =
      false;


    this.sessionEnding =
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
