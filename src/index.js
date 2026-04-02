#!/usr/bin/env node

const { buildRuntimeConfig } = require('./config');
const logger = require('./logger');
const { runShareFlow } = require('./youtubeStudioShare');

function printSummary(results) {
  const rows = results.map((item) => ({
    videoId: item.videoId,
    status: item.status,
    addedCount: item.addedCount,
    message: item.message
  }));

  console.log('\n=== Result Summary ===');
  console.table(rows);

  const failed = rows.filter((r) => r.status !== 'success').length;
  const success = rows.length - failed;
  logger.info('Run completed', { total: rows.length, success, failed });
}

async function main() {
  try {
    const { args, config } = buildRuntimeConfig(process.argv.slice(2));

    if (!args.interactiveLogin && (!config.videoIds || config.videoIds.length === 0)) {
      throw new Error('No video IDs provided. Use config.videoIds or --video <videoId>.');
    }

    if (!args.interactiveLogin && (!config.emailsToAdd || config.emailsToAdd.length === 0)) {
      logger.warn('No emails provided. The tool will only validate UI navigation.');
    }

    const runtimeConfig = {
      ...config,
      interactiveLogin: args.interactiveLogin
    };

    logger.info('Starting tool', {
      interactiveLogin: runtimeConfig.interactiveLogin,
      dryRun: runtimeConfig.dryRun,
      videos: runtimeConfig.videoIds.length,
      emails: runtimeConfig.emailsToAdd.length,
      profileDir: runtimeConfig.profileDir
    });

    const results = await runShareFlow(runtimeConfig);

    if (!runtimeConfig.interactiveLogin) {
      printSummary(results);
      if (results.some((result) => result.status !== 'success')) {
        process.exitCode = 1;
      }
    }
  } catch (error) {
    logger.error('Fatal error', { message: error.message, stack: error.stack });
    process.exitCode = 1;
  }
}

main();
