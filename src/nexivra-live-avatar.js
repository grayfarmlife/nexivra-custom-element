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

    // Speech state comes directly from HeyGen events
    this.learnerSpeaking = false;
    this.avatarSpeaking = false;

    // Interruption tracking
    this.overlapSince = null;
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
       * HeyGen speech events
       *
       * These give NEXIVRA direct knowledge of when
       * Elenora and the learner begin and end speaking.
       * This replaces the old audio-volume guessing system.
       */

      this.session.on(
        AgentEventsEnum.AVATAR_SPEAK_STARTED,
        () => {

          this.avatarSpeaking = true;

          console.log(
            "NEXIVRA SPEECH EVENT: Elenora started speaking"
          );

          this.evaluateSpeechOverlap();
        }
      );


      this.session.on(
        AgentEventsEnum.AVATAR_SPEAK_ENDED,
        () => {

          this.avatarSpeaking = false;

          console.log(
            "NEXIVRA SPEECH EVENT: Elenora stopped speaking"
          );

          this.evaluateSpeechOverlap();
        }
      );


      this.session.on(
        AgentEventsEnum.USER_SPEAK_STARTED,
        () => {

          this.learnerSpeaking = true;

          console.log(
            "NEXIVRA SPEECH EVENT: Learner started speaking"
          );

          this.evaluateSpeechOverlap();
        }
      );


      this.session.on(
        AgentEventsEnum.USER_SPEAK_ENDED,
        () => {

          this.learnerSpeaking = false;

          console.log(
            "NEXIVRA SPEECH EVENT: Learner stopped speaking"
          );

          this.evaluateSpeechOverlap();
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

    this.interruptionEvents = [];

    this.learnerSpeaking = false;

    this.avatarSpeaking = false;
  }


 
