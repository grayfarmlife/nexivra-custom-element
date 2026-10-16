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
:host{display:block;width:100%;color:#eef5fb;background:#030b14;font-family:Arial,Helvetica,sans-serif}*{box-sizing:border-box}button,input,select,textarea{font:inherit}button{cursor:pointer}button:focus-visible,a:focus-visible{outline:3px solid #ff9b31;outline-offset:5px}button{transition:background .2s,transform .2s}button:hover{transform:translateY(-2px)}.site{overflow:clip;background:radial-gradient(ellipse at 85% 7%,#07324a66,transparent 30%),#030b14}p{color:#a8bdcd;line-height:1.75;font-size:16px}h1,h2,h3,p{margin-top:0}h1,h2{font-weight:600;letter-spacing:-1.7px}h2{font-size:clamp(29px,3.2vw,42px);line-height:1.15;margin-bottom:20px}h3{font-size:21px;line-height:1.3;font-weight:600}a{color:inherit;text-decoration:none}.blue,.cyan{color:#39c9fa}.orange{color:#ff9a36}.wrap,.section,.hero,.demo-request,.footer{max-width:1240px;margin:auto;padding-left:48px;padding-right:48px}.header{position:sticky;top:0;z-index:10;background:#030b14ed;backdrop-filter:blur(20px);border-bottom:1px solid #1b2b3a}.header-inner{max-width:1240px;margin:auto;padding:12px 48px;display:flex;align-items:center;justify-content:space-between;gap:24px}.brand{display:flex;align-items:center;gap:13px}.header-logo{width:76px;height:64px;object-fit:contain}.brand-name{font-size:16px;letter-spacing:3px;font-weight:700}.brand-sub{font-size:9px;letter-spacing:2.1px;color:#7f9aaf;margin-top:7px}.nav{display:flex;align-items:center;gap:26px}.nav button{background:none;border:0;color:#b5c6d3;font-size:13px;padding:10px 0}.nav .demo{border:1px solid #2a799e;border-radius:7px;padding:12px 18px;color:#e8f9ff}.nav .login{color:#47ceff}.hero{padding-top:76px;padding-bottom:60px;display:grid;grid-template-columns:.85fr 1.15fr;align-items:center;gap:44px}.eyebrow{font-size:10px;letter-spacing:2.6px;text-transform:uppercase;font-weight:700;color:#54cfff;margin-bottom:22px;line-height:1.6}.hero h1{font-size:clamp(36px,4.2vw,57px);line-height:1.08;margin:0 0 24px;max-width:520px}.hero h1 span{display:block}.hero-copy{font-size:16px;line-height:1.8;max-width:470px}.hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}.primary,.secondary{padding:14px 20px;border-radius:7px;font-size:13px;font-weight:700}.primary{background:#3ac9fa;border:1px solid #3ac9fa;color:#031420}.secondary{background:transparent;border:1px solid #32485a;color:#e5f3fb}.hero-image-wrap{position:relative;border:1px solid #24546d;border-radius:16px;overflow:hidden;background:#061421;box-shadow:0 18px 90px #0084c51c}.hero-image{display:block;width:100%;height:auto}.image-caption{padding:15px 20px;border-top:1px solid #1b3b50;display:flex;justify-content:space-between;gap:12px;font-size:10px;letter-spacing:1.3px;text-transform:uppercase;color:#a3bacb}.image-caption span:first-child{color:#43d4ff}.hero-note{margin-top:20px;font-size:11px;color:#7f98ab}.signal-bar{max-width:1144px;margin:auto;display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #1d3547;border-bottom:1px solid #1d3547;padding:25px 0;gap:25px}.signal{font-size:13px;color:#c6d8e4;display:flex;align-items:center;gap:12px}.signal span{color:#ffab53;font-size:10px;letter-spacing:1px}.section{padding-top:82px;padding-bottom:78px;scroll-margin-top:105px}.section-intro{max-width:640px;margin-bottom:36px}.section-intro p{max-width:610px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.card{border:1px solid #1d3547;background:linear-gradient(135deg,#0b1b29,#06111c);border-radius:12px;padding:28px;position:relative}.card-number{font-size:11px;color:#48caff;letter-spacing:2px;margin-bottom:32px}.card p{font-size:14px;margin-bottom:0}.card .tag{display:inline-block;margin:22px 0 0;color:#ffb66b;font-size:10px;letter-spacing:1px}.feature-section{border-top:1px solid #132838;border-bottom:1px solid #132838;background:linear-gradient(115deg,#071827,#040d17)}.feature-grid{display:grid;grid-template-columns:1fr 1fr;gap:68px;align-items:center}.knowledge{border:1px solid #28475c;border-radius:16px;background:#07131f;padding:28px;box-shadow:0 20px 70px #0005}.knowledge-top{font-size:10px;letter-spacing:2px;color:#49cdff;padding-bottom:20px;border-bottom:1px solid #1d3547}.question{margin:22px 0 16px;padding:16px 19px;background:#12344b;border-radius:12px 12px 0 12px;font-size:14px;line-height:1.6;color:#e0f2ff}.answer{padding:0 5px;font-size:14px;color:#b5c9d8;line-height:1.8}.source{display:inline-block;font-size:10px;padding:8px 12px;border:1px solid #28475c;border-radius:6px;color:#72cce9;margin-top:18px}.illustration-note{font-size:10px;color:#738fa2;margin-top:18px;line-height:1.6}.benefits{padding:0;list-style:none;margin:24px 0 0}.benefits li{color:#b6cbd9;border-top:1px solid #1c3343;padding:16px 0;font-size:14px;line-height:1.6}.benefits strong{display:block;color:#f1f6fa;margin-bottom:4px}.journey{display:grid;grid-template-columns:repeat(3,1fr);gap:30px}.journey-item{border-top:2px solid #2587ac;padding-top:22px}.journey-item:last-child{border-color:#c97f37}.journey-item .eyebrow{margin-bottom:13px}.journey-item p{font-size:14px;margin-bottom:0}.industries{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.industry{position:relative;overflow:hidden;border-radius:10px;border:1px solid #244052;min-height:205px;background:#091725}.industry img{width:100%;height:205px;object-fit:cover;opacity:.55;display:block}.industry h3{position:absolute;left:22px;bottom:8px;font-size:19px;text-shadow:0 2px 10px #000}.industry:after{content:'';position:absolute;inset:0;background:linear-gradient(transparent,#03101bad);pointer-events:none}.industry h3{z-index:1}.industry-footer{font-size:13px;color:#8aa6ba;margin:22px 0 0}.demo-request{padding-top:80px;padding-bottom:80px;scroll-margin-top:105px}.request-grid{display:grid;grid-template-columns:1fr 1fr;gap:64px}.request-copy h2{font-size:clamp(29px,3.2vw,42px);text-transform:none}.request-copy .eyebrow{font-size:10px}.request-copy p{font-size:14px}.request-copy ul{padding:0;list-style:none}.request-copy li{font-size:14px;color:#9fb7c9;line-height:1.7;margin:20px 0}.request-copy strong{display:block;color:#e1edf5;font-size:15px}.request-form{background:#0a1926;padding:28px;border:1px solid #28465a;border-radius:14px;display:grid;grid-template-columns:1fr 1fr;gap:17px}.request-form label{display:flex;flex-direction:column;gap:8px;font-size:12px;color:#c1d2df}.request-form input,.request-form select,.request-form textarea{padding:12px;width:100%;min-width:0;background:#04111e;border:1px solid #345063;border-radius:6px;color:#edf5fb;font-size:14px}.request-form .wide{grid-column:1/-1}.request-form .consent{flex-direction:row;font-size:11px;line-height:1.6;align-items:flex-start}.request-form .consent input{width:auto;margin-top:3px}.request-form button{padding:15px;background:#3ac9fa;border:0;border-radius:7px;color:#041725;font-size:13px;font-weight:700}.request-form button:disabled{opacity:.6}.request-form p{font-size:12px;margin:0}.request-form :focus-visible{outline:2px solid #ff9b31;outline-offset:3px}.request-form .trap{position:absolute;left:-10000px}.footer{padding-top:30px;padding-bottom:32px;border-top:1px solid #1c3344;display:flex;justify-content:space-between;align-items:center;gap:24px;font-size:11px;color:#7895a9}.footer button{border:0;background:none;color:#a9c1d2;font-size:12px;padding:8px}.footer-links{display:flex;gap:16px}.footer strong{letter-spacing:2px;color:#cbdde9;display:block;margin-bottom:9px}
@media(min-width:1500px){.hero{padding-top:100px;padding-bottom:85px}}
@media(max-width:1000px){.wrap,.section,.hero,.demo-request,.footer{padding-left:30px;padding-right:30px}.header-inner{padding:10px 30px}.nav{gap:17px}.nav .optional{display:none}.brand-name{font-size:13px}.hero{gap:28px}.hero h1{font-size:40px}.signal-bar{margin:0 30px}.feature-grid,.request-grid{gap:35px}.cards{gap:12px}.card{padding:22px}.industries{grid-template-columns:repeat(2,1fr)}}
@media(max-width:760px){.header-inner{padding:10px 22px}.header-logo{width:52px;height:46px}.brand-name{font-size:11px;letter-spacing:2px}.brand-sub{font-size:8px;letter-spacing:1px}.nav button:not(.demo){display:none}.nav .demo{font-size:11px;padding:10px 12px}.wrap,.section,.hero,.demo-request,.footer{padding-left:22px;padding-right:22px}.hero{grid-template-columns:1fr;padding-top:42px;padding-bottom:36px;gap:32px}.hero h1{font-size:42px;letter-spacing:-1.4px;max-width:540px}.hero-copy{font-size:15px}.hero-image-wrap{max-width:650px}.eyebrow{font-size:9px;letter-spacing:2px;margin-bottom:17px}.signal-bar{margin:0 22px;grid-template-columns:1fr;gap:15px;padding:22px 0}.section{padding-top:50px;padding-bottom:50px}.cards,.feature-grid,.journey,.request-grid{grid-template-columns:1fr;gap:20px}.card-number{margin-bottom:20px}.card{padding:25px}.feature-grid{gap:28px}.knowledge{padding:23px}.journey{gap:28px}.industries{gap:12px}.industry,.industry img{min-height:170px;height:170px}.industry h3{font-size:16px;left:15px;bottom:2px}.demo-request{padding-top:50px;padding-bottom:50px;scroll-margin-top:90px}.request-form{padding:21px}.footer{align-items:flex-start;flex-direction:column;gap:15px}.footer-links{flex-wrap:wrap;gap:10px}.image-caption{font-size:8px;padding:13px}.hero-note{font-size:10px}.section-intro{margin-bottom:28px}}
@media(max-width:420px){.hero h1{font-size:36px}.brand-sub{display:none}.brand-name{font-size:10px}.nav .demo{padding:10px;font-size:10px}.hero-actions{gap:10px}.primary,.secondary{font-size:12px;padding:13px 15px}.industries{grid-template-columns:1fr}.industry,.industry img{height:200px}.request-form{grid-template-columns:1fr}.request-form label{grid-column:1/-1}}
@media(prefers-reduced-motion:reduce){button{transition:none}button:hover{transform:none}}
</style>
<div class="site">
<header class="header"><div class="header-inner"><div class="brand"><img class="header-logo" src="${LOGO_URL}" alt="NEXSTORVEN"><div><div class="brand-name">NEXSTORVEN</div><div class="brand-sub">CONNECTED INTELLIGENCE</div></div></div><nav class="nav" aria-label="Main navigation"><button data-scroll="platform">Platform</button><button class="optional" data-scroll="industries">Industries</button><button class="optional" data-scroll="about">Experience</button><button class="login" data-login>Sign in</button><button class="demo" data-demo>Request a Demo \u2197</button></nav></div></header>
<section class="hero"><div><div class="eyebrow">AI people. Real impact.</div><h1>Turn knowledge into <span class="cyan">confident action.</span></h1><p class="hero-copy">Give your people more than another course. Bring learning to life through AI conversation, realistic practice, and coaching built around your company.</p><div class="hero-actions"><button class="primary" data-demo>Experience NEXSTORVEN \u2197</button><button class="secondary" data-scroll="platform">Explore the platform</button></div><div class="hero-note">A personal demonstration \xB7 Up to 12 minutes \xB7 No camera needed</div></div><div class="hero-image-wrap"><img class="hero-image" src="${HERO_IMAGE}" alt="NEXSTORVEN AI representative with blue and orange connected intelligence artwork"><div class="image-caption"><span>Human connection. AI possibility.</span><span>Train / Develop / Empower</span></div></div></section>
<div class="signal-bar"><div class="signal"><span>01 /</span> Learning that responds to you</div><div class="signal"><span>02 /</span> Practice without an audience</div><div class="signal"><span>03 /</span> Knowledge, connected to work</div></div>
<section id="platform" class="section"><div class="section-intro"><div class="eyebrow">A different kind of learning experience</div><h2>Your people are unique.<br>Your training should be, too.</h2><p>NEXSTORVEN brings teaching, practice, and feedback into one conversation\u2014shaped by the learner and the work they need to do.</p></div><div class="cards"><article class="card"><div class="card-number">01 / LEARN</div><h3>A conversation,<br>with a purpose.</h3><p>An AI avatar explains concepts, asks questions, and adjusts its approach as the learner responds. Your company's knowledge provides the context.</p><span class="tag">ADAPTIVE TEACHING</span></article><article class="card"><div class="card-number">02 / PRACTICE</div><h3>Real situations.<br>Room to get better.</h3><p>Practise a difficult guest interaction or a client conversation privately. Receive specific coaching, then try again with greater confidence.</p><span class="tag">REALISTIC ROLE-PLAY</span></article><article class="card"><div class="card-number">03 / DEVELOP</div><h3>Beyond completion.<br>Toward capability.</h3><p>Connect learning with demonstrated performance. See where people improve and where focused practice can help them take the next step.</p><span class="tag">PERFORMANCE INSIGHT</span></article></div></section>
<div class="feature-section"><section class="section feature-grid"><div><div class="eyebrow">The vision goes beyond training</div><h2>Company knowledge.<br><span class="cyan">A more human way to find it.</span></h2><p>We're building toward a live AI avatar assistant for each user\u2014helping people find answers in company-approved handbooks, SOPs, and training, right when they need them.</p><ul class="benefits"><li><strong>Support in the flow of work</strong>Ask a question in everyday language instead of searching through documents.</li><li><strong>Help for the people creating courses</strong>Planned assistant support will help administrators shape company material into learning experiences.</li><li><strong>Build on what you already have</strong>Explore bringing existing training into NEXSTORVEN. The approach depends on your content and its format.</li></ul></div><div class="knowledge"><div class="knowledge-top">HANNAH / AI ASSISTANT CONCEPT</div><div class="question">Where do I find the process for requesting time off?</div><div class="answer">I can help you find the relevant guidance in your company's approved handbook and walk you through what it says.</div><div class="source">Company-approved knowledge</div><div class="illustration-note">Illustrative example of planned company knowledge assistance. Your company's documents and permissions will shape the answers.</div></div></section></div>
<section id="about" class="section"><div class="section-intro"><div class="eyebrow">Meet the experience</div><h2>Don't just read about it.<br>See what it could mean for your team.</h2><p>Your demonstration starts with your company and its training challenges. Then experience a practical glimpse of what NEXSTORVEN can do.</p></div><div class="journey"><article class="journey-item"><div class="eyebrow">ELENORA / YOUR GUIDE</div><h3>Make it relevant.</h3><p>Elenora gets to know your needs, teaches, and connects what you experience to your company's goals.</p></article><article class="journey-item"><div class="eyebrow">MATTHEW / ROLE-PLAY GUEST</div><h3>Try a real conversation.</h3><p>When role-play fits your needs, Matthew becomes the guest or client. You practise; Elenora helps you improve.</p></article><article class="journey-item"><div class="eyebrow">HANNAH / AI ASSISTANT</div><h3>Explore a new kind of support.</h3><p>Meet Hannah for a sample of AI assistance, then ask how company knowledge and course-building support fit the vision.</p></article></div></section>
<section id="industries" class="section" style="padding-top:20px"><div class="section-intro"><div class="eyebrow">Built around your world</div><h2>Your standards. Your situations.<br>Your company's way of working.</h2></div><div class="industries"><article class="industry"><img loading="lazy" src="${HOSPITALITY_IMAGE}" alt="Hospitality setting"><h3>Hospitality</h3></article><article class="industry"><img loading="lazy" src="${HEALTHCARE_IMAGE}" alt="Healthcare setting"><h3>Healthcare</h3></article><article class="industry"><img loading="lazy" src="${FINANCIAL_IMAGE}" alt="Financial services setting"><h3>Financial services</h3></article><article class="industry"><img loading="lazy" src="${SENIOR_LIVING_IMAGE}" alt="Senior living setting"><h3>Senior living</h3></article><article class="industry"><img loading="lazy" src="${CONNECTED_TEAMS_IMAGE}" alt="Connected teams"><h3>Teams across locations</h3></article><article class="card"><div class="card-number">YOUR INDUSTRY</div><h3>Where people make the difference.</h3><p>Let's explore how your knowledge, service standards, and training needs could shape your experience.</p></article></div></section>
<section id="contact" class="demo-request" aria-labelledby="request-title">
<div class="request-grid"><div class="request-copy">
<p class="eyebrow">YOUR PERSONAL DEMONSTRATION</p>
<h2 id="request-title">A stronger team starts<br>with a <span class="blue">conversation.</span></h2>
<p>Tell us a little about your company. Elenora will use that context to guide a personal demonstration built around your training needs.</p>
<ul><li><strong>Learn through conversation.</strong> Explore a practical teaching experience with Elenora.</li><li><strong>Practice without an audience.</strong> Meet Matthew in a realistic role-play when it fits your needs.</li><li><strong>Explore everyday support.</strong> See Hannah demonstrate an AI assistant, and ask about planned support for company knowledge and course creation.</li></ul>
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

<footer class="footer"><div><strong>NEXSTORVEN</strong>The next generation of connected intelligence.</div><div class="footer-links"><button data-scroll="platform">Platform</button><button data-scroll="contact">Request a demo</button><button data-login>Sign in</button></div><div>\xA9 2026 NEXSTORVEN</div></footer></div>
`;
  }
};
if (!customElements.get("nexivra-home")) customElements.define("nexivra-home", NexivraHome);
