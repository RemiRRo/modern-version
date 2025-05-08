# modern-version

**Automated Version Management and CHANGELOG Generation**  
A feature-rich replacement for standard-version with enhanced capabilities

![version](https://img.shields.io/github/package-json/v/RemiRRo/modern-version)
![GitHub license](https://img.shields.io/github/license/RemiRRo/modern-version)
## 📦 Installation

```bash
npm install --save-dev modern-version
# or globally
npm install -g modern-version
```

## 🚀 Quick Start

1. Add to your `package.json`:
```json
{
  "scripts": {
    "release": "modern-version"
  }
}
```

2. Run:
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
      {"type": "fix", "section": "🐞 Bug Fixes"}
    ]
  }
}
```

### Advanced Configuration
```json
{
  "files": ["package.json", "manifest.json"],
  "packages": false,
  "changelog": {
    "header": "# CHANGELOG\n\n",
    "footer": "Automatically generated on {{date}}",
    "repositoryUrl": "https://github.com/your/repo",
    "commitUrlFormat": "{{host}}/commit/{{hash}}",
    "issueUrlFormat": "{{host}}/issues/{{id}}",
    "types": [
      {"type": "feat", "section": "Features", "hidden": false},
      {"type": "fix", "section": "Bug Fixes"}
    ],
    "skip": {
      "chore": true,
      "docs": false
    }
  },
  "scripts": {
    "prerelease": "echo 'Starting release'",
    "postchangelog": "prettier --write CHANGELOG.md"
  }
}
```

## 🛠 Complete Config Reference

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `files` | string[] | Files to bump version in | `["package.json"]` |
| `packages` | boolean | Mono-repo mode | `false` |
| `changelog.header` | string | CHANGELOG header | `"# CHANGELOG\n\n"` |
| `changelog.footer` | string | Footer text (supports {{date}}) | `""` |
| `changelog.repositoryUrl` | string | Repo URL for links | - |
| `changelog.types` | object[] | Commit grouping settings | - |
| `changelog.skip` | object | Commit types to skip | - |
| `scripts` | object | Lifecycle hooks | - |

## 🔄 Lifecycle Hooks

Complete list of available hooks:

| Hook | Description | Can Return |
|------|-------------|------------|
| `prerelease` | Before release starts | - |
| `prebump` | Before version bump | New version (overrides calculation) |
| `postbump` | After version bump | - |
| `prechangelog` | Before CHANGELOG generation | - |
| `postchangelog` | After CHANGELOG generation | - |
| `precommit` | Before commit | - |
| `postcommit` | After commit | - |
| `pretag` | Before tag creation | - |
| `posttag` | After tag creation | - |

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

| Option | Description | Example |
|--------|-------------|---------|
| `--release-as` | Specify version explicitly | `--release-as 1.2.3` |
| `--prerelease` | Create pre-release | `--prerelease alpha` |
| `--dry-run` | Dry run mode | `--dry-run` |
| `--skip.commit` | Skip commit | `--skip.commit` |
| `--skip.tag` | Skip tag | `--skip.tag` |
| `--silent` | Minimal output | `--silent` |

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

### Skip Specific Steps
```bash
modern-version --skip.commit --skip.tag
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

MIT © 2023 [RemiRRo]