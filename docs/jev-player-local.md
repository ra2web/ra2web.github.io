# Jev 本地玩家接入

本示例优先从正常浏览器进入隔离在线站点 [staging.wangerhuoda.com](https://staging.wangerhuoda.com/) 的单机遭遇战，仅用户脚本和 Jev 代理运行在本机。页内脚本仅通过线上现有 `window.werhd` 观察和操作玩家；本机 Node 代理持有 TypeSafe key，发送 `state + questions` 到 `/v1/systemone`。Jev 选择候选动作，脚本复查后执行。不会向浏览器提供模型 key。

## 当前版本与验证

当前用户脚本为 `v8.8.15-tactics-wait`，策略计算位于用户侧：

- 防御按真实射程、目标装甲和合法落点判断；够不到敌方光棱坦克的光棱塔不会作为远程反制方案。保卫基地直接接敌，必要时收起部署单位，敌人离开基地范围后停止追赶。
- 战术组明确移动与攻击不消耗资金，资金不足不构成部队等待理由；仍允许维持正在执行的有效任务，以及无合适任务时等待。
- 三矿车经济目标与八辆机动编队目标共享生产预算；保护在建反制单位，并允许科技解锁。普通双武器同时考虑对空、对地作用，带防空副武器的装甲主力不因护航上限被排除。
- 步兵按装甲克制与部署姿态比较，快速廉价单位承担侦察；建筑和闲置战车为矿场、工厂通行留空间。选址是公开信息下的规划，不能保证所有时刻没有拥堵。
- 驻扎、载员、空袭、围墙、防御、变卖、修桥和断桥均有条件候选与执行守卫；无合适任务时等待是合法选择。

在线对局使用正常菜单与公开玩家 API。三方阵营、两种 AI、地图特征、脚本版本及中途控制器中断分别记录，不能由有限胜局推导所有地图或 MOD 的稳定胜率。完整结果、射程接敌证据和真实引擎效果见 [验收记录](jev-player-goal-audit.md)。

本轮策略验证没有继续修改游戏 API。API 的类型、失效对象、副本边界以及两种内置 AI 的真实模拟对照另有回归。下面的命令、`docs/examples/`、`tools/` 和日志路径均相对于 **ra2web-werhd 源工程**；静态站点提供游戏、公开类型、文档和示例，不运行 Node 代理，也不携带 key。

## 示例位置

基础玩家循环位于 [examples/werhd-user-script.mjs](examples/werhd-user-script.mjs)。Jev 接入模块、策略、特殊行动、摄像机与看板统一位于 [examples/jev/](examples/jev/README.md)，从同一份源文件随文档发布，不进入游戏主包，也不会自动挂载。

## 启动

在仓库根目录创建已被 Git 忽略的 `.env.local`：

```dotenv
JEV_API_KEY=填写你自己的key
JEV_BASE_URL=https://api.typesafe.ai/v1
JEV_MODEL=jev-latest
```

在源工程根目录运行本地代理（默认仅允许在线游戏域名及本地看板访问）：

```sh
node --env-file=.env.local tools/werhd-jev-server.mjs
```

打开 **`https://staging.wangerhuoda.com/`**，选择 CDN 资源、单机模式、遭遇战。游戏程序及资源使用线上配置，不启动本地游戏服、不重写资源地址，也不覆盖静态站点。默认验证美国阵营、10000 初始资金、0 初始部队、AI-简单海陆。若需复测 GitHub 在线站点，以 `JEV_GAME_ORIGIN=https://ra2web.github.io` 启动代理；不同在线域名的结果分别记录。

策略问题优先修改 `docs/examples/jev/` 中的本地脚本；若线上公开 API 的具体缺口确实阻塞验证，先记录缺口并停止该项验收，再单独讨论 API 调整。开发服测试属于另外的测试环境，不能替代在线站点验收；如确需使用，可显式设置 `JEV_GAME_ORIGIN`。

进局后在同一个页面的控制台执行：

```js
const { attachJevPlayer } = await import('http://127.0.0.1:5174/player.mjs?v=8.8.12')
window.werhdJev = await attachJevPlayer(window.werhd)
```

重复挂载前先停止旧实例。浏览器会缓存 ES 模块：修改脚本后，应在旧局结束后刷新游戏页面、重新开局再挂载；仅给入口加随机参数不会刷新已缓存的依赖。需要中途诊断时，所有改动依赖都必须使用新的版本参数，并将该局标为中途更新，不能作为固定版本完整验收。查看进度与停止：

```js
werhdJev.status
werhdJev.stop()
```

新版默认启用用户侧自动摄像机：优先观察可见交战，其次观察新建筑、部队任务和基地，每次切换至少停留 5 秒。摄像机不会改变部队选择或战斗命令。

```js
werhdJev.setAutoCamera(false) // 保持当前镜头，允许手动观察
werhd.camera.centerAt(60, 45) // 地图坐标，不需要移动鼠标
werhdJev.setAutoCamera(true) // 恢复自动导播
// 也可在 attachJevPlayer(werhd, { autoCamera: false }) 时禁用
```

默认每次托管最多 600 次决策；本机代理最多接受 1500 次请求（可通过 `JEV_MAX_CALLS` 调整）。请求完成后间隔 0.6 秒再观察；独立执行器每 150ms 维护采矿、维修、近距离集火、建筑落地和战况上报，不在 `onTick` 中等待网络。读数跨越超过 180 个模拟 tick 会丢弃。页面离局、玩家战败、手动停止或达到预算时停止托管。

长局需要同时提高代理和玩家循环的次数上限，例如代理启动时设置 `JEV_MAX_CALLS=2400`，挂载时使用 `attachJevPlayer(werhd, { maxDecisions: 2000 })`。次数上限是本地请求预算，达到后只会停止脚本，不代表游戏结算；多局共用代理时应核对剩余请求数。

## 实时看板

打开 `http://127.0.0.1:5174/`。看板通过 SSE 自动更新真实模型版本、候选选择与概率、置信度、请求耗时、P50/P95、Token 用量、当前战况和执行时间线。点击历史行可暂停跟随并检查当时结果，点击“返回实时跟随”恢复。看板只接收本机代理的战况和模型结果，不接收 API key。

执行时间线区分模型选择和执行器动作。模型决定宏观任务及 GI 等单位的展开/收起，执行器负责可见射程内集火、补发移动、建筑摆放及采矿维修；不把这些机械动作伪装成额外模型决策。战况与决策延迟分开显示，概率不是胜率。

## 职责与限制

- 模型分别选择基地建设、车辆、步兵、单位展开/收起、侦察和战术任务；各问题同一次请求评估。候选生成按当前可生产项目、经济目标、可见威胁和兵力约束。只有严重受损且基地安全时提供紧急撤退；兵力不足时可选择回基地集结。部署候选基于公开的实际姿态、可见敌人距离及部署前后武器；执行前再次复查，已达到目标姿态时不重复切换。
- 建筑落点由 `canPlace` 搜索，模型选定建筑后的放置由执行器完成。具体单位 id、坐标和费用由代码提供，模型仅返回候选项标识。
- 单位角色、武器和价格从公开 `werhd.rules(name, type)` 读取当前有效规则，包含地图 / MOD 覆盖；代理不读取仓库的静态 INI。分类、武器比较、科技选择和空间搜索均在用户脚本内完成。具体 MOD 的策略效果仍需分别验证。
- 已加入空军、海军、载员/卸载、围墙/武器防御、变卖、驻扎/撤出、修桥/断桥候选。驻扎/载员先等待收起姿态，再提交进入命令，以容器中实际出现的单位 ID 确认成功。真实模型候选与独立引擎效果分别验证，不能把候选出现算成自然线上对局已执行成功。侦察记忆只保存曾经看到的位置。
- `accepted` 只表示本地校验后已调用玩家 API，不能证明模拟已执行。通过后续 `observation` 的单位、队列、电力、资金变化和浏览器画面验证实际效果。
- 不确定性记录在 `confidence` 与 `probabilities` 中；不是实际战斗胜率。原型暂未对置信度设置经过标定的行动阈值。

## 记录与检查

本机代理的 `http://127.0.0.1:5174/status` 返回模型、请求次数、延迟与用量。日志保存在忽略提交的 `artifacts/jev-local/session-*.jsonl`，包含发送给模型的可见战况、候选动作、模型回答、执行记录和后续观察，不保存 key。

```sh
node tools/test-werhd-jev-player.mjs
node tools/test-werhd-jev-special.mjs
node tools/test-werhd-jev-strategy.mjs
node tools/test-werhd-jev-roles-traffic.mjs
node tools/test-werhd-jev-range-defense.mjs
node tools/test-werhd-jev-camera.mjs
node tools/test-player-console-types.mjs
node tools/test-player-console-runtime.mjs
node tools/test-player-console-deploy-runtime.mjs
node tools/test-werhd-user-script-runtime.mjs
node tools/summarize-werhd-jev.mjs
```

汇总工具读取该目录下所有 session 日志，写入 `artifacts/jev-local/summary.json`。不同 session 可能属于同一局中的策略调整，不能把 session 数当作对局数。实际结算单独保存在 `battle-*-result.json`。

官方协议：[HTTP API](https://docs.typesafe.ai/api)、[Choice](https://docs.typesafe.ai/primitives/choice)、[模型限制](https://docs.typesafe.ai/model-jaggedness/jev-1.13)。

当前 `v8.8.15` 还会按当前武器、目标装甲及空地类别选择交战目标。编队迎击和每单位射程内微操均使用武器克制关系，避免敌军列表顺序或任务目标固定加分让坦克持续追打不合适的步兵目标。线上验收进度及失败场次见 [验收记录](jev-player-goal-audit.md)。

地面编队补兵及防守反制会同时保留现金和战车生产队列。空中载具不会算作缺少的地面战车；地面编队满足后，可选空中载具重新进入候选。
