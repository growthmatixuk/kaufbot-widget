(async function () {
  const stage = document.getElementById("agent-stage");
  const loading = document.getElementById("agent-loading");
  const micBtn = document.getElementById("mic-btn");
  const endBtn = document.getElementById("end-btn");

  let call;
  let micMuted = false;
  let videoEl;

  try {
    const response = await fetch("https://growthmatixuk-kaufbot-widget.vercel.app/api/conversation", {
      method: "POST"
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to start KaufBot");
    }

    call = window.Daily.createCallObject();

    // Create video element first
    videoEl = document.createElement("video");
    videoEl.autoplay = true;
    videoEl.playsInline = true;
    videoEl.muted = false;
    videoEl.style.width = "100%";
    videoEl.style.height = "100%";
    videoEl.style.objectFit = "cover";
    videoEl.style.display = "block";

    // Listen for KaufBot remote video BEFORE joining
    call.on("track-started", (ev) => {
      if (
        ev.track &&
        ev.track.kind === "video" &&
        ev.participant &&
        !ev.participant.local
      ) {
        videoEl.srcObject = new MediaStream([ev.track]);

        if (loading) loading.remove();
        if (!stage.contains(videoEl)) {
          stage.appendChild(videoEl);
        }
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

  micBtn.addEventListener("click", async () => {
    if (!call) return;

    micMuted = !micMuted;
    await call.setLocalAudio(!micMuted);
    micBtn.textContent = micMuted ? "Unmute mic" : "Mute mic";
  });

  endBtn.addEventListener("click", async () => {
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
