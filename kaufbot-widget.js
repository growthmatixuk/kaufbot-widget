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

    #kaufbot-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.35);
      opacity: 0;
      pointer-events: none;
      transition: opacity .25s ease;
      z-index: 999997;
    }

    #kaufbot-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    #kaufbot-drawer {
      position: fixed;
      top: 0;
      right: 0;
      width: 420px;
      max-width: 100vw;
      height: 100vh;
      background: #0f1115;
      color: #fff;
      transform: translateX(100%);
      transition: transform .3s ease;
      z-index: 999998;
      display: flex;
      flex-direction: column;
      box-shadow: -20px 0 50px rgba(0,0,0,.25);
    }

    #kaufbot-drawer.open {
      transform: translateX(0);
    }

    #kaufbot-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 18px;
      border-bottom: 1px solid rgba(255,255,255,.08);
    }

    #kaufbot-title {
      font-size: 18px;
      font-weight: 700;
    }

    #kaufbot-subtitle {
      font-size: 12px;
      opacity: .7;
      margin-top: 2px;
    }

    #kaufbot-close {
      border: 0;
      background: rgba(255,255,255,.08);
      color: #fff;
      width: 36px;
      height: 36px;
      border-radius: 999px;
      cursor: pointer;
      font-size: 18px;
    }

    #kaufbot-body {
      flex: 1;
      padding: 0;
      display: flex;
      flex-direction: column;
    }

    #kaufbot-iframe {
      width: 100%;
      height: 100%;
      border: 0;
      background: #0f1115;
    }

    @media (max-width: 768px) {
      #kaufbot-drawer {
        width: 100vw;
      }
    }
  `;
  document.head.appendChild(style);

  const launcher = document.createElement("button");
  launcher.id = "kaufbot-launcher";
  launcher.textContent = "Talk to KaufBot";

  const overlay = document.createElement("div");
  overlay.id = "kaufbot-overlay";

  const drawer = document.createElement("div");
  drawer.id = "kaufbot-drawer";
  drawer.innerHTML = `
    <div id="kaufbot-header">
      <div>
        <div id="kaufbot-title">Talk to KaufBot</div>
        <div id="kaufbot-subtitle">Your Click Backdrops assistant</div>
      </div>
      <button id="kaufbot-close" aria-label="Close">×</button>
    </div>
    <div id="kaufbot-body"></div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  const body = drawer.querySelector("#kaufbot-body");
  const closeBtn = drawer.querySelector("#kaufbot-close");

  function mountAgent() {
    if (body.querySelector("#kaufbot-iframe")) return;

    const iframe = document.createElement("iframe");
    iframe.id = "kaufbot-iframe";
    iframe.src = "https://growthmatixuk-kaufbot-widget.vercel.app/agent/";
    iframe.allow = "camera; microphone; autoplay; fullscreen; display-capture";
    body.appendChild(iframe);
  }

  function openDrawer() {
    mountAgent();
    overlay.classList.add("open");
    drawer.classList.add("open");
  }

  function closeDrawer() {
    overlay.classList.remove("open");
    drawer.classList.remove("open");
    body.innerHTML = "";
  }

  launcher.addEventListener("click", openDrawer);
  closeBtn.addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);

  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "KAUFBOT_CLOSE") {
      closeDrawer();
    }
  });
})();
