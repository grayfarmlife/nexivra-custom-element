// src/nexivra-home.js
var NexivraHome = class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.assets = {
      logo: "https://static.wixstatic.com/media/433270_aba4225e8fc54279ba41af267bab397a~mv2.png",
      heroImage: "https://static.wixstatic.com/media/433270_c2c3b23a9eb9422da7d8aca2c9239840~mv2.png",
      hospitality: "https://static.wixstatic.com/media/433270_a00caa15c8a64cc09e47e59ccb5a1081~mv2.png",
      healthcare: "https://static.wixstatic.com/media/433270_224fec054635445987e2b072424d5f49~mv2.png",
      finance: "https://static.wixstatic.com/media/433270_28132edbcc3945718e98edbcc864a722~mv2.png",
      seniorLiving: "https://static.wixstatic.com/media/433270_eed61d022cfc4157ae2a06614a0e4ecf~mv2.png",
      multiLocation: "https://static.wixstatic.com/media/433270_082c2ff6123241e18afb516df3af9b6b~mv2.png"
    };
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
          background: #02060b;
          color: #fff;
          font-family: Arial, Helvetica, sans-serif;
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
          font: inherit;
        }

        .page {
          width: 100%;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 72% 7%,
              rgba(0, 154, 255, .12),
              transparent 28%
            ),
            radial-gradient(
              circle at 83% 9%,
              rgba(255, 133, 0, .08),
              transparent 22%
            ),
            linear-gradient(
              180deg,
              #02060b 0%,
              #030811 55%,
              #02060b 100%
            );
        }

        .container {
          width: min(1500px, calc(100% - 60px));
          margin: 0 auto;
        }

        /* =========================
           NAVIGATION
        ========================= */

        .nav-wrap {
          border-bottom:
            1px solid rgba(255,255,255,.055);
          position: relative;
          z-index: 50;
        }

        .nav {
          min-height: 105px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
        }

        .brand {
          display: flex;
          align-items: center;
          min-width: 250px;
        }

        .brand img {
          display: block;
          width: 300px;
          max-width: 31vw;
          height: auto;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 30px;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 30px;
          color: #aebed0;
          font-size: 13px;
        }

        .nav-links a {
          transition: .2s ease;
        }

        .nav-links a:hover {
          color: #ffffff;
        }

        .login-link {
          color: #23c6ff;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }

        .nav-demo {
          border: 1px solid #00a9ff;
          background:
            linear-gradient(
              135deg,
              rgba(0,122,255,.15),
              rgba(0,188,255,.08)
            );
          color: #ffffff;
          padding: 13px 20px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
          box-shadow:
            0 0 22px rgba(0,157,255,.12);
        }

        /* =========================
           HERO
        ========================= */

        .hero {
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: 42px;
          align-items: center;
          min-height: 760px;
          padding: 38px 0 30px;
        }

        .hero-copy-wrap {
          position: relative;
          z-index: 3;
        }

        .eyebrow {
          color: #26cbff;
          text-transform: uppercase;
          letter-spacing: .38em;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 20px;
        }

        .hero h1 {
          margin: 0;
          font-size:
            clamp(54px, 5.7vw, 90px);
          line-height: .96;
          letter-spacing: -.025em;
          text-transform: uppercase;
          max-width: 780px;
        }

        .gradient-text {
          background:
            linear-gradient(
              90deg,
              #008dff 0%,
              #11caff 27%,
              #e8edf4 54%,
              #ff9a20 88%
            );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-copy {
          max-width: 720px;
          margin-top: 26px;
          font-size: 18px;
          line-height: 1.65;
          color: #a6b5c7;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 32px;
        }

        .primary-btn {
          border: 0;
          border-radius: 9px;
          padding: 15px 24px;
          background:
            linear-gradient(
              135deg,
              #008cff,
              #25c6ff
            );
          color: #03111a;
          font-weight: 900;
          cursor: pointer;
          box-shadow:
            0 0 30px rgba(0,164,255,.26);
          transition: .2s ease;
        }

        .primary-btn:hover {
          transform: translateY(-2px);
        }

        .outline-btn {
          border: 1px solid #00aaff;
          border-radius: 9px;
          padding: 14px 23px;
          background: rgba(0,0,0,.15);
          color: #ffffff;
          font-weight: 800;
          cursor: pointer;
        }

        .hero-visual {
          min-height: 650px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-image-shell {
          width: 100%;
          max-width: 850px;
          position: relative;
          border-radius: 22px;
          overflow: hidden;
          border:
            1px solid rgba(0,161,255,.24);
          box-shadow:
            0 0 60px rgba(0,115,255,.10);
        }

        .hero-image-shell::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(
              90deg,
              rgba(2,6,11,.14),
              transparent 20%,
              transparent 78%,
              rgba(2,6,11,.12)
            );
        }

        .hero-image-shell img {
          display: block;
          width: 100%;
          height: auto;
        }

        /* =========================
           DIFFERENCE
        ========================= */

        .difference {
          padding: 100px 0;
          text-align: center;
          border-top:
            1px solid rgba(0,155,255,.10);
          border-bottom:
            1px solid rgba(0,155,255,.08);
          background:
            radial-gradient(
              circle at center,
              rgba(0,141,255,.055),
              transparent 55%
            );
        }

        .section-label {
          color: #28caff;
          font-size: 11px;
          letter-spacing: .36em;
          text-transform: uppercase;
          font-weight: 800;
        }

        .section-title {
          margin: 14px auto 20px;
          max-width: 1000px;
          font-size:
            clamp(36px, 4.3vw, 58px);
          line-height: 1.03;
          text-transform: uppercase;
        }

        .section-copy {
          max-width: 850px;
          margin: 0 auto;
          color: #98a9bc;
          font-size: 16px;
          line-height: 1.75;
        }

        .difference-grid {
          margin-top: 55px;
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .difference-card {
          border:
            1px solid rgba(0,156,255,.14);
          border-radius: 14px;
          padding: 28px 23px;
          background:
            linear-gradient(
              180deg,
              rgba(5,15,27,.82),
              rgba(2,8,15,.92)
            );
        }

        .difference-icon {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          margin: 0 auto 18px;
          display: grid;
          place-items: center;
          border:
            1px solid rgba(0,174,255,.55);
          color: #2acaff;
          font-size: 23px;
          box-shadow:
            inset 0 0 14px rgba(0,146,255,.08);
        }

        .difference-card h3 {
          margin: 0 0 10px;
          font-size: 17px;
        }

        .difference-card p {
          margin: 0;
          color: #899aae;
          line-height: 1.6;
          font-size: 14px;
        }

        /* =========================
           INDUSTRIES
        ========================= */

        .industries {
          padding: 100px 0 105px;
        }

        .industries-head {
          max-width: 820px;
          margin-bottom: 45px;
        }

        .industries-head h2 {
          margin: 12px 0 18px;
          font-size:
            clamp(36px, 4vw, 56px);
          text-transform: uppercase;
          line-height: 1.02;
        }

        .industries-head p {
          color: #97a7ba;
          line-height: 1.7;
        }

        .industry-grid {
          display: grid;
          grid-template-columns:
            repeat(5, minmax(0, 1fr));
          gap: 15px;
        }

        .industry-card {
          min-height: 415px;
          border-radius: 14px;
          overflow: hidden;
          border:
            1px solid rgba(0,156,255,.30);
          background:
            #05101b;
          display: flex;
          flex-direction: column;
          box-shadow:
            0 0 30px rgba(0,121,255,.03);
        }

        .industry-image {
          height: 190px;
          overflow: hidden;
          background: #07131f;
        }

        .industry-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition:
            transform .35s ease;
        }

        .industry-card:hover
        .industry-image img {
          transform: scale(1.025);
        }

        .industry-content {
          padding: 20px 20px 22px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .industry-content h3 {
          margin: 0 0 10px;
          font-size: 18px;
          line-height: 1.15;
        }

        .industry-content p {
          margin: 0;
          color: #98a9bc;
          font-size: 13px;
          line-height: 1.55;
        }

        .industry-arrow {
          margin-top: auto;
          padding-top: 20px;
        }

        .industry-arrow span {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          border: 1px solid #00aaff;
          color: #ffffff;
        }

        /* =========================
           PLATFORM
        ========================= */

        .platform {
          padding: 100px 0;
          background:
            linear-gradient(
              180deg,
              rgba(0, 140, 255, .025),
              transparent
            ),
            #02070d;
          border-top:
            1px solid rgba(0,157,255,.09);
          border-bottom:
            1px solid rgba(0,157,255,.08);
        }

        .platform-head {
          max-width: 900px;
          margin-bottom: 48px;
        }

        .platform-head h2 {
          margin: 12px 0 18px;
          font-size:
            clamp(38px, 4.3vw, 58px);
          text-transform: uppercase;
          line-height: 1.02;
        }

        .platform-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 18px;
        }

        .platform-card {
          border:
            1px solid rgba(0,154,255,.16);
          border-radius: 14px;
          padding: 29px 26px;
          background:
            rgba(4,13,23,.78);
        }

        .platform-card h3 {
          margin: 0 0 11px;
          font-size: 17px;
        }

        .platform-card p {
          margin: 0;
          color: #90a1b5;
          line-height: 1.65;
          font-size: 14px;
        }

        /* =========================
           LOGIN SECTION
        ========================= */

        .access {
          padding: 95px 0;
        }

        .access-grid {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 24px;
        }

        .access-card {
          border:
            1px solid rgba(0,156,255,.20);
          border-radius: 15px;
          padding: 38px;
          background:
            linear-gradient(
              145deg,
              rgba(5,17,30,.92),
              rgba(2,8,15,.96)
            );
        }

        .access-card h3 {
          margin: 0 0 12px;
          font-size: 25px;
        }

        .access-card p {
          color: #96a7ba;
          line-height: 1.65;
          margin-bottom: 23px;
        }

        .access-card a {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #29caff;
          font-weight: 800;
        }

        /* =========================
           CTA
        ========================= */

        .cta-wrap {
          padding-bottom: 105px;
        }

        .cta {
          min-height: 350px;
          border-radius: 18px;
          border:
            1px solid rgba(0,159,255,.27);
          padding: 58px;
          display: flex;
          align-items: center;
          background:
            radial-gradient(
              circle at 87% 45%,
              rgba(0,142,255,.22),
              transparent 28%
            ),
            radial-gradient(
              circle at 92% 17%,
              rgba(255,130,0,.13),
              transparent 20%
            ),
            linear-gradient(
              135deg,
              #06121e,
              #02070d 62%
            );
          position: relative;
          overflow: hidden;
        }

        .cta::after {
          content: "";
          position: absolute;
          width: 460px;
          height: 460px;
          right: -130px;
          bottom: -270px;
          border-radius: 50%;
          border:
            1px solid rgba(0,186,255,.52);
          box-shadow:
            0 0 65px rgba(0,140,255,.12);
        }

        .cta-content {
          max-width: 850px;
          position: relative;
          z-index: 2;
        }

        .cta h2 {
          margin: 12px 0 18px;
          font-size:
            clamp(40px, 5vw, 68px);
          line-height: .98;
          text-transform: uppercase;
        }

        .cta p {
          max-width: 650px;
          color: #9cadbf;
          line-height: 1.65;
        }

        /* =========================
           FOOTER
        ========================= */

        footer {
          padding: 58px 0 32px;
          border-top:
            1px solid rgba(255,255,255,.055);
        }

        .footer-grid {
          display: grid;
          grid-template-columns:
            1.4fr 1fr 1fr;
          gap: 50px;
        }

        .footer-logo img {
          width: 310px;
          max-width: 100%;
          display: block;
        }

        .footer-links {
          display: grid;
          gap: 11px;
          color: #99aabd;
          font-size: 13px;
        }

        .footer-links a:hover {
          color: #fff;
        }

        .footer-bottom {
          margin-top: 45px;
          padding-top: 21px;
          border-top:
            1px solid rgba(255,255,255,.05);
          display: flex;
          justify-content: space-between;
          gap: 20px;
          color: #637589;
          font-size: 11px;
        }

        .footer-tag {
          background:
            linear-gradient(
              90deg,
              #12c8ff,
              #ff8d10
            );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* =========================
           RESPONSIVE
        ========================= */

        @media (max-width: 1180px) {
          .nav-links {
            display: none;
          }

          .hero {
            grid-template-columns: 1fr;
            padding-top: 70px;
          }

          .hero-visual {
            min-height: auto;
          }

          .industry-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .platform-grid,
          .difference-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .container {
            width:
              min(100% - 26px, 1500px);
          }

          .nav {
            min-height: 78px;
          }

          .brand img {
            width: 185px;
            max-width: 54vw;
          }

          .nav-right {
            gap: 12px;
          }

          .login-link {
            display: none;
          }

          .nav-demo {
            padding: 10px 12px;
            font-size: 10px;
          }

          .hero {
            min-height: auto;
            padding: 45px 0 60px;
          }

          .hero h1 {
            font-size: 44px;
          }

          .hero-copy {
            font-size: 16px;
          }

          .difference,
          .industries,
          .platform,
          .access {
            padding:
              72px 0;
          }

          .difference-grid,
          .platform-grid,
          .industry-grid,
          .access-grid,
          .footer-grid {
            grid-template-columns: 1fr;
          }

          .industry-card {
            min-height: auto;
          }

          .industry-image {
            height: 220px;
          }

          .cta {
            padding: 40px 26px;
          }

          .footer-bottom {
            flex-direction: column;
          }
        }
      </style>

      <div class="page">

        <!-- NAVIGATION -->

        <div class="nav-wrap">
          <div class="container">

            <nav class="nav">

              <a
                class="brand"
                href="#top"
              >
                <img
                  src="${this.assets.logo}"
                  alt="NEXIVRA"
                />
              </a>

              <div class="nav-right">

                <div class="nav-links">
                  <a href="#platform">
                    Platform
                  </a>

                  <a href="#industries">
                    Industries
                  </a>

                  <a href="#about">
                    About
                  </a>

                  <a href="#access">
                    Login
                  </a>

                  <a href="#contact">
                    Contact
                  </a>
                </div>

                <a
                  class="login-link"
                  href="/login"
                >
                  Client Login
                </a>

                <button
                  class="nav-demo"
                  data-demo
                >
                  Request a Demo
                </button>

              </div>

            </nav>

          </div>
        </div>


        <!-- HERO -->

        <section
          class="container hero"
          id="top"
        >

          <div class="hero-copy-wrap">

            <div class="eyebrow">
              AI Training. Real Performance.
            </div>

            <h1>

              Human-Centered
              <br>
              AI Training

              <span class="gradient-text">
                For a Smarter Tomorrow
              </span>

            </h1>

            <p class="hero-copy">
              NEXIVRA is an adaptive AI training platform
              that learns the learner, teaches through
              conversation, creates realistic practice,
              observes performance, and helps organizations
              turn knowledge into demonstrated skill.
            </p>

            <div class="actions">

              <button
                class="primary-btn"
                data-demo
              >
                Request a Demo \u2192
              </button>

              <button
                class="outline-btn"
                data-scroll="platform"
              >
                Explore the Platform
              </button>

            </div>

          </div>


          <div class="hero-visual">

            <div class="hero-image-shell">

              <img
                src="${this.assets.heroImage}"
                alt="NEXIVRA connected human future"
              />

            </div>

          </div>

        </section>


        <!-- DIFFERENCE -->

        <section
          class="difference"
          id="about"
        >

          <div class="container">

            <div class="section-label">
              The NEXIVRA Difference
            </div>

            <h2 class="section-title">
              Learn the Learner.
              <br>
              Then Teach.
            </h2>

            <p class="section-copy">
              Traditional training delivers the same content
              to everyone. NEXIVRA learns how each person
              communicates, responds, processes information,
              practices, and performs \u2014 then adapts the
              experience around them.
            </p>


            <div class="difference-grid">

              ${this.differenceCard(
      "\u25C9",
      "Conversational AI",
      "Natural training through real interaction instead of passive content."
    )}

              ${this.differenceCard(
      "\u21BB",
      "Adaptive Teaching",
      "NEXIVRA changes how it teaches based on how the learner responds."
    )}

              ${this.differenceCard(
      "\u25CE",
      "Realistic Practice",
      "Role-play, scenarios, feedback, coaching, and repeated practice build capability."
    )}

              ${this.differenceCard(
      "\u2197",
      "Performance Intelligence",
      "Measure what learners can demonstrate, where they improve, and what they need next."
    )}

            </div>

          </div>

        </section>


        <!-- INDUSTRIES -->

        <section
          class="industries"
          id="industries"
        >

          <div class="container">

            <div class="industries-head">

              <div class="section-label">
                Designed Around Your Organization
              </div>

              <h2>
                Training That Speaks
                <br>
                Your Language
              </h2>

              <p>
                NEXIVRA Core provides the intelligence.
                Your organization's knowledge, standards,
                behaviors, scenarios, goals, and culture
                shape the learning experience.
              </p>

            </div>


            <div class="industry-grid">

              ${this.industryCard(
      this.assets.hospitality,
      "Hospitality",
      "Create stronger service, communication, emotional awareness, and memorable guest experiences."
    )}

              ${this.industryCard(
      this.assets.healthcare,
      "Healthcare",
      "Strengthen trust, communication, compassion, service recovery, and patient experience."
    )}

              ${this.industryCard(
      this.assets.finance,
      "Financial Services",
      "Build confidence, stronger conversations, deeper relationships, and client trust."
    )}

              ${this.industryCard(
      this.assets.seniorLiving,
      "Senior Living",
      "Develop communication rooted in dignity, empathy, trust, connection, and respect."
    )}

              ${this.industryCard(
      this.assets.multiLocation,
      "Multi-Location Organizations",
      "Create consistent capability across people, locations, teams, leaders, and roles."
    )}

            </div>

          </div>

        </section>


        <!-- PLATFORM -->

        <section
          class="platform"
          id="platform"
        >

          <div class="container">

            <div class="platform-head">

              <div class="section-label">
                One Intelligent Platform
              </div>

              <h2>
                Conversation.
                <br>
                Practice.
                <br>
                Performance.
              </h2>

              <p class="section-copy"
                 style="
                   text-align:left;
                   margin:0;
                 ">
                NEXIVRA combines adaptive AI, real-time
                conversation, behavioral observation,
                realistic practice, evaluation, coaching,
                and learner memory into one connected
                development experience.
              </p>

            </div>


            <div class="platform-grid">

              ${this.platformCard(
      "Learn the Learner",
      "NEXIVRA builds an understanding of the individual and uses that understanding to shape the learning experience."
    )}

              ${this.platformCard(
      "Teach Adaptively",
      "The platform adjusts explanations, questions, pacing, practice, and coaching based on the learner."
    )}

              ${this.platformCard(
      "Practice Real Work",
      "Learners interact with realistic situations, conversations, role-play, and scenarios drawn from the subject."
    )}

              ${this.platformCard(
      "Demonstrate Capability",
      "NEXIVRA evaluates demonstrated performance and helps determine what the learner should practice next."
    )}

            </div>

          </div>

        </section>


        <!-- ACCESS -->

        <section
          class="access"
          id="access"
        >

          <div class="container">

            <div class="section-label">
              Your NEXIVRA Environment
            </div>

            <h2 class="section-title"
                style="
                  text-align:left;
                  margin-left:0;
                ">
              One Platform.
              <br>
              Different Experiences.
            </h2>


            <div class="access-grid">

              <div class="access-card">

                <h3>
                  Company Dashboard
                </h3>

                <p>
                  Authorized company leaders and administrators
                  can manage learners, assign training,
                  review progress, monitor development,
                  and access organization reporting.
                </p>

                <a href="/login">
                  Client Login \u2192
                </a>

              </div>


              <div class="access-card">

                <h3>
                  Learner Experience
                </h3>

                <p>
                  Learners log in to their assigned environment,
                  access their courses, continue previous sessions,
                  practice with the AI instructor,
                  and see their development progress.
                </p>

                <a href="/login">
                  Learner Login \u2192
                </a>

              </div>

            </div>

          </div>

        </section>


        <!-- CTA -->

        <div class="cta-wrap">

          <div class="container">

            <div class="cta">

              <div class="cta-content">

                <div class="section-label"
                     style="text-align:left;">
                  The Future of Learning Is Personal
                </div>

                <h2>

                  Build Stronger People.

                  <br>

                  <span class="gradient-text">
                    Build a Stronger Organization.
                  </span>

                </h2>

                <p>
                  Turn your organization's knowledge,
                  standards, scenarios, goals, and culture
                  into an adaptive AI training experience
                  built around the people you are developing.
                </p>

                <div class="actions">

                  <button
                    class="primary-btn"
                    data-demo
                  >
                    Request a Demo \u2192
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>


        <!-- FOOTER -->

        <footer id="contact">

          <div class="container">

            <div class="footer-grid">

              <div class="footer-logo">

                <img
                  src="${this.assets.logo}"
                  alt="NEXIVRA"
                />

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

                <a href="#access">
                  Login
                </a>

              </div>


              <div class="footer-links">

                <a href="/login">
                  Client Login
                </a>

                <a href="#contact">
                  Contact
                </a>

                <a href="/privacy">
                  Privacy
                </a>

              </div>

            </div>


            <div class="footer-bottom">

              <span>
                \xA9 2026 NEXIVRA.
                All rights reserved.
              </span>

              <span class="footer-tag">
                The Next Generation of Connected Intelligence
              </span>

            </div>

          </div>

        </footer>

      </div>
    `;
  }
  differenceCard(icon, title, copy) {
    return `
      <article class="difference-card">

        <div class="difference-icon">
          ${icon}
        </div>

        <h3>
          ${title}
        </h3>

        <p>
          ${copy}
        </p>

      </article>
    `;
  }
  industryCard(image, title, copy) {
    return `
      <article class="industry-card">

        <div class="industry-image">

          <img
            src="${image}"
            alt="${title}"
          />

        </div>

        <div class="industry-content">

          <h3>
            ${title}
          </h3>

          <p>
            ${copy}
          </p>

          <div class="industry-arrow">
            <span>\u2192</span>
          </div>

        </div>

      </article>
    `;
  }
  platformCard(title, copy) {
    return `
      <article class="platform-card">

        <h3>
          ${title}
        </h3>

        <p>
          ${copy}
        </p>

      </article>
    `;
  }
  bindEvents() {
    this.shadowRoot.querySelectorAll(
      "[data-scroll]"
    ).forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            const id = button.getAttribute(
              "data-scroll"
            );
            const target = this.shadowRoot.getElementById(id);
            if (target) {
              target.scrollIntoView({
                behavior: "smooth"
              });
            }
          }
        );
      }
    );
    this.shadowRoot.querySelectorAll(
      "[data-demo]"
    ).forEach(
      (button) => {
        button.addEventListener(
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
    );
  }
};
if (!customElements.get(
  "nexivra-home"
)) {
  customElements.define(
    "nexivra-home",
    NexivraHome
  );
}
