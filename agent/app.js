const urlParams = new URLSearchParams(window.location.search);
const pageContext = JSON.parse(urlParams.get("context") || "{}");

(async function () {
  const stage = document.getElementById("agent-stage");
  const loading = document.getElementById("agent-loading");

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

  let kaufbotReady = false;
  let sentReadyMessage = false;
  let readyTimeout = null;
  let goodFrameCount = 0;

  let micMuted = true;
  let conversationActivated = false;

  const WELCOME_TEXT =
    "Hi, welcome to Click Backdrops. I’m KaufBot. Tell me what you’re looking for and I’ll help you find the right backdrop. If your browser asks for microphone access, allow it so I can hear you properly.";

  function markReady() {
    if (kaufbotReady) return;

    kaufbotReady = true;

    if (canvas) {
      canvas.style.opacity = "1";

      // 👇 wait until canvas is actually visible before showing logo
setTimeout(() => {
  if (logoEl) {
    logoEl.style.opacity = "0.95";
  }
}, 220);
    }

    if (logoEl) {
  logoEl.style.opacity = "0.95";
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

    if (readyTimeout) {
      clearTimeout(readyTimeout);
      readyTimeout = null;
    }

    if (canvas) {
      canvas.style.opacity = "0";
    }
    
  }

  function animateLogo() {
    if (!logoEl) return;

    const t = performance.now() * 0.002;

    const y = Math.sin(t) * 0.8;
    const rotate = Math.sin(t * 0.7) * 0.4;
    const scale = 1 + Math.sin(t * 0.5) * 0.005;

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
      hiddenAudio.play().catch(console.warn);
    }
  }

  async function initKaufBot() {
    try {
      const response = await fetch("https://growthmatixuk-kaufbot-widget.vercel.app/api/conversation", {
        method: "POST"
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
      hiddenAudio.muted = false;

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
      event_type: "conversation.respond",
      conversation_id: sessionData.conversation_id,
      properties: {
        text: WELCOME_TEXT
      }
    };

    try {
      call.sendAppMessage(interaction, "*");
    } catch (err) {
      console.warn("Failed to send welcome interaction", err);
    }
  }

  await initKaufBot();
  await joinKaufBot();

  window.addEventListener("message", async (event) => {
    if (!event.data) return;

    if (event.data.type === "KAUFBOT_START_TALKING" && call && joined) {
      conversationActivated = true;
      micMuted = false;

      await call.setLocalAudio(true);
      await sendWelcomeMessage();
    }

    if (event.data.type === "KAUFBOT_TOGGLE_MIC" && call && joined && conversationActivated) {
      micMuted = !!event.data.muted;
      await call.setLocalAudio(!micMuted);
    }

    if (event.data.type === "KAUFBOT_CLOSE_SELF") {
      await leaveKaufBot();
    }
  });
})();
