const LOGO_URL =
  "https://static.wixstatic.com/media/433270_aba4225e8fc54279ba41af267bab397a~mv2.png";

const HERO_IMAGE =
  "https://static.wixstatic.com/media/433270_c2c3b23a9eb9422da7d8aca2c9239840~mv2.png";

const HOSPITALITY_IMAGE =
  "https://static.wixstatic.com/media/433270_a00caa15c8a64cc09e47e59ccb5a1081~mv2.png";

const SENIOR_LIVING_IMAGE =
  "https://static.wixstatic.com/media/433270_eed61d022cfc4157ae2a06614a0e4ecf~mv2.png";

const HEALTHCARE_IMAGE =
  "https://static.wixstatic.com/media/433270_224fec054635445987e2b072424d5f49~mv2.png";

const CONNECTED_TEAMS_IMAGE =
  "https://static.wixstatic.com/media/433270_082c2ff6123241e18afb516df3af9b6b~mv2.png";

const FINANCIAL_IMAGE =
  "https://static.wixstatic.com/media/433270_28132edbcc3945718e98edbcc864a722~mv2.png";

const LOGIN_URL =
  "https://createdbyken.wixstudio.com/my-site-5/login";


class NexivraHome extends HTMLElement {

  constructor() {
    super();

    this.attachShadow({
      mode: "open"
    });
  }


  connectedCallback() {

    this.render();

    this.bindEvents();

  }


  bindEvents() {

    this.shadowRoot
      .querySelectorAll("[data-scroll]")
      .forEach(button => {

        button.addEventListener(
          "click",
          event => {

            event.preventDefault();

            const id =
              button.getAttribute(
                "data-scroll"
              );

            const target =
              this.shadowRoot.getElementById(
                id
              );

            target?.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });

          }
        );

      });


    this.shadowRoot
      .querySelectorAll("[data-login]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            window.top.location.href =
              LOGIN_URL;

          }
        );

      });


    this.shadowRoot
      .querySelectorAll("[data-demo]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            this.shadowRoot
              .getElementById("contact")
              ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
              });

          }
        );

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

html,
body {
  margin: 0;
}

button,
a {
  font: inherit;
}

button {
  cursor: pointer;
}

a {
  color: inherit;
  text-decoration: none;
}

.site {
  width: 100%;

  background:
    radial-gradient(
      circle at 80% 8%,
      rgba(0, 174, 255, .09),
      transparent 34%
    ),
    #020711;
}


/* =========================================================
   HEADER
========================================================= */

.header {
  min-height: 118px;

  position: sticky;
  top: 0;
  z-index: 100;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding:
    0 32px;

  background:
    rgba(3, 16, 29, .92);

  backdrop-filter:
    blur(20px);

  border-bottom:
    1px solid rgba(255,255,255,.06);
}

.header-logo {
  width: 300px;
  max-width: 27vw;
  display: block;
}

.nav {
  display: flex;
  align-items: center;

  gap: 29px;
}

.nav button {
  border: 0;
  background: transparent;

  padding: 5px 0;

  color: #a9b9c9;

  font-size: 14px;

  transition:
    .2s ease;
}

.nav button:hover {
  color: #00c9ff;
}

.nav .login {
  color: #00c9ff;
  font-weight: 800;
}

.nav .demo {
  padding:
    14px 22px;

  border:
    1px solid #00aef0;

  border-radius:
    11px;

  color: white;

  background:
    linear-gradient(
      90deg,
      rgba(0, 140, 255, .18),
      rgba(0, 200, 255, .05)
    );
}


/* =========================================================
   HERO
========================================================= */

.hero {
  min-height: 760px;

  display: grid;

  grid-template-columns:
    minmax(0, .88fr)
    minmax(0, 1.12fr);

  align-items: center;

  gap: 54px;

  padding:
    70px 30px 82px;
}

.eyebrow {
  color: #00c8ff;

  font-size: 11px;
  font-weight: 800;

  letter-spacing: 5px;

  text-transform: uppercase;
}

.hero h1 {
  margin:
    24px 0 26px;

  font-size:
    clamp(
      58px,
      6.5vw,
      105px
    );

  line-height: .91;

  letter-spacing: -4px;

  text-transform: uppercase;
}

.blue {
  color: #069df8;
}

.cyan {
  color: #32c6f3;
}

.orange {
  color: #ff9927;
}

