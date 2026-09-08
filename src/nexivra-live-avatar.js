                                    ideal:
                                        720
                                }
                            }
                        }
                    );


            this._cameraStream =
                mediaStream;


            learnerVideo.srcObject =
                mediaStream;


            await learnerVideo.play();


            learnerPreview.classList
                .add(
                    "active"
                );


            /*
             * Browser microphone permission is now
             * established. LiveAvatar manages the
             * microphone used for conversation.
             */

            mediaStream
                .getAudioTracks()
                .forEach(
                    (track) => {

                        track.stop();

                    }
                );


            /*
             * Start visual analysis.
             */

            this.setStatus(
                "Starting live coaching..."
            );


            await this.initializeVisualAnalysis();


            this.startVisualAnalysis();


            /*
             * Start voice conversation.
             */

            await this._session
                .voiceChat
                .start();


            this._learnerSessionActive =
                true;


            sessionButton.disabled =
                false;


            sessionButton.textContent =
                "End Session";


            sessionButton.classList
                .add(
                    "session-active"
                );


            this.setTrainingState(
                "ACTIVE"
            );


            this.setStatus(
                "Session active."
            );


            console.log(
                "NEXIVRA live coaching session started."
            );


        } catch (error) {

            console.error(
                "NEXIVRA SESSION START ERROR:",
                error
            );


            sessionButton.disabled =
                false;


            this.stopVisualAnalysis();


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


    /*
     * =====================================================
     * LIVE VISUAL ANALYSIS
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


        this._visualMetrics =
            this.createEmptyVisualMetrics();


        this.resetLiveEventTracking();


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
            "NEXIVRA live visual awareness started."
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
    }


    analyzeLearnerFrame() {

        if (
            !this._visualAnalysisRunning ||
            !this._learnerSessionActive
        ) {

            return;

        }


        const video =
            this.shadowRoot
                .getElementById(
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


        const poseLandmarks =
            poseResult?.landmarks?.[0];


        const faceDetected =
            Boolean(
                faceLandmarks &&
                faceLandmarks.length
            );


        const poseDetected =
            Boolean(
                poseLandmarks &&
                poseLandmarks.length
            );


        metrics.faceDetected =
            faceDetected;


        metrics.poseDetected =
            poseDetected;


        let faceData = {

            orientation:
                "No face",

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


        /*
         * Now convert raw measurements into
         * meaningful live coaching events.
         */

        this.evaluateLiveVisualEvents(
            {
                faceDetected,
                poseDetected,
                faceData,
                posture:
                    metrics.posture
            }
        );
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


        return {

            orientation,

            facingForward:
                orientation ===
                "Forward",

            inFrame:
                nose.x > 0.08 &&
                nose.x < 0.92 &&
                nose.y > 0.08 &&
                nose.y < 0.92
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


    /*
     * =====================================================
     * LIVE EVENT ENGINE
     * =====================================================
     */

    evaluateLiveVisualEvents(
        observation
    ) {

        if (
            this._trainingState ===
                "ENDING"
        ) {

            return;

        }


        const now =
            Date.now();


        const learnerVisible =
            observation.faceDetected ||
            observation.poseDetected;


        /*
         * -------------------------------------------------
         * LEARNER ABSENT
         * -------------------------------------------------
         */

        if (!learnerVisible) {

            this._returnStartedAt =
                null;


            if (
                this._absenceStartedAt ===
                null
            ) {

                this._absenceStartedAt =
                    now;

            }


            if (
                this._trainingState ===
                    "ACTIVE" &&
                now -
                    this._absenceStartedAt >=
                    this._thresholds.absent
            ) {

                this.handleLearnerAbsent();

            }


            return;
        }


        /*
         * Learner is visible again.
         */

        this._absenceStartedAt =
            null;


        if (
            this._trainingState ===
                "PAUSED_ABSENT"
        ) {

            if (
                this._returnStartedAt ===
                    null
            ) {

                this._returnStartedAt =
                    now;

            }


            if (
                now -
                    this._returnStartedAt >=
                    this._thresholds.returned
            ) {

                this.handleLearnerReturned();

            }


            return;
        }


        this._returnStartedAt =
            null;


        /*
         * Don't start another visual coaching
         * intervention while one is already active.
         */

        if (
            this._trainingState !==
                "ACTIVE" &&
            this._trainingState !==
                "WAITING_FOR_CORRECTION"
        ) {

            return;
        }


        /*
         * -------------------------------------------------
         * ORIENTATION / VISUAL ENGAGEMENT
         * -------------------------------------------------
         */

        if (
            observation.faceDetected &&
            !observation.faceData
                .facingForward
        ) {

            this._visualCorrectionStartedAt =
                null;


            if (
                this._turnedAwayStartedAt ===
                    null
            ) {

                this._turnedAwayStartedAt =
                    now;

            }


            const cooldownPassed =
                now -
                    this._lastVisualCoachingAt >=
                    this._thresholds
                        .visualCooldown;


            if (
                !this._waitingForOrientationCorrection &&
                cooldownPassed &&
                now -
                    this._turnedAwayStartedAt >=
                    this._thresholds
                        .turnedAway
            ) {

                this.handleSustainedTurnAway(
                    observation
                        .faceData
                        .orientation
                );

            }

        } else {

            this._turnedAwayStartedAt =
                null;


            if (
                this._waitingForOrientationCorrection
            ) {

                if (
                    this._visualCorrectionStartedAt ===
                        null
                ) {

                    this._visualCorrectionStartedAt =
                        now;

                }


                if (
                    now -
                        this._visualCorrectionStartedAt >=
                        this._thresholds
                            .orientationCorrection
                ) {

                    this.handleOrientationCorrected();

                }

            } else {

                this._visualCorrectionStartedAt =
                    null;

            }
        }


        /*
         * -------------------------------------------------
         * POSTURE / PHYSICAL PRESENCE
         * -------------------------------------------------
         */

        if (
            observation.posture ===
                "Leaning"
        ) {

            if (
                this._postureIssueStartedAt ===
                    null
            ) {

                this._postureIssueStartedAt =
                    now;

            }


            const cooldownPassed =
                now -
                    this._lastPostureCoachingAt >=
                    this._thresholds
                        .postureCooldown;


            if (
                !this._waitingForPostureCorrection &&
                cooldownPassed &&
                now -
                    this._postureIssueStartedAt >=
                    this._thresholds
                        .posture
            ) {

                this.handlePostureIssue();

            }

        } else {

            this._postureIssueStartedAt =
                null;


            if (
                this._waitingForPostureCorrection
            ) {

                this.handlePossiblePostureCorrection(
                    now
                );

            }
        }
    }


    /*
     * =====================================================
     * LIVE VISUAL INTERVENTIONS
     * =====================================================
     */

    handleLearnerAbsent() {

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


        this.sendCoachEvent(`
LIVE TRAINING EVENT:

The learner has not been visible in the camera for several seconds.

Pause the current training interaction.

Briefly tell the learner that you will wait for them to return.

Do not continue teaching, ask the next training question, or advance the scenario until a learner-returned event is received.

Do not infer why the learner stepped away.
        `);


        console.log(
            "NEXIVRA EVENT: learner absent."
        );
    }


    handleLearnerReturned() {

        this._returnStartedAt =
            null;


        this.setTrainingState(
            "ACTIVE"
        );


        this.setStatus(
            "Session active."
        );


        this.sendCoachEvent(`
LIVE TRAINING EVENT:

The learner is visible again and has remained visible long enough to confirm they have returned.

Briefly welcome the learner back.

Resume the training interaction from the point where it was paused.

Do not restart the entire lesson unless necessary.
        `);


        console.log(
            "NEXIVRA EVENT: learner returned."
        );
    }


    handleSustainedTurnAway(
        orientation
    ) {

        this._lastVisualCoachingAt =
            Date.now();


        this._waitingForOrientationCorrection =
            true;


        this.setTrainingState(
            "COACHING_VISUAL"
        );


        this.setStatus(
            "NEXIVRA is coaching visual presence."
        );


        this.sendCoachEvent(`
LIVE VISUAL COACHING EVENT:

The learner's head has remained visibly oriented ${orientation.toLowerCase()} rather than approximately toward the interaction for a sustained period.

Pause the training content briefly.

Teach the importance of appropriate visual engagement and eye contact in face-to-face hospitality interactions.

Explain that appropriate eye contact and facing the person can help communicate presence, listening, and respect.

Do not claim the learner is distracted, uninterested, nervous, dishonest, or inattentive.

Do not insist on constant eye contact.

Acknowledge that natural conversation includes looking away and that appropriate eye contact can vary by person, culture, accessibility needs, and situation.

Ask the learner to reorient toward the interaction so they can practice a more engaged physical presence.

Then wait for a correction event before continuing the training.
        `);


        this.setTrainingState(
            "WAITING_FOR_CORRECTION"
        );


        console.log(
            "NEXIVRA EVENT: sustained orientation away."
        );
    }


    handleOrientationCorrected() {

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


        this.sendCoachEvent(`
LIVE VISUAL CORRECTION EVENT:

The learner has reoriented toward the interaction and maintained that position long enough to confirm the adjustment.

Briefly acknowledge the improvement in visual presence.

Then continue the training from where it paused.

Keep the acknowledgment encouraging and concise.
        `);


        console.log(
            "NEXIVRA EVENT: orientation corrected."
        );
    }


    handlePostureIssue() {

        this._lastPostureCoachingAt =
            Date.now();


        this._waitingForPostureCorrection =
            true;


        this.setTrainingState(
            "COACHING_VISUAL"
        );


        this.setStatus(
            "NEXIVRA is coaching physical presence."
        );


        this.sendCoachEvent(`
LIVE VISUAL COACHING EVENT:

The learner's visible shoulder alignment has remained noticeably uneven or leaning for a sustained period.

Pause the training content briefly.

Coach the learner on professional physical presence.

Explain that an open, engaged posture can influence how another person experiences the interaction.

Do not demand rigid posture.

Do not infer laziness, confidence, mood, disability, health, or attitude.

Frame the coaching as an opportunity to experiment with a more open and engaged physical presence appropriate to the learner's abilities and circumstances.

Ask the learner to adjust if they comfortably can.

Wait for the visual system to confirm a sustained adjustment before continuing.
        `);


        this.setTrainingState(
            "WAITING_FOR_CORRECTION"
        );


        console.log(
            "NEXIVRA EVENT: posture coaching."
        );
    }


    handlePossiblePostureCorrection(
        now
    ) {

        if (
            this._visualCorrectionStartedAt
                                                    720
                                }
                            }
                        }
                    );


            /*
             * Keep the combined media stream.
             * Video drives the learner preview.
             * Audio is used for interruption detection.
             */

            this._cameraStream =
                mediaStream;


            learnerVideo.srcObject =
                mediaStream;


            await learnerVideo.play();


            learnerPreview.classList
                .add(
                    "active"
                );


            /*
             * Initialize visual coaching.
             */

            this.setStatus(
                "Starting live coaching awareness..."
            );


            await this.initializeVisualAnalysis();


            this.startVisualAnalysis();


            /*
             * Start microphone activity monitoring.
             *
             * This does NOT transcribe the learner.
             * It only helps detect meaningful speech
             * overlap while NEXIVRA is speaking.
             */

            await this.startMicrophoneMonitor(
                mediaStream
            );


            /*
             * Start LiveAvatar voice conversation.
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


            sessionButton.classList
                .add(
                    "session-active"
                );


            this.setStatus(
                "Session active."
            );


            console.log(
                "NEXIVRA live coaching session active."
            );


        } catch (error) {

            console.error(
                "NEXIVRA SESSION START ERROR:",
                error
            );


            sessionButton.disabled =
                false;


            this.stopVisualAnalysis();

            this.stopMicrophoneMonitor();

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


    /*
     * =====================================================
     * LIVE EVENT RESET
     * =====================================================
     */

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
     * MEDIAPIPE INITIALIZATION
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


    /*
     * =====================================================
     * VISUAL ANALYSIS LOOP
     * =====================================================
     */

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


        this._visualAnalysisTimer =
            setInterval(
                () => {

                    this.analyzeLearnerFrame();

                },
                500
            );


        console.log(
            "NEXIVRA live visual analysis started."
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
            this.shadowRoot
                .getElementById(
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
         * -------------------------------------------------
         * FACE
         * -------------------------------------------------
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
                "No face detected";


            metrics.previousFacingForward =
                false;
        }


        /*
         * -------------------------------------------------
         * POSE
         * -------------------------------------------------
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


        /*
         * Evaluate meaningful live events.
         */

        this.evaluateLiveVisualEvents(
            {
                faceDetected,
                poseDetected,
                faceData,
                postureData
            }
        );
    }


    /*
     * =====================================================
     * FACE ORIENTATION
     * =====================================================
     */

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


    /*
     * =====================================================
     * UPPER-BODY POSTURE
     * =====================================================
     */

    evaluatePosture(
        landmarks
    ) {

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


        /*
         * Estimate visible torso compression
         * when hips are available.
         *
         * This is only a rough visual cue and is
         * never treated as medical or diagnostic.
         */

        let torsoHeight =
            null;


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


            torsoHeight =
                Math.abs(
                    hipCenterY -
                    shoulderCenterY
                );
        }


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
            torsoHeight !== null &&
            torsoHeight < 0.18
        ) {

            return {

                label:
                    "Compressed upper-body posture",

                needsCoaching:
                    true
            };
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
         * -------------------------------------------------
         * LEARNER ABSENT
         * -------------------------------------------------
         */

        if (
            !learnerVisible
        ) {

            this._returnStartedAt =
                null;


            if (
                !this._absenceStartedAt
            ) {

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

                this.handleLearnerAbsent();

            }


            return;
        }


        /*
         * Learner is visible.
         */

        this._absenceStartedAt =
            null;


        /*
         * -------------------------------------------------
         * RETURN AFTER ABSENCE
         * -------------------------------------------------
         */

        if (
            this._trainingState ===
            "PAUSED_ABSENT"
        ) {

            if (
                !this._returnStartedAt
            ) {

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
         * Don't launch another coaching event
         * while NEXIVRA is already coaching.
         */

        if (
            this._trainingState !==
            "ACTIVE" &&
            this._trainingState !==
            "WAITING_FOR_CORRECTION"
        ) {

            return;
        }


        /*
         * -------------------------------------------------
         * WAITING FOR ORIENTATION CORRECTION
         * -------------------------------------------------
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
         * -------------------------------------------------
         * WAITING FOR POSTURE CORRECTION
         * -------------------------------------------------
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


        /*
         * -------------------------------------------------
         * SUSTAINED ORIENTATION AWAY
         * -------------------------------------------------
         */

        if (
            observation.faceDetected &&
            !observation.faceData
                .facingForward
        ) {

            if (
                !this._turnedAwayStartedAt
            ) {

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

                this.handleSustainedOrientationAway(
                    observation.faceData
                        .orientation
                );

            }

        } else {

            this._turnedAwayStartedAt =
                null;
        }


        /*
         * -------------------------------------------------
         * SUSTAINED POSTURE CONCERN
         * -------------------------------------------------
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


            const postureCooldownComplete =
                (
                    now -
                    this._lastPostureCoachingAt
                ) >=
                    this._thresholds
                        .postureCooldown;


            if (
                postureCooldownComplete &&
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
     * LIVE VISUAL COACHING ACTIONS
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


        /*
         * If the SDK provides an interrupt method,
         * stop the current avatar response first.
         */

        try {

            if (
                this._session &&
                typeof this._session
                    .interrupt ===
                    "function"
            ) {

                await this._session
                    .interrupt();

            }

        } catch (error) {

            console.warn(
                "NEXIVRA interrupt warning:",
                error
            );
        }


        this.sendLiveCoachInstruction(
            `
LIVE TRAINING EVENT:

The learner has not been visibly present in the camera view for several seconds.

Pause the current training interaction.

Briefly tell the learner that you will wait until they return.

Do not continue teaching, questioning, role-play, scoring, or scenario progression until you receive a LEARNER RETURNED event.

Do not speculate about why the learner stepped away.
            `
        );
    }


    handleLearnerReturned() {

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


        this.sendLiveCoachInstruction(
            `
LIVE TRAINING EVENT:

The learner has returned and has been visibly present again for a stable period.

Briefly welcome them back.

Resume the training from the point where it was paused.

Do not restart the entire lesson unless necessary.
            `
        );
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


        this.sendLiveCoachInstruction(
            `
LIVE VISUAL COACHING EVENT:

The learner has maintained a visible head orientation away from the trainer for a sustained period.

Current observed orientation: ${orientation}.

Pause the current training content briefly.

Coach the learner on visual engagement and the role appropriate eye contact can play in helping another person feel heard, respected, and attended to during face-to-face hospitality interactions.

Do NOT claim the learner was distracted, uninterested, nervous, dishonest, or inattentive.

Do NOT demand constant eye contact.

Explain that natural conversation includes looking away, but sustained orientation away from the person speaking can affect how the interaction is experienced.

Ask the learner to reorient toward the interaction.

Then wait for the system to confirm that the visual adjustment has been maintained before continuing.
            `
        );
    }


    handleOrientationCorrected() {

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


        this.sendLiveCoachInstruction(
            `
LIVE VISUAL COACHING EVENT:

The learner has maintained a more forward-facing orientation for a stable period after the visual-presence coaching.

Briefly acknowledge the adjustment positively.

Then continue the training from where you paused.

Do not overpraise or make the correction feel punitive.
            `
        );
    }


    handlePostureConcern(
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


        this.sendLiveCoachInstruction(
            `
LIVE VISUAL COACHING EVENT:

A sustained visible upper-body alignment pattern has been observed that may reduce the learner's professional or engaged physical presence.

Observed pattern: ${postureLabel}.

Pause the training briefly.

Coach the learner on maintaining an open, engaged, professional posture appropriate to their abilities and circumstances.

Explain that posture and physical presence can influence how another person experiences our communication.

Do NOT diagnose a medical, physical, emotional, or psychological reason for the posture.

Do NOT demand a rigid pose.

Invite the learner to adjust into a more open and comfortable professional position.

Wait for the system to confirm a stable adjustment before continuing.
            `
        );
    }


    handlePostureCorrected() {

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


        this.sendLiveCoachInstruction(
            `
LIVE VISUAL COACHING EVENT:

The learner has maintained a more open and level upper-body position for a stable period after posture coaching.

Briefly acknowledge the adjustment.

Then resume the training from where you paused.
            `
        );
    }


    sendLiveCoachInstruction(
        instruction
    ) {

        if (
            !this._session
        ) {

            return;
        }


        try {

            this._session.message(
                instruction.trim()
            );


            console.log(
                "NEXIVRA LIVE COACHING EVENT SENT:",
                instruction.trim()
            );


        } catch (error) {

            console.error(
                "NEXIVRA LIVE COACHING EVENT ERROR:",
                error
            );
        }
    }


    /*
     * =====================================================
     * MICROPHONE ACTIVITY / INTERRUPTION DETECTION
     * =====================================================
     */

    async startMicrophoneMonitor(
        mediaStream
    ) {

        try {

            const audioTracks =
                mediaStream
                    .getAudioTracks();


            if (
                !audioTracks.length
            ) {

                console.warn(
                    "NEXIVRA: No microphone track available for interruption monitoring."
                );

                return;
            }


            const AudioContextClass =
                window.AudioContext ||
                window.webkitAudioContext;


            if (
                !AudioContextClass
            ) {

                console.warn(
                    "NEXIVRA: Web Audio API unavailable."
                );

                return;
            }


            this._audioContext =
                new AudioContextClass();


            if (
                this._audioContext.state ===
                "suspended"
            ) {

                await this._audioContext
                    .resume();

            }


            this._micSource =
                this._audioContext
                    .createMediaStreamSource(
                        mediaStream
                    );


            this._audioAnalyser =
                this._audioContext
                    .createAnalyser();


            this._audioAnalyser
                .fftSize =
                    1024;


            this._audioAnalyser
                .smoothingTimeConstant =
                    0.65;


            this._micSource
                .connect(
                    this._audioAnalyser
                );


            const samples =
                new Float32Array(
                    this._audioAnalyser
                        .fftSize
                );


            /*
             * Poll microphone energy roughly
             * ten times per second.
             */

            this._micMonitorTimer =
                setInterval(
                    () => {

                        if (
                            !this._audioAnalyser ||
                            !this._learnerSessionActive
                        ) {

                            return;
                        }


                        this._audioAnalyser
                            .getFloatTimeDomainData(
                                samples
                            );


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


                        const rms =
                            Math.sqrt(
                                sum /
                                samples.length
                            );


                        /*
                         * Conservative speech-energy
                         * threshold.
                         *
                         * Echo cancellation is requested
                         * by the browser, but this threshold
                         * will still need real-world tuning.
                         */

                        const learnerSpeaking =
                            rms > 0.045;


                        this.handleLearnerAudioActivity(
                            learnerSpeaking
                        );


                    },
                    100
                );


            console.log(
                "NEXIVRA microphone overlap monitor active."
            );


        } catch (error) {

            console.warn(
                "NEXIVRA MICROPHONE MONITOR ERROR:",
                error
            );
        }
    }


    handleLearnerAudioActivity(
        learnerSpeaking
    ) {

        if (
            !this._learnerSessionActive ||
            this._endingSession
        ) {

            return;
        }


        /*
         * We only care about overlap while
         * NEXIVRA is speaking.
         */

        if (
            this._avatarSpeaking &&
            learnerSpeaking
        ) {

            if (
                !this._overlapStartedAt
            ) {

                this._overlapStartedAt =
                    Date.now();

            }


            return;
        }


        /*
         * If speech overlap just ended,
         * evaluate whether it was long enough
         * to qualify as a meaningful event.
         */

        if (
            this._overlapStartedAt
        ) {

            this.finishPossibleInterruption();

        }
    }


    finishPossibleInterruption() {

        if (
            !this._overlapStartedAt
        ) {

            return;
        }


        const now =
            Date.now();


        const overlapDuration =
            now -
            this._overlapStartedAt;


        this._overlapStartedAt =
            null;


        if (
            overlapDuration <
            this._interruptionThresholds
                .minimumOverlap
        ) {

            return;
        }


        this._interruptionEvents
            .push(
                {
                    time:
                        now,

                    duration:
                        overlapDuration
                }
            );


        /*
         * Keep only recent events.
         */

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


        console.log(
            "NEXIVRA meaningful overlap detected:",
            overlapDuration,
            "ms"
        );


        this.evaluateInterruptionPattern();
    }


    evaluateInterruptionPattern() {

        const now =
            Date.now();


        if (
            this._interruptionEvents
                .length <
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


    handleRepeatedInterruption() {

        this.setTrainingState(
            "COACHING_INTERRUPTION"
        );


        this.setStatus(
            "NEXIVRA is coaching listening skills."
        );


        this.sendLiveCoachInstruction(
            `
LIVE LISTENING COACHING EVENT:

The learner has produced multiple sustained speech-overlap events while you were still speaking during the recent interaction.

Treat this as a possible interruption pattern, but remain conversational and non-punitive.

Pause the current training point briefly.

Explain that in hospitality, allowing another person to finish speaking helps them feel heard and respected and helps us fully understand before responding.

Do not criticize normal brief acknowledgments such as "yes," "okay," or "I understand."

Frame this as practice in listening and response timing.

Ask the learner to allow the speaker to finish before beginning their next response.

Then continue the interaction naturally.

Do not say that an automated microphone detector reported them.
            `
        );


        /*
         * The learner does not need a special
         * physical correction for this event.
         *
         * Return to ACTIVE after a short coaching
         * window so other live monitoring continues.
         */

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


    stopMicrophoneMonitor() {

        if (
            this._micMonitorTimer
        ) {

            clearInterval(
                this._micMonitorTimer
            );


            this._micMonitorTimer =
                null;
        }


        if (
            this._micSource
        ) {

            try {

                this._micSource
                    .disconnect();

            } catch (error) {

                /*
                 * Ignore disconnect errors.
                 */

            }


            this._micSource =
                null;
        }


        this._audioAnalyser =
            null;


        if (
            this._audioContext
        ) {

            try {

                this._audioContext
                    .close();

            } catch (error) {

                /*
                 * Ignore close errors.
                 */

            }


            this._audioContext =
                null;
        }


        this._overlapStartedAt =
            null;
    }
    /*
     * =====================================================
     * END-OF-SESSION INTEGRATED COACHING
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
            this.shadowRoot
                .getElementById(
                    "sessionButton"
                );


        sessionButton.disabled =
            true;


        this.setTrainingState(
            "ENDING"
        );


        try {

            /*
             * Freeze live visual observations.
             */

            this.stopVisualAnalysis();


            /*
             * Stop interruption monitoring.
             */

            this.stopMicrophoneMonitor();


            /*
             * Build final visual summary.
             */

            const visualSummary =
                this.buildVisualSummary();


            console.log(
                "NEXIVRA FINAL VISUAL SUMMARY:",
                visualSummary
            );


            this.setStatus(
                "NEXIVRA is reviewing your practice..."
            );


            /*
             * Send final visual context.
             */

            this._session.message(
                visualSummary
            );


            await this.delay(
                800
            );


            /*
             * Ask for integrated verbal + visual feedback.
             */

            this._session.message(
                this.buildIntegratedFeedbackRequest()
            );


            this.setStatus(
                "NEXIVRA is preparing your coaching feedback..."
            );


            /*
             * Prototype feedback window.
             *
             * Later we can replace this fixed delay
             * with actual avatar speaking-state events.
             */

            await this.delay(
                18000
            );


        } catch (error) {

            console.error(
                "NEXIVRA END SESSION FEEDBACK ERROR:",
                error
            );


            this.setStatus(
                "NEXIVRA could not complete the final coaching review."
            );
        }


        /*
         * Shut down learner camera.
         */

        this.stopCameraOnly();


        /*
         * Stop LiveAvatar voice if supported.
         */

        try {

            if (
                this._session &&
                this._session.voiceChat &&
                typeof this._session
                    .voiceChat
                    .stop ===
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


        sessionButton.classList
            .remove(
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

The following information summarizes observable visual behavior from the learner's completed practice interaction.

OBSERVATIONS:

- Face was detected in approximately ${faceDetectedPercent}% of analyzed visual samples.
- Upper-body pose was detected in approximately ${poseDetectedPercent}% of analyzed visual samples.
- Learner remained within the central camera frame in approximately ${inFramePercent}% of analyzed samples.
- Learner's visible head orientation was approximately forward-facing in ${facingPercent}% of analyzed samples.
- ${metrics.lookAwayEvents} transition(s) away from a forward-facing head orientation were observed.
- Final visible head orientation: ${metrics.headOrientation}.
- Final visible upper-body alignment: ${metrics.posture}.

IMPORTANT RULES:

Use these observations only as supplemental coaching context.

Do not infer:
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

Do not equate camera-facing behavior with perfect eye contact.

Do not treat looking away as inherently negative.

Do not use any percentage or count above as a hospitality score or performance grade.

Natural conversation includes head movement and looking away.

When visual behavior is relevant, explain only what was observable and how it could potentially affect another person's experience.

Do not read technical percentages aloud unless the learner specifically asks for them.

Combine this information with the learner's actual verbal responses, choices, listening behavior, and hospitality performance.
        `.trim();
    }


    /*
     * =====================================================
     * INTEGRATED FEEDBACK REQUEST
     * =====================================================
     */

    buildIntegratedFeedbackRequest() {

        return `
COACHING REQUEST:

The learner has completed the current hospitality practice interaction.

Provide concise, integrated coaching using:

1. The conversation you just had with the learner.
2. The learner's verbal responses and decisions.
3. Any live coaching moments that occurred during the interaction.
4. The observable visual summary immediately provided before this request.

COACHING STRUCTURE:

First, identify what the learner did effectively.

Then identify one or two meaningful opportunities for improvement.

If listening or interruption coaching occurred, reinforce the importance of allowing others to finish speaking and fully understanding before responding.

If visual presence or posture was relevant, describe the observable behavior naturally and explain how it could potentially affect another person's experience.

Do not force visual feedback into the response if it is not useful.

Do not mention:
- MediaPipe
- camera metrics
- telemetry
- percentages
- microphone detection
- automated event detection
- system messages

Do not say the learner failed.

Use Legacy Edge Partners coaching language such as:

"That's a good start."

"One thing I'd work on..."

"One thing you could experiment with..."

"Here's another way to approach it..."

"This is an area we can strengthen."

Keep the coaching conversational, supportive, specific, and concise.

Speak directly to the learner as their NEXIVRA hospitality coach.
        `.trim();
    }


    /*
     * =====================================================
     * TEXT FALLBACK
     * =====================================================
     */

    async sendMessage() {

        const input =
            this.shadowRoot
                .getElementById(
                    "messageInput"
                );


        const message =
            input.value
                .trim();


        if (
            !message
        ) {

            return;
        }


        if (
            !this._session
        ) {

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
            this.shadowRoot
                .getElementById(
                    "learnerVideo"
                );


        const learnerPreview =
            this.shadowRoot
                .getElementById(
                    "learnerPreview"
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


        if (
            learnerVideo
        ) {

            learnerVideo.srcObject =
                null;

        }


        if (
            learnerPreview
        ) {

            learnerPreview
                .classList
                .remove(
                    "active"
                );

        }
    }


    /*
     * =====================================================
     * HELPERS
     * =====================================================
     */

    delay(
        milliseconds
    ) {

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
     * FULL COMPONENT CLEANUP
     * =====================================================
     */

    disconnectedCallback() {

        /*
         * Stop attach timer.
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
         * Stop visual engine.
         */

        this.stopVisualAnalysis();


        /*
         * Stop interruption monitor.
         */

        this.stopMicrophoneMonitor();


        /*
         * Stop camera.
         */

        this.stopCameraOnly();


        /*
         * Close face landmarker.
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
         * Close pose landmarker.
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
