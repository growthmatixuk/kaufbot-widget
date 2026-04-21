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
  let isProcessingProductReply = false;

  // ✅ DEFINE FIRST
  const SESSION_KEYS = {
    startTalkingPlayed: "kaufbot_start_talking_played"
  };

  // ✅ SAFE INIT
  let hasPlayedStartTalkingIntro = false;
  try {
    hasPlayedStartTalkingIntro =
      sessionStorage.getItem(SESSION_KEYS.startTalkingPlayed) === "1";
  } catch (e) {
    console.warn("Session storage unavailable", e);
  }

  const WELCOME_TEXT =
    "Hi, I’m KoffBot! Welcome to Click Backdrops… Click 'Start talking' and let’s chat.";

  const START_TALKING_TEXT =
    "Great, I can hear you now… How can I help you today?";

  function markReady() {
    if (kaufbotReady) return;
    if (!videoStreamReady || !audioStreamReady) return;

    kaufbotReady = true;

    if (canvas) canvas.style.opacity = "1";
    if (logoEl) logoEl.style.opacity = "1";
    if (loading) loading.remove();

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

    if (readyTimeout) clearTimeout(readyTimeout);

    if (canvas) canvas.style.opacity = "0";
    if (logoEl) logoEl.style.opacity = "0";
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
      hiddenAudio.muted = true;
      hiddenAudio.play().catch(console.warn);
      audioStreamReady = true;
      markReady();
    }
  }

  async function initKaufBot() {
    try {
      const response = await fetch(
        "https://growthmatixuk-kaufbot-widget.vercel.app/api/conversation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageContext })
        }
      );

      sessionData = await response.json();

      call = window.Daily.createCallObject();

      hiddenVideo = document.createElement("video");
      hiddenVideo.autoplay = true;
      hiddenVideo.muted = true;

      hiddenAudio = document.createElement("audio");
      hiddenAudio.autoplay = true;
      hiddenAudio.muted = true;

      canvas = document.createElement("canvas");
      ctx = canvas.getContext("2d");

      logoEl = document.createElement("img");
      logoEl.src = "https://i.postimg.cc/PPCXFF2y/click-backdrops-logo-white-r.png";

      stage.innerHTML = "";
      stage.append(hiddenVideo, hiddenAudio, canvas, logoEl);

      call.on("track-started", (ev) => {
        if (ev.participant.local) return;

        if (ev.track.kind === "video") {
          remoteVideoTrack = ev.track;
          attachMedia();
        }

        if (ev.track.kind === "audio") {
          remoteAudioTrack = ev.track;
          attachMedia();
        }
      });

      call.on("app-message", async (event) => {
        const payload = event?.data || event;
        const text =
          payload?.properties?.speech ||
          payload?.properties?.text ||
          "";

        if (!text) return;

        console.log("USER SAID:", text);

        if (!isProcessingProductReply) {
          isProcessingProductReply = true;

          const productContext = await fetchProductContext(text);

          if (productContext?.results?.length) {
            const reply = buildProductReply(productContext, text);
            if (reply) await sendSpokenLine(reply);
          }

          setTimeout(() => (isProcessingProductReply = false), 1000);
        }
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function joinKaufBot() {
    await call.join({
      url: sessionData.conversation_url,
      token: sessionData.meeting_token
    });

    joined = true;
    await call.setLocalAudio(false);
  }

  async function sendSpokenLine(text) {
    call.sendAppMessage({
      message_type: "conversation",
      event_type: "conversation.echo",
      conversation_id: sessionData.conversation_id,
      properties: { text }
    });
  }

  async function fetchProductContext(message) {
    const res = await fetch("/api/product-context", {
      method: "POST",
      body: JSON.stringify({ message }),
      headers: { "Content-Type": "application/json" }
    });

    return res.json();
  }

  function buildProductReply(ctx, userText) {
    const p = ctx.results[0];
    const v = p.variant;

    if (userText.includes("cheapest")) {
      return `The cheapest option is ${p.title} at £${v.price_gbp}.`;
    }

    return `${p.title} is £${v.price_gbp}.`;
  }

  await initKaufBot();
  await joinKaufBot();

  window.addEventListener("message", async (event) => {
    if (!event.data) return;

    if (event.data.type === "KAUFBOT_START_TALKING") {
      await call.setLocalAudio(true);

      if (!hasPlayedStartTalkingIntro) {
        hasPlayedStartTalkingIntro = true;
        sessionStorage.setItem(SESSION_KEYS.startTalkingPlayed, "1");
        await sendSpokenLine(START_TALKING_TEXT);
      }
    }
  });
})();
