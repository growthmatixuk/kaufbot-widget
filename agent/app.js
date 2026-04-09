(async function () {
  const stage = document.getElementById("agent-stage");
  const loading = document.getElementById("agent-loading");

  let call;
  let hiddenVideo;
  let hiddenAudio;
  let canvas;
  let ctx;
  let animationId;
  let micMuted = true;

  let sessionData = null;
  let joined = false;
  let remoteVideoTrack = null;
  let remoteAudioTrack = null;

  let kaufbotReady = false;
  let sentReadyMessage = false;
  let readyTimeout = null;
  let goodFrameCount = 0;

  function markReady() {
    if (kaufbotReady) return;

    kaufbotReady = true;

    if (canvas) {
      canvas.style.opacity = "1";
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

          // Only reveal KaufBot when the stream has stabilised
          // at a decent resolution for a few frames.
          if (!kaufbotReady) {
            const minWidth = 540;
            const minHeight = 810;

            if (videoWidth >= minWidth && videoHeight >= minHeight) {
              goodFrameCount++;
            } else {
              goodFrameCount = 0;
            }

            if (goodFrameCount >= 8) {
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

      stage.innerHTML = "";
      stage.appendChild(hiddenVideo);
      stage.appendChild(hiddenAudio);
      stage.appendChild(canvas);

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

      // Keep user mic muted until explicitly enabled
      await call.setLocalAudio(false);

      // Fallback: if WebRTC never reports a strong enough frame,
      // reveal after a sensible delay rather than hang forever.
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
  }

  await initKaufBot();
  await joinKaufBot();

  window.addEventListener("message", async (event) => {
    if (!event.data) return;

    if (event.data.type === "KAUFBOT_TOGGLE_MIC" && call && joined) {
      micMuted = !!event.data.muted;
      await call.setLocalAudio(!micMuted);
    }

    if (event.data.type === "KAUFBOT_CLOSE_SELF") {
      await leaveKaufBot();
    }
  });
})();
