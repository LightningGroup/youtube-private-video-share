const path = require('path');
const fs = require('fs');

function timestamp() {
  return new Date().toISOString();
}

function format(level, message, meta) {
  if (!meta) {
    return `[${timestamp()}] [${level}] ${message}`;
  }
  return `[${timestamp()}] [${level}] ${message} ${JSON.stringify(meta)}`;
}

function log(level, message, meta) {
  const line = format(level, message, meta);
  if (level === 'ERROR') {
    console.error(line);
  } else {
    console.log(line);
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function makeArtifactPath(baseDir, videoId, suffix, ext) {
  ensureDir(baseDir);
  const safeVideoId = String(videoId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(baseDir, `${safeVideoId}-${suffix}-${stamp}.${ext}`);
}

module.exports = {
  info(message, meta) {
    log('INFO', message, meta);
  },
  warn(message, meta) {
    log('WARN', message, meta);
  },
  error(message, meta) {
    log('ERROR', message, meta);
  },
  ensureDir,
  makeArtifactPath
};
