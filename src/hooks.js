const { execSync } = require('child_process');

function runHook(hookName, config, env = {}) {
    const script = config.scripts?.[hookName];
    if (!script) return null;

    console.log(`Running ${hookName} hook...`);
    try {
        return execSync(script, {
            stdio: 'inherit',
            env: { ...process.env, ...env }
        }).toString().trim();
    } catch (error) {
        if (hookName === 'prerelease') process.exit(1);
        throw error;
    }
}

module.exports = { runHook };