.hero-copy {
  max-width: 600px;

  margin: 0;

  color: #a0b2c4;

  font-size: 19px;

  line-height: 1.68;
}

.hero-actions {
  display: flex;

  gap: 15px;

  margin-top: 34px;
}

.primary {
  padding:
    15px 25px;

  border: 0;

  border-radius: 10px;

  background:
    linear-gradient(
      90deg,
      #079bf5,
      #23cfff
    );

  color: #00121d;

  font-weight: 800;
}

.secondary {
  padding:
    15px 25px;

  border:
    1px solid #00aef0;

  border-radius: 10px;

  background: transparent;

  color: white;

  font-weight: 800;
}

.hero-image-wrap {
  overflow: hidden;

  border:
    1px solid rgba(0, 174, 240, .38);

  border-radius: 21px;

  box-shadow:
    0 0 80px rgba(0, 174, 240, .07);
}

.hero-image {
  display: block;

  width: 100%;
}


/* =========================================================
   SECTIONS
========================================================= */

.section {
  padding:
    105px 30px;

  border-top:
    1px solid rgba(255,255,255,.06);
}

.center-heading {
  max-width: 990px;

  margin:
    0 auto 56px;

  text-align: center;
}

.center-heading h2,
.left-heading h2 {
  margin:
    17px 0 22px;

  font-size:
    clamp(
      46px,
      5.4vw,
      76px
    );

  line-height: .97;

  letter-spacing: -2px;

  text-transform: uppercase;
}

.center-heading p,
.left-heading p {
  color: #98abbe;

  font-size: 17px;

  line-height: 1.65;
}

.left-heading {
  max-width: 890px;

  margin-bottom: 48px;
}


/* =========================================================
   LEARN THE LEARNER
========================================================= */

.feature-grid {
  display: grid;

  grid-template-columns:
    repeat(4, 1fr);

  gap: 18px;
}

