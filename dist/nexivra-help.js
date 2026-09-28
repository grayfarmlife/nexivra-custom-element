// src/nexivra-help.js
var BUILD = "NEXIVRA-HELP-V1-TEXT-SUPPORT";
var HELP_TOPICS = {
  gettingStarted: { title: "Getting Started", keywords: ["getting started", "start", "begin", "dashboard", "where do i start"], answer: "Start from My Training on the Learner Dashboard. Your assigned training appears there. Select a course to start or continue it. Other learner areas include My Skills, My Profile, Certificates, Resources, and Help." },
  profile: { title: "My Profile", keywords: ["profile", "preferred name", "name", "phone", "email", "role", "title", "update my"], answer: "Open My Profile from the Learner Dashboard. Your system name and organization come from your learner account. You can update your Preferred Name, phone number, email, and role or title, then select Save Changes. Your Preferred Name personalizes the learner experience." },
  training: { title: "Training", keywords: ["training", "course", "courses", "resume", "continue", "assigned", "assignment", "progress"], answer: "Open My Training to see assigned courses and their current status. Select an available course to start or continue it. NEXIVRA uses your course activity to update your learner experience." },
  instructor: { title: "AI Instructor", keywords: ["elenora", "instructor", "ai instructor", "teacher", "trainer"], answer: "Elenora is the NEXIVRA AI Instructor used in the current training experience. Start your training session, allow the required microphone and camera permissions, and speak naturally. Elenora teaches, practices, and guides the learning experience conversationally." },
  rolePlay: { title: "Role-Play", keywords: ["role play", "role-play", "pedro", "guest", "client", "scenario"], answer: "Role-play lets you practice a realistic interaction with an AI guest or client. Elenora introduces the activity and hands the conversation to the guest. Speak naturally, listen, respond as you would with a real guest, and close naturally. Elenora returns afterward to provide feedback." },
  skills: { title: "My Skills", keywords: ["skill", "skills", "competency", "competencies", "developing", "demonstrated"], answer: "My Skills shows skills NEXIVRA has observed through learning, practice, role-play, and evaluation. Skill descriptions come from the course or competency definition and can develop as NEXIVRA observes additional meaningful performance." },
  certificates: { title: "Certificates", keywords: ["certificate", "certificates", "certification", "certified", "download certificate", "print certificate"], answer: "Open Certificates from the Learner Dashboard to see certificates earned from completed certification-eligible courses. Select View Certificate to open one. Use Print / Save PDF when you want a printable PDF copy." },
  resources: { title: "Resources", keywords: ["resource", "resources", "document", "documents", "reference", "material"], answer: "Resources contains learner-visible reference material connected to your organization, course, or learning path. What appears there depends on resources approved and published for learners." },
  cameraMic: { title: "Camera & Microphone", keywords: ["camera", "microphone", "mic", "can't hear", "cannot hear", "can't see", "permission", "permissions", "audio", "video"], answer: "NEXIVRA training may require browser access to your camera and microphone. Allow both permissions when prompted. If NEXIVRA cannot hear or see you, confirm the browser has permission to use the correct devices, then return to My Training and restart the training session if necessary." },
  troubleshooting: { title: "Troubleshooting", keywords: ["problem", "issue", "broken", "not working", "error", "stuck", "trouble", "troubleshoot"], answer: "Confirm you are signed in, your browser has the required camera and microphone permissions, and your internet connection is active. Return to My Training and reopen the course if a learning session stopped unexpectedly. If the problem continues, contact your company or NEXIVRA administrator and describe what you were doing when the issue occurred." }
};
var NexivraHelp = class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.messages = [];
  }
  connectedCallback() {
    this.render();
    this.bind();
    console.log("NEXIVRA HELP BUILD:", BUILD);
  }
  escape(v = "") {
    return String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);
  }
  findTopic(q = "") {
    q = String(q).toLowerCase();
    let best = null, score = 0;
    Object.values(HELP_TOPICS).forEach((t) => {
      let s = 0;
      t.keywords.forEach((k) => {
        if (q.includes(k)) s += Math.max(1, k.split(" ").length);
      });
      if (s > score) {
        best = t;
        score = s;
      }
    });
    return score ? best : null;
  }
  answer(q) {
    const t = this.findTopic(q);
    return t ? t.answer : "I can help with NEXIVRA navigation, profiles, training, the AI Instructor, role-play, skills, certificates, resources, camera and microphone permissions, and basic troubleshooting. Try asking your question another way or choose a Help topic.";
  }
  add(role, text) {
    const c = this.shadowRoot.getElementById("conversation");
    const d = document.createElement("div");
    d.className = `message ${role}`;
    d.innerHTML = `<b>${role === "user" ? "You" : "NEXIVRA Support"}</b><div>${this.escape(text)}</div>`;
    c.appendChild(d);
    c.scrollTop = c.scrollHeight;
  }
  ask(q) {
    q = String(q || "").trim();
    if (!q) return;
    this.add("user", q);
    setTimeout(() => this.add("assistant", this.answer(q)), 150);
  }
  bind() {
    const input = this.shadowRoot.getElementById("question");
    const submit = () => {
      const q = input.value;
      input.value = "";
      this.ask(q);
    };
    this.shadowRoot.getElementById("askButton").onclick = submit;
    input.onkeydown = (e) => {
      if (e.key === "Enter") submit();
    };
    this.shadowRoot.querySelectorAll("[data-topic]").forEach((b) => b.onclick = () => {
      const t = HELP_TOPICS[b.dataset.topic];
      this.add("user", t.title);
      setTimeout(() => this.add("assistant", t.answer), 100);
    });
    this.shadowRoot.getElementById("backButton").onclick = () => this.dispatchEvent(new CustomEvent("nexivra-help-back", { bubbles: true, composed: true }));
  }
  render() {
    this.shadowRoot.innerHTML = `
<style>
:host{display:block;width:100%;min-height:100%;background:#03131f;color:#f7fbff;font-family:Arial,Helvetica,sans-serif}*{box-sizing:border-box}.shell{min-height:100vh;background:radial-gradient(circle at 76% 12%,rgba(19,160,238,.12),transparent 30%),linear-gradient(135deg,#03131f,#061c2a 55%,#03131f)}.top{min-height:76px;padding:18px 32px;border-bottom:1px solid #15445c;display:flex;align-items:center;justify-content:space-between}.brand{letter-spacing:5px;font-size:18px;font-weight:800;color:#1da9f2}.back,.topic{border:1px solid #2c6078;background:#082535;color:#fff;border-radius:9px;padding:10px 15px;cursor:pointer;font-weight:700}.layout{display:grid;grid-template-columns:310px 1fr;min-height:calc(100vh - 76px)}aside{border-right:1px solid #15445c;padding:30px 24px;background:rgba(2,17,27,.72)}.eyebrow{color:#7799ac;letter-spacing:3px;font-size:12px;font-weight:800}h2{font-size:25px}aside p,.hero p,.notice{color:#9fb5c2;line-height:1.55}.topics{display:grid;gap:9px}.topic{text-align:left}.topic:hover{border-color:#1da9f2}.main{padding:42px;max-width:1180px;width:100%;margin:auto}.hero{display:grid;grid-template-columns:1fr 270px;gap:28px;align-items:center;margin-bottom:28px}.hero h1{font-size:clamp(34px,4vw,58px);margin:8px 0}.hero h1 span{color:#1da9f2}.assistant{border:1px solid #1d5973;border-radius:18px;padding:24px;background:#082839;text-align:center}.orb{width:88px;height:88px;margin:0 auto 14px;border-radius:50%;border:2px solid #1da9f2;display:grid;place-items:center;font-size:30px;font-weight:900;color:#1da9f2}.card{border:1px solid #17506b;border-radius:16px;overflow:hidden;background:#041925}.head{padding:18px 22px;border-bottom:1px solid #15445c;font-weight:800}.conversation{min-height:290px;max-height:390px;overflow:auto;padding:22px;display:flex;flex-direction:column;gap:14px}.message{max-width:78%;border-radius:14px;padding:13px 15px;line-height:1.5}.message.user{align-self:flex-end;background:#0d5b82}.message.assistant{align-self:flex-start;background:#0a2635;border:1px solid #17465d}.message b{display:block;font-size:11px;letter-spacing:1px;text-transform:uppercase;opacity:.65;margin-bottom:6px}.ask{border-top:1px solid #15445c;padding:16px;display:flex;gap:10px}.ask input{flex:1;background:#071f2d;color:#fff;border:1px solid #27546a;border-radius:10px;padding:14px 16px;font-size:16px}.ask button{border:0;background:#1da9f2;color:#03131f;border-radius:10px;padding:0 22px;font-weight:900;cursor:pointer}.notice{font-size:12px;margin-top:14px}@media(max-width:800px){.layout,.hero{grid-template-columns:1fr}aside{border-right:0;border-bottom:1px solid #15445c}.main{padding:26px 18px}}
</style>
<div class="shell"><header class="top"><div class="brand">NEXIVRA</div><button class="back" id="backButton">\u2190 Learner Dashboard</button></header><div class="layout"><aside><div class="eyebrow">SUPPORT</div><h2>Help Center</h2><p>Choose a topic or ask NEXIVRA a question about using the platform.</p><div class="topics">
${Object.entries(HELP_TOPICS).map(([k, t]) => `<button class="topic" data-topic="${k}">${t.title}</button>`).join("")}
</div></aside><main class="main"><section class="hero"><div><div class="eyebrow">NEXIVRA SUPPORT ASSISTANT</div><h1>How can <span>I help?</span></h1><p>Ask about NEXIVRA, your training experience, role-play, certificates, resources, or basic troubleshooting.</p></div><div class="assistant"><div class="orb">N</div><strong>NEXIVRA Support</strong><p>Text assistant active \u2022 Avatar coming next</p></div></section><section class="card"><div class="head">Ask NEXIVRA</div><div class="conversation" id="conversation"><div class="message assistant"><b>NEXIVRA Support</b><div>Hi. I can help you use NEXIVRA. What can I help you with?</div></div></div><div class="ask"><input id="question" autocomplete="off" placeholder="Ask a question about NEXIVRA..."><button id="askButton">Ask</button></div></section><div class="notice">NEXIVRA Support answers questions about using the NEXIVRA platform. Organization-specific policies, procedures, products, and information belong to the organization's approved knowledge environment.</div></main></div></div>`;
  }
};
if (!customElements.get("nexivra-help")) customElements.define("nexivra-help", NexivraHelp);
export {
  HELP_TOPICS,
  NexivraHelp
};
