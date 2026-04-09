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
      width: 460px;
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
    <div id="kaufbot-controls">
      <button class="kaufbot-mini-btn" id="kaufbot-start-btn">Start talking</button>
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(wrap);

  const shell = wrap.querySelector("#kaufbot-stage-shell");
  const closeBtn = wrap.querySelector("#kaufbot-close");
  const startBtn = wrap.querySelector("#kaufbot-start-btn");

  let mounted = false;
  let agentReady = false;
  let hasAutoAppeared = false;
  let micLive = false;

  function mountAgent() {
    if (mounted) return;

    const iframe = document.createElement("iframe");
    iframe.id = "kaufbot-agent-frame";
   const pageContext = {
  url: window.location.href,
  path: window.location.pathname,
  title: document.title,
  h1: document.querySelector("h1")?.innerText || "",
};

iframe.src =
  "https://growthmatixuk-kaufbot-widget.vercel.app/agent/?" +
  new URLSearchParams({
    context: JSON.stringify(pageContext),
  });
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

  window.addEventListener("message", (event) => {
    if (!event.data) return;

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
  });
})();
