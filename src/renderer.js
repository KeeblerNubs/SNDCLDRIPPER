const logEl = document.getElementById('log');
const startBtn = document.getElementById('startBtn');
const folderBtn = document.getElementById('folderBtn');
const clientIdInput = document.getElementById('clientId');
const playlistUrlInput = document.getElementById('playlistUrl');
const outputDirInput = document.getElementById('outputDir');

function log(txt, color = '#9ef39a') {
  const line = document.createElement('div');
  line.style.color = color;
  line.textContent = txt;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

async function boot() {
  const savedClientId = await window.api.getClientId();
  if (savedClientId) {
    clientIdInput.value = savedClientId;
  }
}

folderBtn.addEventListener('click', async () => {
  const selected = await window.api.selectOutputFolder();
  if (selected) {
    outputDirInput.value = selected;
    log(`Output folder set: ${selected}`);
  }
});

startBtn.addEventListener('click', async () => {
  const playlistUrl = playlistUrlInput.value.trim();
  const clientId = clientIdInput.value.trim();
  const outputDir = outputDirInput.value.trim();

  if (!playlistUrl || !clientId || !outputDir) {
    log('Please provide playlist URL, client ID, and output folder.', '#ff9e9e');
    return;
  }

  startBtn.disabled = true;
  logEl.innerHTML = '';

  try {
    await window.api.setClientId(clientId);

    log('Resolving playlist and downloading tracks...');
    const summary = await window.api.ripPlaylist({
      playlistUrl,
      clientId,
      outputDir
    });

    log(`Playlist: ${summary.playlistTitle}`);
    summary.results.forEach((r) => {
      if (r.ok) {
        log(`✔ ${r.progress} ${r.title}`, '#9ef39a');
      } else {
        log(`✖ ${r.title} — ${r.reason}`, '#ff9e9e');
      }
    });

    log(
      `Done. Downloaded ${summary.downloaded}/${summary.totalTracks} track(s); ${summary.failed} failed.`,
      summary.failed ? '#ffd27a' : '#7bf4c5'
    );
  } catch (error) {
    log(`Failed: ${error.message}`, '#ff9e9e');
  } finally {
    startBtn.disabled = false;
  }
});

boot();
