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
      transition: opacity 0.2s ease;
    }

    #kaufbot-floating-wrap.visible {
      opacity: 1;
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
      z-index: 3;
      pointer-events: auto;
    }

    #kaufbot-controls {
      position: absolute;
      bottom: 18px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;
      z-index: 3;
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

    @media (max-width: 768px) {
      #kaufbot-floating-wrap {
        width: 320px;
        height: 520px;
        right: 8px;
        bottom: 8px;
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

  let mounted = false;
  let micMuted = false;
  let agentReady = false;

  function mountAgent() {
    if (mounted) return;

    const iframe = document.createElement("iframe");
    iframe.id = "kaufbot-agent-frame";
    iframe.src = "https://growthmatixuk-kaufbot-widget.vercel.app/agent/";
    iframe.allow = "camera; microphone; autoplay; fullscreen; display-capture";
    shell.appendChild(iframe);

    mounted = true;
  }

  // Preload immediately
  mountAgent();

  function openKaufbot() {
    wrap.classList.add("visible");
    launcher.style.display = "none";

    const frame = document.getElementById("kaufbot-agent-frame");
    if (!agentReady) {
      loading.classList.add("visible");
      frame?.classList.remove("ready");
    } else {
      loading.classList.remove("visible");
      frame?.classList.add("ready");
    }
  }

  function closeKaufbot() {
    const frame = document.getElementById("kaufbot-agent-frame");
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: "KAUFBOT_CLOSE_SELF" }, "*");
    }

    wrap.classList.remove("visible");
    launcher.style.display = "block";
    agentReady = false;
    loading.classList.remove("visible");

    if (frame) {
      frame.classList.remove("ready");
      frame.remove();
    }

    mounted = false;
    mountAgent();
  }

  launcher.addEventListener("click", openKaufbot);
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
    }
  });
})();
