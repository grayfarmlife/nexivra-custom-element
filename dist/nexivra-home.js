// src/nexivra-home.js
var LOGO_URL = "https://static.wixstatic.com/media/433270_e3b37abf0524488796c381c8a6c5e025~mv2.png";
var HERO_IMAGE = "https://static.wixstatic.com/media/433270_8657d23c372248acba93903ebe9f5843~mv2.png";
var HOSPITALITY_IMAGE = "https://static.wixstatic.com/media/433270_7b3b256ab3f5477faff559a22adc9790~mv2.png";
var SENIOR_LIVING_IMAGE = "https://static.wixstatic.com/media/433270_afa1f9a60edd4173a176e596b61affef~mv2.png";
var HEALTHCARE_IMAGE = "https://static.wixstatic.com/media/433270_eb9533bfcae242c7899e6718b51c0905~mv2.png";
var CONNECTED_TEAMS_IMAGE = "https://static.wixstatic.com/media/433270_d03ac614d9a9482fa764babbb1970379~mv2.png";
var FINANCIAL_IMAGE = "https://static.wixstatic.com/media/433270_162ea5878a0d45ebabc35384ab067a8e~mv2.png";
var LOGIN_URL = "https://nexivratech.com/login";
var NexivraHome = class extends HTMLElement {
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
  static get observedAttributes() {
    return ["demo-request-result", "demo-bridge-ready"];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "demo-request-result" && newValue && this.shadowRoot) {
      try {
        const result = JSON.parse(newValue);
        if (result.requestId !== this.requestId) return;
        clearTimeout(this.requestTimer);
        const status = this.shadowRoot.getElementById("demo-request-status");
        status.textContent = result.ok ? "Thank you. Your request is received. Our team will send your personal invitation by email." : "We could not submit your request. Please try again.";
        this.shadowRoot.getElementById("demo-submit").disabled = false;
        this.submitting = false;
        if (result.ok) this.shadowRoot.getElementById("demo-request-form").reset();
      } catch (_) {
      }
    }
  }
  bindEvents() {
    const form = this.shadowRoot.getElementById("demo-request-form");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (this.submitting || !form.reportValidity()) return;
      const status = this.shadowRoot.getElementById("demo-request-status");
      if (this.getAttribute("demo-bridge-ready") !== "true") {
        status.textContent = "The request form is still connecting. Please try again shortly.";
        return;
      }
      const data = Object.fromEntries(new FormData(form));
      delete data.consent;
      this.submitting = true;
      this.requestId = String(Date.now()) + "-" + Math.random().toString(36).slice(2);
      this.shadowRoot.getElementById("demo-submit").disabled = true;
      status.textContent = "Submitting your request\u2026";
      this.dispatchEvent(new CustomEvent("nexstorven-demo-request", {
        detail: { requestId: this.requestId, prospect: data }
      }));
      this.requestTimer = setTimeout(() => {
        if (!this.submitting) return;
        status.textContent = "The request is taking longer than expected. Please wait before trying again.";
        this.shadowRoot.getElementById("demo-submit").disabled = false;
        this.submitting = false;
      }, 3e4);
    });
    this.shadowRoot.querySelectorAll("[data-scroll]").forEach((button) => {
      button.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          const id = button.getAttribute(
            "data-scroll"
          );
          const target = this.shadowRoot.getElementById(
            id
          );
          target?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      );
    });
    this.shadowRoot.querySelectorAll("[data-login]").forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          window.top.location.href = LOGIN_URL;
        }
      );
    });
    this.shadowRoot.querySelectorAll("[data-demo]").forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          this.shadowRoot.getElementById("contact")?.scrollIntoView({
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
    16 / 9;

  display: block;

  object-fit: contain;

  background: #020711;
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


.header{min-height:100px;padding-top:12px;padding-bottom:12px}.header-logo{width:190px;max-width:24vw}.demo-request{scroll-margin-top:170px}
/* D2.8: an actual destination for every Request a Demo and Contact button. */
.demo-request{padding:84px max(6vw,24px);background:linear-gradient(125deg,#061727,#020711);border-top:1px solid #23445f;scroll-margin-top:170px}
.request-grid{max-width:1180px;margin:auto;display:grid;grid-template-columns:1fr 1.1fr;gap:60px}.request-copy h2{font-size:clamp(30px,4vw,48px);line-height:1.12;margin:18px 0}.request-copy p,.request-copy li{color:#b8c8d8;line-height:1.75}.request-copy li{margin:14px 0}.request-copy strong{color:#00c9fa}.request-form{padding:30px;background:#0b1c2c;border:1px solid #29475f;border-radius:18px;display:grid;grid-template-columns:1fr 1fr;gap:18px}.request-form label{display:flex;flex-direction:column;gap:7px;font-size:13px;color:#dce9f2}.request-form input,.request-form select,.request-form textarea{width:100%;padding:12px;border-radius:8px;border:1px solid #39546a;background:#05111f;color:#fff;font:inherit;box-sizing:border-box}.request-form .wide{grid-column:1/-1}.request-form .consent{flex-direction:row;align-items:flex-start;line-height:1.6}.request-form .consent input{width:auto;margin-top:5px}.request-form button{padding:15px;background:#00c9fa;color:#001b2b;border:0;border-radius:8px;font-weight:700;cursor:pointer}.request-form button:disabled{opacity:.6;cursor:wait}.request-form input:focus-visible,.request-form textarea:focus-visible,.request-form select:focus-visible,.request-form button:focus-visible{outline:3px solid #ff9d18;outline-offset:3px}.request-form .trap{position:absolute;left:-10000px}.request-form p{font-size:13px;line-height:1.6;color:#c1d2df;margin:0}
@media(max-width:760px){.request-grid{grid-template-columns:1fr;gap:24px}.request-form{grid-template-columns:1fr;padding:20px}.request-form label{grid-column:1/-1}.demo-request{padding:50px 22px}}

</style>


<div class="site">


<!-- =====================================================
     HEADER
===================================================== -->

<header class="header">

  <img
    class="header-logo"
    src="${LOGO_URL}"
    alt="NEXSTORVEN"
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

      NEXSTORVEN is an adaptive AI training platform
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
        Request a Demo \u2192
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
      alt="NEXSTORVEN AI people real impact"
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
      THE NEXSTORVEN DIFFERENCE
    </div>


    <h2>
      LEARN THE LEARNER.
      <br>
      THEN TEACH.
    </h2>


    <p>

      Traditional training delivers
      the same content to everyone.

      NEXSTORVEN learns how each person
      communicates, responds,
      processes information,
      practices, and performs \u2014
      then adapts the experience around them.

    </p>

  </div>


  <div class="feature-grid">

    <div class="feature">

      <div class="feature-icon">
        \u25CE
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
        \u21BB
      </div>

      <h3>
        Adaptive Teaching
      </h3>

      <p>
        NEXSTORVEN changes how it teaches
        based on how the learner responds.
      </p>

    </div>


    <div class="feature">

      <div class="feature-icon">
        \u25C9
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
        \u2197
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

      NEXSTORVEN Core provides the intelligence.
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
          \u2192
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
          \u2192
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
          \u2192
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
          \u2192
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
          \u2192
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

      NEXSTORVEN combines adaptive AI,
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

        NEXSTORVEN builds an understanding
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

        NEXSTORVEN evaluates demonstrated
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
      YOUR NEXSTORVEN ENVIRONMENT
    </div>


    <h2>

      ONE LOGIN.
      <br>
      THE RIGHT EXPERIENCE.

    </h2>


    <p>

      Every authorized user enters
      NEXSTORVEN through one secure login.

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
        Sign in to NEXSTORVEN
      </h3>


      <p>

        Whether you manage the platform,
        lead an organization,
        or are completing training,
        NEXSTORVEN automatically connects
        you to the correct environment
        after authentication.

      </p>


      <button
        class="primary"
        data-login
      >
        Sign In to NEXSTORVEN \u2192
      </button>

    </div>


    <div class="role-stack">


      <div class="role">

        <div class="role-code">
          NX
        </div>

        <div>

          <strong>
            NEXSTORVEN Management
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
  id="demo-overview"
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
        Request a Demo \u2192
      </button>

    </div>

  </div>

</section>


<!-- =====================================================
     FOOTER
===================================================== -->


<section id="contact" class="demo-request" aria-labelledby="request-title">
<div class="request-grid"><div class="request-copy">
<p class="eyebrow">YOUR COMPANY. YOUR PEOPLE. YOUR DEMONSTRATION.</p>
<h2 id="request-title">SEE HOW NEXSTORVEN COULD HELP <span class="blue">YOUR TEAM.</span></h2>
<p>Tell us a little about your company. Elenora will use that context to guide a personal demonstration built around your training needs.</p>
<ul><li><strong>Learn through conversation.</strong> Explore a practical teaching experience with Elenora.</li><li><strong>Practise without an audience.</strong> Meet Matthew in a realistic role-play when it fits your needs.</li><li><strong>Explore everyday support.</strong> See Hannah demonstrate an AI assistant, and ask about planned support for company knowledge and course creation.</li></ul>
<p>Up to 12 minutes \xB7 Speak or type \xB7 No camera needed</p>
<p>This form requests an invitation. Your personal demo link will arrive separately by email.</p>
</div><form id="demo-request-form" class="request-form">
<label>First name *<input name="firstName" autocomplete="given-name" maxlength="80" required></label>
<label>Last name *<input name="lastName" autocomplete="family-name" maxlength="80" required></label>
<label class="wide">Email address *<input name="email" type="email" autocomplete="email" maxlength="254" required></label>
<label class="wide">Company name *<input name="companyName" autocomplete="organization" maxlength="160" required></label>
<label>Your role<input name="jobTitle" autocomplete="organization-title" maxlength="120"></label>
<label>Industry<select name="industry"><option value="other">Select your industry</option><option>Hospitality</option><option>Healthcare</option><option>Financial services</option><option>Senior living</option><option>Professional services</option><option>Retail</option><option>Multi-location organization</option><option value="other">Other</option></select></label>
<label class="wide">Number of employees<select name="employeeCount"><option value="">Select a range</option><option>1\u201325</option><option>26\u2013100</option><option>101\u2013500</option><option>501\u20131000</option><option>1000+</option></select></label>
<label class="wide">What would you most like to improve?<textarea name="trainingChallenge" rows="4" maxlength="2000" placeholder="For example: engaging training, confident conversations, consistent onboarding, or finding company information."></textarea></label>
<label class="trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
<label class="wide consent"><input type="checkbox" name="consent" required><span>Please contact me by email about my requested NEXSTORVEN demonstration.</span></label>
<button id="demo-submit" class="wide" type="submit">Request My Personal Demo \u2192</button>
<p id="demo-request-status" class="wide" role="status" aria-live="polite"></p>
</form></div></section>

<footer class="footer">

  <div class="footer-grid">


    <div>

      <img
        class="footer-logo"
        src="${LOGO_URL}"
        alt="NEXSTORVEN"
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
      \xA9 2026 NEXSTORVEN. All rights reserved.
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
};
if (!customElements.get(
  "nexivra-home"
)) {
  customElements.define(
    "nexivra-home",
    NexivraHome
  );
}
