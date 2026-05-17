<div align="center">

**🌐 [English](#english) · [中文](#chinese)**

</div>

---

<p align="center">
  <img src="src-tauri/icons/icon.png" width="80" alt="RCS logo" />
</p>

<h1 align="center">RCS Client</h1>

<p align="center">
  <strong>量化风控订阅客户端 · Quant Risk Control Subscription Client</strong><br/>
  Tauri 2 · Rust · Vanilla JS · 6 languages
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-2.0-ffc131?logo=tauri" alt="Tauri 2" />
  <img src="https://img.shields.io/badge/Rust-1.77+-dea584?logo=rust" alt="Rust" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT" />
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey" alt="Platform" />
</p>

---

<h2 id="english">🇬🇧 English</h2>

## Features

A thin, polished desktop remote for the [rcsd](https://github.com/your-org/rcsd) risk-control platform. All heavy lifting — risk evaluation, AI patrol, strategy entitlements — lives on your VPS. The client just authenticates with your subscription key and surfaces real-time status.

- **🔐 HMAC-signed API** — every request signed with SHA-256 using your subscription secret; the secret never leaves local storage in plaintext
- **📊 Strategy Catalog** — browse all available strategies with allowed/denied status per your tier
- **🛡️ Risk Dashboard** — view active risk rules and test symbol evaluations in real time
- **🤖 AI Patrol (pending)** — upload AI provider keys & exchange API credentials for server-side agent monitoring (UI ready, waiting on `rcsd` agent module)
- **🌍 6 Languages** — English & Chinese (full), Spanish / Japanese / French / German (stubs, fall back to EN per key)
- **📱 App-style UI** — 420px compact window, bottom tab bar, light gradient design system
- **⚡ Tiny & fast** — vanilla JS, zero framework overhead; Rust binary ~4 MB after LTO + strip
- **🔒 Secure storage** — session persisted via OS keychain on macOS / credential store on Windows / encrypted file on Linux (Tauri Store plugin)

## TODO

- [ ] Agent module integration — wire up `/api/agent/*` endpoints when `rcsd` ships the patrol daemon
- [ ] Strategy catalog fetch — replace hardcoded label table with `/api/strategies` server endpoint
- [ ] Dark theme — override `:root` CSS variables with a dark palette
- [ ] Risk evaluation parameterisation — expose symbol/amount fields in the tester form
- [ ] Push notifications — Tauri notification plugin for risk alerts
- [ ] Auto-updater — Tauri updater plugin for seamless binary updates
- [ ] Mobile support — Tauri mobile targets (iOS / Android)

## Demo

<p align="center">
  <em>Screenshots coming soon</em>
</p>

| Screen | Description |
|--------|-------------|
| Auth | Sign in with endpoint + key ID + 64-hex secret |
| Home | Tier hero card, server health, stats at a glance |
| Strategies | Catalog with allowed/denied/restricted badges |
| Risk | Active rules table + symbol evaluation tester |
| AI | Upload OpenAI / exchange credentials (UI ready) |
| Me | Profile info, tier details, sign-out |

## Deploy / Build

### Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **Rust 1.77+** — [rustup.rs](https://rustup.rs)
- **Platform dependencies:**

| OS | Required packages |
|----|------------------|
| **Linux** | `libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libssl-dev` |
| **macOS** | Xcode Command Line Tools (`xcode-select --install`) |
| **Windows** | WebView2 runtime (preinstalled on Win11/10), VS2022 Build Tools with "Desktop C++" workload |

### Dev mode

```sh
cd rcs-client
npm install
npm run tauri dev          # opens native window; first Rust build takes ~3 min
```

### Production build

```sh
npm run tauri build
```

Output in `src-tauri/target/release/bundle/`:
- **Linux:** `.deb`, `.AppImage`
- **macOS:** `.app`, `.dmg`
- **Windows:** `.msi`, `.exe` (NSIS)

### CI/CD (GitHub Actions)

Push to `main` / `master` triggers the [release workflow](.github/workflows/release.yml) — builds all 3 platforms in parallel and uploads artifacts.

## Usage

1. **Deploy `rcsd`** on your VPS (see [rcsd docs](https://github.com/your-org/rcsd))
2. **Issue a subscription key** via `POST /api/keys` from the admin console → you get `key_id` (`rck_…`) + `secret` (64 hex chars)
3. **Open RCS Client** → enter your VPS endpoint (e.g. `https://your-vps.example.com:8090`), key ID, and secret
4. **Done** — the client verifies the HMAC, loads your tier info, and opens the dashboard

> **Don't have a subscription?** Register at [tauri2.buzz](https://tauri2.buzz) to get your key.

## About

RCS Client is the desktop companion to [rcsd](https://github.com/your-org/rcsd) — an open-source quantitative risk control daemon that enforces strategy subscription tiers, monitors exchange positions, and runs AI patrol agents on your VPS.

Built with [Tauri 2](https://v2.tauri.app) for minimal binary size, native OS integration, and a Rust-backed security model. The frontend is vanilla JavaScript — no React, no Vue, no Svelte — keeping the install footprint under 10 MB.

**License:** MIT — do whatever you want, no warranty.

---

<h2 id="chinese">🇨🇳 中文</h2>

## 功能

[rcsd](https://github.com/your-org/rcsd) 风控平台的轻量桌面客户端。所有重活——风控评估、AI 巡检、策略授权——都在你的 VPS 上运行。客户端只负责用订阅密钥登录并展示实时状态。

- **🔐 HMAC 签名 API** — 每次请求用你的订阅密钥做 SHA-256 签名；密钥永不以明文离开本地存储
- **📊 策略目录** — 浏览全部可用策略，按你的档位显示已授权/未授权状态
- **🛡️ 风控面板** — 查看生效中的风控规则，实时测试交易对评估
- **🤖 AI 巡检（待接入）** — 上传 AI 模型 key 和交易所 API 凭证供服务端巡检代理使用（界面已就绪，等 `rcsd` 的 agent 模块）
- **🌍 6 种语言** — 英文和中文（完整），西班牙/日本/法国/德国（骨架，逐个 key 回退到英文）
- **📱 App 风格 UI** — 420px 紧凑窗口，底部标签栏，浅色渐变设计系统
- **⚡ 轻量快速** — 原生 JS，零框架；Rust 二进制 LTO + strip 后约 4 MB
- **🔒 安全存储** — macOS 用钥匙串，Windows 用凭据管理器，Linux 加密文件存储（Tauri Store 插件）

## TODO

- [ ] Agent 模块接入 — 等 `rcsd` 上线巡检守护进程后，接通 `/api/agent/*` 接口
- [ ] 策略目录动态拉取 — 用 `/api/strategies` 服务端接口替换硬编码的标签表
- [ ] 深色主题 — 覆盖 `:root` CSS 变量为深色调色板
- [ ] 风控测试参数化 — 在测试表单中暴露交易对/数量字段
- [ ] 推送通知 — Tauri notification 插件做风控告警
- [ ] 自动更新 — Tauri updater 插件实现二进制静默升级
- [ ] 移动端 — Tauri mobile targets（iOS / Android）

## 演示

| 页面 | 说明 |
|------|------|
| 登录 | 输入 VPS 地址 + Key ID + 64 位十六进制密钥 |
| 首页 | 档位卡片、服务器健康、数据概览 |
| 策略 | 策略目录，已授权/未授权/受限制标记 |
| 风控 | 生效规则表格 + 交易对评估测试 |
| AI | 上传 OpenAI / 交易所凭证（界面已就绪） |
| 我的 | 个人信息、档位详情、退出登录 |

## 构建 & 部署

### 环境要求

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **Rust 1.77+** — [rustup.rs](https://rustup.rs)
- **平台依赖:**

| 系统 | 依赖包 |
|------|--------|
| **Linux** | `libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libssl-dev` |
| **macOS** | Xcode Command Line Tools (`xcode-select --install`) |
| **Windows** | WebView2 运行时（Win11/10 自带），VS2022 Build Tools（"使用 C++ 的桌面开发"） |

### 开发模式

```sh
cd rcs-client
npm install
npm run tauri dev          # 打开原生窗口；首次 Rust 编译约 3 分钟
```

### 生产构建

```sh
npm run tauri build
```

产物在 `src-tauri/target/release/bundle/`:
- **Linux:** `.deb`、`.AppImage`
- **macOS:** `.app`、`.dmg`
- **Windows:** `.msi`、`.exe`（NSIS 安装包）

### CI/CD（GitHub Actions）

推送到 `main` / `master` 分支自动触发 [构建流水线](.github/workflows/release.yml) —— 三平台并行构建并上传产物。

## 使用

1. **部署 `rcsd`** 到你的 VPS（见 [rcsd 文档](https://github.com/your-org/rcsd)）
2. **签发订阅密钥** — 通过管理后台 `POST /api/keys` → 拿到 `key_id`（`rck_…`）+ `secret`（64 位十六进制，仅显示一次）
3. **打开 RCS Client** → 输入你的 VPS 地址（如 `https://your-vps.example.com:8090`）、Key ID、密钥
4. **完成** — 客户端验证 HMAC 签名，加载档位信息，进入面板

> **还没有订阅？** 去 [tauri2.buzz](https://tauri2.buzz) 注册获取密钥。

## 关于

RCS Client 是 [rcsd](https://github.com/your-org/rcsd) 的桌面伴侣 —— 一个开源的量化风控守护进程，在你的 VPS 上执行策略订阅授权、持仓监控和 AI 巡检。

使用 [Tauri 2](https://v2.tauri.app) 构建，最小化二进制体积、原生系统集成、Rust 级别安全模型。前端纯 JavaScript —— 不依赖 React/Vue/Svelte，安装包控制在 10 MB 以内。

**许可证:** MIT — 随便用，无担保。

---

<p align="center">
  <sub>Built with Tauri 2 · Rust · Vanilla JS</sub>
</p>