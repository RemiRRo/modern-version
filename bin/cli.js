#!/usr/bin/env node
const minimist = require('minimist');
const release = require('../src/index');

const args = minimist(process.argv.slice(2), {
    boolean: ['dry-run', 'skip-changelog', 'regenerate-changelog'],
    string: ['release-as', 'prerelease'],
    alias: { r: 'release-as' }
});

release(args).catch(error => {
    console.error(error.message || error);
    process.exitCode = 1;
});
