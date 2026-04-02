const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const logger = require('./logger');

const TEXT_PATTERNS = {
  visibility: /^(Visibility|공개 상태)$/i,
  privateOption: /^(Private|비공개)$/i,
  sharePrivately: /(Share privately|비공개로 공유)/i,
  save: /^(Save|저장)$/i,
  cancel: /^(Cancel|취소)$/i,
  notifyViaEmail: /(Notify via email|이메일 알림)/i,
  done: /^(Done|완료)$/i
};

// NOTE: UI selectors are intentionally centralized here.
// If YouTube Studio UI changes later, update fallback selector lists in this file first.
const SELECTORS = {
  visibilitySection: [
    () => ({ type: 'role', role: 'button', name: TEXT_PATTERNS.visibility }),
    () => ({ type: 'label', label: TEXT_PATTERNS.visibility }),
    () => ({ type: 'text', text: TEXT_PATTERNS.visibility })
  ],
  privateBadge: [
    () => ({ type: 'role', role: 'button', name: TEXT_PATTERNS.privateOption }),
    () => ({ type: 'text', text: TEXT_PATTERNS.privateOption })
  ],
  sharePrivatelyTrigger: [
    () => ({ type: 'role', role: 'button', name: TEXT_PATTERNS.sharePrivately }),
    () => ({ type: 'text', text: TEXT_PATTERNS.sharePrivately })
  ],
  emailInput: [
    () => ({ type: 'css', css: 'input[type="email"]' }),
    () => ({ type: 'css', css: 'ytcp-social-suggestions-textbox input' }),
    () => ({ type: 'css', css: 'input[aria-label*="email" i], input[aria-label*="이메일"]' })
  ],
  notificationToggle: [
    () => ({ type: 'role', role: 'checkbox', name: TEXT_PATTERNS.notifyViaEmail }),
    () => ({ type: 'role', role: 'switch', name: TEXT_PATTERNS.notifyViaEmail }),
    () => ({ type: 'text', text: TEXT_PATTERNS.notifyViaEmail })
  ],
  dialogSave: [
    () => ({ type: 'role', role: 'button', name: TEXT_PATTERNS.save }),
    () => ({ type: 'role', role: 'button', name: TEXT_PATTERNS.done }),
    () => ({ type: 'text', text: TEXT_PATTERNS.save })
  ],
  pageSave: [
    () => ({ type: 'role', role: 'button', name: TEXT_PATTERNS.save }),
    () => ({ type: 'css', css: 'ytcp-button#save' })
  ]
};

function toLocator(page, descriptor) {
  if (descriptor.type === 'role') {
    return page.getByRole(descriptor.role, { name: descriptor.name });
  }
  if (descriptor.type === 'label') {
    return page.getByLabel(descriptor.label);
  }
  if (descriptor.type === 'text') {
    return page.getByText(descriptor.text);
  }
  return page.locator(descriptor.css);
}

async function findFirstVisible(page, candidates, timeoutMs = 5000) {
  for (const factory of candidates) {
    const locator = toLocator(page, factory());
    try {
      await locator.first().waitFor({ state: 'visible', timeout: timeoutMs });
      return locator.first();
    } catch (_) {
      // continue fallback chain
    }
  }
  return null;
}

async function safeClick(locator, label) {
  await locator.scrollIntoViewIfNeeded();
  await locator.click({ timeout: 7000 });
  logger.info(`Clicked: ${label}`);
}

