/* =========================================================
   NEXSTORVEN HOME
   Public-facing rebrand of the existing NEXIVRA Home element.

   IMPORTANT:
   - Customer-facing branding = NEXSTORVEN
   - Internal custom-element identity remains nexivra-home
   - Existing login routing remains unchanged for demo safety
   ========================================================= */

const LOGO_URL =
  "https://static.wixstatic.com/media/433270_e3b37abf0524488796c381c8a6c5e025~mv2.png";

const HERO_IMAGE =
  "https://static.wixstatic.com/media/433270_8657d23c372248acba93903ebe9f5843~mv2.png";

const HOSPITALITY_IMAGE =
  "https://static.wixstatic.com/media/433270_7b3b256ab3f5477faff559a22adc9790~mv2.png";

const SENIOR_LIVING_IMAGE =
  "https://static.wixstatic.com/media/433270_afa1f9a60edd4173a176e596b61affef~mv2.png";

const HEALTHCARE_IMAGE =
  "https://static.wixstatic.com/media/433270_eb9533bfcae242c7899e6718b51c0905~mv2.png";

const CONNECTED_TEAMS_IMAGE =
  "https://static.wixstatic.com/media/433270_d03ac614d9a9482fa764babbb1970379~mv2.png";

const FINANCIAL_IMAGE =
  "https://static.wixstatic.com/media/433270_162ea5878a0d45ebabc35384ab067a8e~mv2.png";

const LOGIN_URL =
  "https://nexivratech.com/login";


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
  .platform-grid
