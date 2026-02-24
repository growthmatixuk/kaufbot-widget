(async function () {

  if (window.__kaufbotLoaded) return;
  window.__kaufbotLoaded = true;

  const isHome = location.pathname === "/";
  const isProduct = document.body.classList.contains("single-product");

  if (!(isHome || isProduct)) return;

  const launcher = document.createElement("button");
  launcher.innerText = "Talk to KaufBot";
  launcher.style.cssText = `
    position:fixed;
    bottom:20px;
    right:20px;
    background:#111;
    color:#fff;
    border:none;
    padding:14px 20px;
    border-radius:40px;
    font-weight:bold;
    cursor:pointer;
    z-index:999999;
  `;

  const container = document.createElement("div");
  container.style.cssText = `
    position:fixed;
    bottom:90px;
    right:20px;
    width:360px;
    height:520px;
    display:none;
    z-index:999999;
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(container);

  launcher.onclick = async function () {

    launcher.style.display = "none";
    container.style.display = "block";

    const response = await fetch("https://YOUR-VERCEL-DOMAIN/api/conversation", {
      method: "POST"
    });

    const data = await response.json();

    const iframe = document.createElement("iframe");
    iframe.src = data.conversation_url + "?t=" + data.meeting_token;
    iframe.allow = "camera; microphone; fullscreen;";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";

    container.appendChild(iframe);
  };

})();