async function captureFailureArtifacts(page, artifactDir, videoId, error) {
  try {
    const screenshotPath = logger.makeArtifactPath(artifactDir, videoId, 'error', 'png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    logger.error('Saved failure screenshot', { screenshotPath });

    const htmlPath = logger.makeArtifactPath(artifactDir, videoId, 'dom', 'html');
    const html = await page.content();
    fs.writeFileSync(htmlPath, html, 'utf8');
    logger.error('Saved failure HTML snapshot', { htmlPath });
  } catch (artifactError) {
    logger.error('Failed to capture artifacts', {
      message: artifactError.message,
      originalError: error && error.message
    });
  }
}

async function ensureOnVideoEditPage(page, videoId) {
  const studioUrl = `https://studio.youtube.com/video/${videoId}/edit`;
  await page.goto(studioUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1200);
  logger.info('Opened Studio video page', { videoId, studioUrl });
}

async function openSharePrivatelyDialog(page) {
  const visibility = await findFirstVisible(page, SELECTORS.visibilitySection, 4000);
  if (visibility) {
    await safeClick(visibility, 'visibility section');
    await page.waitForTimeout(500);
  }

  const privateBadge = await findFirstVisible(page, SELECTORS.privateBadge, 2500);
  if (privateBadge) {
    await safeClick(privateBadge, 'private badge');
    await page.waitForTimeout(500);
  }

  const sharePrivately = await findFirstVisible(page, SELECTORS.sharePrivatelyTrigger, 5000);
  if (!sharePrivately) {
    throw new Error('Could not find "Share privately" entry point. UI may have changed.');
  }

  await safeClick(sharePrivately, 'share privately');
  await page.waitForTimeout(800);
}

async function addEmails(page, emails) {
  if (!emails.length) {
    logger.warn('No emails requested to add.');
    return 0;
  }

  const emailInput = await findFirstVisible(page, SELECTORS.emailInput, 7000);
  if (!emailInput) {
    throw new Error('Could not find email input in private share dialog.');
  }

  let added = 0;
  for (const email of emails) {
    await emailInput.fill('');
    await emailInput.type(email, { delay: 20 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    logger.info('Queued invitee email', { email });
    added += 1;
  }

  return added;
}

async function setNotificationToggle(page, disableEmailNotification) {
  const toggle = await findFirstVisible(page, SELECTORS.notificationToggle, 2500);
  if (!toggle) {
    logger.warn('Notification toggle not found. Skipping toggle change.');
    return;
  }

  const checked = await toggle.isChecked().catch(() => null);
  if (checked === null) {
    logger.warn('Toggle state could not be detected. Skipping explicit toggle adjustment.');
    return;
  }

  const shouldEnable = !disableEmailNotification;
  if (checked === shouldEnable) {
    logger.info('Email notification toggle already in desired state', {
      disableEmailNotification
    });
    return;
  }

  await safeClick(toggle, 'notify via email toggle');
  logger.info('Adjusted email notification preference', {
    disableEmailNotification
  });
}

async function saveDialog(page, dryRun) {
  const saveButton = await findFirstVisible(page, SELECTORS.dialogSave, 5000);
  if (!saveButton) {
    throw new Error('Unable to find dialog save button.');
  }

  if (dryRun) {
    logger.info('Dry-run enabled: dialog save click skipped.');
    return;
  }

  await safeClick(saveButton, 'dialog save');
  await page.waitForTimeout(1000);
}

async function savePageIfNeeded(page, dryRun) {
  const pageSave = await findFirstVisible(page, SELECTORS.pageSave, 2500);
  if (!pageSave) {
    logger.info('Top-level page save button not found or not required.');
    return;
  }

  if (dryRun) {
    logger.info('Dry-run enabled: page save click skipped.');
    return;
  }

  const disabled = await pageSave.isDisabled().catch(() => false);
  if (disabled) {
    logger.info('Page save button exists but already disabled.');
    return;
  }

  await safeClick(pageSave, 'page save');
  await page.waitForTimeout(1000);
}

async function processVideo(page, options) {
  const {
    videoId,
    emailsToAdd,
    disableEmailNotification,
    dryRun,
    artifactDir
  } = options;

  try {
    await ensureOnVideoEditPage(page, videoId);
    await openSharePrivatelyDialog(page);
    const addedCount = await addEmails(page, emailsToAdd);
    await setNotificationToggle(page, disableEmailNotification);
    await saveDialog(page, dryRun);
    await savePageIfNeeded(page, dryRun);

    return {
      videoId,
      status: 'success',
      addedCount,
      message: dryRun ? 'Dry run completed' : 'Invites updated'
    };
  } catch (error) {
    logger.error('Failed processing video', { videoId, error: error.message });
    await captureFailureArtifacts(page, artifactDir, videoId, error);
    return {
      videoId,
      status: 'failed',
      addedCount: 0,
      message: error.message
    };
  }
}

async function runInteractiveLogin(page) {
  logger.info('Interactive login mode: finish Google login in browser and press ENTER in terminal to save session and exit.');
  await page.goto('https://studio.youtube.com', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  process.stdin.setEncoding('utf8');
  process.stdin.resume();
  await new Promise((resolve) => {
    process.stdin.once('data', () => resolve());
  });
}

async function runShareFlow(config) {
  const profileDir = path.resolve(process.cwd(), config.profileDir);
  const artifactDir = path.resolve(process.cwd(), 'artifacts');

  logger.ensureDir(profileDir);
  logger.ensureDir(artifactDir);

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: Boolean(config.headless),
    channel: 'chromium',
    viewport: { width: 1400, height: 900 }
  });

  const page = context.pages()[0] || (await context.newPage());

  if (config.locale && config.locale !== 'auto') {
    await page.setExtraHTTPHeaders({
      'Accept-Language': config.locale === 'ko' ? 'ko-KR,ko;q=0.9,en;q=0.8' : 'en-US,en;q=0.9'
    });
  }

  if (config.interactiveLogin) {
    await runInteractiveLogin(page);
    await context.close();
    return [];
  }

  const results = [];
  for (const videoId of config.videoIds) {
    logger.info('Starting video processing', { videoId });
    const result = await processVideo(page, {
      videoId,
      emailsToAdd: config.emailsToAdd,
      disableEmailNotification: config.disableEmailNotification,
      dryRun: config.dryRun,
      artifactDir
    });
    results.push(result);
  }

  await context.close();
  return results;
}

module.exports = {
  runShareFlow
};