.feature {
  min-height: 235px;

  padding: 26px;

  border:
    1px solid rgba(0, 174, 240, .22);

  border-radius: 18px;

  background:
    linear-gradient(
      145deg,
      rgba(6, 26, 44, .93),
      rgba(2, 9, 18, .98)
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

  font-size: 22px;
}

.feature h3 {
  margin:
    0 0 12px;

  font-size: 20px;
}

.feature p {
  margin: 0;

  color: #8da2b6;

  line-height: 1.6;
}


/* =========================================================
   INDUSTRIES
========================================================= */

.industry-grid {
  display: grid;

  grid-template-columns:
    repeat(5, 1fr);

  gap: 16px;
}

.industry-card {
  overflow: hidden;

  border:
    1px solid rgba(0,174,240,.29);

  border-radius: 17px;

  background: #04111d;
}

.industry-card img {
  width: 100%;

  aspect-ratio:
    1.12 / 1;

  display: block;

  object-fit: cover;
}

.industry-content {
  padding: 20px;
}

.industry-content h3 {
  margin:
    0 0 12px;

  font-size: 19px;
}

.industry-content p {
  min-height: 100px;

  margin: 0;

  color: #93a7ba;

  font-size: 14px;

  line-height: 1.55;
}

.round-arrow {
  width: 38px;
  height: 38px;

  display: grid;
  place-items: center;

  margin-top: 18px;

  border:
    1px solid #00aef0;

  border-radius: 50%;
}


/* =========================================================
   PLATFORM
========================================================= */

.platform-grid {
  display: grid;

  grid-template-columns:
    repeat(4, 1fr);

  gap: 18px;
}

.platform-card {
  min-height: 205px;

  padding: 26px;

  border:
    1px solid rgba(0,174,240,.22);

  border-radius: 17px;

  background:
    linear-gradient(
      145deg,
      rgba(6, 25, 43, .93),
      rgba(2, 9, 17, .98)
    );
}

.platform-card h3 {
  margin:
    0 0 14px;

  font-size: 19px;
}

.platform-card p {
  margin: 0;

  color: #91a6b9;

  line-height: 1.64;
}


/* =========================================================
   ONE LOGIN
========================================================= */

.access-heading {
  max-width: 900px;

  margin-bottom: 42px;
}

.access-heading h2 {
  margin:
    16px 0 20px;

  font-size:
    clamp(
      47px,
      5.4vw,
      75px
    );

  line-height: .97;

  text-transform: uppercase;
}

.access-heading p {
  max-width: 760px;

  color: #97aabd;

  line-height: 1.65;
}

.access-grid {
  display: grid;

  grid-template-columns:
    1.05fr .95fr;

  gap: 20px;
}

.login-card {
  padding: 40px;

  border:
    1px solid rgba(0,174,240,.30);

  border-radius: 19px;

  background:
    linear-gradient(
      145deg,
      rgba(6, 27, 45, .95),
      rgba(2, 9, 18, .98)
    );
}

.login-card h3 {
  margin:
    10px 0 15px;

  font-size: 33px;
}

.login-card p {
  max-width: 610px;

  color: #97aabd;

  line-height: 1.68;
}

.login-card .primary {
  margin-top: 18px;
}

.role-stack {
  display: grid;

  gap: 12px;
}

.role {
  display: flex;

  gap: 14px;

  align-items: center;

  padding: 17px;

  border:
    1px solid rgba(255,255,255,.07);

  border-radius: 14px;

  background:
    rgba(255,255,255,.018);
}

.role-code {
  width: 42px;
  height: 42px;

  flex: 0 0 42px;

  display: grid;
  place-items: center;

  border:
    1px solid rgba(0,200,255,.3);

  border-radius: 50%;

  color: #00c8ff;

  font-size: 12px;

  font-weight: 800;
}

.role strong {
  display: block;

  margin-bottom: 4px;
}

.role span {
  color: #768da2;

  font-size: 12px;

  line-height: 1.4;
}


/* =========================================================
   CTA
========================================================= */

.cta {
  position: relative;

  overflow: hidden;

  padding: 65px;

  border:
    1px solid rgba(0,174,240,.3);

  border-radius: 23px;

  background:
    radial-gradient(
      circle at 78% 55%,
      rgba(0, 145, 255, .18),
      transparent 37%
    ),
    linear-gradient(
      145deg,
      #061725,
      #020811
    );
}

.cta h2 {
  max-width: 920px;

  margin:
    17px 0 24px;

  font-size:
    clamp(
      52px,
      6.4vw,
      92px
    );

  line-height: .94;

  letter-spacing: -2px;

  text-transform: uppercase;
}

.cta p {
  max-width: 730px;

  color: #97aabd;

  line-height: 1.65;
}


/* =========================================================
   FOOTER
========================================================= */

.footer {
  padding:
    70px 30px 30px;

  border-top:
    1px solid rgba(255,255,255,.06);
}

.footer-grid {
  display: grid;

  grid-template-columns:
    1.25fr 1fr 1fr;

  gap: 55px;
}

.footer-logo {
  width: 310px;
  max-width: 100%;
}

.footer-links {
  display: grid;

  gap: 18px;

  color: #98aabd;
}

.footer-links button {
  border: 0;

  padding: 0;

  background: none;

  color: inherit;

  text-align: left;
}

.footer-links button:hover {
  color: #00c8ff;
}

.footer-bottom {
  display: flex;

  justify-content: space-between;

  gap: 20px;

  margin-top: 48px;

  padding-top: 23px;

  border-top:
    1px solid rgba(255,255,255,.06);

  color: #6d8397;

  font-size: 12px;
}

.footer-tagline {
  color: #00c8ff;
}

.footer-tagline span {
  color: #ff9827;
}


/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 1100px) {

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

@media (max-width: 850px) {

  .header {
    min-height: auto;

    padding:
      17px 20px;
  }

  .header-logo {
    width: 180px;
    max-width: 45vw;
  }

  .nav button:not(.login) {
    display: none;
  }

  .hero {
    grid-template-columns:
      1fr;

    min-height: auto;

    padding:
      65px 20px;
  }

  .section {
    padding:
      78px 20px;
  }

  .feature-grid,
  .platform-grid,
  .industry-grid,
  .access-grid {
    grid-template-columns:
      1fr;
  }

  .industry-content p {
    min-height: auto;
  }

  .cta {
    padding:
      40px 24px;
  }

  .footer-grid {
    grid-template-columns:
      1fr;
  }

  .footer-bottom {
    flex-direction: column;
  }

}

</style>


<div class="site">


<!-- =====================================================
     HEADER
===================================================== -->

<header class="header">

  <img
    class="header-logo"
    src="${LOGO_URL}"
    alt="NEXIVRA"
  >


  <nav class="nav">

    <button data-scroll="platform">
      Platform
    </button>

    <button data-scroll="industries">
      Industries
    </button>

    <button data-scroll="about">
      About
    </button>

    <button data-scroll="contact">
      Contact
    </button>

    <button
      class="login"
      data-login
    >
      Login
    </button>

    <button
      class="demo"
      data-demo
    >
      Request a Demo
    </button>

  </nav>

</header>


<!-- =====================================================
     HERO
===================================================== -->

<section class="hero">

  <div>

    <div class="eyebrow">
      AI TRAINING. REAL PERFORMANCE.
    </div>


    <h1>

      HUMAN-
      CENTERED
      AI TRAINING

      <span class="blue">
        FOR A
      </span>

      <span class="cyan">
        SMARTER
      </span>

      <span class="orange">
        TOMORROW
      </span>

    </h1>


    <p class="hero-copy">

      NEXIVRA is an adaptive AI training platform
      that learns the learner,
      teaches through conversation,
      creates realistic practice,
      observes performance,
      and helps organizations turn knowledge
      into demonstrated skill.

    </p>


    <div class="hero-actions">

      <button
        class="primary"
        data-demo
      >
        Request a Demo →
      </button>


      <button
        class="secondary"
        data-scroll="platform"
      >
        Explore the Platform
      </button>

    </div>

  </div>


  <div class="hero-image-wrap">

    <img
      class="hero-image"
      src="${HERO_IMAGE}"
      alt="NEXIVRA AI people real impact"
    >

  </div>

</section>


<!-- =====================================================
     DIFFERENCE
===================================================== -->

<section
  id="about"
  class="section"
>

  <div class="center-heading">

    <div class="eyebrow">
      THE NEXIVRA DIFFERENCE
    </div>


    <h2>
      LEARN THE LEARNER.
      <br>
      THEN TEACH.
    </h2>


    <p>

      Traditional training delivers
      the same content to everyone.

      NEXIVRA learns how each person
      communicates, responds,
      processes information,
      practices, and performs —
      then adapts the experience around them.

    </p>

  </div>


  <div class="feature-grid">

    <div class="feature">

      <div class="feature-icon">
        ◎
      </div>

      <h3>
        Conversational AI
      </h3>

      <p>
        Natural training through real interaction
        instead of passive content.
      </p>

    </div>


    <div class="feature">

      <div class="feature-icon">
        ↻
      </div>

      <h3>
        Adaptive Teaching
      </h3>

      <p>
        NEXIVRA changes how it teaches
        based on how the learner responds.
      </p>

    </div>


    <div class="feature">

      <div class="feature-icon">
        ◉
      </div>

      <h3>
        Realistic Practice
      </h3>

      <p>
        Role-play, scenarios, feedback,
        coaching, and repeated practice
        build capability.
      </p>

    </div>


    <div class="feature">

      <div class="feature-icon">
        ↗
      </div>

      <h3>
        Performance Intelligence
      </h3>

      <p>
        Measure what learners can demonstrate,
        where they improve,
        and what they need next.
      </p>

    </div>

  </div>

</section>


<!-- =====================================================
     INDUSTRIES
===================================================== -->

<section
  id="industries"
  class="section"
>

  <div class="left-heading">

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
      Your organization's knowledge,
      standards, behaviors, scenarios,
      goals, and culture shape
      the learning experience.

    </p>

  </div>


  <div class="industry-grid">


    <div class="industry-card">

      <img
        src="${HOSPITALITY_IMAGE}"
        alt="Hospitality"
      >

      <div class="industry-content">

        <h3>
          Hospitality
        </h3>

        <p>

          Create stronger service,
          communication,
          emotional awareness,
          and memorable guest experiences.

        </p>

        <div class="round-arrow">
          →
        </div>

      </div>

    </div>


    <div class="industry-card">

      <img
        src="${HEALTHCARE_IMAGE}"
        alt="Healthcare"
      >

      <div class="industry-content">

        <h3>
          Healthcare
        </h3>

        <p>

          Strengthen trust,
          communication,
          compassion,
          service recovery,
          and patient experience.

        </p>

        <div class="round-arrow">
          →
        </div>

      </div>

    </div>


    <div class="industry-card">

      <img
        src="${FINANCIAL_IMAGE}"
        alt="Financial Services"
      >

      <div class="industry-content">

        <h3>
          Financial Services
        </h3>

        <p>

          Build confidence,
          stronger conversations,
          deeper relationships,
          and client trust.

        </p>

        <div class="round-arrow">
          →
        </div>

      </div>

    </div>


    <div class="industry-card">

      <img
        src="${SENIOR_LIVING_IMAGE}"
        alt="Senior Living"
      >

      <div class="industry-content">

        <h3>
          Senior Living
        </h3>

        <p>

          Develop communication
          rooted in dignity,
          empathy, trust,
          connection, and respect.

        </p>

        <div class="round-arrow">
          →
        </div>

      </div>

    </div>


    <div class="industry-card">

      <img
        src="${CONNECTED_TEAMS_IMAGE}"
        alt="Multi-Location Organizations"
      >

      <div class="industry-content">

        <h3>
          Multi-Location Organizations
        </h3>

        <p>

          Create consistent capability
          across people, locations,
          teams, leaders, and roles.

        </p>

        <div class="round-arrow">
          →
        </div>

      </div>

    </div>

  </div>

</section>


<!-- =====================================================
     PLATFORM
===================================================== -->

<section
  id="platform"
  class="section"
>

  <div class="left-heading">

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
      and learner memory into
      one connected development experience.

    </p>

  </div>


  <div class="platform-grid">


    <div class="platform-card">

      <h3>
        Learn the Learner
      </h3>

      <p>

        NEXIVRA builds an understanding
        of the individual and uses that
        understanding to shape
        the learning experience.

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

        Learners interact with realistic
        situations, conversations,
        role-play, and scenarios
        drawn from the subject.

      </p>

    </div>


    <div class="platform-card">

      <h3>
        Demonstrate Capability
      </h3>

      <p>

        NEXIVRA evaluates demonstrated
        performance and helps determine
        what the learner should practice next.

      </p>

    </div>

  </div>

</section>


<!-- =====================================================
     SINGLE LOGIN
===================================================== -->

<section class="section">

  <div class="access-heading">

    <div class="eyebrow">
      YOUR NEXIVRA ENVIRONMENT
    </div>


    <h2>

      ONE LOGIN.
      <br>
      THE RIGHT EXPERIENCE.

    </h2>


    <p>

      Every authorized user enters
      NEXIVRA through one secure login.

      Your account identifies your role,
      organization, permissions,
      and the experience built for you.

    </p>

  </div>


  <div class="access-grid">


    <div class="login-card">

      <div class="eyebrow">
        SECURE ACCESS
      </div>


      <h3>
        Sign in to NEXIVRA
      </h3>


      <p>

        Whether you manage the platform,
        lead an organization,
        or are completing training,
        NEXIVRA automatically connects
        you to the correct environment
        after authentication.

      </p>


      <button
        class="primary"
        data-login
      >
        Sign In to NEXIVRA →
      </button>

    </div>


    <div class="role-stack">


      <div class="role">

        <div class="role-code">
          NX
        </div>

        <div>

          <strong>
            NEXIVRA Management
          </strong>

          <span>
            Platform administration and authoring
          </span>

        </div>

      </div>


      <div class="role">

        <div class="role-code">
          CO
        </div>

        <div>

          <strong>
            Company Dashboard
          </strong>

          <span>
            Organization management and reporting
          </span>

        </div>

      </div>


      <div class="role">

        <div class="role-code">
          LR
        </div>

        <div>

          <strong>
            Learner Dashboard
          </strong>

          <span>
            Training, practice, progress and development
          </span>

        </div>

      </div>


    </div>

  </div>

</section>


<!-- =====================================================
     CTA
===================================================== -->

<section
  id="contact"
  class="section"
>

  <div class="cta">

    <div class="eyebrow">
      THE FUTURE OF LEARNING IS PERSONAL
    </div>


    <h2>

      BUILD STRONGER
      <br>
      PEOPLE.

      <span class="blue">
        BUILD A STRONGER
      </span>

      <span class="orange">
        ORGANIZATION.
      </span>

    </h2>


    <p>

      Turn your organization's knowledge,
      standards, scenarios, goals,
      and culture into an adaptive
      AI training experience built
      around the people you are developing.

    </p>


    <div class="hero-actions">

      <button
        class="primary"
        data-demo
      >
        Request a Demo →
      </button>

    </div>

  </div>

</section>


<!-- =====================================================
     FOOTER
===================================================== -->

<footer class="footer">

  <div class="footer-grid">


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

    </div>


    <div class="footer-links">

      <button data-login>
        Login
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
      © 2026 NEXIVRA. All rights reserved.
    </div>


    <div class="footer-tagline">

      The Next Generation of

      <span>
        Connected Intelligence
      </span>

    </div>

  </div>

</footer>


</div>

    `;

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
