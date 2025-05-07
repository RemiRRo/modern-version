#!/usr/bin/env node
const minimist = require('minimist');
const release = require('../src/index');

const args = minimist(process.argv.slice(2), {
    boolean: ['dry-run', 'skip-changelog'],
    string: ['release-as', 'prerelease'],
    alias: { r: 'release-as' }
});

release(args).catch(console.error);