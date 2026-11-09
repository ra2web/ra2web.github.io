# 网页红井测试版一键部署

网页红警一键部署包。网页红井（网页版“红警”）预览版测试站点，帮助各类爱好者一键搭建自己的网页版“红警”站点.

请注意，本仓库已经与至少2025年10月前不再是Chronodivide的中文镜像，请知悉。

Web-based Red Alert one-click deployment package.
Webpage Well is a preview test site of “Web-based Red Alert”, designed to help enthusiasts of all kinds quickly set up their own web “Red Alert” site with one click.

Attention: This repository has not been the Chinese mirror of Chronodivide since at least October 2025.

## 重要说明（许可与使用边界）

请阅读 LICENSE

## Usage Notice

Plase read LICENSE

## 玩家战场控制台

对局开始后，在浏览器开发者工具控制台使用 `window.werhd` 读取本地视野，并下发与鼠标相同的锁步指令。

完整 API、返回值、枚举和示例见 [docs/player-console-api.md](docs/player-console-api.md)。
玩家自己写的脚本在游戏页里直接调用 `window.werhd`；参考循环见 [docs/examples/werhd-user-script.mjs](docs/examples/werhd-user-script.mjs)。

可直接下载 [TypeScript 声明](werhd-player-api.d.ts)。API 支持精确物体/地格/桥面目标、部署姿态、载员/驻军状态及本地摄像机移动；已消失的单位查询返回 `undefined`。

[Jev 本地接入](docs/jev-player-local.md) · [阶段验收与待办](docs/jev-player-goal-audit.md)。当前为阶段交付，跨地图固定策略胜利及全部特殊行动的实战验证仍有待办。

```js
werhd.help()
const mcv = werhd.units('self').find((unit) => ['AMCV', 'SMCV', 'CMCV'].includes(unit.name))
werhd.deploy([mcv.id])
```

## 赞助商

本项目的CDN加速和安全防护由腾讯EdgeOne赞助

[![最佳亚洲 CDN、Edge 和安全解决方案 - 腾讯 EdgeOne](https://edgeone.ai/media/34fe3a45-492d-4ea4-ae5d-ea1087ca7b4b.png)](https://edgeone.ai/?from=github)

## 一键部署

### Github托管页面

fork该项目，命名为 你的名字.github.io，例如 ra2web.github.io

正如你所见，这个项目的名字就符合这个域名规则。那么，此时的你可以访问 https://ra2web.github.io 来游玩网页红井拉

当前本项目同样可以通过github pages访问，地址就是 https://ra2web.github.io

### 腾讯云EdgeOne Pages

[![使用 EdgeOne Pages 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?repository-url=https%3A%2F%2Fgithub.com%2Fra2web%2Fra2web.github.io)

### Vercel

[![一键部署到Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/ra2web/ra2web.github.io)


