class NexivraHome extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          background: #020408;
          color: #ffffff;
          font-family:
            Inter,
            Arial,
            Helvetica,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        button {
          font-family: inherit;
        }

        .site {
          width: 100%;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 70% 10%,
              rgba(0, 145, 255, 0.12),
              transparent 28%
            ),
            radial-gradient(
              circle at 82% 14%,
              rgba(255, 120, 0, 0.08),
              transparent 22%
            ),
            #020408;
        }

        .container {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
        }

        /* =========================
           NAVIGATION
        ========================= */

        .nav {
          height: 84px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 20;
          border-bottom:
            1px solid rgba(255,255,255,0.04);
        }

        .logo {
          font-size: 24px;
          letter-spacing: 0.18em;
          font-weight: 700;
          color: #f2f6fb;
          position: relative;
        }

        .logo::after {
          content: "";
          width: 36px;
          height: 2px;
          display: inline-block;
          margin-left: 5px;
          vertical-align: middle;
          background:
            linear-gradient(
              90deg,
              #00bfff,
              #ff8500
            );
          box-shadow:
            0 0 12px rgba(0,180,255,.55);
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 30px;
          font-size: 13px;
          color: #a9b6c8;
        }

        .nav-links a {
          transition: 0.2s;
        }

        .nav-links a:hover {
          color: #ffffff;
        }

        .demo-button {
          padding: 11px 18px;
          border-radius: 7px;
          border:
            1px solid rgba(0,174,255,.8);
          background:
            rgba(0,132,255,.10);
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          box-shadow:
            0 0 18px rgba(0,157,255,.16);
          transition: .2s;
        }

        .demo-button:hover {
          background:
            rgba(0,145,255,.22);
          transform:
            translateY(-1px);
        }

        /* =========================
           HERO
        ========================= */

        .hero {
          min-height: 690px;
          position: relative;
          display: grid;
          align-items: center;
          border-bottom:
            1px solid rgba(0,149,255,.16);
        }

        .hero-grid {
          display: grid;
          grid-template-columns:
            0.9fr 1.1fr;
          gap: 20px;
          align-items: center;
        }

        .eyebrow {
          color: #65d5ff;
          letter-spacing: .34em;
          text-transform: uppercase;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 22px;
        }

        .headline {
          font-size:
            clamp(48px, 6.5vw, 88px);
          line-height: .95;
          font-weight: 800;
          letter-spacing: -.03em;
          margin: 0;
          text-transform: uppercase;
        }

        .headline span {
          display: block;
        }

        .headline .blue {
          background:
            linear-gradient(
              90deg,
              #007cff,
              #39dcff
            );
          -webkit-background-clip:
            text;
          -webkit-text-fill-color:
            transparent;
        }

        .headline .orange {
          background:
            linear-gradient(
              90deg,
              #27c8ff,
              #ff8c00
            );
          -webkit-background-clip:
            text;
          -webkit-text-fill-color:
            transparent;
        }

        .hero-copy {
          max-width: 610px;
          font-size: 18px;
          line-height: 1.6;
          color: #a8b5c8;
          margin-top: 27px;
        }

        .button-row {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 30px;
        }

        .primary {
          border: 0;
          background:
            linear-gradient(
              135deg,
              #0088ff,
              #29c5ff
            );
          color: #041019;
          padding: 14px 22px;
          border-radius: 7px;
          font-weight: 800;
          cursor: pointer;
          box-shadow:
            0 0 25px rgba(0,151,255,.22);
        }

        .secondary {
          border:
            1px solid rgba(0,174,255,.62);
          background:
            rgba(1,12,23,.6);
          color: #fff;
          padding: 13px 22px;
          border-radius: 7px;
          font-weight: 700;
          cursor: pointer;
        }

        .visual {
          min-height: 580px;
          position: relative;
          display: grid;
          place-items: center;
        }

        .orb {
          width: min(500px, 80vw);
          aspect-ratio: 1;
          border-radius: 50%;
          position: relative;
          display: grid;
          place-items: center;
          background:
            radial-gradient(
              circle,
              rgba(0,132,255,.10),
              rgba(0,0,0,.15) 55%,
              rgba(0,0,0,.75) 72%
            );
        }

        .orb::before {
          content: "";
          position: absolute;
          inset: 8%;
          border-radius: 50%;
          border-top:
            2px solid #15bfff;
          border-left:
            2px solid rgba(21,191,255,.45);
          border-right:
            2px solid #ff8700;
          border-bottom:
            2px solid rgba(255,135,0,.28);
          filter:
            drop-shadow(
              0 0 15px rgba(0,174,255,.3)
            );
          animation:
            rotateRing 16s linear infinite;
        }

        .orb::after {
          content: "";
          position: absolute;
          width: 3px;
          height: 115%;
          background:
            linear-gradient(
              to bottom,
              transparent,
              #13baff,
              transparent
            );
          opacity: .65;
          filter:
            drop-shadow(
              0 0 10px #00aaff
            );
        }

        @keyframes rotateRing {
          to {
            transform: rotate(360deg);
          }
        }

        .n-mark {
          position: relative;
          z-index: 4;
          font-size:
            clamp(130px, 22vw, 250px);
          font-weight: 900;
          font-style: italic;
          letter-spacing: -.13em;
          background:
            linear-gradient(
              135deg,
              #dae8f7 10%,
              #168dff 34%,
              #f7f7f7 54%,
              #ff8b00 82%
            );
          -webkit-background-clip:
            text;
          -webkit-text-fill-color:
            transparent;
          filter:
            drop-shadow(
              -4px 4px 10px rgba(0,152,255,.28)
            )
            drop-shadow(
              5px 2px 10px rgba(255,119,0,.15)
            );
        }

        .circuit-left,
        .circuit-right {
          position: absolute;
          width: 37%;
          height: 170px;
          opacity: .7;
        }

        .circuit-left {
          left: 0;
          top: 48%;
        }

        .circuit-right {
          right: 0;
          top: 52%;
        }

        .circuit-line {
          height: 1px;
          margin: 15px 0;
          position: relative;
        }

        .circuit-left .circuit-line {
          background:
            linear-gradient(
              90deg,
              transparent,
              #00b8ff
            );
        }

        .circuit-right .circuit-line {
          background:
            linear-gradient(
              90deg,
              #ff8500,
              transparent
            );
        }

        .circuit-line::after {
          content: "";
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          top: -2px;
        }

        .circuit-left
        .circuit-line::after {
          right: 0;
          background: #29d7ff;
          box-shadow:
            0 0 12px #00c3ff;
        }

        .circuit-right
        .circuit-line::after {
          left: 0;
          background: #ff8c00;
          box-shadow:
            0 0 12px #ff7600;
        }

        /* =========================
           SECTION GENERAL
        ========================= */

        .section {
          padding:
            105px 0;
          position: relative;
        }

        .section-label {
          text-align: center;
          color: #30c9ff;
          font-size: 11px;
          letter-spacing: .36em;
          text-transform: uppercase;
          font-weight: 700;
        }

        .section-title {
          text-align: center;
          font-size:
            clamp(34px, 4vw, 54px);
          line-height: 1.08;
          margin:
            14px auto 20px;
          max-width: 900px;
          text-transform: uppercase;
        }

        .section-copy {
          color: #97a5ba;
          max-width: 780px;
          margin: 0 auto;
          text-align: center;
          line-height: 1.7;
          font-size: 16px;
        }

        /* =========================
           ADVANTAGE
        ========================= */

        .feature-grid {
          margin-top: 60px;
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 0;
        }

        .feature {
          padding: 12px 30px 30px;
          text-align: center;
          border-right:
            1px solid rgba(255,255,255,.08);
        }

        .feature:last-child {
          border-right: 0;
        }

        .icon-ring {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          margin:
            0 auto 22px;
          display: grid;
          place-items: center;
          border:
            1px solid rgba(0,174,255,.65);
          box-shadow:
            inset 0 0 18px rgba(0,142,255,.09),
            0 0 16px rgba(0,142,255,.08);
          font-size: 28px;
        }

        .feature h3 {
          margin:
            0 0 12px;
          font-size: 17px;
        }

        .feature p {
          color: #8593a7;
          line-height: 1.55;
          font-size: 14px;
          margin: 0;
        }

        /* =========================
           HUMAN SECTION
        ========================= */

        .human-section {
          padding: 100px 0;
          background:
            linear-gradient(
              90deg,
              rgba(0,119,210,.045),
              rgba(0,0,0,0)
            );
          border-top:
            1px solid rgba(0,149,255,.09);
          border-bottom:
            1px solid rgba(0,149,255,.09);
        }

        .human-grid {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .human-title {
          margin: 0;
          font-size:
            clamp(40px, 5vw, 65px);
          line-height: 1.02;
          text-transform: uppercase;
        }

        .human-title .people {
          background:
            linear-gradient(
              90deg,
              #00baff,
              #ff8b00
            );
          -webkit-background-clip:
            text;
          -webkit-text-fill-color:
            transparent;
        }

        .human-copy {
          margin-top: 26px;
          color: #a0aec1;
          line-height: 1.7;
          font-size: 16px;
        }

        .human-visual {
          position: relative;
          min-height: 420px;
          border:
            1px solid rgba(0,157,255,.2);
          border-radius: 20px;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 50% 45%,
              rgba(0,139,255,.18),
              transparent 45%
            ),
            linear-gradient(
              135deg,
              #06111c,
              #020306 65%
            );
        }

        .human-face {
          position: absolute;
          left: 19%;
          top: 12%;
          width: 230px;
          height: 310px;
          border-radius:
            55% 45% 48% 52%;
          border-right:
            2px solid #ff8200;
          border-left:
            2px solid #00aaff;
          background:
            radial-gradient(
              circle at 65% 40%,
              rgba(255,128,0,.10),
              rgba(0,91,170,.14) 45%,
              rgba(0,0,0,.1)
            );
          filter:
            drop-shadow(
              0 0 20px rgba(0,129,255,.18)
            );
        }

        .human-word {
          position: absolute;
          right: 8%;
          color: #dce9f7;
          letter-spacing: .11em;
          font-size: 13px;
        }

        .hw1 { top: 18%; }
        .hw2 { top: 37%; }
        .hw3 { top: 57%; }
        .hw4 { top: 76%; }

        .human-word::before {
          content: "";
          width: 75px;
          height: 1px;
          position: absolute;
          right: calc(100% + 13px);
          top: 50%;
          background:
            linear-gradient(
              90deg,
              transparent,
              #00aeff
            );
        }

        /* =========================
           INDUSTRIES
        ========================= */

        .industry-grid {
          margin-top: 54px;
          display: grid;
          grid-template-columns:
            repeat(5, 1fr);
          gap: 14px;
        }

        .industry {
          min-height: 280px;
          border:
            1px solid rgba(0,148,255,.22);
          border-radius: 13px;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          padding: 22px;
          position: relative;
          background:
            linear-gradient(
              to top,
              rgba(0,4,10,.98),
              rgba(0,13,25,.42)
            ),
            radial-gradient(
              circle at 60% 20%,
              rgba(0,145,255,.20),
              transparent 60%
            );
        }

        .industry::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              135deg,
              rgba(0,160,255,.04),
              rgba(255,134,0,.04)
            );
        }

        .industry-content {
          position: relative;
          z-index: 2;
        }

        .industry h3 {
          margin:
            0 0 7px;
          font-size: 17px;
        }

        .industry p {
          margin: 0;
          font-size: 13px;
          line-height: 1.45;
          color: #9ca9bb;
        }

        /* =========================
           IMPACT
        ========================= */

        .impact {
          padding: 90px 0;
          border-top:
            1px solid rgba(0,157,255,.08);
        }

        .impact-grid {
          margin-top: 46px;
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
        }

        .impact-item {
          text-align: center;
          padding: 15px;
          border-right:
            1px solid rgba(255,255,255,.06);
        }

        .impact-item:last-child {
          border-right: 0;
        }

        .impact-icon {
          font-size: 35px;
          margin-bottom: 15px;
        }

        .impact-item h3 {
          margin: 0;
          font-size: 18px;
        }

        /* =========================
           CTA
        ========================= */

        .cta-wrap {
          padding:
            30px 0 100px;
        }

        .cta {
          min-height: 340px;
          border-radius: 15px;
          border:
            1px solid rgba(0,159,255,.25);
          padding:
            55px 58px;
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 85% 50%,
              rgba(0,137,255,.2),
              transparent 36%
            ),
            radial-gradient(
              circle at 88% 20%,
              rgba(255,119,0,.14),
              transparent 25%
            ),
            linear-gradient(
              135deg,
              #06111d,
              #020408 60%
            );
        }

        .cta::after {
          content: "";
          position: absolute;
          width: 430px;
          height: 430px;
          right: -100px;
          bottom: -230px;
          border-radius: 50%;
          border:
            1px solid rgba(0,183,255,.65);
          box-shadow:
            0 0 70px rgba(0,128,255,.15);
        }

        .cta-content {
          position: relative;
          z-index: 2;
          max-width: 720px;
        }

        .cta h2 {
          font-size:
            clamp(40px, 5vw, 65px);
          line-height: .98;
          text-transform: uppercase;
          margin:
            12px 0 20px;
        }

        .cta .gradient {
          background:
            linear-gradient(
              90deg,
              #11caff,
              #ff8a00
            );
          -webkit-background-clip:
            text;
          -webkit-text-fill-color:
            transparent;
        }

        .cta p {
          color: #9aa8bc;
          line-height: 1.65;
          max-width: 570px;
        }

        /* =========================
           FOOTER
        ========================= */

        footer {
          border-top:
            1px solid rgba(255,255,255,.06);
          padding:
            52px 0 30px;
        }

        .footer-grid {
          display: grid;
          grid-template-columns:
            1.4fr 1fr 1fr;
          gap: 40px;
        }

        .footer-brand {
          font-size: 25px;
          font-weight: 700;
          letter-spacing: .18em;
        }

        .footer-tag {
          margin-top: 13px;
          color: #5aaed6;
          letter-spacing: .18em;
          text-transform: uppercase;
          font-size: 10px;
          line-height: 1.6;
        }

        .footer-links {
          display: grid;
          gap: 10px;
          color: #96a4b7;
          font-size: 13px;
        }

        .copyright {
          border-top:
            1px solid rgba(255,255,255,.05);
          margin-top: 45px;
          padding-top: 22px;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          color: #5f6d80;
          font-size: 11px;
        }

        .mini-gradient {
          background:
            linear-gradient(
              90deg,
              #00baff,
              #ff8500
            );
          -webkit-background-clip:
            text;
          -webkit-text-fill-color:
            transparent;
        }

        /* =========================
           RESPONSIVE
        ========================= */

        @media
        (max-width: 1000px) {

          .nav-links a:not(.demo-button) {
            display: none;
          }

          .hero-grid,
          .human-grid {
            grid-template-columns: 1fr;
          }

          .visual {
            min-height: 470px;
          }

          .feature-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .feature {
            border-bottom:
              1px solid rgba(255,255,255,.06);
          }

          .industry-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .impact-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }
        }

        @media
        (max-width: 640px) {

          .container {
            width:
              min(
                100% - 26px,
                1180px
              );
          }

          .nav {
            height: 72px;
          }

          .logo {
            font-size: 18px;
          }

          .demo-button {
            padding: 9px 12px;
          }

          .hero {
            padding:
              40px 0 65px;
            min-height: 0;
          }

          .headline {
            font-size: 46px;
          }

          .hero-copy {
            font-size: 16px;
          }

          .visual {
            min-height: 365px;
          }

          .orb {
            width: 340px;
          }

          .n-mark {
            font-size: 150px;
          }

          .section,
          .human-section {
            padding:
              75px 0;
          }

          .feature-grid,
          .industry-grid,
          .impact-grid,
          .footer-grid {
            grid-template-columns: 1fr;
          }

          .feature,
          .impact-item {
            border-right: 0;
            border-bottom:
              1px solid rgba(255,255,255,.06);
            padding:
              28px 10px;
          }

          .industry {
            min-height: 220px;
          }

          .human-visual {
            min-height: 360px;
          }

          .human-face {
            width: 170px;
            height: 240px;
          }

          .cta {
            padding:
              40px 28px;
          }

          .copyright {
            flex-direction: column;
          }
        }

      </style>


      <div class="site">

        <!-- NAV -->

        <div class="container">

          <nav class="nav">

            <a
              class="logo"
              href="#top"
            >
              NEXIVRA
            </a>


            <div class="nav-links">

              <a href="#platform">
                Platform
              </a>

              <a href="#solutions">
                Solutions
              </a>

              <a href="#industries">
                Industries
              </a>

              <a href="#about">
                About
              </a>

              <a
                class="demo-button"
                href="#demo"
              >
                Request a Demo
              </a>

            </div>

          </nav>

        </div>


        <!-- HERO -->

        <section
          class="hero"
          id="top"
        >

          <div
            class="
              container
              hero-grid
            "
          >

            <div>

              <div class="eyebrow">
                The Next Generation of Connected Intelligence
              </div>


              <h1 class="headline">

                <span>
                  People.
                </span>

                <span>
                  Practice.
                </span>

                <span class="orange">
                  Progress.
                </span>

              </h1>


              <p class="hero-copy">
                AI-powered training that understands the learner,
                adapts in real time, and turns knowledge into
                demonstrated skill.
              </p>


              <div class="button-row">

                <button
                  class="primary"
                  data-scroll="demo"
                >
                  See It In Action
                </button>

                <button
                  class="secondary"
                  data-scroll="platform"
                >
                  Explore the Platform
                </button>

              </div>

            </div>


            <div class="visual">

              <div class="circuit-left">

                <div class="circuit-line"></div>
                <div class="circuit-line"></div>
                <div class="circuit-line"></div>
                <div class="circuit-line"></div>

              </div>


              <div class="orb">

                <div class="n-mark">
                  N
                </div>

              </div>


              <div class="circuit-right">

                <div class="circuit-line"></div>
                <div class="circuit-line"></div>
                <div class="circuit-line"></div>
                <div class="circuit-line"></div>

              </div>

            </div>

          </div>

        </section>


        <!-- ADVANTAGE -->

        <section
          class="section"
          id="platform"
        >

          <div class="container">

            <div class="section-label">
              The NEXIVRA Advantage
            </div>


            <h2 class="section-title">
              Real Conversations.
              <br>
              Real Growth.
            </h2>


            <p class="section-copy">
              NEXIVRA combines conversational AI,
              adaptive learning, behavioral observation,
              realistic practice, and measurable performance
              into one intelligent training experience.
            </p>


            <div class="feature-grid">

              <div class="feature">

                <div class="icon-ring">
                  ◌
                </div>

                <h3>
                  Conversational AI
                </h3>

                <p>
                  Natural interaction that listens,
                  responds, teaches, challenges,
                  and adapts.
                </p>

              </div>


              <div class="feature">

                <div class="icon-ring">
                  ▥
                </div>

                <h3>
                  Adaptive Learning
                </h3>

                <p>
                  Training changes based on the learner's
                  understanding, behavior, confidence,
                  and performance.
                </p>

              </div>


              <div class="feature">

                <div class="icon-ring">
                  ◎
                </div>

                <h3>
                  Demonstrated Skill
                </h3>

                <p>
                  NEXIVRA evaluates what learners can
                  actually do — not simply what content
                  they completed.
                </p>

              </div>


              <div class="feature">

                <div class="icon-ring">
                  ∞
                </div>

                <h3>
                  Built to Scale
                </h3>

                <p>
                  From one learner to enterprise-wide
                  development across teams, locations,
                  roles, and subjects.
                </p>

              </div>

            </div>

          </div>

        </section>


        <!-- HUMAN-CENTERED -->

        <section
          class="human-section"
          id="about"
        >

          <div
            class="
              container
              human-grid
            "
          >

            <div>

              <div class="eyebrow">
                AI Training for a More Human Tomorrow
              </div>


              <h2 class="human-title">

                Intelligence
                <br>
                That Inspires
                <br>

                <span class="people">
                  People.
                </span>

              </h2>


              <p class="human-copy">
                NEXIVRA doesn't simply deliver information.
                It creates conversations, practice,
                feedback, coaching, and experiences that
                help people develop real capability.
                <br><br>
                The platform learns how the learner responds
                and adjusts how it teaches — allowing the same
                course to become a different experience for
                different people.
              </p>

            </div>


            <div class="human-visual">

              <div class="human-face"></div>

              <div class="human-word hw1">
                SKILLS
              </div>

              <div class="human-word hw2">
                CONFIDENCE
              </div>

              <div class="human-word hw3">
                BETTER PERFORMANCE
              </div>

              <div class="human-word hw4">
                STRONGER TEAMS
              </div>

            </div>

          </div>

        </section>


        <!-- INDUSTRIES -->

        <section
          class="section"
          id="industries"
        >

          <div class="container">

            <div class="section-label">
              Intelligence That Adapts
            </div>


            <h2 class="section-title">
              Training That Speaks
              <br>
              Your Language
            </h2>


            <p class="section-copy">
              NEXIVRA Core remains the same.
              The subject intelligence, scenarios,
              standards, behaviors, knowledge,
              and outcomes change for every organization.
            </p>


            <div class="industry-grid">

              <div class="industry">

                <div class="industry-content">

                  <h3>
                    Hospitality
                  </h3>

                  <p>
                    Create memorable interactions,
                    stronger service,
                    and lasting loyalty.
                  </p>

                </div>

              </div>


              <div class="industry">

                <div class="industry-content">

                  <h3>
                    Healthcare
                  </h3>

                  <p>
                    Strengthen trust,
                    communication,
                    compassion,
                    and patient experience.
                  </p>

                </div>

              </div>


              <div class="industry">

                <div class="industry-content">

                  <h3>
                    Financial Services
                  </h3>

                  <p>
                    Turn transactions into
                    stronger conversations
                    and relationships.
                  </p>

                </div>

              </div>


              <div class="industry">

                <div class="industry-content">

                  <h3>
                    Senior Living
                  </h3>

                  <p>
                    Develop communication
                    rooted in dignity,
                    trust,
                    and respect.
                  </p>

                </div>

              </div>


              <div class="industry">

                <div class="industry-content">

                  <h3>
                    Multi-Location Organizations
                  </h3>

                  <p>
                    Build consistent capability
                    across teams,
                    roles,
                    and locations.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>


        <!-- IMPACT -->

        <section class="impact">

          <div class="container">

            <div class="section-label">
              A Stronger Tomorrow
            </div>


            <h2 class="section-title">
              Built to Make a Real Impact
            </h2>


            <div class="impact-grid">

              <div class="impact-item">

                <div class="impact-icon">
                  ◉
                </div>

                <h3>
                  Higher Engagement
                </h3>

              </div>


              <div class="impact-item">

                <div class="impact-icon">
                  ▥
                </div>

                <h3>
                  Improved Performance
                </h3>

              </div>


              <div class="impact-item">

                <div class="impact-icon">
                  ♡
                </div>

                <h3>
                  Stronger Relationships
                </h3>

              </div>


              <div class="impact-item">

                <div class="impact-icon">
                  ☆
                </div>

                <h3>
                  Healthier Cultures
                </h3>

              </div>

            </div>

          </div>

        </section>


        <!-- CTA -->

        <div
          class="cta-wrap"
          id="demo"
        >

          <div class="container">

            <div class="cta">

              <div class="cta-content">

                <div class="eyebrow">
                  Let's Build What's Next
                </div>


                <h2>

                  The Future of
                  <br>
                  Human Potential
                  <br>

                  <span class="gradient">
                    Starts Here.
                  </span>

                </h2>


                <p>
                  See how NEXIVRA can help your organization
                  train smarter, adapt faster,
                  develop stronger people,
                  and turn learning into measurable performance.
                </p>


                <div class="button-row">

                  <button
                    class="primary"
                    data-demo-click
                  >
                    Request a Demo
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>


        <!-- FOOTER -->

        <footer>

          <div class="container">

            <div class="footer-grid">

              <div>

                <div class="footer-brand">
                  NEXIVRA
                </div>

                <div class="footer-tag">
                  The Next Generation of
                  <br>
                  Connected Intelligence
                </div>

              </div>


              <div class="footer-links">

                <a href="#platform">
                  Platform
                </a>

                <a href="#industries">
                  Industries
                </a>

                <a href="#about">
                  About
                </a>

              </div>


              <div class="footer-links">

                <a href="#demo">
                  Request a Demo
                </a>

                <a href="#">
                  Contact
                </a>

                <a href="#">
                  Privacy
                </a>

              </div>

            </div>


            <div class="copyright">

              <span>
                © 2026 NEXIVRA.
                All rights reserved.
              </span>

              <span class="mini-gradient">
                People. Practice. Progress.
              </span>

            </div>

          </div>

        </footer>

      </div>
    `;
  }

  bindEvents() {
    this.shadowRoot
      .querySelectorAll("[data-scroll]")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {

            const id =
              button.getAttribute(
                "data-scroll"
              );

            const target =
              this.shadowRoot
                .getElementById(id);

            if (target) {
              target.scrollIntoView({
                behavior: "smooth"
              });
            }
          }
        );
      });

    const demo =
      this.shadowRoot
        .querySelector(
          "[data-demo-click]"
        );

    if (demo) {
      demo.addEventListener(
        "click",
        () => {

          this.dispatchEvent(
            new CustomEvent(
              "nexivra-demo-request",
              {
                bubbles: true,
                composed: true
              }
            )
          );
        }
      );
    }
  }
}

if (
  !customElements.get(
    "nexivra-home"
  )
) {
  customElements.define(
    "nexivra-home",
    NexivraHome
  );
}
