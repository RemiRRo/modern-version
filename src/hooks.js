const { execSync } = require('child_process');

function runHook(hookName, config, env = {}) {
    const script = config.scripts?.[hookName];
    if (!script) return null;

    console.log(`Running ${hookName} hook...`);
    try {
        const shouldCaptureOutput = hookName === 'prebump';
        const output = execSync(script, {
            stdio: shouldCaptureOutput ? 'pipe' : 'inherit',
            env: { ...process.env, ...env }
        });

        return shouldCaptureOutput ? output.toString().trim() : null;
    } catch (error) {
        if (hookName === 'prerelease') process.exit(1);
        throw error;
    }
}

module.exports = { runHook };
