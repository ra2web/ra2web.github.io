# 玩家战场控制台 `window.werhd`

对局开始后，浏览器开发者工具控制台可以使用 `window.werhd` 读取**本地玩家看得见的**战场，并下发与鼠标、键盘相同的锁步指令。全局名是王二火大的缩写，不是红警，也没有 `window.ra`。

离局后对象会摘掉。再访问会抛 `werhd is not available outside a running battle`。观战或已投降只能读，不能下战斗指令。

```js
werhd.help()
```

会在控制台打印一份速查，并返回同一段文本。

## 能做什么

- 读己方、盟友、迷雾内可见的敌方单位与箱子
- 读地图可见格子、高程、能否落建筑
- 用 `weaponVs` / `inRange` 判断射程，以及「以高打低」的射程加成
- 读己方生产队列
- 选中、移动、攻击、展开、采矿、生产、放置、卖修、超武、结盟、投降
- 用 `onTick` 每拍跑一段自己的逻辑

指令进入人类 `ActionQueue`，联机与回放和点鼠标同一条路径。不要用它们去改模拟或揭迷雾。

## 开局示例：选中基地车并展开

```js
const mcv = werhd.units('self').find((unit) => ['AMCV', 'SMCV', 'CMCV'].includes(unit.name))
if (!mcv) throw new Error('找不到基地车')
werhd.deploy([mcv.id])
```

不必先 `select`。`deploy` 与 D 键相同，走 `DeploySelected`。失败会 `console.error` 并返回 `false`，不会静默丢掉。

## 查询

| 调用 | 返回 | 说明 |
| --- | --- | --- |
| `werhd.me()` | 自己 | 名字、阵营、钱、电、雷达、是否观战/战败 |
| `werhd.players()` | 玩家列表 | 敌方**没有**金钱、电力、雷达 |
| `werhd.tick()` | 整数 | 当前模拟拍 |
| `werhd.time()` | 秒 | 当前对局时间 |
| `werhd.units(relation?)` | 单位数组 | 默认 `'self'`。见下方关系 |
| `werhd.unit(id)` | 单位或 `undefined` | 看不见的 id 当作不存在 |
| `werhd.selected()` | 单位数组 | 当前选中 |
| `werhd.crates()` | 箱子数组 | 仅本地可见 |
| `werhd.map.size()` | `{ width, height }` | 地图尺寸 |
| `werhd.map.tile(x, y)` | 格子或 `undefined` | 迷雾中为 `undefined` |
| `werhd.map.visible(x, y)` | 布尔 | 该格是否可见 |
| `werhd.canPlace(name, x, y)` | 布尔 | 可见格子上能否放该建筑 |
| `werhd.elevation(id)` | 数字或 `undefined` | 单位有效高度 `tile.z + tileElevation` |
| `werhd.elevation({ x, y })` | 数字或 `undefined` | 可见格子的 `z` |
| `werhd.weaponVs(a, b)` | 射程对照或 `undefined` | 见下方 |
| `werhd.inRange(a, b)` | 布尔 | `weaponVs` 的 `inRange` |
| `werhd.production.queues()` | 六条队列 | 建筑/兵营/战车等 |
| `werhd.production.available(queueType?)` | `{ name, type }[]` | 当前能造的 |

`units` 的 `relation`：

- `'self'`：自己的单位
- `'allied'`：自己和盟友
- `'hostile'`：迷雾内可见的非友方
- `'enemy'`：其中的战斗单位（过滤掉非战斗对象）

看不见、未探开、隐身未侦测的单位，`unit(id)` 返回 `undefined`，不能靠扫 id 透视。

### 单位对象

```js
{
  id, name, type, owner,
  hitPoints, maxHitPoints,
  tile: { rx, ry, z, rampType, landType, onBridge },
  tileElevation,          // 相对格子的高度
  elevation,              // tile.z + tileElevation，用于以高打低
  worldPosition: { x, y, z },
  onBridge, zone, direction, velocity,
  isIdle, sight, veteranLevel,
  primaryWeapon: { minRange, maxRange, subjectToElevation, cooldownTicks },
  secondaryWeapon
}
```

