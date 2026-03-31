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

await call.join({
  url: data.conversation_url,
  token: data.meeting_token,
  startVideoOff: true,
  startAudioOff: false
});

// create video element for KaufBot
const videoEl = document.createElement("video");
videoEl.autoplay = true;
videoEl.playsInline = true;
videoEl.style.width = "100%";
videoEl.style.height = "100%";
videoEl.style.objectFit = "cover";

stage.innerHTML = "";
stage.appendChild(videoEl);

// listen for Tavus/KaufBot video track
call.on("track-started", (ev) => {
  if (ev.track.kind === "video" && ev.participant && !ev.participant.local) {
    videoEl.srcObject = new MediaStream([ev.track]);
  }
});
