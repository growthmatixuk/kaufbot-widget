(function () {
  if (window.__kaufbotLoaded) return;
  window.__kaufbotLoaded = true;

  const blockedPaths = [
    "/cart",
    "/checkout",
    "/my-account"
  ];

  const currentPath = location.pathname.toLowerCase();

  if (blockedPaths.some(path => currentPath.includes(path))) {
    return;
  }

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
  #kaufbot-launcher {
    position: fixed;
    right: 28px;
    bottom: 28px;
    z-index: 999999;
    cursor: pointer;
    opacity: 0;
    transform: translateY(20px);
    transition: transform 0.4s ease, opacity 0.4s ease;
  }

  #kaufbot-launcher img {
    width: 290px;
    max-width: 42vw;
    height: auto;
    display: block;
    pointer-events: none;
  }

  #kaufbot-launcher.visible {
    opacity: 1;
    transform: translateY(0);
  }

  #kaufbot-launcher:hover {
    transform: translateY(-6px) scale(1.03);
  }

  @keyframes kaufbotFloat {
    0%   { transform: translateY(0px); }
    50%  { transform: translateY(-5px); }
    100% { transform: translateY(0px); }
  }

  #kaufbot-launcher img {
    animation: kaufbotFloat 5s ease-in-out infinite;
  }

  @media (max-width: 768px) {
    #kaufbot-launcher {
      right: 12px;
      bottom: 12px;
    }

    #kaufbot-launcher img {
      width: 180px;
    }
  }
`;
document.head.appendChild(style);

  const launcher = document.createElement("div");
launcher.id = "kaufbot-launcher";

launcher.innerHTML = `
  <img src="https://i.postimg.cc/zXKCMfrh/I-m-Kauf-Bot-Click-to-talk-to-me.png" alt="Talk to KaufBot" />
`;

  const wrap = document.createElement("div");
  wrap.id = "kaufbot-floating-wrap";
  wrap.innerHTML = `
    <button id="kaufbot-close" aria-label="Close">×</button>
    <div id="kaufbot-stage-shell"></div>
    <div id="kaufbot-controls">
      <button class="kaufbot-mini-btn" id="kaufbot-link-btn"></button>
      <button class="kaufbot-mini-btn" id="kaufbot-start-btn">Start talking</button>
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(wrap);

  const shell = wrap.querySelector("#kaufbot-stage-shell");
  const closeBtn = wrap.querySelector("#kaufbot-close");
  const startBtn = wrap.querySelector("#kaufbot-start-btn");
  const linkBtn = wrap.querySelector("#kaufbot-link-btn");

  let mounted = false;
  let agentReady = false;
  let hasAutoAppeared = false;
  let micLive = false;
  let currentSuggestedUrl = "";

  function buildPageContext() {
    return {
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      h1: document.querySelector("h1")?.innerText || ""
    };
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

  mountAgent();

  function openKaufbot() {
    wrap.classList.add("visible");
    launcher.classList.add("hidden");

    const frame = document.getElementById("kaufbot-agent-frame");
    if (agentReady) {
      frame?.classList.add("ready");
    } else {
      frame?.classList.remove("ready");
    }
  }

  function closeKaufbot() {
    const frame = document.getElementById("kaufbot-agent-frame");
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: "KAUFBOT_CLOSE_SELF" }, "*");
    }

    wrap.classList.remove("visible");
    launcher.classList.remove("hidden");
    agentReady = false;
    micLive = false;

    if (frame) {
      frame.classList.remove("ready");
    }

    startBtn.textContent = "Start talking";
    hideSuggestedLink();
  }

  launcher.addEventListener("click", openKaufbot);
  closeBtn.addEventListener("click", closeKaufbot);

  startBtn.addEventListener("click", () => {
    const frame = document.getElementById("kaufbot-agent-frame");
    if (!frame || !frame.contentWindow) return;

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

window.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "KAUFBOT_DEBUG_APP_MESSAGE") {
    console.log("KAUFBOT DEBUG APP MESSAGE:", event.data.payload);
  }

  if (event.data.type === "KAUFBOT_READY") {
    agentReady = true;

    const frame = document.getElementById("kaufbot-agent-frame");
    frame?.classList.add("ready");

    if (!hasAutoAppeared) {
      hasAutoAppeared = true;
      setTimeout(() => {
        openKaufbot();
      }, 450);
    }
  }

  if (event.data.type === "KAUFBOT_SUGGEST_LINK") {
    showSuggestedLink(event.data);
  }

  if (event.data.type === "KAUFBOT_CLEAR_LINK") {
    hideSuggestedLink();
  }
});
})();
