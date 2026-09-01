const { spawn } = require('child_process');
const semver = require('semver');

function runHook(hookName, config, env = {}) {
    const script = config.scripts?.[hookName];
    if (!script) return null;

    console.log(`Running ${hookName} hook...`);

    return new Promise((resolve, reject) => {
        let stdout = '';
        const child = spawn(script, {
            shell: true,
            stdio: ['inherit', 'pipe', 'pipe'],
            env: { ...process.env, ...env }
        });

        child.stdout.on('data', chunk => {
            stdout += chunk.toString();
            process.stdout.write(chunk);
        });

        child.stderr.on('data', chunk => {
            process.stderr.write(chunk);
        });

        child.on('error', reject);

        child.on('close', code => {
            if (code === 0) {
                resolve(getHookResult(hookName, stdout));
                return;
            }

            const error = new Error(`${hookName} hook failed with exit code ${code}`);
            if (hookName === 'prerelease') process.exit(1);
            reject(error);
        });
    });
}

function getHookResult(hookName, stdout) {
    if (hookName !== 'prebump') return null;

    const lines = stdout
        .trim()
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);
    const version = lines[lines.length - 1];

    return semver.valid(version) ? version : null;
}

module.exports = { runHook, getHookResult };
