(async function () {
  const stage = document.getElementById("agent-stage");
  const loading = document.getElementById("agent-loading");
  const micBtn = document.getElementById("mic-btn");
  const endBtn = document.getElementById("end-btn");

  let call;
  let micMuted = false;

  try {
    const response = await fetch("https://growthmatixuk-kaufbot-widget.vercel.app/api/conversation", {
      method: "POST"
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to start KaufBot");
    }

    call = window.Daily.createCallObject();
      showLeaveButton: false,
      showFullscreenButton: false,
      iframeStyle: {
        width: "100%",
        height: "100%",
        border: "0",
        borderRadius: "18px"
      }
    });

    await call.join({
      url: data.conversation_url,
      token: data.meeting_token,
      startVideoOff: true,
      startAudioOff: false
    });

    if (loading) loading.remove();

    // best-effort cleanup of some prebuilt chrome
    try {
      call.setShowParticipantsBar(false);
      call.setShowLocalVideo(false);
    } catch (e) {
      console.warn("Could not hide some Daily UI elements", e);
    }

  } catch (err) {
    console.error(err);
    loading.textContent = "Could not start KaufBot.";
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
