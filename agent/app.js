(async function () {
  const stage = document.getElementById("agent-stage");
  const loading = document.getElementById("agent-loading");

  let call;
  let hiddenVideo;
  let hiddenAudio;
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

          ctx.clearRect(0, 0, canvas.width, canvas.height);
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

    hiddenAudio = document.createElement("audio");
    hiddenAudio.id = "agent-audio-hidden";
    hiddenAudio.autoplay = true;
    hiddenAudio.playsInline = true;
    hiddenAudio.muted = false;

    canvas = document.createElement("canvas");
    canvas.id = "agent-canvas";

    ctx = canvas.getContext("2d", { willReadFrequently: true });

    stage.innerHTML = "";
    stage.appendChild(hiddenVideo);
    stage.appendChild(hiddenAudio);
    stage.appendChild(canvas);

    let remoteVideoTrack = null;
    let remoteAudioTrack = null;

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

      if (loading) loading.remove();
    }

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

    await call.join({
      url: data.conversation_url,
      token: data.meeting_token,
      startVideoOff: true,
      startAudioOff: false
    });

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

    if (event.data.type === "KAUFBOT_CLOSE_SELF") {
      if (animationId) cancelAnimationFrame(animationId);

      try {
        await call.leave();
        call.destroy();
      } catch (e) {
        console.warn(e);
      }
    }
  });
})();