`type` 对应 `werhd.ObjectType`。坐标 `rx/ry` 是地图格，`worldPosition` 是世界坐标。

### 自己 / 玩家对象

`me()`：

```js
{ name, country, credits, power, radarDisabled, defeated, isObserver, combatant }
```

`power` 为 `{ total, drain, isLowPower }`。`players()` 对非盟友不带 `credits`、`power`、`radarDisabled`。

### 箱子 / 格子

```js
werhd.crates()
// { id, name, water, tile }

werhd.map.tile(x, y)
// { rx, ry, z, rampType, landType, onBridge }
```

### 射程与以高打低

`weaponVs` 走引擎 `RangeHelper`，用攻击者主武器。以高打低是**射程加成**，不是伤害倍率。

```js
{
  distance,          // 格
  minRange, maxRange,
  inRange,
  hasHighGround,     // 弹道吃高程，且攻击者更高
  elevationBonus     // 因高程多出来的射程
}
```

任一方不可见、或攻击者没有主武器时返回 `undefined`。

```js
const me = werhd.units('self').find((unit) => unit.primaryWeapon)
const them = werhd.units('enemy')[0]
if (me && them) console.log(werhd.weaponVs(me.id, them.id))
```

## 指令

这些方法在观战/战败时不会入队，并 `console.warn`。`deploy` / `order` 另外返回 `boolean`。

| 调用 | 作用 |
| --- | --- |
| `werhd.select(ids)` | 选中己方单位 |
| `werhd.move(ids, x, y)` | 移动到格子 |
| `werhd.attack(ids, targetId)` | 攻击目标 |
| `werhd.attackMove(ids, x, y)` | 攻击移动 |
| `werhd.stop(ids)` | 停止 |
| `werhd.gather(ids, x?, y?)` | 采矿；可省略坐标 |
| `werhd.deploy(ids)` | 展开 / 部署，与 D 键相同 |
| `werhd.order(ids, type, targetIdOrX?, y?)` | 原始指令 |
| `werhd.produce(name, qty?)` | 入队生产，默认 1 |
| `werhd.cancel(name, qty?)` | 取消生产 |
| `werhd.pause(queueType)` | 暂停队列 |
| `werhd.resume(queueType)` | 继续队列 |
| `werhd.place(name, x, y)` | 放置已就绪建筑 |
| `werhd.sell(id)` | 卖 |
| `werhd.repair(id)` | 切换维修扳手 |
| `werhd.superweapon(type, x, y, x2?, y2?)` | 超武；超时空可带第二点 |
| `werhd.ally(name, on)` | 结盟 / 解盟 |
| `werhd.ping(x, y)` | 地图标记 |
| `werhd.resign()` | 投降 |

`order` 的目标：只传一个数字当目标单位 id；传 `x, y` 当地图格。无目标的 `OrderType.Deploy` 会改成 `DeploySelected`。

`produce` / `cancel` 找不到该名字时 `console.warn`，例如 `werhd.produce: E1 is not available`。

### `deploy` 失败原因

会 `console.error` 并返回 `false`：

- 没有单位 id
- 找不到单位
- 不是己方单位
- 该单位不能部署
- 没有格子
- 当前位置不能展开（基地车落不下建筑）

能部署的包括：基地车（`deploysInto`）、GI 一类展开步兵、运输卸载、切换主厂、清空驻军、TickTank 收起。

## 托管逻辑

每成功走完一拍模拟后回调一次。

```js
werhd.onTick(({ tick, time }) => {
  const idle = werhd.units('self').filter((unit) => unit.isIdle && unit.name === 'E1')
  const enemy = werhd.units('enemy')[0]
  if (idle.length && enemy) werhd.attack(idle.map((unit) => unit.id), enemy.id)
})
werhd.offTick()
```

