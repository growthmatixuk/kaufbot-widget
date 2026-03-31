(function () {
  if (window.__kaufbotLoaded) return;
  window.__kaufbotLoaded = true;

  const isHome = location.pathname === "/" || document.body.classList.contains("home");
  const isProduct = document.body.classList.contains("single-product") || location.pathname.includes("/product/");

  if (!(isHome || isProduct)) return;

  const launcher = document.createElement("button");
  launcher.innerText = "Talk to KaufBot";
  launcher.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #111;
    color: #fff;
    border: none;
    padding: 14px 20px;
    border-radius: 40px;
    font-weight: 700;
    cursor: pointer;
    z-index: 999999;
    box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  `;

  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 360px;
    height: 520px;
    display: none;
    z-index: 999999;
    filter: drop-shadow(0 20px 40px rgba(0,0,0,0.35));
  `;

  const closeBtn = document.createElement("button");
  closeBtn.innerText = "✕";
  closeBtn.style.cssText = `
    position: absolute;
    top: -10px;
    right: -10px;
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 50%;
    background: #000;
    color: #fff;
    cursor: pointer;
    z-index: 2;
  `;

  const frameWrapper = document.createElement("div");
  frameWrapper.style.cssText = `
    width: 100%;
    height: 100%;
    background: transparent;
  `;

  container.appendChild(closeBtn);
  container.appendChild(frameWrapper);
  document.body.appendChild(launcher);
  document.body.appendChild(container);

  launcher.addEventListener("click", async function () {
    launcher.style.display = "none";
    container.style.display = "block";

    if (frameWrapper.innerHTML !== "") return;

    try {
      const response = await fetch("https://growthmatix-kaufbot-widget-git-main-dean-7115s-projects.vercel.app/api/conversation", {
        method: "POST"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start KaufBot");
      }

      const iframe = document.createElement("iframe");
      iframe.src = data.conversation_url + "?t=" + data.meeting_token;
      iframe.allow = "camera; microphone; fullscreen; display-capture;";
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "0";
      iframe.style.background = "transparent";

      frameWrapper.appendChild(iframe);
    } catch (error) {
      frameWrapper.innerHTML = '<div style="color:#fff;background:#111;padding:16px;border-radius:12px;font-family:sans-serif;">Could not load KaufBot.</div>';
      console.error(error);
    }
  });

  closeBtn.addEventListener("click", function () {
    container.style.display = "none";
    launcher.style.display = "block";
    frameWrapper.innerHTML = "";
  });
})();
