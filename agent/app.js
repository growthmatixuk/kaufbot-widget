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

    const draw = () => {
      if (hiddenVideo.readyState >= 2) {
        const w = hiddenVideo.videoWidth;
        const h = hiddenVideo.videoHeight;

        if (w && h) {
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }

          ctx.drawImage(hiddenVideo, 0, 0, w, h);

          if (!kaufbotReady) {
            goodFrameCount++;

            if (goodFrameCount >= 6) {
              videoStreamReady = true;
              markReady();
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
