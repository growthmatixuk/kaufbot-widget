(function () {
  function bootKaufbot() {
    if (window.__kaufbotLoaded === "active") return;

    const blockedPaths = ["/cart", "/checkout", "/my-account"];
    const currentPath = location.pathname.toLowerCase();
    if (blockedPaths.some(path => currentPath.includes(path))) return;

    const ua = navigator.userAgent.toLowerCase();
    const isBot = /bot|crawl|spider|slurp|facebookexternalhit|headless|wget|curl/.test(ua);
    if (isBot) return;

    window.__kaufbotLoaded = "active";

  const SESSION_KEYS = {
    teaserSeen: "kaufbot_teaser_seen",
    greetingPlayed: "kaufbot_greeting_played"
  };

  const hasSeenTeaserThisSession =
    sessionStorage.getItem(SESSION_KEYS.teaserSeen) === "1";

  const hasPlayedGreetingThisSession =
    sessionStorage.getItem(SESSION_KEYS.greetingPlayed) === "1";

  const PAGE_MAP = {
    "newborn-kids-and-seniors": {
      label: "View Newborn, Kids & Seniors Backdrops",
      url: "https://clickbackdrops.co.uk/product-category/backdrops/newborn-kids-and-seniors"
    },
    "headshot": {
      label: "View Headshot Backdrops",
      url: "https://clickbackdrops.co.uk/product-category/backdrops/headshot"
    },
    "masters-textures-and-fine-art": {
      label: "View Fine Art & Texture Backdrops",
      url: "https://clickbackdrops.co.uk/product-category/backdrops/masters-textures-and-fine-art"
    },
    "exterior": {
      label: "View Exterior Backdrops",
      url: "https://clickbackdrops.co.uk/product-category/backdrops/exterior"
    },
    "floors": {
      label: "View Floors",
      url: "https://clickbackdrops.co.uk/product-category/backdrops/floors"
    },
    "solid-seamless": {
      label: "View Solid & Seamless Backdrops",
      url: "https://clickbackdrops.co.uk/product-category/backdrops/solid-seamless"
    },
    "interior": {
      label: "View Interior Backdrops",
      url: "https://clickbackdrops.co.uk/product-category/backdrops/interior"
    },
    "signature-collections": {
      label: "View Signature Collections",
      url: "https://clickbackdrops.co.uk/product-category/backdrops/signature-collections"
    },
    "holidays": {
      label: "View Holiday Backdrops",
      url: "https://clickbackdrops.co.uk/product-category/backdrops/holidays"
    },
    "floral": {
      label: "View Floral Backdrops",
      url: "https://clickbackdrops.co.uk/product-category/backdrops/floral"
    },
    "clicki": {
      label: "View Clicki",
      url: "https://clickbackdrops.co.uk/product-category/clicki"
    },
    "magna-fix": {
      label: "View Magna Fix",
      url: "https://clickbackdrops.co.uk/product-category/magna-fix"
    },
    "clearance": {
      label: "View Clearance",
      url: "https://clickbackdrops.co.uk/product-category/clearance"
    },
    "roller-systems": {
      label: "View Roller Systems",
      url: "https://clickbackdrops.co.uk/product-category/roller-systems"
    }
  };

  const style = document.createElement("style");
  style.innerHTML = `
    #kaufbot-teaser,
    #kaufbot-panel-loader-sphere {
      width: 112px;
      height: 112px;
    }

    #kaufbot-teaser {
      position: fixed;
      right: 42px;
      bottom: 52px;
      z-index: 2147483647;
      opacity: 0;
      transform: translateY(16px) scale(0.96);
      pointer-events: none;
      transition: opacity 0.45s ease, transform 0.45s ease;
    }

    #kaufbot-teaser.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    #kaufbot-teaser.hidden {
      opacity: 0;
      transform: translateY(10px) scale(0.94);
      pointer-events: none;
    }

    .kaufbot-sphere-core {
      position: absolute;
      inset: 0;
      border-radius: 999px;
      background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.18), rgba(255,255,255,0.04) 45%, rgba(0,0,0,0.42) 100%);
      backdrop-filter: blur(10px);
      box-shadow:
        0 18px 40px rgba(0,0,0,0.20),
        inset 0 1px 1px rgba(255,255,255,0.20);
      overflow: hidden;
    }

    .kaufbot-sphere-core::before {
      content: "";
      position: absolute;
      inset: 10px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.18);
    }

    .kaufbot-sphere-core::after {
      content: "";
      position: absolute;
      inset: 22px;
      border-radius: 999px;
      background: radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 35%, rgba(255,255,255,0.01) 70%, transparent 100%);
      filter: blur(1px);
    }

    .kaufbot-sphere-ring {
      position: absolute;
      inset: 8px;
      border-radius: 999px;
      border: 2px solid transparent;
      border-top-color: rgba(255,255,255,0.95);
      border-right-color: rgba(255,255,255,0.30);
      border-bottom-color: rgba(255,255,255,0.10);
      border-left-color: rgba(255,255,255,0.55);
      animation: kaufbotTeaserSpin 1.8s linear infinite;
    }

    .kaufbot-sphere-ring-2 {
      position: absolute;
      inset: 18px;
      border-radius: 999px;
      border: 1px solid transparent;
      border-top-color: rgba(255,255,255,0.18);
      border-right-color: rgba(255,255,255,0.75);
      border-bottom-color: rgba(255,255,255,0.18);
      border-left-color: rgba(255,255,255,0.08);
      animation: kaufbotTeaserSpinReverse 2.6s linear infinite;
    }

    .kaufbot-sphere-dot {
      position: absolute;
      width: 14px;
      height: 14px;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      border-radius: 999px;
      background: rgba(255,255,255,0.92);
      box-shadow:
        0 0 18px rgba(255,255,255,0.45),
        0 0 36px rgba(255,255,255,0.16);
      animation: kaufbotTeaserPulse 1.9s ease-in-out infinite;
    }

    #kaufbot-teaser-label,
    #kaufbot-panel-loader-label {
      position: absolute;
      left: 50%;
      bottom: -24px;
      transform: translateX(-50%);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(17,17,17,0.72);
      white-space: nowrap;
    }

    @keyframes kaufbotTeaserSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes kaufbotTeaserSpinReverse {
      from { transform: rotate(360deg); }
      to { transform: rotate(0deg); }
    }

    @keyframes kaufbotTeaserPulse {
      0%   { transform: translate(-50%, -50%) scale(0.94); opacity: 0.86; }
      50%  { transform: translate(-50%, -50%) scale(1.08); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(0.94); opacity: 0.86; }
    }

    #kaufbot-launcher {
      position: fixed;
      right: 28px;
      bottom: 28px;
      z-index: 2147483647;
      cursor: pointer;
      opacity: 0;
      transform: translateY(22px) scale(0.97);
      transition: transform 0.45s ease, opacity 0.45s ease;
      pointer-events: none;
    }

    #kaufbot-launcher.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    #kaufbot-launcher.hidden {
      opacity: 0;
      pointer-events: none;
      transform: translateY(10px) scale(0.97);
    }

    #kaufbot-launcher img {
      width: 400px;
      max-width: 42vw;
      height: auto;
      display: block;
      pointer-events: none;
      filter: drop-shadow(0 10px 25px rgba(0,0,0,0.18));
      animation: kaufbotFloat 5s ease-in-out infinite;
    }

    #kaufbot-launcher:hover {
      transform: translateY(-6px) scale(1.03);
    }

    @keyframes kaufbotFloat {
      0%   { transform: translateY(0px); }
      50%  { transform: translateY(-5px); }
      100% { transform: translateY(0px); }
    }

    #kaufbot-floating-wrap {
      position: fixed;
      right: 24px;
      bottom: 24px;
      width: 460px;
      height: 620px;
      z-index: 2147483646;
      pointer-events: none;
      opacity: 0;
      transform: translateY(20px) scale(0.98);
      transition:
        opacity 0.35s ease,
        transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
    }

    #kaufbot-floating-wrap.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    #kaufbot-stage-shell {
      position: absolute;
      inset: 0;
      background: transparent;
      pointer-events: none;
    }

    #kaufbot-agent-frame {
      width: 100%;
      height: 100%;
      border: 0;
      background: transparent;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    #kaufbot-agent-frame.ready,
    #kaufbot-agent-frame.visual-ready {
      opacity: 1;
    }

    #kaufbot-panel-loader {
      position: absolute;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 3;
      pointer-events: none;
    }

    #kaufbot-floating-wrap.loading #kaufbot-panel-loader {
      display: flex;
    }

    #kaufbot-panel-loader-sphere {
      position: relative;
    }

    #kaufbot-floating-wrap.loading #kaufbot-agent-frame {
      opacity: 0;
    }

    #kaufbot-close {
      position: absolute;
      top: 14px;
      right: 8px;
      width: 38px;
      height: 38px;
      border: 0;
      border-radius: 999px;
      background: rgba(0,0,0,.82);
      color: #fff;
      font-size: 20px;
      cursor: pointer;
      z-index: 4;
      pointer-events: auto;
    }

    #kaufbot-controls {
      position: absolute;
      bottom: 18px;
      left: 50%;
      transform: translateX(-50%);
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      z-index: 4;
      pointer-events: auto;
    }

    #kaufbot-floating-wrap.ready #kaufbot-controls {
      display: flex;
    }

    .kaufbot-mini-btn {
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      background: rgba(255,255,255,0.92);
      color: #111;
      cursor: pointer;
      font-weight: 700;
      backdrop-filter: blur(10px);
      box-shadow:
        0 8px 20px rgba(0,0,0,0.18),
        0 2px 6px rgba(0,0,0,0.08);
      transition: all 0.2s ease;
    }

    .kaufbot-mini-btn:hover {
      transform: translateY(-2px) scale(1.03);
      box-shadow:
        0 12px 26px rgba(0,0,0,0.22),
        0 4px 10px rgba(0,0,0,0.12);
    }

    @keyframes kaufbotPulse {
      0%   { transform: scale(1); }
      50%  { transform: scale(1.04); }
      100% { transform: scale(1); }
    }

    #kaufbot-start-btn {
      animation: kaufbotPulse 2.5s ease-in-out infinite;
    }


    #kaufbot-text-row {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 300px;
      max-width: 90vw;
    }

    #kaufbot-text-input {
      flex: 1;
      border: 0;
      border-radius: 999px;
      padding: 12px 14px;
      background: rgba(255,255,255,0.94);
      color: #111;
      font-size: 14px;
      outline: none;
      box-shadow: 0 8px 20px rgba(0,0,0,0.14);
    }

    #kaufbot-send-btn {
      border: 0;
      border-radius: 999px;
      padding: 12px 14px;
      background: rgba(0,0,0,0.86);
      color: #fff;
      cursor: pointer;
      font-weight: 700;
      box-shadow: 0 8px 20px rgba(0,0,0,0.16);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    #kaufbot-send-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 24px rgba(0,0,0,0.20);
    }

    #kaufbot-link-btn {
      display: none;
      max-width: 280px;
      white-space: normal;
      text-align: center;
      line-height: 1.25;
      background: rgba(255,255,255,.94);
      color: #111;
      box-shadow: 0 10px 24px rgba(0,0,0,.18);
    }

    #kaufbot-link-btn.visible {
      display: inline-block;
    }

    @media (max-width: 768px) {
      #kaufbot-teaser {
        right: 18px;
        bottom: 24px;
        width: 84px;
        height: 84px;
      }

      #kaufbot-panel-loader-sphere {
        width: 84px;
        height: 84px;
      }

      #kaufbot-teaser-label,
      #kaufbot-panel-loader-label {
        font-size: 10px;
        bottom: -20px;
      }

      #kaufbot-launcher {
        right: 12px;
        bottom: 12px;
      }

      #kaufbot-launcher img {
        width: 180px;
      }

      #kaufbot-floating-wrap {
        width: 320px;
        height: 520px;
        right: 8px;
        bottom: 8px;
      }

      #kaufbot-link-btn {
        max-width: 220px;
      }
    }
  `;
  document.head.appendChild(style);

  function sphereHTML(label) {
    return `
      <div class="kaufbot-sphere-core">
        <div class="kaufbot-sphere-ring"></div>
        <div class="kaufbot-sphere-ring-2"></div>
        <div class="kaufbot-sphere-dot"></div>
      </div>
      <div id="${label === "Loading KaufBot" ? "kaufbot-teaser-label" : "kaufbot-panel-loader-label"}">${label}</div>
    `;
  }

  const teaser = document.createElement("div");
  teaser.id = "kaufbot-teaser";
  teaser.innerHTML = sphereHTML("Loading KaufBot");

  const launcher = document.createElement("div");
  launcher.id = "kaufbot-launcher";
  launcher.innerHTML = `
    <img src="https://i.postimg.cc/zXKCMfrh/I-m-Kauf-Bot-Click-to-talk-to-me.png" alt="Talk to KaufBot" />
  `;

  const wrap = document.createElement("div");
  wrap.id = "kaufbot-floating-wrap";
  wrap.innerHTML = `
    <button id="kaufbot-close" aria-label="Close">×</button>

    <div id="kaufbot-panel-loader">
      <div id="kaufbot-panel-loader-sphere">
        ${sphereHTML("Getting KaufBot ready")}
      </div>
    </div>

    <div id="kaufbot-stage-shell"></div>

    <div id="kaufbot-controls">
      <button class="kaufbot-mini-btn" id="kaufbot-link-btn"></button>

      <div id="kaufbot-text-row">
        <input id="kaufbot-text-input" type="text" placeholder="Type to KaufBot..." />
        <button id="kaufbot-send-btn">Send</button>
      </div>

      <button class="kaufbot-mini-btn" id="kaufbot-start-btn">Start talking</button>
    </div>
  `;

  document.body.appendChild(teaser);
  document.body.appendChild(launcher);
  document.body.appendChild(wrap);

  const shell = wrap.querySelector("#kaufbot-stage-shell");
  const closeBtn = wrap.querySelector("#kaufbot-close");
  const startBtn = wrap.querySelector("#kaufbot-start-btn");
  const linkBtn = wrap.querySelector("#kaufbot-link-btn");
  const textInput = wrap.querySelector("#kaufbot-text-input");
  const sendBtn = wrap.querySelector("#kaufbot-send-btn");

  let mounted = false;
  let visualReady = false;
  let agentReady = false;
  let micLive = false;
  let currentSuggestedUrl = "";
  let destroyTimer = null;
  let loadingFallbackTimer = null;
  let pendingGreeting = false;
  let hasPlayedGreeting = false;
  let launcherShown = hasSeenTeaserThisSession;

  function buildPageContext() {
    return {
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      h1: document.querySelector("h1")?.innerText || ""
    };
  }

  function showLauncherAfterTeaser() {
    if (launcherShown) return;
    launcherShown = true;

    teaser.classList.add("hidden");
    sessionStorage.setItem(SESSION_KEYS.teaserSeen, "1");

    setTimeout(() => {
      launcher.classList.add("visible");
    }, 180);
  }

  function showSuggestedLink(payload) {
    if (!payload) return;

    let url = payload.url || "";
    let label = payload.label || "View suggested page";

    if (!url && payload.slug && PAGE_MAP[payload.slug]) {
      url = PAGE_MAP[payload.slug].url;
      label = payload.label || PAGE_MAP[payload.slug].label;
    }

    if (!url) return;

    currentSuggestedUrl = url;
    linkBtn.textContent = label;
    linkBtn.classList.add("visible");
  }

  function hideSuggestedLink() {
    currentSuggestedUrl = "";
    linkBtn.textContent = "";
    linkBtn.classList.remove("visible");
  }

  function sendTypedMessage() {
    const frame = document.getElementById("kaufbot-agent-frame");
    const text = String(textInput?.value || "").trim();

    if (!frame || !frame.contentWindow || !agentReady || !text) return;

    frame.contentWindow.postMessage(
      {
        type: "KAUFBOT_TYPED_MESSAGE",
        text
      },
      "*"
    );

    textInput.value = "";
    textInput?.focus();
  }

  function mountAgent() {
    if (mounted) return;

    const pageContext = buildPageContext();

    const iframe = document.createElement("iframe");
    iframe.id = "kaufbot-agent-frame";
    iframe.src =
      "https://growthmatixuk-kaufbot-widget.vercel.app/agent/?" +
      new URLSearchParams({
        context: JSON.stringify(pageContext)
      }).toString();

    iframe.allow = "camera; microphone; autoplay; fullscreen; display-capture";

    shell.appendChild(iframe);
    mounted = true;
  }

  function playGreetingIfReady() {
    const frame = document.getElementById("kaufbot-agent-frame");

    if (
      wrap.classList.contains("visible") &&
      agentReady &&
      !hasPlayedGreeting &&
      frame &&
      frame.contentWindow
    ) {
      hasPlayedGreeting = true;
      pendingGreeting = false;
      frame.contentWindow.postMessage({ type: "KAUFBOT_PLAY_GREETING" }, "*");
    }
  }

 function openKaufbot() {
  hasPlayedGreeting = false;
  pendingGreeting = true;

  if (destroyTimer) {
    clearTimeout(destroyTimer);
    destroyTimer = null;
  }

    if (loadingFallbackTimer) {
      clearTimeout(loadingFallbackTimer);
      loadingFallbackTimer = null;
    }

    const existingFrame = document.getElementById("kaufbot-agent-frame");

    if (!existingFrame) {
      mounted = false;
      visualReady = false;
      agentReady = false;
    }

    startBtn.textContent = "Start talking";
    hideSuggestedLink();

    wrap.classList.add("visible");
    wrap.classList.add("loading");
    wrap.classList.remove("ready");
    teaser.classList.add("hidden");
    launcher.classList.add("hidden");

    pendingGreeting = !hasPlayedGreeting;

    if (!mounted) {
      mountAgent();
    }

    const frame = document.getElementById("kaufbot-agent-frame");

    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: "KAUFBOT_PANEL_OPENED" }, "*");
    }

    if (visualReady) {
      frame?.classList.add("visual-ready");
    } else {
      frame?.classList.remove("visual-ready");
    }

    if (agentReady) {
      wrap.classList.remove("loading");
      wrap.classList.add("ready");
      frame?.classList.add("ready");
      playGreetingIfReady();
    } else {
      frame?.classList.remove("ready");

      loadingFallbackTimer = setTimeout(() => {
        wrap.classList.remove("loading");
        wrap.classList.add("ready");
      }, 12000);
    }
  }

  function closeKaufbot() {
    const frame = document.getElementById("kaufbot-agent-frame");

    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: "KAUFBOT_PANEL_CLOSED" }, "*");
    }

    wrap.classList.remove("visible");
    wrap.classList.remove("loading");
    wrap.classList.remove("ready");
    micLive = false;
    pendingGreeting = false;

    startBtn.textContent = "Start talking";
    hideSuggestedLink();

    launcher.classList.remove("hidden");
    launcher.classList.add("visible");

    if (loadingFallbackTimer) {
      clearTimeout(loadingFallbackTimer);
      loadingFallbackTimer = null;
    }

    if (destroyTimer) {
      clearTimeout(destroyTimer);
    }

    destroyTimer = setTimeout(() => {
      const frameToDestroy = document.getElementById("kaufbot-agent-frame");

      if (frameToDestroy && frameToDestroy.contentWindow) {
        frameToDestroy.contentWindow.postMessage({ type: "KAUFBOT_CLOSE_SELF" }, "*");
      }

      setTimeout(() => {
        const oldFrame = document.getElementById("kaufbot-agent-frame");
        if (oldFrame) {
          oldFrame.remove();
        }

        mounted = false;
        visualReady = false;
        agentReady = false;
        destroyTimer = null;
      }, 200);
    }, 60000);
  }

  launcher.addEventListener("click", openKaufbot);
  closeBtn.addEventListener("click", closeKaufbot);

  startBtn.addEventListener("click", () => {
    const frame = document.getElementById("kaufbot-agent-frame");
    if (!frame || !frame.contentWindow || !agentReady) return;

    if (!micLive) {
      micLive = true;
      frame.contentWindow.postMessage({ type: "KAUFBOT_START_TALKING" }, "*");
      startBtn.textContent = "Mute mic";
      return;
    }

    micLive = !micLive;
    frame.contentWindow.postMessage(
      { type: "KAUFBOT_TOGGLE_MIC", muted: !micLive },
      "*"
    );
    startBtn.textContent = micLive ? "Mute mic" : "Unmute mic";
  });

  linkBtn.addEventListener("click", () => {
    if (!currentSuggestedUrl) return;
    window.location.href = currentSuggestedUrl;
  });

  sendBtn.addEventListener("click", sendTypedMessage);

  textInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendTypedMessage();
    }
  });

  window.addEventListener("message", (event) => {
    if (!event.data) return;

    if (event.data.type === "KAUFBOT_DEBUG_APP_MESSAGE") {
      console.log("KAUFBOT DEBUG APP MESSAGE:", event.data.payload);
      return;
    }

    if (event.data.type === "KAUFBOT_VISUAL_READY") {
      visualReady = true;

      const frame = document.getElementById("kaufbot-agent-frame");
      frame?.classList.add("visual-ready");
      return;
    }

    if (event.data.type === "KAUFBOT_READY") {
      agentReady = true;
      wrap.classList.remove("loading");
      wrap.classList.add("ready");

      if (loadingFallbackTimer) {
        clearTimeout(loadingFallbackTimer);
        loadingFallbackTimer = null;
      }

      const frame = document.getElementById("kaufbot-agent-frame");
      frame?.classList.add("ready");

      if (pendingGreeting) {
        setTimeout(() => {
          playGreetingIfReady();
        }, 300);
      }

      return;
    }

    if (event.data.type === "KAUFBOT_SUGGEST_LINK") {
      showSuggestedLink(event.data);
      return;
    }

    if (event.data.type === "KAUFBOT_CLEAR_LINK") {
      hideSuggestedLink();
      return;
    }
  });

  if (!hasSeenTeaserThisSession) {
    requestAnimationFrame(() => {
      teaser.classList.add("visible");
    });

    setTimeout(() => {
      showLauncherAfterTeaser();
    }, 1800);
  } else {
    teaser.classList.add("hidden");
    launcher.classList.add("visible");
  }

  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootKaufbot);
  } else {
    bootKaufbot();
  }
})();.
