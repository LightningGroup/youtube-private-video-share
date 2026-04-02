const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG = {
  profileDir: '.yt-studio-profile',
  headless: false,
  videoIds: [],
  emailsToAdd: [],
  disableEmailNotification: false,
  dryRun: false,
  locale: 'auto'
};

function parseBoolFlag(value) {
  if (value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return Boolean(value);
}

function normalizeEmails(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseArgs(argv) {
  const args = {
    configPath: null,
    interactiveLogin: false,
    dryRun: undefined,
    video: null,
    emails: null
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--config') {
      args.configPath = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === '--interactive-login') {
      args.interactiveLogin = true;
      continue;
    }
    if (token === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (token === '--video') {
      args.video = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === '--emails') {
      args.emails = argv[i + 1];
      i += 1;
      continue;
    }
    if (token.startsWith('--dry-run=')) {
      const [, raw] = token.split('=');
      args.dryRun = parseBoolFlag(raw);
    }
  }

  return args;
}

function loadConfig(configPath) {
  if (!configPath) {
    return { ...DEFAULT_CONFIG };
  }

  const absPath = path.resolve(process.cwd(), configPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Config file not found: ${absPath}`);
  }

  const raw = fs.readFileSync(absPath, 'utf8');
  const parsed = JSON.parse(raw);
  return { ...DEFAULT_CONFIG, ...parsed };
}

function dedupeEmails(emailList) {
  const set = new Set();
  for (const raw of emailList || []) {
    const normalized = String(raw || '').trim().toLowerCase();
    if (normalized) {
      set.add(normalized);
    }
  }
  return [...set];
}

function buildRuntimeConfig(argv) {
  const args = parseArgs(argv);
  const fileConfig = loadConfig(args.configPath);

  const merged = { ...fileConfig };
  if (args.dryRun !== undefined) merged.dryRun = args.dryRun;
  if (args.video) merged.videoIds = [args.video.trim()];
  if (args.emails) merged.emailsToAdd = normalizeEmails(args.emails);

  merged.emailsToAdd = dedupeEmails(merged.emailsToAdd);
  merged.videoIds = [...new Set((merged.videoIds || []).map((id) => String(id).trim()).filter(Boolean))];
  merged.profileDir = merged.profileDir || DEFAULT_CONFIG.profileDir;

  if (!['ko', 'en', 'auto'].includes(merged.locale)) {
    throw new Error(`Invalid locale: ${merged.locale}. Expected one of ko, en, auto`);
  }

  return { args, config: merged };
}

module.exports = {
  parseArgs,
  loadConfig,
  buildRuntimeConfig
};
