(async function () {
  const stage = document.getElementById("agent-stage");
  const loading = document.getElementById("agent-loading");

  const urlParams = new URLSearchParams(window.location.search);
  let pageContext = {};

  try {
    pageContext = JSON.parse(urlParams.get("context") || "{}");
  } catch (e) {
    console.warn("Could not parse page context", e);
    pageContext = {};
  }

  let call;
  let hiddenVideo;
  let hiddenAudio;
  let canvas;
  let ctx;
  let animationId;
  let logoEl;

  let sessionData = null;
  let joined = false;
  let remoteVideoTrack = null;
  let remoteAudioTrack = null;
  let videoStreamReady = false;
  let audioStreamReady = false;

  let kaufbotReady = false;
  let sentReadyMessage = false;
  let readyTimeout = null;
  let goodFrameCount = 0;

  let micMuted = true;
  let conversationActivated = false;

  const WELCOME_TEXT =
  "Hi, I’m KaufBot! Welcome to Click Backdrops… Click 'Start talking' and let’s chat.";

  function markReady() {
  if (kaufbotReady) return;
  if (!videoStreamReady || !audioStreamReady) return;

  kaufbotReady = true;

  if (canvas) {
    canvas.style.opacity = "1";
  }

  const logo = document.getElementById("kaufbot-logo");
  if (logo) {
    logo.style.opacity = "1";
  }

  if (loading) {
    loading.remove();
  }

  if (!sentReadyMessage && window.parent !== window) {
    sentReadyMessage = true;
    window.parent.postMessage({ type: "KAUFBOT_READY" }, "*");
  }
}

  function resetReadyState() {
  kaufbotReady = false;
  sentReadyMessage = false;
  goodFrameCount = 0;
  videoStreamReady = false;
  audioStreamReady = false;

  if (readyTimeout) {
    clearTimeout(readyTimeout);
    readyTimeout = null;
  }

  if (canvas) {
    canvas.style.opacity = "0";
  }

  if (logoEl) {
    logoEl.style.opacity = "0";
  }
}

  function animateLogo() {
    if (!logoEl) return;

    const t = performance.now() * 0.002;

    const y = Math.sin(t) * 0.4;
    const rotate = Math.sin(t * 0.7) * 0.2;
    const scale = 1 + Math.sin(t * 0.5) * 0.002;

    logoEl.style.transform = `
      translate(-50%, -50%)
      translateY(${y}px)
      rotate(${rotate}deg)
      scale(${scale})
    `;
  }

  function startChromaKey() {
  if (!hiddenVideo || !canvas || !ctx) return;

  ctx.imageSmoothingEnabled = true;
  if ("imageSmoothingQuality" in ctx) {
    ctx.imageSmoothingQuality = "high";
  }

  const draw = () => {
    if (hiddenVideo.readyState >= 2) {
      const videoWidth = hiddenVideo.videoWidth;
      const videoHeight = hiddenVideo.videoHeight;

      if (videoWidth && videoHeight) {
        if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
          canvas.width = videoWidth;
          canvas.height = videoHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(hiddenVideo, 0, 0, videoWidth, videoHeight);

        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];
          let a = data[i + 3];

          const greenDominance = g - Math.max(r, b);

          if (g > 95 && greenDominance > 28) {
            a = 0;
          } else if (g > 70 && greenDominance > 12) {
            const spill = Math.min(1, (greenDominance - 12) / 28);
            g = g * (1 - spill * 0.7);
            r = r + spill * 10;
            b = b + spill * 10;
            a = a * (1 - spill * 0.35);
          }

          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = a;
        }

        ctx.putImageData(frame, 0, 0);

        animateLogo();

        if (!kaufbotReady) {
          const minWidth = 480;
          const minHeight = 720;

          if (videoWidth >= minWidth && videoHeight >= minHeight) {
            goodFrameCount++;
          } else {
            goodFrameCount = 0;
          }

          if (goodFrameCount >= 6) {
            videoStreamReady = true;
            markReady();

            setTimeout(() => {
              if (logoEl) {
                logoEl.style.opacity = "0.95";
              }
            }, 180);
          }
        }
      }
    }

    animationId = requestAnimationFrame(draw);
  };

  draw();
}

      animationId = requestAnimationFrame(draw);
    };

    draw();
  }

  function attachMedia() {
  if (remoteVideoTrack) {
    hiddenVideo.srcObject = new MediaStream([remoteVideoTrack]);
    hiddenVideo.onloadedmetadata = () => {
      hiddenVideo.play().catch(console.warn);
      startChromaKey();
    };
  }

  if (remoteAudioTrack) {
    hiddenAudio.srcObject = new MediaStream([remoteAudioTrack]);
    hiddenAudio.play().catch(console.warn);
    hiddenAudio.muted = true;
    audioStreamReady = true;
    markReady();
  }
}

  async function initKaufBot() {
    try {
      const response = await fetch("https://growthmatixuk-kaufbot-widget.vercel.app/api/conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pageContext
        })
      });

      sessionData = await response.json();

      if (!response.ok) {
        throw new Error(sessionData.error || "Failed to start KaufBot");
      }

      call = window.Daily.createCallObject();

      hiddenVideo = document.createElement("video");
      hiddenVideo.id = "agent-video-hidden";
      hiddenVideo.autoplay = true;
      hiddenVideo.playsInline = true;
      hiddenVideo.muted = true;

      hiddenAudio = document.createElement("audio");
      hiddenAudio.id = "agent-audio-hidden";
      hiddenAudio.autoplay = true;
      hiddenAudio.playsInline = true;
      hiddenAudio.muted = true;
      hiddenAudio.volume = 1;

      canvas = document.createElement("canvas");
      canvas.id = "agent-canvas";
      canvas.style.opacity = "0";
      canvas.style.transition = "opacity 0.18s ease";

      ctx = canvas.getContext("2d", { willReadFrequently: true });

      const renderWrap = document.createElement("div");
      renderWrap.id = "agent-render-wrap";

      logoEl = document.createElement("img");
      logoEl.id = "kaufbot-logo";
      logoEl.src = "https://i.postimg.cc/PPCXFF2y/click-backdrops-logo-white-r.png";

      stage.innerHTML = "";
      stage.appendChild(hiddenVideo);
      stage.appendChild(hiddenAudio);
      renderWrap.appendChild(canvas);
      renderWrap.appendChild(logoEl);
      stage.appendChild(renderWrap);

      call.on("track-started", (ev) => {
        if (!ev.track || !ev.participant || ev.participant.local) return;

        if (ev.track.kind === "video") {
          remoteVideoTrack = ev.track;
          attachMedia();
        }

        if (ev.track.kind === "audio") {
          remoteAudioTrack = ev.track;
          attachMedia();
        }
      });

      call.on("app-message", (event) => {
        try {
          const payload = event?.data || event;
          if (!payload) return;

          if (window.parent !== window) {
            window.parent.postMessage({
              type: "KAUFBOT_DEBUG_APP_MESSAGE",
              payload
            }, "*");
          }

          if (!String(payload.event_type || "").startsWith("conversation.utterance")) {
            return;
          }

          const isUser =
            payload?.properties?.role === "user" ||
            payload?.role === "user";

          if (!isUser) return;

          const text = (
            payload?.properties?.speech ||
            payload?.properties?.text ||
            payload?.speech ||
            payload?.text ||
            ""
          ).toLowerCase().trim();

          if (!text) return;

          console.log("USER SAID:", text);

          const requestIntent =
            text.includes("show me") ||
            text.includes("take me to") ||
            text.includes("take a look") ||
            text.includes("look at") ||
            text.includes("looking for") ||
            text.includes("looking") ||
            text.includes("do you have") ||
            text.includes("can i see") ||
            text.includes("can you show me") ||
            text.includes("where are") ||
            text.includes("i need") ||
            text.includes("i want") ||
            text.includes("browse") ||
            text.includes("range") ||
            text.includes("collection") ||
            text.includes("collections") ||
            text.includes("options") ||
            text.includes("see");

          if (!requestIntent) {
            window.parent.postMessage({
              type: "KAUFBOT_CLEAR_LINK"
            }, "*");
            return;
          }

          if (
            text.includes("headshot") ||
            text.includes("headshots") ||
            text.includes("corporate portrait") ||
            text.includes("professional portrait") ||
            text.includes("linkedin")
          ) {
            window.parent.postMessage({
              type: "KAUFBOT_SUGGEST_LINK",
              slug: "headshot"
            }, "*");
            return;
          }

          if (
            text.includes("newborn") ||
            text.includes("baby") ||
            text.includes("babies") ||
            text.includes("kids") ||
            text.includes("children") ||
            text.includes("child") ||
            text.includes("seniors")
          ) {
            window.parent.postMessage({
              type: "KAUFBOT_SUGGEST_LINK",
              slug: "newborn-kids-and-seniors"
            }, "*");
            return;
          }

          if (
            text.includes("fine art") ||
            text.includes("texture") ||
            text.includes("textures") ||
            text.includes("textured") ||
            text.includes("masters")
          ) {
            window.parent.postMessage({
              type: "KAUFBOT_SUGGEST_LINK",
              slug: "masters-textures-and-fine-art"
            }, "*");
            return;
          }

          if (
            text.includes("exterior") ||
            text.includes("outdoor") ||
            text.includes("outside")
          ) {
            window.parent.postMessage({
              type: "KAUFBOT_SUGGEST_LINK",
              slug: "exterior"
            }, "*");
            return;
          }

          if (
            text.includes("floor") ||
            text.includes("floors")
          ) {
            window.parent.postMessage({
              type: "KAUFBOT_SUGGEST_LINK",
              slug: "floors"
            }, "*");
            return;
          }

          if (
            text.includes("solid") ||
            text.includes("seamless") ||
            text.includes("plain backdrop") ||
            text.includes("plain background")
          ) {
            window.parent.postMessage({
              type: "KAUFBOT_SUGGEST_LINK",
              slug: "solid-seamless"
            }, "*");
            return;
          }

          if (
            text.includes("interior") ||
            text.includes("indoors") ||
            text.includes("room")
          ) {
            window.parent.postMessage({
              type: "KAUFBOT_SUGGEST_LINK",
              slug: "interior"
            }, "*");
            return;
          }

          if (
            text.includes("signature") ||
            text.includes("signature collection")
          ) {
            window.parent.postMessage({
              type: "KAUFBOT_SUGGEST_LINK",
              slug: "signature-collections"
            }, "*");
            return;
          }

          if (
            text.includes("holiday") ||
            text.includes("christmas") ||
            text.includes("seasonal") ||
            text.includes("halloween") ||
            text.includes("easter") ||
            text.includes("valentine")
          ) {
            window.parent.postMessage({
              type: "KAUFBOT_SUGGEST_LINK",
              slug: "holidays"
            }, "*");
            return;
          }

          if (
            text.includes("floral") ||
            text.includes("flower") ||
            text.includes("flowers") ||
            text.includes("botanical")
          ) {
            window.parent.postMessage({
              type: "KAUFBOT_SUGGEST_LINK",
              slug: "floral"
            }, "*");
            return;
          }

          if (text.includes("clicki")) {
            window.parent.postMessage({
              type: "KAUFBOT_SUGGEST_LINK",
              slug: "clicki"
            }, "*");
            return;
          }

          if (
            text.includes("magna fix") ||
            text.includes("magna-fix") ||
            text.includes("magnetic")
          ) {
            window.parent.postMessage({
              type: "KAUFBOT_SUGGEST_LINK",
              slug: "magna-fix"
            }, "*");
            return;
          }

          if (
            text.includes("clearance") ||
            text.includes("sale") ||
            text.includes("discount") ||
            text.includes("reduced")
          ) {
            window.parent.postMessage({
              type: "KAUFBOT_SUGGEST_LINK",
              slug: "clearance"
            }, "*");
            return;
          }

          if (
            text.includes("roller system") ||
            text.includes("roller systems") ||
            text.includes("backdrop roller") ||
            text.includes("roller")
          ) {
            window.parent.postMessage({
              type: "KAUFBOT_SUGGEST_LINK",
              slug: "roller-systems"
            }, "*");
            return;
          }

          window.parent.postMessage({
            type: "KAUFBOT_CLEAR_LINK"
          }, "*");
        } catch (e) {
          console.warn("CTA detection error", e);
        }
      });

      call.on("left-meeting", () => {
        joined = false;
        resetReadyState();
      });
    } catch (err) {
      console.error(err);
      if (loading) {
        loading.textContent = "Could not start KaufBot.";
      }
    }
  }

  async function joinKaufBot() {
    if (!call || !sessionData || joined) return;

    try {
      resetReadyState();

      await call.join({
        url: sessionData.conversation_url,
        token: sessionData.meeting_token,
        startVideoOff: true,
        startAudioOff: true
      });

      joined = true;
      await call.setLocalAudio(false);

      readyTimeout = setTimeout(() => {
        markReady();
      }, 2200);
    } catch (err) {
      console.error("Join error:", err);
      if (loading) {
        loading.textContent = "Could not join KaufBot.";
      }
    }
  }

  async function leaveKaufBot() {
    if (animationId) cancelAnimationFrame(animationId);
    resetReadyState();

    try {
      if (call && joined) {
        await call.leave();
      }
    } catch (e) {
      console.warn(e);
    }

    joined = false;
    micMuted = true;
    conversationActivated = false;
  }

 async function sendWelcomeMessage() {
  if (!call || !sessionData?.conversation_id) return;

  const interaction = {
    message_type: "conversation",
    event_type: "conversation.echo",
    conversation_id: sessionData.conversation_id,
    properties: {
      text: WELCOME_TEXT
    }
  };

  try {
    console.log("Sending welcome echo");
    call.sendAppMessage(interaction, "*");
  } catch (err) {
    console.warn("Failed to send welcome echo", err);
  }
}

  await initKaufBot();
  await joinKaufBot();

  window.addEventListener("message", async (event) => {
    if (!event.data) return;

    if (event.data.type === "KAUFBOT_PLAY_GREETING" && call && joined) {
  console.log("PLAY_GREETING received");

  if (hiddenAudio) {
    hiddenAudio.muted = false;
    hiddenAudio.volume = 1;
    hiddenAudio.play().catch(() => {});
  }

  micMuted = true;
  await call.setLocalAudio(false);
  await sendWelcomeMessage();
  return;
}

    if (event.data.type === "KAUFBOT_START_TALKING" && call && joined) {
      conversationActivated = true;
      micMuted = false;

      if (hiddenAudio) {
        hiddenAudio.muted = false;
        hiddenAudio.volume = 1;
        hiddenAudio.play().catch(() => {});
      }

      await call.setLocalAudio(true);
      return;
    }

    if (event.data.type === "KAUFBOT_TOGGLE_MIC" && call && joined) {
      micMuted = !!event.data.muted;
      await call.setLocalAudio(!micMuted);
      return;
    }

    if (event.data.type === "KAUFBOT_PANEL_CLOSED") {
      if (hiddenAudio) {
        hiddenAudio.muted = true;
      }

      micMuted = true;
      if (call && joined) {
        await call.setLocalAudio(false);
      }
      return;
    }

    if (event.data.type === "KAUFBOT_PANEL_OPENED") {
      // intentionally do nothing here
      return;
    }

    if (event.data.type === "KAUFBOT_CLOSE_SELF") {
      await leaveKaufBot();
    }
  });
})();
