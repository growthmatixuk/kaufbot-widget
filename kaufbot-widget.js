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
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    #kaufbot-video-shell {
      flex: 1;
      min-height: 420px;
      border-radius: 18px;
      background: #171a20;
      overflow: hidden;
      position: relative;
    }

    #kaufbot-status {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;
      color: rgba(255,255,255,.8);
      font-size: 14px;
      line-height: 1.4;
    }

    #kaufbot-footer {
      display: flex;
      gap: 10px;
      padding-top: 4px;
    }

    .kaufbot-btn {
      flex: 1;
      border: 0;
      border-radius: 12px;
      padding: 12px 14px;
      cursor: pointer;
      font-weight: 600;
    }

    .kaufbot-btn.primary {
      background: #fff;
      color: #111;
    }

    .kaufbot-btn.secondary {
      background: rgba(255,255,255,.08);
      color: #fff;
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
    <div id="kaufbot-body">
      <div id="kaufbot-video-shell">
        <div id="kaufbot-status">
          We’re replacing the old video-call look with a cleaner KaufBot experience.
        </div>
      </div>
      <div id="kaufbot-footer">
        <button class="kaufbot-btn primary" id="kaufbot-start">Start KaufBot</button>
        <button class="kaufbot-btn secondary" id="kaufbot-end">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  const closeBtn = drawer.querySelector("#kaufbot-close");
  const endBtn = drawer.querySelector("#kaufbot-end");

  function openDrawer() {
    overlay.classList.add("open");
    drawer.classList.add("open");
  }

  function closeDrawer() {
    overlay.classList.remove("open");
    drawer.classList.remove("open");
  }

  launcher.addEventListener("click", openDrawer);
  closeBtn.addEventListener("click", closeDrawer);
  endBtn.addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);

  // NOTE:
  // This is the new shell only.
  // Next step is wiring Daily custom mode into #kaufbot-video-shell
  // instead of embedding the full meeting UI.
})();
