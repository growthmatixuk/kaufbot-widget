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
      display: none;
      pointer-events: none;
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
    }

    #kaufbot-close {
      position: absolute;
      top: 14px;
      right: 6px;
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
        width: 240px;
        height: 500px;
        right: 10px;
        bottom: 10px;
      }

      #kaufbot-controls {
        bottom: 10px;
      }

      #kaufbot-close {
        top: 8px;
        right: 4px;
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
      <button class="kaufbot-mini-btn" id="kaufbot-mic-toggle">Mute mic</button>
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(wrap);

  const shell = wrap.querySelector("#kaufbot-stage-shell");
  const closeBtn = wrap.querySelector("#kaufbot-close");
  const micBtn = wrap.querySelector("#kaufbot-mic-toggle");

  let mounted = false;
  let micMuted = false;

  function mountAgent() {
    if (mounted) return;
    const iframe = document.createElement("iframe");
    iframe.id = "kaufbot-agent-frame";
    iframe.src = "https://growthmatixuk-kaufbot-widget.vercel.app/agent/";
    iframe.allow = "camera; microphone; autoplay; fullscreen; display-capture";
    shell.appendChild(iframe);
    mounted = true;
  }

  function openKaufbot() {
    mountAgent();
    wrap.style.display = "block";
    launcher.style.display = "none";
  }

  function closeKaufbot() {
    const frame = document.getElementById("kaufbot-agent-frame");
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: "KAUFBOT_CLOSE_SELF" }, "*");
    }

    wrap.style.display = "none";
    launcher.style.display = "block";
    shell.innerHTML = "";
    mounted = false;
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
})();
