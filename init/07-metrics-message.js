#!/usr/bin/env node
const process = require('node:process');
const {
    metricsTrackOnHcs,
} = require('../util/util.js');

async function metricsMessage() {
    const args = process.argv.slice(2);
    const [action, detail] = args;
    await metricsTrackOnHcs(action, detail);
}

metricsMessage();
