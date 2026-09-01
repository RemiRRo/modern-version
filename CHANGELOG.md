# CHANGELOG

## v2.0.1 (2026-09-01)

### 📝 Документация
- [316e5ca](https://github.com/RemiRRo/modern-version/commit/316e5ca): document bump and breaking change behavior

## v2.0.0 (2026-09-01)

### ⚠️ Breaking Changes
- **[016be34](https://github.com/RemiRRo/modern-version/commit/016be34): detect bump type from commits**

  Running modern-version without release flags now derives the bump type from commits
  and can produce a minor release instead of always producing a patch release. CI workflows that rely
  on the previous default should pass --release-as patch explicitly.

### ✨ Новое
- [016be34](https://github.com/RemiRRo/modern-version/commit/016be34): detect bump type from commits

### 🐞 Исправлено
- [bf82099](https://github.com/RemiRRo/modern-version/commit/bf82099): stream prebump output safely

## v1.4.6 (2026-06-02)

### 🐞 Исправлено
- [613145b](https://github.com/RemiRRo/modern-version/commit/613145b): stream lifecycle hook output
- [00a3166](https://github.com/RemiRRo/modern-version/commit/00a3166): limit changelog preview output

## v1.4.5 (2026-03-31)

### 📝 Документация
- [518e907](https://github.com/RemiRRo/modern-version/commit/518e907): remove undocumented options and fix inaccuracies

## v1.4.4 (2026-03-31)

### 🐞 Исправлено
- [17bf51b](https://github.com/RemiRRo/modern-version/commit/17bf51b): prevent changelog header duplication and improve security

## v1.4.3 (2025-05-16)

### 🐞 Исправлено
- [24258ff](https://github.com/RemiRRo/modern-version/commit/24258ff): fix release-as flags

### ✅ Тесты
- [b63594d](https://github.com/RemiRRo/modern-version/commit/b63594d): refactoring tests taking into account changes

## v1.4.2 (2025-05-16)

### 📚 Documentation
- [9f0d9e3](https://github.com/RemiRRo/modern-version/commit/9f0d9e3): update README.md
