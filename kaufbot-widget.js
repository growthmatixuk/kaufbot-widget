(function () {
  if (window.__kaufbotLoaded) return;
  window.__kaufbotLoaded = true;

  const isHome =
    location.pathname === "/" || document.body.classList.contains("home");

  const isProduct =
    document.body.classList.contains("single-product") ||
    location.pathname.includes("/product/");

  if (!(isHome || isProduct)) return;

  const style = document.createElement("style");
  style.innerHTML = `
    #kaufbot-launcher {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 999999;
      background: #111;
      color: #fff;
      border: 0;
      border-radius: 999px;
      padding: 14px 20px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 12px 30px rgba(0,0,0,.25);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    #kaufbot-launcher.hidden {
      opacity: 0;
      transform: translateY(8px);
      pointer-events: none;
    }

    #kaufbot-floating-wrap {
      position: fixed;
      right: 24px;
      bottom: 24px;
      width: 420px;
      height: 620px;
      z-index: 999998;
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
      transition: opacity 0.15s ease;
    }

    #kaufbot-agent-frame.ready {
      opacity: 1;
    }

    #kaufbot-loading {
      position: absolute;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 600;
      text-shadow: 0 2px 10px rgba(0,0,0,.35);
      z-index: 2;
      pointer-events: none;
    }

    #kaufbot-loading.visible {
      display: flex;
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
      display: flex;
      gap: 8px;
      z-index: 4;
      pointer-events: auto;
    }

    .kaufbot-mini-btn {
      border: 0;
      border-radius: 999px;
      padding: 10px 16px;
      background: rgba(0,0,0,.82);
      color: #fff;
      cursor: pointer;
      font-weight: 600;
      backdrop-filter: blur(6px);
    }

    #kaufbot-bubble {
      position: absolute;
      right: 18px;
      bottom: 460px;
      max-width: 270px;
      background: rgba(17,17,17,.92);
      color: #fff;
      padding: 14px 16px;
      border-radius: 18px;
      box-shadow: 0 14px 30px rgba(0,0,0,.22);
      font-size: 14px;
      line-height: 1.4;
      z-index: 5;
      opacity: 0;
      transform: translateY(10px);
      transition:
        opacity 0.28s ease,
        transform 0.28s ease;
      pointer-events: none;
    }

    #kaufbot-bubble.visible {
      opacity: 1;
      transform: translateY(0);
    }

    #kaufbot-bubble::after {
      content: "";
      position: absolute;
      right: 34px;
      bottom: -8px;
      width: 16px;
      height: 16px;
      background: rgba(17,17,17,.92);
      transform: rotate(45deg);
      border-radius: 2px;
    }

    #kaufbot-bubble strong {
      display: block;
      margin-bottom: 4px;
      font-size: 14px;
    }

    @media (max-width: 768px) {
      #kaufbot-floating-wrap {
        width: 320px;
        height: 520px;
        right: 8px;
        bottom: 8px;
      }

      #kaufbot-bubble {
        right: 8px;
        bottom: 385px;
        max-width: 220px;
        font-size: 13px;
      }
    }
  `;
  document.head.appendChild(style);

  const launcher = document.createElement("button");
  launcher.id = "kaufbot-launcher";
  launcher.textContent = "Talk to KaufBot";

  const wrap = document.createElement("div");
  wrap.id = "kaufbot-floating-wrap";
  wrap.innerHTML = `
    <button id="kaufbot-close" aria-label="Close">×</button>
    <div id="kaufbot-stage-shell"></div>
    <div id="kaufbot-loading">Loading KaufBot...</div>
    <div id="kaufbot-bubble">
      <strong>Hi, I’m KaufBot.</strong>
      Tell me what you’re looking for and I’ll help you find the right backdrop.
    </div>
    <div id="kaufbot-controls">
      <button class="kaufbot-mini-btn" id="kaufbot-mic-toggle">Mute mic</button>
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(wrap);

  const shell = wrap.querySelector("#kaufbot-stage-shell");
  const closeBtn = wrap.querySelector("#kaufbot-close");
  const micBtn = wrap.querySelector("#kaufbot-mic-toggle");
  const loading = wrap.querySelector("#kaufbot-loading");
  const bubble = wrap.querySelector("#kaufbot-bubble");

  let mounted = false;
  let micMuted = false;
  let agentReady = false;
  let hasAutoAppeared = false;
  let bubbleTimer = null;

  function mountAgent() {
    if (mounted) return;

    const iframe = document.createElement("iframe");
    iframe.id = "kaufbot-agent-frame";
    iframe.src = "https://growthmatixuk-kaufbot-widget.vercel.app/agent/";
    iframe.allow = "camera; microphone; autoplay; fullscreen; display-capture";
    shell.appendChild(iframe);

    mounted = true;
  }

  // preload the iframe/page immediately
  mountAgent();

  function showBubble() {
    if (!bubble) return;
    bubble.classList.add("visible");

    if (bubbleTimer) clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => {
      bubble.classList.remove("visible");
    }, 6500);
  }

  function openKaufbot({ auto = false } = {}) {
    wrap.classList.add("visible");
    launcher.classList.add("hidden");

    const frame = document.getElementById("kaufbot-agent-frame");
    loading.classList.add("visible");

    if (agentReady) {
      loading.classList.remove("visible");
      frame?.classList.add("ready");
    } else {
      frame?.classList.remove("ready");
    }

    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: "KAUFBOT_OPEN" }, "*");
    }

    if (auto) {
      setTimeout(showBubble, 500);
    }
  }

  function closeKaufbot() {
    const frame = document.getElementById("kaufbot-agent-frame");
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: "KAUFBOT_CLOSE_SELF" }, "*");
    }

    wrap.classList.remove("visible");
    launcher.classList.remove("hidden");
    bubble.classList.remove("visible");
    loading.classList.remove("visible");
    agentReady = false;

    if (frame) {
      frame.classList.remove("ready");
    }
  }

  launcher.addEventListener("click", () => openKaufbot({ auto: false }));
  closeBtn.addEventListener("click", closeKaufbot);

  micBtn.addEventListener("click", () => {
    const frame = document.getElementById("kaufbot-agent-frame");
    if (!frame || !frame.contentWindow) return;

    micMuted = !micMuted;
    frame.contentWindow.postMessage(
      { type: "KAUFBOT_TOGGLE_MIC", muted: micMuted },
      "*"
    );
    micBtn.textContent = micMuted ? "Unmute mic" : "Mute mic";
  });

  window.addEventListener("message", (event) => {
    if (!event.data) return;

    if (event.data.type === "KAUFBOT_READY") {
      agentReady = true;
      loading.classList.remove("visible");

      const frame = document.getElementById("kaufbot-agent-frame");
      frame?.classList.add("ready");

      if (!hasAutoAppeared) {
        hasAutoAppeared = true;
        setTimeout(() => {
          openKaufbot({ auto: true });
        }, 450);
      }
    }
  });
})();
