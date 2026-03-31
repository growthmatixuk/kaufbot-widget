(async function () {
  const stage = document.getElementById("agent-stage");
  const loading = document.getElementById("agent-loading");
  const endBtn = document.getElementById("end-btn");

  let call;
  let hiddenVideo;
  let canvas;
  let ctx;
  let animationId;
  let micMuted = false;

  function startChromaKey() {
    if (!hiddenVideo || !canvas || !ctx) return;

    const draw = () => {
      if (hiddenVideo.readyState >= 2) {
        const videoWidth = hiddenVideo.videoWidth;
        const videoHeight = hiddenVideo.videoHeight;

        if (videoWidth && videoHeight) {
          if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
            canvas.width = videoWidth;
            canvas.height = videoHeight;
          }

          ctx.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height);

          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = frame.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            if (g > 110 && g > r * 1.25 && g > b * 1.25) {
              data[i + 3] = 0;
            }
          }

          ctx.putImageData(frame, 0, 0);
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();
  }

  try {
    const response = await fetch("https://growthmatixuk-kaufbot-widget.vercel.app/api/conversation", {
      method: "POST"
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to start KaufBot");
    }

    call = window.Daily.createCallObject();

    hiddenVideo = document.createElement("video");
    hiddenVideo.id = "agent-video-hidden";
    hiddenVideo.autoplay = true;
    hiddenVideo.playsInline = true;
    hiddenVideo.muted = true;

    canvas = document.createElement("canvas");
    canvas.id = "agent-canvas";

    ctx = canvas.getContext("2d", { willReadFrequently: true });

    call.on("track-started", (ev) => {
      if (
        ev.track &&
        ev.track.kind === "video" &&
        ev.participant &&
        !ev.participant.local
      ) {
        hiddenVideo.srcObject = new MediaStream([ev.track]);

        stage.innerHTML = "";
        stage.appendChild(hiddenVideo);
        stage.appendChild(canvas);

        hiddenVideo.onloadedmetadata = () => {
          hiddenVideo.play();
          startChromaKey();
        };
      }
    });

    await call.join({
      url: data.conversation_url,
      token: data.meeting_token,
      startVideoOff: true,
      startAudioOff: false
    });

    if (loading && stage.contains(loading)) {
      loading.remove();
    }
  } catch (err) {
    console.error(err);
    if (loading) {
      loading.textContent = "Could not start KaufBot.";
    }
  }

  window.addEventListener("message", async (event) => {
    if (!event.data || !call) return;

    if (event.data.type === "KAUFBOT_TOGGLE_MIC") {
      micMuted = !!event.data.muted;
      await call.setLocalAudio(!micMuted);
    }
  });

  endBtn?.addEventListener("click", async () => {
    if (animationId) cancelAnimationFrame(animationId);

    if (call) {
      try {
        await call.leave();
        call.destroy();
      } catch (e) {
        console.warn(e);
      }
    }

    if (window.parent !== window) {
      window.parent.postMessage({ type: "KAUFBOT_CLOSE" }, "*");
    }
  });
})();
