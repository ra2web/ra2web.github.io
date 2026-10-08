# Jev 玩家示例

完整启动步骤、密钥配置、实验记录与限制见 [Jev 本地接入](../../jev-player-local.md)。

优先验证环境是在线游戏 `https://staging.wangerhuoda.com/` 加本地用户脚本与本地 Jev 代理。无需启动本地游戏服或重新构建游戏；策略修正留在本目录，线上 API 缺口单独记录和讨论。需要验证其他在线域名时，通过 `JEV_GAME_ORIGIN` 明确指定允许来源。

| 文件 | 用途 |
| --- | --- |
| [werhd-jev-player.mjs](werhd-jev-player.mjs) | 收集公开状态、请求模型、复查并执行动作 |
| [werhd-jev-catalog.mjs](werhd-jev-catalog.mjs) | 根据公开规则构建单位与建筑目录 |
| [werhd-jev-strategy.mjs](werhd-jev-strategy.mjs) | 经济、兵力、科技、防御与恢复候选 |
| [werhd-jev-special.mjs](werhd-jev-special.mjs) | 驻扎、载员、桥梁等组合行动 |
| [werhd-jev-camera.mjs](werhd-jev-camera.mjs) | 本地观察镜头 |
| [werhd-jev-dashboard.html](werhd-jev-dashboard.html) | 本地代理提供的实时看板源码 |

模型 key 由源工程 `tools/werhd-jev-server.mjs` 本地代理持有。代理仍通过 `http://127.0.0.1:5174/player.mjs` 提供入口，页面内挂载方式保持不变；看板请通过代理的 `http://127.0.0.1:5174/` 访问，静态副本不会提供 `/events` 或模型请求服务。

这里发布的是文档附带的示例源码。仅下载这些文件不会自动启动代理、挂载玩家脚本或发起付费模型请求。