回调抛错或单次超过约 8ms 会被关掉，并 `console.warn`，避免卡死主线程。新的 `onTick` 会替换旧回调，不是叠加。

## 枚举

挂在 `werhd` 上，不要自己填魔法数字（除非你明确知道值）。

### `werhd.OrderType`

| 名字 | 值 | 常见用途 |
| --- | --- | --- |
| `Move` | 0 | `move` |
| `ForceMove` | 1 | 强制移动 |
| `Attack` | 2 | `attack` |
| `ForceAttack` | 3 | 强制攻击 |
| `AttackMove` | 4 | `attackMove` |
| `Guard` | 5 | 警戒 |
| `GuardArea` | 6 | 区域警戒 |
| `Capture` | 7 | 工程师占领 |
| `Occupy` | 8 | 进入建筑 |
| `Deploy` | 9 | 需要点单位自己；无目标时 `order` 会改成下一项 |
| `DeploySelected` | 10 | D 键 / `deploy` |
| `Stop` | 11 | `stop` |
| `Cheer` | 12 | 欢呼 |
| `Dock` | 13 | 进船坞等 |
| `Gather` | 14 | `gather` |
| `Repair` | 15 | 修理目标 |
| `Scatter` | 16 | 散开 |
| `EnterTransport` | 17 | 上运输工具 |
| `PlaceBomb` | 18 | 伊文炸弹 |

```js
werhd.order([id], werhd.OrderType.AttackMove, 20, 21)
```

### `werhd.QueueType`

| 名字 | 值 |
| --- | --- |
| `Structures` | 0 |
| `Armory` | 1 |
| `Infantry` | 2 |
| `Vehicles` | 3 |
| `Aircrafts` | 4 |
| `Ships` | 5 |

```js
werhd.pause(werhd.QueueType.Infantry)
werhd.production.available(werhd.QueueType.Vehicles)
```

### `werhd.ObjectType`

| 名字 | 值 |
| --- | --- |
| `None` | 0 |
| `Aircraft` | 1 |
| `Building` | 2 |
| `Infantry` | 3 |
| `Overlay` | 4 |
| `Smudge` | 5 |
| `Terrain` | 6 |
| `Vehicle` | 7 |
| `Animation` | 8 |
| `Projectile` | 9 |
| `VoxelAnim` | 10 |
| `Debris` | 11 |

### `werhd.SuperWeaponType`

| 名字 | 值 |
| --- | --- |
| `MultiMissile` | 0 |
| `IronCurtain` | 1 |
| `LightningStorm` | 2 |
| `ChronoSphere` | 3 |
| `ChronoWarp` | 4 |
| `ParaDrop` | 5 |
| `AmerParaDrop` | 6 |

```js
werhd.superweapon(werhd.SuperWeaponType.ChronoSphere, 30, 40)
```

## 更多例子

巡逻己方空闲矿车：

```js
const ore = werhd.units('self').find((unit) => unit.name === 'OREP' || unit.name === 'CMIN')
werhd.units('self')
  .filter((unit) => unit.isIdle && (unit.name === 'HARV' || unit.name === 'HORV'))
  .forEach((unit) => werhd.gather([unit.id], ore?.tile.rx, ore?.tile.ry))
```

造兵并放置基地：

```js
werhd.produce('E1', 5)
if (werhd.canPlace('GACNST', 20, 22)) werhd.place('GACNST', 20, 22)
```

## 红线

- 没有全图透视，不能扫隐身 id，不能读敌人钱电
- 不暴露 `Game` / 完整 `GameApi`，也不挂 `window.ra`
- 不消耗对局 PRNG
- 调试作弊仍走单机 `r.cheats`
- 这是给会写脚本的玩家用的本机控制台，不是给外挂改模拟的接口
