#!/usr/bin/env node

const {
    metricsTopicCreate,
    metricsTrackOnHcs,
} = require('../util/util.js');

async function initMetricsTopic() {
    await metricsTopicCreate();
    await metricsTrackOnHcs('initMetricsTopic', 'complete');
}

initMetricsTopic();
