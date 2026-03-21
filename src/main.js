const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Store = require('electron-store');

const store = new Store();

const TRACKS_BATCH_SIZE = 50;
const PLAYLIST_TRACK_PAGE_SIZE = 200;

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

function getRequestParams(clientId, extra = {}) {
  return {
    client_id: clientId,
    app_version: '1735909863',
    app_locale: 'en',
    ...extra
  };
}

function chunkArray(items, size) {
  const chunks = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

async function fetchTracksByIds(trackIds, clientId) {
  const hydratedTracks = [];

  const chunks = chunkArray(trackIds, TRACKS_BATCH_SIZE);
  for (const idChunk of chunks) {
    const response = await axios.get('https://api-v2.soundcloud.com/tracks', {
      params: getRequestParams(clientId, { ids: idChunk.join(',') })
    });

    const tracks = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.collection)
        ? response.data.collection
        : [];

    hydratedTracks.push(...tracks);
  }

  return hydratedTracks;
}

async function fetchAllPlaylistTrackIds(playlistId, clientId) {
  let nextHref = 'https://api-v2.soundcloud.com/playlists/' + playlistId + '/tracks';
  const allTrackIds = [];

  while (nextHref) {
    const response = await axios.get(nextHref, {
      params: getRequestParams(clientId, {
        linked_partitioning: 1,
        limit: PLAYLIST_TRACK_PAGE_SIZE
      })
    });

    const collection = Array.isArray(response.data?.collection)
      ? response.data.collection
      : Array.isArray(response.data)
        ? response.data
        : [];

    collection.forEach((track) => {
      if (track?.id) {
        allTrackIds.push(track.id);
      }
    });

    nextHref = response.data?.next_href || null;
  }

  return allTrackIds;
}

async function resolvePlaylist({ playlistUrl, clientId }) {
  const resolved = await axios.get('https://api-v2.soundcloud.com/resolve', {
    params: getRequestParams(clientId, { url: playlistUrl })
  });

  const data = resolved.data;
  if (data.kind !== 'playlist' || !data.id) {
    throw new Error('The provided URL is not a playlist SoundCloud can resolve.');
  }

  return data;
}

async function collectPlaylistTracks(playlist, clientId) {
  const seedTrackIds = (playlist.tracks || [])
    .map((track) => track?.id)
    .filter(Boolean);

  const completeTrackIds = await fetchAllPlaylistTrackIds(playlist.id, clientId);
  const orderedUniqueTrackIds = [...new Set(completeTrackIds.length ? completeTrackIds : seedTrackIds)];

  if (!orderedUniqueTrackIds.length) {
    throw new Error('No tracks found in this playlist.');
  }

  const hydratedTracks = await fetchTracksByIds(orderedUniqueTrackIds, clientId);
  const trackById = new Map(hydratedTracks.map((track) => [track.id, track]));

  return orderedUniqueTrackIds
    .map((trackId) => trackById.get(trackId))
    .filter(Boolean);
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
    params: getRequestParams(clientId)
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
  const playlistTracks = await collectPlaylistTracks(playlist, clientId);

  const results = [];
  for (let i = 0; i < playlistTracks.length; i += 1) {
    const track = playlistTracks[i];
    try {
      const result = await downloadTrack({
        track,
        index: i,
        total: playlistTracks.length,
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
    totalTracks: playlistTracks.length,
    downloaded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results
  };
});
