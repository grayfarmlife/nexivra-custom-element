// src/nexivra-home.js
var LOGO_URL = "https://static.wixstatic.com/media/433270_aba4225e8fc54279ba41af267bab397a~mv2.png";
var HERO_IMAGE = "https://static.wixstatic.com/media/433270_c2c3b23a9eb9422da7d8aca2c9239840~mv2.png";
var HOSPITALITY_IMAGE = "https://static.wixstatic.com/media/433270_a00caa15c8a64cc09e47e59ccb5a1081~mv2.png";
var SENIOR_LIVING_IMAGE = "https://static.wixstatic.com/media/433270_eed61d022cfc4157ae2a06614a0e4ecf~mv2.png";
var HEALTHCARE_IMAGE = "https://static.wixstatic.com/media/433270_224fec054635445987e2b072424d5f49~mv2.png";
var CONNECTED_TEAMS_IMAGE = "https://static.wixstatic.com/media/433270_082c2ff6123241e18afb516df3af9b6b~mv2.png";
var FINANCIAL_IMAGE = "https://static.wixstatic.com/media/433270_28132edbcc3945718e98edbcc864a722~mv2.png";
var LOGIN_URL = "https://createdbyken.wixstudio.com/my-site-5/login";
var NexivraHome = class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.render();
    this.bindEvents();
  }
  bindEvents() {
    const navLinks = this.shadowRoot.querySelectorAll("[data-scroll]");
    navLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const targetId = link.getAttribute("data-scroll");
        const target = this.shadowRoot.getElementById(targetId);
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      });
    });
    const loginButtons = this.shadowRoot.querySelectorAll("[data-login]");
    loginButtons.forEach((button) => {
      button.addEventListener("click", () => {
        window.top.location.href = LOGIN_URL;
      });
    });
    const demoButtons = this.shadowRoot.querySelectorAll("[data-demo]");
    demoButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const contact = this.shadowRoot.getElementById("contact");
        if (contact) {
          contact.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      });
    });
  }
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          background: #020711;
          color: #ffffff;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        button,
        a {
          font: inherit;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .page {
          width: 100%;
          min-height: 100vh;

          background:
            radial-gradient(
              circle at 70% 10%,
              rgba(0, 174, 255, 0.1),
              transparent 35%
            ),
            radial-gradient(
              circle at 90% 30%,
              rgba(255, 128, 0, 0.05),
              transparent 30%
            ),
            #020711;
        }

        .container {
          width: min(1440px, 100%);
          margin: 0 auto;
        }

        /* ============================================
           HEADER
        ============================================ */

        header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          min-height: 120px;

          padding: 0 32px;

          border-bottom:
            1px solid rgba(255, 255, 255, 0.06);

          background:
            rgba(3, 15, 27, 0.78);

          backdrop-filter: blur(18px);

          position: sticky;
          top: 0;
          z-index: 20;
        }

        .logo {
          width: 300px;
          max-width: 26vw;
          display: block;
        }

        nav {
          display: flex;
          align-items: center;
          gap: 30px;
        }

        nav a,
        nav button {
          border: 0;
          background: transparent;

          color: #a8b7c7;

          font-size: 14px;

          cursor: pointer;

          transition: 0.2s ease;
        }

        nav a:hover,
        nav button:hover {
          color: #00c8ff;
        }

        .client-login {
          color: #00c8ff;
          font-weight: 700;
        }

        .demo-button {
          padding: 14px 22px;

          border:
            1px solid #00aee8;

          border-radius: 12px;

          background:
            linear-gradient(
              90deg,
              rgba(0, 150, 255, 0.16),
              rgba(0, 200, 255, 0.05)
            );

          color: white;

          font-weight: 700;
        }

        /* ============================================
           HERO
        ============================================ */

        .hero {
          display: grid;

          grid-template-columns:
            minmax(0, 0.9fr)
            minmax(0, 1.1fr);

          gap: 46px;

          align-items: center;

          min-height: 760px;

          padding:
            70px 32px 80px;
        }

        .eyebrow {
          color: #00c8ff;

          font-size: 12px;
          font-weight: 800;

          letter-spacing: 5px;
          text-transform: uppercase;
        }

        h1 {
          margin:
            24px 0 22px;

          font-size:
            clamp(58px, 7vw, 108px);

          line-height: 0.92;

          letter-spacing: -4px;

          text-transform: uppercase;
        }

        .cyan {
          color: #00aef0;
        }

        .cyan-soft {
          color: #73dbff;
        }

        .orange-soft {
          color: #ff9a27;
        }

        .hero-copy {
          max-width: 630px;

          color: #a8b7c7;

          font-size: 20px;

          line-height: 1.65;
        }

        .hero-actions {
          display: flex;
          gap: 16px;

          margin-top: 34px;
        }

        .primary-button,
        .secondary-button {
          padding:
            15px 24px;

          border-radius: 11px;

          font-size: 13px;
          font-weight: 800;

          cursor: pointer;
        }

        .primary-button {
          border: 0;

          background:
            linear-gradient(
              90deg,
              #089cf6,
              #20cfff
            );

          color: #00131f;
        }

        .secondary-button {
          border:
            1px solid #00aef0;

          background: transparent;

          color: white;
        }

        .hero-visual {
          border:
            1px solid rgba(0, 174, 240, 0.45);

          border-radius: 22px;

          overflow: hidden;

          box-shadow:
            0 0 70px rgba(0, 174, 240, 0.08);
        }

        .hero-visual img {
          display: block;

          width: 100%;
          height: auto;
        }

        /* ============================================
           GENERAL SECTION
        ============================================ */

        section {
          border-top:
            1px solid rgba(255, 255, 255, 0.06);

          padding:
            110px 32px;
        }

        .section-heading {
          text-align: center;

          max-width: 980px;

          margin: 0 auto 60px;
        }

        .section-heading h2 {
          margin:
            18px 0;

          font-size:
            clamp(46px, 6vw, 76px);

          line-height: 0.98;

          letter-spacing: -2px;

          text-transform: uppercase;
        }

        .section-heading p {
          color: #9cafc1;

          font-size: 18px;

          line-height: 1.65;
        }

        /* ============================================
           DIFFERENCE
        ============================================ */

        .feature-grid {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 18px;
        }

        .feature-card {
          min-height: 245px;

          padding: 28px;

          border:
            1px solid rgba(0, 174, 240, 0.22);

          border-radius: 18px;

          background:
            linear-gradient(
              145deg,
              rgba(7, 26, 45, 0.92),
              rgba(2, 9, 17, 0.96)
            );
        }

        .feature-icon {
          width: 58px;
          height: 58px;

          display: grid;
          place-items: center;

          margin-bottom: 22px;

          border:
            1px solid #00aef0;

          border-radius: 50%;

          color: #00c8ff;

          font-size: 24px;
        }

        .feature-card h3 {
          margin:
            0 0 12px;

          font-size: 20px;
        }

        .feature-card p {
          margin: 0;

          color: #90a4b8;

          line-height: 1.65;
        }

        /* ============================================
           INDUSTRIES
        ============================================ */

        .industry-intro {
          max-width: 900px;

          margin-bottom: 44px;
        }

        .industry-intro h2 {
          margin:
            16px 0 20px;

          font-size:
            clamp(46px, 5vw, 72px);

          line-height: 0.98;

          text-transform: uppercase;
        }

        .industry-intro p {
          color: #9cafc1;
          line-height: 1.6;
        }

        .industry-grid {
          display: grid;

          grid-template-columns:
            repeat(5, minmax(0, 1fr));

          gap: 16px;
        }

        .industry-card {
          overflow: hidden;

          border:
            1px solid rgba(0, 174, 240, 0.28);

          border-radius: 18px;

          background:
            #04111d;
        }

        .industry-card img {
          width: 100%;
          aspect-ratio: 1.18 / 1;

          display: block;

          object-fit: cover;
        }

        .industry-body {
          padding: 22px;
        }

        .industry-card h3 {
          margin:
            0 0 12px;

          font-size: 19px;
        }

        .industry-card p {
          min-height: 105px;

          margin: 0;

          color: #9cafc1;

          font-size: 14px;

          line-height: 1.55;
        }

        .arrow {
          width: 38px;
          height: 38px;

          display: grid;
          place-items: center;

          margin-top: 20px;

          border:
            1px solid #00aef0;

          border-radius: 50%;

          color: white;
        }

        /* ============================================
           PLATFORM
        ============================================ */

        .platform-heading {
          max-width: 860px;

          margin-bottom: 56px;
        }

        .platform-heading h2 {
          margin:
            16px 0 24px;

          font-size:
            clamp(50px, 6vw, 82px);

          line-height: 0.96;

          text-transform: uppercase;
        }

        .platform-heading p {
          color: #9cafc1;

          font-size: 18px;

          line-height: 1.65;
        }

        .platform-grid {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 18px;
        }

        .platform-card {
          min-height: 215px;

          padding: 28px;

          border:
            1px solid rgba(0, 174, 240, 0.23);

          border-radius: 17px;

          background:
            linear-gradient(
              145deg,
              rgba(6, 25, 42, 0.94),
              rgba(3, 10, 18, 0.98)
            );
        }

        .platform-card h3 {
          margin: 0 0 14px;

          font-size: 20px;
        }

        .platform-card p {
          color: #95a8bb;

          line-height: 1.65;
        }

        /* ============================================
           ACCESS
        ============================================ */

        .access-grid {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 24px;
        }

        .access-card {
          padding: 38px;

          border:
            1px solid rgba(0, 174, 240, 0.28);

          border-radius: 20px;

          background:
            linear-gradient(
              145deg,
              rgba(6, 26, 44, 0.95),
              rgba(2, 9, 18, 0.96)
            );
        }

        .access-card h3 {
          margin:
            0 0 16px;

          font-size: 30px;
        }

        .access-card p {
          color: #9cafc1;

          line-height: 1.65;
        }

        .access-link {
          display: inline-block;

          margin-top: 20px;

          border: 0;
          background: transparent;

          color: #00c8ff;

          font-weight: 700;

          cursor: pointer;
        }

        /* ============================================
           CTA
        ============================================ */

        .cta-box {
          position: relative;

          overflow: hidden;

          padding:
            70px;

          border:
            1px solid rgba(0, 174, 240, 0.3);

          border-radius: 24px;

          background:
            radial-gradient(
              circle at 75% 50%,
              rgba(0, 148, 255, 0.18),
              transparent 36%
            ),
            linear-gradient(
              145deg,
              #061725,
              #020811
            );
        }

        .cta-box h2 {
          max-width: 900px;

          margin:
            18px 0 24px;

          font-size:
            clamp(54px, 7vw, 96px);

          line-height: 0.94;

          text-transform: uppercase;
        }

        .cta-box p {
          max-width: 740px;

          color: #9cafc1;

          line-height: 1.65;
        }

        /* ============================================
           CONTACT
        ============================================ */

        .contact-section {
          text-align: center;
        }

        .contact-card {
          max-width: 900px;

          margin: 0 auto;

          padding: 55px;

          border:
            1px solid rgba(0, 174, 240, 0.26);

          border-radius: 22px;

          background:
            linear-gradient(
              145deg,
              rgba(6, 25, 42, 0.95),
              rgba(2, 9, 18, 0.96)
            );
        }

        .contact-card h2 {
          margin:
            18px 0;

          font-size:
            clamp(44px, 5vw, 68px);

          text-transform: uppercase;
        }

        .contact-card p {
          color: #9cafc1;
          line-height: 1.65;
        }

        /* ============================================
           FOOTER
        ============================================ */

        footer {
          padding:
            70px 32px 32px;

          border-top:
            1px solid rgba(255, 255, 255, 0.06);
        }

        .footer-top {
          display: grid;

          grid-template-columns:
            1.2fr 1fr 1fr;

          gap: 50px;

          align-items: start;
        }

        .footer-logo {
          width: 310px;
          max-width: 100%;
        }

        .footer-links {
          display: grid;
          gap: 18px;

          color: #9cafc1;
        }

        .footer-links button {
          border: 0;
          background: transparent;

          padding: 0;

          color: inherit;

          text-align: left;

          cursor: pointer;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;

          margin-top: 48px;

          padding-top: 24px;

          border-top:
            1px solid rgba(255, 255, 255, 0.06);

          color: #6f8498;

          font-size: 12px;
        }

        .tagline {
          color: #00c8ff;
        }

        .tagline span {
          color: #ff9a27;
        }

        /* ============================================
           MOBILE
        ============================================ */

        @media (max-width: 1100px) {
          nav {
            gap: 16px;
          }

          .feature-grid,
          .platform-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .industry-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }
        }

        @media (max-width: 800px) {
          header {
            padding:
              18px;

            min-height: auto;
          }

          .logo {
            width: 190px;
            max-width: 48vw;
          }

          nav a:not(.client-login),
          nav button:not(.demo-button) {
            display: none;
          }

          .demo-button {
            padding:
              10px 13px;
          }

          .hero {
            grid-template-columns:
              1fr;

            min-height: auto;

            padding:
              70px 20px;
          }

          h1 {
            letter-spacing: -2px;
          }

          section {
            padding:
              80px 20px;
          }

          .feature-grid,
          .platform-grid,
          .industry-grid,
          .access-grid {
            grid-template-columns:
              1fr;
          }

          .industry-card p {
            min-height: auto;
          }

          .cta-box {
            padding:
              42px 25px;
          }

          .footer-top {
            grid-template-columns:
              1fr;
          }

          .footer-bottom {
            flex-direction: column;
            gap: 12px;
          }
        }
      </style>

      <div class="page">
        <div class="container">

          <header>
            <img
              class="logo"
              src="${LOGO_URL}"
              alt="NEXIVRA"
            >

            <nav>
              <a href="#" data-scroll="platform">
                Platform
              </a>

              <a href="#" data-scroll="industries">
                Industries
              </a>

              <a href="#" data-scroll="about">
                About
              </a>

              <a href="#" data-scroll="contact">
                Contact
              </a>

              <button data-login>
                Login
              </button>

              <button
                class="client-login"
                data-login
              >
                Client Login
              </button>

              <button
                class="demo-button"
                data-demo
              >
                Request a Demo
              </button>
            </nav>
          </header>

          <section class="hero">

            <div>
              <div class="eyebrow">
                AI TRAINING. REAL PERFORMANCE.
              </div>

              <h1>
                HUMAN-CENTERED
                AI TRAINING
                <span class="cyan">
                  FOR A
                </span>
                <span class="cyan-soft">
                  SMARTER
                </span>
                <span class="orange-soft">
                  TOMORROW
                </span>
              </h1>

              <p class="hero-copy">
                NEXIVRA is an adaptive AI training platform
                that learns the learner, teaches through
                conversation, creates realistic practice,
                observes performance, and helps organizations
                turn knowledge into demonstrated skill.
              </p>

              <div class="hero-actions">
                <button
                  class="primary-button"
                  data-demo
                >
                  Request a Demo \u2192
                </button>

                <button
                  class="secondary-button"
                  data-scroll="platform"
                >
                  Explore the Platform
                </button>
              </div>
            </div>

            <div class="hero-visual">
              <img
                src="${HERO_IMAGE}"
                alt="NEXIVRA connected human future"
              >
            </div>

          </section>

          <section id="about">

            <div class="section-heading">

              <div class="eyebrow">
                THE NEXIVRA DIFFERENCE
              </div>

              <h2>
                LEARN THE LEARNER.
                <br>
                THEN TEACH.
              </h2>

              <p>
                Traditional training delivers the same content
                to everyone. NEXIVRA learns how each person
                communicates, responds, processes information,
                practices, and performs \u2014 then adapts the
                experience around them.
              </p>

            </div>

            <div class="feature-grid">

              <div class="feature-card">
                <div class="feature-icon">\u25CE</div>

                <h3>
                  Conversational AI
                </h3>

                <p>
                  Natural training through real interaction
                  instead of passive content.
                </p>
              </div>

              <div class="feature-card">
                <div class="feature-icon">\u21BB</div>

                <h3>
                  Adaptive Teaching
                </h3>

                <p>
                  NEXIVRA changes how it teaches based on how
                  the learner responds.
                </p>
              </div>

              <div class="feature-card">
                <div class="feature-icon">\u25C9</div>

                <h3>
                  Realistic Practice
                </h3>

                <p>
                  Role-play, scenarios, feedback, coaching,
                  and repeated practice build capability.
                </p>
              </div>

              <div class="feature-card">
                <div class="feature-icon">\u2197</div>

                <h3>
                  Performance Intelligence
                </h3>

                <p>
                  Measure what learners can demonstrate,
                  where they improve, and what they need next.
                </p>
              </div>

            </div>

          </section>

          <section id="industries">

            <div class="industry-intro">

              <div class="eyebrow">
                DESIGNED AROUND YOUR ORGANIZATION
              </div>

              <h2>
                TRAINING THAT SPEAKS
                <br>
                YOUR LANGUAGE
              </h2>

              <p>
                NEXIVRA Core provides the intelligence.
                Your organization's knowledge, standards,
                behaviors, scenarios, goals, and culture
                shape the learning experience.
              </p>

            </div>

            <div class="industry-grid">

              <div class="industry-card">
                <img
                  src="${HOSPITALITY_IMAGE}"
                  alt="Hospitality"
                >

                <div class="industry-body">
                  <h3>
                    Hospitality
                  </h3>

                  <p>
                    Create stronger service, communication,
                    emotional awareness, and memorable guest
                    experiences.
                  </p>

                  <div class="arrow">
                    \u2192
                  </div>
                </div>
              </div>

              <div class="industry-card">
                <img
                  src="${HEALTHCARE_IMAGE}"
                  alt="Healthcare"
                >

                <div class="industry-body">
                  <h3>
                    Healthcare
                  </h3>

                  <p>
                    Strengthen trust, communication,
                    compassion, service recovery,
                    and patient experience.
                  </p>

                  <div class="arrow">
                    \u2192
                  </div>
                </div>
              </div>

              <div class="industry-card">
                <img
                  src="${FINANCIAL_IMAGE}"
                  alt="Financial Services"
                >

                <div class="industry-body">
                  <h3>
                    Financial Services
                  </h3>

                  <p>
                    Build confidence, stronger conversations,
                    deeper relationships, and client trust.
                  </p>

                  <div class="arrow">
                    \u2192
                  </div>
                </div>
              </div>

              <div class="industry-card">
                <img
                  src="${SENIOR_LIVING_IMAGE}"
                  alt="Senior Living"
                >

                <div class="industry-body">
                  <h3>
                    Senior Living
                  </h3>

                  <p>
                    Develop communication rooted in dignity,
                    empathy, trust, connection, and respect.
                  </p>

                  <div class="arrow">
                    \u2192
                  </div>
                </div>
              </div>

              <div class="industry-card">
                <img
                  src="${CONNECTED_TEAMS_IMAGE}"
                  alt="Multi-Location Organizations"
                >

                <div class="industry-body">
                  <h3>
                    Multi-Location Organizations
                  </h3>

                  <p>
                    Create consistent capability across people,
                    locations, teams, leaders, and roles.
                  </p>

                  <div class="arrow">
                    \u2192
                  </div>
                </div>
              </div>

            </div>

          </section>

          <section id="platform">

            <div class="platform-heading">

              <div class="eyebrow">
                ONE INTELLIGENT PLATFORM
              </div>

              <h2>
                CONVERSATION.
                <br>
                PRACTICE.
                <br>
                PERFORMANCE.
              </h2>

              <p>
                NEXIVRA combines adaptive AI,
                real-time conversation,
                behavioral observation,
                realistic practice,
                evaluation,
                coaching,
                and learner memory into one connected
                development experience.
              </p>

            </div>

            <div class="platform-grid">

              <div class="platform-card">
                <h3>
                  Learn the Learner
                </h3>

                <p>
                  NEXIVRA builds an understanding of the
                  individual and uses that understanding
                  to shape the learning experience.
                </p>
              </div>

              <div class="platform-card">
                <h3>
                  Teach Adaptively
                </h3>

                <p>
                  The platform adjusts explanations,
                  questions, pacing, practice,
                  and coaching based on the learner.
                </p>
              </div>

              <div class="platform-card">
                <h3>
                  Practice Real Work
                </h3>

                <p>
                  Learners interact with realistic situations,
                  conversations, role-play, and scenarios
                  drawn from the subject.
                </p>
              </div>

              <div class="platform-card">
                <h3>
                  Demonstrate Capability
                </h3>

                <p>
                  NEXIVRA evaluates demonstrated performance
                  and helps determine what the learner
                  should practice next.
                </p>
              </div>

            </div>

          </section>

          <section>

            <div class="section-heading">
              <div class="eyebrow">
                YOUR NEXIVRA ENVIRONMENT
              </div>

              <h2>
                ONE PLATFORM.
                <br>
                DIFFERENT EXPERIENCES.
              </h2>
            </div>

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

                <button
                  class="access-link"
                  data-login
                >
                  Client Login \u2192
                </button>
              </div>

              <div class="access-card">
                <h3>
                  Learner Experience
                </h3>

                <p>
                  Learners log into their assigned environment,
                  access their courses, continue previous sessions,
                  practice with the AI instructor,
                  and see their development progress.
                </p>

                <button
                  class="access-link"
                  data-login
                >
                  Learner Login \u2192
                </button>
              </div>

            </div>

          </section>

          <section id="contact">

            <div class="cta-box">

              <div class="eyebrow">
                THE FUTURE OF LEARNING IS PERSONAL
              </div>

              <h2>
                BUILD STRONGER PEOPLE.
                <br>
                <span class="cyan">
                  BUILD A STRONGER
                </span>
                <span class="orange-soft">
                  ORGANIZATION.
                </span>
              </h2>

              <p>
                Turn your organization's knowledge,
                standards, scenarios, goals,
                and culture into an adaptive AI training
                experience built around the people
                you are developing.
              </p>

              <div class="hero-actions">
                <button
                  class="primary-button"
                  data-demo
                >
                  Request a Demo \u2192
                </button>
              </div>

            </div>

          </section>

          <footer>

            <div class="footer-top">

              <div>
                <img
                  class="footer-logo"
                  src="${LOGO_URL}"
                  alt="NEXIVRA"
                >
              </div>

              <div class="footer-links">
                <button data-scroll="platform">
                  Platform
                </button>

                <button data-scroll="industries">
                  Industries
                </button>

                <button data-scroll="about">
                  About
                </button>

                <button data-login>
                  Login
                </button>
              </div>

              <div class="footer-links">
                <button data-login>
                  Client Login
                </button>

                <button data-scroll="contact">
                  Contact
                </button>

                <span>
                  Privacy
                </span>
              </div>

            </div>

            <div class="footer-bottom">

              <div>
                \xA9 2026 NEXIVRA. All rights reserved.
              </div>

              <div class="tagline">
                The Next Generation of
                <span>
                  Connected Intelligence
                </span>
              </div>

            </div>

          </footer>

        </div>
      </div>
    `;
  }
};
if (!customElements.get("nexivra-home")) {
  customElements.define(
    "nexivra-home",
    NexivraHome
  );
}
