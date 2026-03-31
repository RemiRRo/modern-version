# modern-version

**Automated Version Management and CHANGELOG Generation**  
A feature-rich replacement for `standard-version` with enhanced capabilities, full lifecycle hooks, multi-file support, and commit validation.

![version](https://img.shields.io/github/package-json/v/RemiRRo/modern-version)
![GitHub license](https://img.shields.io/github/license/RemiRRo/modern-version)
![Tests](https://github.com/RemiRRo/modern-version/actions/workflows/test.yaml/badge.svg)
[![codecov](https://codecov.io/gh/RemiRRo/modern-version/branch/main/graph/badge.svg)](https://codecov.io/gh/RemiRRo/modern-version)

---

## ✅ Recommended Commit Format

We recommend using [Commitizen](https://github.com/commitizen/cz-cli) or [git-cz](https://github.com/typicode/husky#example-using-commitizen) to follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This ensures your commit messages are parsed correctly and changelogs are generated accurately.

Install and use with:

```bash
npm install --save-dev commitizen
npx commitizen init cz-conventional-changelog --save-dev --save-exact
```
## 📦 Installation
```bash
npm install --save-dev modern-version
# or globally
npm install -g modern-version
```

## 🚀 Quick Start

1. Add the release script to your `package.json`:
```json
{
  "scripts": {
    "release": "modern-version"
  }
}
```

2. Run a release:
```bash
npm run release -- --release-as minor
```

## ⚙️ Configuration

Create `.versionrc.json` in your project root:

### Basic Example
```json
{
  "changelog": {
    "header": "# Change History\n\n",
    "types": [
      {"type": "feat", "section": "✨ Features"},
      {"type": "fix", "section": "🐞 Bug Fixes"},
      {"type": "chore", "section": "🔧 Maintenance"},
      {"type": "docs", "section": "📚 Documentation"}
    ]
  }
}
```

### Advanced Configuration
```json
{
  "files": ["package.json", "manifest.json"],
  "changelog": {
    "header": "# CHANGELOG\n\n",
    "footer": "Automatically generated",
    "repositoryUrl": "https://github.com/your/repo",
    "types": [
      {"type": "feat", "section": "Features"},
      {"type": "fix", "section": "Bug Fixes"},
      {"type": "perf", "section": "Performance Improvements"},
      {"type": "revert", "section": "Reverts"}
    ],
    "skip": {
      "chore": true,
      "docs": false
    },
    "skipInvalidCommits": true
  },
  "scripts": {
    "prerelease": "echo 'Starting release'",
    "postchangelog": "prettier --write CHANGELOG.md"
  }
}
```

## 🛠 Complete Config Reference

| Parameter                 | Type      | Description                           | Default                      |
| ------------------------- | --------- | ------------------------------------- | ---------------------------- |
| `files`                   | string\[] | Files to bump version in              | `["package.json"]`           |
| `commitMessage`           | string    | Custom commit message                 | `chore(release): v{version}` |
| `changelog.header`        | string    | Changelog header                      | `"# Changelog\n\n"`          |
| `changelog.footer`        | string    | Footer text                           | `""`                         |
| `changelog.repositoryUrl` | string    | Repository URL for links              |                              |
| `changelog.types`         | object\[] | Grouping for commit types             |                              |
| `changelog.skip`          | object    | Types of commits to skip in changelog |                              |
| `scripts`                 | object    | Lifecycle hook commands               |                              |


## 🔄 Lifecycle Hooks

Complete list of available hooks:

| Hook            | Description                 | Return Value           |
| --------------- | --------------------------- | ---------------------- |
| `prerelease`    | Before the release starts   | -                      |
| `prebump`       | Before version bump         | New version (override) |
| `postbump`      | After version bump          | -                      |
| `prechangelog`  | Before changelog generation | -                      |
| `postchangelog` | After changelog generation  | -                      |
| `precommit`     | Before committing changes   | -                      |
| `postcommit`    | After committing changes    | -                      |
| `pretag`        | Before creating a Git tag   | -                      |
| `posttag`       | After tag creation          | -                      |


### Hook Usage Example
```json
{
  "scripts": {
    "prebump": "echo 'Current version: $VERSION'",
    "postbump": "npm run build",
    "postchangelog": "prettier --write CHANGELOG.md"
  }
}
```

## 💻 CLI Options

```bash
modern-version [options]
```

| Option             | Description                      | Example              |
| ------------------ | -------------------------------- | -------------------- |
| `--release-as`     | Specify the release version      | `--release-as 1.2.3` |
| `--prerelease`     | Mark as a pre-release            | `--prerelease beta`  |
| `--dry-run`        | Run without changing anything    | `--dry-run`          |
| `--skip-changelog` | Skip changelog generation        | `--skip-changelog`   |


## 📌 Usage Examples

### Standard Release
```bash
modern-version
# or via npm
npm run release
```

### Major Release
```bash
modern-version --release-as major
```

### Pre-release
```bash
modern-version --prerelease beta
```

### Skip Changelog
```bash
modern-version --skip-changelog
```

### Specific Version
```bash
modern-version --release-as 2.1.0-rc.1
```

## 🤝 Contributing

1. Fork the repository
2. Install dependencies:
```bash
npm install
```
3. Create a feature branch:
```bash
git checkout -b feature/new-awesome-feature
```
4. Run tests:
```bash
npm test
```
5. Create a Pull Request

## 📜 License

MIT © 2025 [RemiRRo]