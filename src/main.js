const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Store = require('electron-store');

const store = new Store();

let mainWindow;

function sanitizeFileName(name) {
  return name
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 760,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

async function resolvePlaylist({ playlistUrl, clientId }) {
  const resolved = await axios.get('https://api-v2.soundcloud.com/resolve', {
    params: {
      url: playlistUrl,
      client_id: clientId,
      app_version: '1735909863',
      app_locale: 'en'
    }
  });

  const data = resolved.data;
  if (data.kind !== 'playlist' || !Array.isArray(data.tracks)) {
    throw new Error('The provided URL is not a playlist SoundCloud can resolve.');
  }

  return data;
}

async function getDownloadableStreamUrl(track, clientId) {
  if (!track?.media?.transcodings?.length) {
    return null;
  }

  const progressive = track.media.transcodings.find(
    (t) => t.format?.protocol === 'progressive'
  );

  const candidate = progressive || track.media.transcodings[0];
  if (!candidate?.url) {
    return null;
  }

  const streamResponse = await axios.get(candidate.url, {
    params: { client_id: clientId }
  });

  return streamResponse.data?.url || null;
}

async function downloadTrack({ track, index, total, outputDir, clientId }) {
  const title = track?.title || `track-${index + 1}`;
  const safeName = sanitizeFileName(`${index + 1} - ${title}.mp3`);
  const destination = path.join(outputDir, safeName);

  const streamUrl = await getDownloadableStreamUrl(track, clientId);
  if (!streamUrl) {
    return {
      ok: false,
      title,
      reason: 'No downloadable/streamable URL found for this track.'
    };
  }

  const response = await axios.get(streamUrl, { responseType: 'stream' });

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(destination);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  return {
    ok: true,
    title,
    path: destination,
    progress: `${index + 1}/${total}`
  };
}

ipcMain.handle('get-client-id', async () => store.get('client_id', ''));
ipcMain.handle('set-client-id', async (_event, id) => {
  store.set('client_id', id);
  return true;
});

ipcMain.handle('select-output-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  });

  if (result.canceled || !result.filePaths.length) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('rip-playlist', async (_event, payload) => {
  const { playlistUrl, clientId, outputDir } = payload || {};

  if (!playlistUrl || !clientId || !outputDir) {
    throw new Error('playlistUrl, clientId, and outputDir are required.');
  }

  const playlist = await resolvePlaylist({ playlistUrl, clientId });

  const results = [];
  for (let i = 0; i < playlist.tracks.length; i += 1) {
    const track = playlist.tracks[i];
    try {
      const result = await downloadTrack({
        track,
        index: i,
        total: playlist.tracks.length,
        outputDir,
        clientId
      });
      results.push(result);
    } catch (error) {
      results.push({
        ok: false,
        title: track?.title || `track-${i + 1}`,
        reason: error.message
      });
    }
  }

  return {
    playlistTitle: playlist.title,
    totalTracks: playlist.tracks.length,
    downloaded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results
  };
});
