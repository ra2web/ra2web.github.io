import { isAirSupport } from './werhd-jev-strategy.mjs?v=8.8.15';
// All tactical choices and spatial searches live in the ordinary player script.
const distance = (a, b) => Math.hypot(a.rx - b.rx, a.ry - b.ry);
const idle = (unit, memory, tick) => unit.isIdle && tick - (memory.specialOrders?.get(unit.id)?.tick ?? -10000) > 450;
const friendlyOnBridge = (api, tile) => [...api.units('self'), ...api.units('allied')]
  .some(u => u.onBridge && distance(u.tile, { rx: tile.x, ry: tile.y }) < 7);

export function specialGroups(api, catalog, snapshot, memory, groups) {
  const { units, enemies, buildings, base } = snapshot.raw;
  if (!api.order || !api.QueueType || !base) return;
  const tick = api.tick();
  memory.specialOrders ??= new Map();
  const hostile = api.units('hostile');
  const civilians = hostile.filter((u) => u.garrison || catalog[u.name]?.bridgeRepairHut);
  const own = new Map(units.map((u) => [u.id, u]));
  const available = api.production.available();
  const freeQueue = (type) => {
    const queue = api.production.queues().find((q) => q.type === type);
    return queue && !queue.size && (queue.maxSize ?? 1) > 0;
  };
  const afford = (r, reserve = 500) => r && snapshot.state.self.credits >= r.cost + reserve;
  const infantry = units.filter((u) => u.type === api.ObjectType.Infantry && !catalog[u.name]?.engineer);
  const group = (id, instructions) => {
    groups[id] ??= { instructions, criteria: { wait: 'Keep existing orders when no offered action has a clear tactical benefit.' }, actions: { wait: { type: 'wait' } } };
    return (key, text, action) => {
      groups[id].criteria[key] = text;
      groups[id].actions[key] = action;
    };
  };
  const addProduction = (add, item, purpose, placement) => {
    const r = catalog[item.name];
    add(`produce_${item.name}`, `${purpose}: ${r.label}, cost ${r.cost}.`, {
      type: 'produce', name: item.name, queue: item.queue, cost: r.cost, minCredits: r.cost,
      placement,
    });
  };
  // Refresh revealed infrastructure at most once per 120 simulation ticks.
  if (!memory.infrastructure || tick - memory.infrastructure.tick >= 120) {
    const bridges = new Map();
    const water = [], seaFrontiers = [];
    const { width, height } = api.map.size();
    for (let x = 0; x < width; x++) for (let y = 0; y < height; y++) {
      const tile = api.map.tile(x, y);
      if (tile?.bridge) bridges.set(tile.bridge.id, { ...tile.bridge, x, y });
      if (tile?.landType === (api.LandType?.Water ?? 7)) {
        if (distance(base.tile, tile) < 24) water.push({ x, y });
        if (x % 3 === 0 && y % 3 === 0 && [[5,0],[-5,0],[0,5],[0,-5]].some(([dx,dy]) =>
          x+dx >= 0 && y+dy >= 0 && x+dx < width && y+dy < height && !api.map.visible(x+dx,y+dy))) seaFrontiers.push({ x, y });
      }
    }
    memory.infrastructure = { tick, bridges: [...bridges.values()], water, seaFrontiers };
  }
  const { bridges, water } = memory.infrastructure;
  snapshot.state.infrastructure = {
    visibleGarrisons: civilians.filter((u) => u.garrison).slice(0, 8).map((u) => ({ id: u.id, tile: u.tile, ...u.garrison })),
    visibleBridgePieces: bridges.length, shoreNearBase: !!water.length,
    aircraft: units.filter((u) => catalog[u.name]?.aircraft).map((u) => ({ id: u.id, ammo: u.ammo, idle: u.isIdle })),
    transports: units.filter((u) => u.transport).map((u) => ({ id: u.id, ...u.transport })),
  };
  const posture = group('deployment', 'Choose a useful deployment posture. Static weapon forms may protect a threatened choke, but must unfold back into mobile units when the battle moves away.');
  for (const u of units.filter((u) => u.canDeploy && idle(u, memory, tick))) {
    const r = catalog[u.name];
    if (!r || r.yard) continue;
    const deployedRule = catalog[r.deploysInto];
    if (r.deploysInto && deployedRule && !deployedRule.yard && deployedRule.weapon?.damage > 0 && snapshot.state.baseUnderAttack && enemies.some(e => distance(e.tile,u.tile) < (deployedRule.weapon.range || 6)))
      posture(`morph_${u.id}`, `Deploy ${r.label} #${u.id} into ${deployedRule.label} to hold the threatened approach; it will lose mobility.`,
        { type: 'special', kind: 'deploy_morph', ids: [u.id], order: { type: api.OrderType.DeploySelected } });
    if (r.tickTank && r.undeploysInto && !enemies.some(e => distance(e.tile,u.tile) < (r.weapon?.range || 6)))
      posture(`mobilize_${u.id}`, `Pack up ${r.label} #${u.id} into ${r.undeploysInto} to join the mobile force; no visible enemy is in its firing range.`,
        { type: 'special', kind: 'undeploy_morph', ids: [u.id], order: { type: api.OrderType.DeploySelected } });
  }
  const garrison = group('garrison', 'Use nearby empty civilian buildings as defensive strongpoints. Preserve at least two mobile infantry. Evacuate a severely damaged occupied building before its occupants are lost. Do not repeatedly interrupt infantry already moving to enter.');
  for (const building of [...civilians, ...buildings].filter((u) => u.garrison).slice(0, 10)) {
    if (own.has(building.id)) {
      if (building.garrison.count && building.hitPoints / building.maxHitPoints < 0.45)
        garrison(`evacuate_${building.id}`, `Evacuate ${building.garrison.count} infantry from badly damaged building #${building.id}.`,
          { type: 'special', kind: 'evacuate_garrison', ids: [building.id], order: { type: api.OrderType.DeploySelected } });
    } else if (building.garrison.canOccupy && !building.garrison.count && distance(base.tile, building.tile) < 28) {
      const candidates = infantry.filter((u) => catalog[u.name]?.occupier && idle(u, memory, tick) && u.id !== memory.scoutId)
        .sort((a, b) => distance(a.tile, building.tile) - distance(b.tile, building.tile))
        .slice(0, Math.min(3, building.garrison.capacity, Math.max(0, infantry.length - 2)));
      if (candidates.length)
        garrison(`occupy_${building.id}`, `Garrison ${candidates.length} infantry in civilian building #${building.id} at (${building.tile.rx},${building.tile.ry}); protect base approaches.`,
          { type: 'special', kind: 'garrison', ids: candidates.map((u) => u.id), targetId: building.id,
            order: { type: api.OrderType.Occupy, target: { objectId: building.id } } });
    }
  }
  const transport = group('transport', 'Use spare infantry to crew empty transports or IFVs when it improves the current mission. Keep anti-air escorts free when enemy aircraft are present. Unload near combat on safe land; never unload infantry into water.');
  for (const vehicle of units.filter((u) => u.transport && idle(u, memory, tick))) {
    const r = catalog[vehicle.name];
    if (!r) continue;
    if (vehicle.transport.occupied < vehicle.transport.capacity && !(r?.gunner && snapshot.state.airThreatCount) && distance(vehicle.tile, base.tile) < 14) {
      const passenger = infantry.find((u) => idle(u, memory, tick) && u.id !== memory.scoutId && distance(u.tile, vehicle.tile) < 8
        && (catalog[u.name]?.size ?? 1) <= r.sizeLimit && (catalog[u.name]?.size ?? 1) <= vehicle.transport.capacity);
      if (passenger)
        transport(`load_${vehicle.id}`, `Load infantry #${passenger.id} into ${r.label} #${vehicle.id}${r.gunner ? ' to use its infantry weapon mode' : ' for protected transport'}.`,
          { type: 'special', kind: 'load', ids: [passenger.id], targetId: vehicle.id,
            order: { type: api.OrderType.EnterTransport, target: { objectId: vehicle.id } } });
    }
    if (vehicle.transport.occupied && (!r?.gunner || snapshot.state.airThreatCount > 0) && vehicle.zone !== (api.ZoneType?.Water ?? 2) && enemies.some((e) => distance(e.tile, vehicle.tile) < 14))
      transport(`unload_${vehicle.id}`, `Unload transport #${vehicle.id} on land near the battle.`,
        { type: 'special', kind: 'unload', ids: [vehicle.id], order: { type: api.OrderType.DeploySelected } });
  }
  for (const vehicle of units.filter(u => u.transport?.occupied && !catalog[u.name]?.gunner && idle(u, memory, tick))) {
    const destination = enemies.find(e => e.type === api.ObjectType.Building && distance(e.tile, vehicle.tile) >= 12)
      ?? [...(memory.enemyBuildings?.values() ?? [])].find(e => distance(e.tile ?? {rx:e.x,ry:e.y},vehicle.tile) >= 12);
    const tile = destination?.tile ?? (destination && { rx: destination.x, ry: destination.y });
    if (tile && api.map.tile(tile.rx, tile.ry))
      transport(`ferry_${vehicle.id}`, `Transport ${vehicle.transport.occupied} occupied slots toward the known enemy shore (${tile.rx},${tile.ry}); unload after reaching safe land.`,
        { type: 'special', kind: 'transport_move', ids: [vehicle.id], order: { type: api.OrderType.Move, target: { x: tile.rx, y: tile.ry } } });
  }
  if (water.length > 20 && infantry.length >= 4 && !units.some(u => u.transport?.capacity > 1) && snapshot.state.self.credits > 3000) {
    const carrier = available.find(item => catalog[item.name]?.passengers > 1 && !catalog[item.name]?.gunner && afford(catalog[item.name], 1500));
    if (carrier) {
      const queue = api.production.available(api.QueueType.Ships).some(item => item.name === carrier.name) ? api.QueueType.Ships : api.QueueType.Vehicles;
      if (freeQueue(queue)) addProduction(group(queue === api.QueueType.Ships ? 'navy' : 'vehicles', 'Choose a useful vehicle for combined arms.'), { ...carrier, queue }, 'Build one transport for a landing force');
    }
  }
  const engineering = group('engineering', 'Repair a bridge to restore mobility when engineers are available. Demolish a bridge only to delay a visible enemy attack, with no friendly troops on it and a viable alternative position. Preserve engineers after unsuccessful orders.');
  const huts = civilians.filter((u) => catalog[u.name]?.bridgeRepairHut && distance(base.tile, u.tile) < 40);
  const engineers = units.filter((u) => catalog[u.name]?.engineer);
  for (const hut of huts.slice(0, 3)) {
    const engineer = engineers.find((u) => idle(u, memory, tick));
    if (engineer && tick - (memory.specialTargets?.get(`repair_${hut.id}`) ?? -10000) > 1200)
      engineering(`repair_${hut.id}`, `Inspect and repair the bridge associated with visible hut #${hut.id}; engineer #${engineer.id}. A healthy bridge will reject repair.`,
        { type: 'special', kind: 'repair_bridge', ids: [engineer.id], targetId: hut.id,
          order: { type: api.OrderType.Repair, target: { objectId: hut.id } } });
  }
  if (huts.length && !engineers.length && freeQueue(api.QueueType.Infantry) && snapshot.state.self.credits > 1800) {
    const engineer = available.find((u) => catalog[u.name]?.engineer && afford(catalog[u.name], 1200));
    if (engineer) addProduction(group('infantry', ''), { ...engineer, queue: api.QueueType.Infantry }, 'Train one engineer for visible bridge repair');
  }
  for (const bridge of bridges.slice(0, 12)) {
    const tile = { rx: bridge.x, ry: bridge.y };
    if (friendlyOnBridge(api, bridge) || memory.specialTasks?.some(t => t.bridge?.id === bridge.id)) continue;
    if (!enemies.some((e) => e.onBridge && distance(e.tile, tile) < 4 && distance(e.tile, base.tile) < 22)) continue;
    const weapons = snapshot.raw.army.filter((u) => !u.onBridge && !u.isDeployed && distance(u.tile, tile) < 9
      && tick >= (memory.bridgeRetryAfter?.get(`${bridge.id}:${u.name}`) ?? 0)
      && tick - (memory.specialOrders?.get(u.id)?.tick ?? -10000) > 450).slice(0, 3);
    if (weapons.length)
      engineering(`demolish_${bridge.id}`, `Destroy bridge piece (${bridge.x},${bridge.y}) beneath visible attackers approaching our base; no friendly units are on the nearby bridge. Consider whether the loss of this route would trap our army.`,
        { type: 'special', kind: 'demolish_bridge', ids: weapons.map((u) => u.id),
          order: { type: api.OrderType.ForceAttack, target: { x: bridge.x, y: bridge.y, onBridge: true } } });
  }
  const sell = group('salvage', 'Sell a doomed building to recover resources before it is destroyed. Protect essential power, the only refinery, and the only construction yard. Waiting is correct when selling would harm survival.');
  for (const b of buildings) {
    const r = catalog[b.name];
    if (!r || r.unsellable || r.yard || r.refinery || r.power > 0 || b.garrison?.count) continue;
    if (b.hitPoints / b.maxHitPoints < 0.18 && enemies.some((e) => distance(e.tile, b.tile) < 8))
      sell(`sell_${b.id}`, `Salvage critically damaged ${r.label} #${b.id} under immediate enemy pressure.`, { type: 'sell', objectId: b.id });
  }
  const defenses = group('defenses', 'Build limited base defenses at threatened approaches after the economy is running. Walls block movement but must leave exits open. Use anti-air defenses against visible aircraft. Preserve funds for tanks.');
  if (snapshot.state.harvesters >= 2 && freeQueue(api.QueueType.Armory)) {
    const existing = buildings.filter((u) => catalog[u.name]?.isBaseDefense || catalog[u.name]?.wall);
    for (const item of api.production.available(api.QueueType.Armory)) {
      const r = catalog[item.name];
      if (!r || !afford(r, 1000) || existing.filter((u) => u.name === item.name).length >= (r.wall ? 4 : 2)) continue;
      if (r.isBaseDefense || r.wall)
        addProduction(defenses, { ...item, queue: api.QueueType.Armory }, r.wall ? 'Build a wall segment to screen a vulnerable approach, leaving a passage' : 'Build a defensive strongpoint');
    }
  }
  // Technology is proposed in the existing construction category, keeping one queue owner.
  if (snapshot.state.economy?.factories && snapshot.state.harvesters >= 3 && freeQueue(api.QueueType.Structures)) {
    for (const item of api.production.available(api.QueueType.Structures)) {
      const r = catalog[item.name];
      if (!r || !afford(r, 1500) || buildings.some((u) => u.name === item.name)) continue;
      if (isAirSupport(r))
        addProduction(group('construction', ''), { ...item, queue: api.QueueType.Structures }, 'Build aircraft support to enable air strikes');
      if (r.naval && r.factory === 'NavalUnitType' && water.length) {
        const placement = water.find((p) => api.canPlace(item.name, p.x, p.y));
        if (placement) addProduction(group('construction', ''), { ...item, queue: api.QueueType.Structures }, 'Build a naval yard on the revealed shore', placement);
      }
    }
  }
  for (const [name, queue, select] of [
    ['aircraft', api.QueueType.Aircrafts, (r) => r.aircraft],
    ['navy', api.QueueType.Ships, (r) => r.naval],
  ]) {
    const add = group(name, name === 'aircraft' ? 'Build and use an air wing to strike visible vulnerable targets. Consider ammunition and anti-air threats; do not send empty aircraft into combat.' : 'Build a naval force when the coast is accessible. Attack visible enemy ships or reachable shore targets; explore water to find naval threats.');
    const force = units.filter((u) => select(catalog[u.name] ?? {}) && u.type !== api.ObjectType.Building);
    if (force.length < 4 && freeQueue(queue)) for (const item of api.production.available(queue)) {
      const r = catalog[item.name];
      if (r && r.weapon?.damage > 0 && afford(r, 800)) addProduction(add, { ...item, queue }, `Expand ${name}`);
    }
    const ready = force.filter((u) => idle(u, memory, tick) && (u.ammo === undefined || u.ammo !== 0));
    if (name === 'aircraft' && ready.length && !enemies.length && !memory.enemyBuildings?.size) {
      const p=memory.points?.[0];
      if (p && api.map.tile(p.x,p.y)) add('air_scout',`Scout the revealed frontier (${p.x},${p.y}) with one ready aircraft to locate the enemy base; ground scouts have not found it.`,
        {type:'special',kind:'air_scout',ids:[ready[0].id],order:{type:api.OrderType.Move,target:{x:p.x,y:p.y}}});
    }
    if (name === 'navy' && ready.length && !enemies.some((u) => u.zone === (api.ZoneType?.Water ?? 2))) {
      const points = memory.infrastructure.seaFrontiers ?? [];
      const p = [...points].sort((a, b) => distance(base.tile, {rx:b.x,ry:b.y}) - distance(base.tile, {rx:a.x,ry:a.y}))[0];
      if (p) add('sea_scout', `Explore revealed water frontier (${p.x},${p.y}) with ${ready.length} ships.`,
        { type: 'special', kind: 'naval_scout', ids: ready.map((u) => u.id), order: { type: api.OrderType.Move, target: p } });
    }
    for (const target of enemies.slice(0, 8)) {
      const ids = ready.filter((u) => api.weaponVs ? !!api.weaponVs(u.id, target.id, 'current') : target.zone === 1 ? catalog[u.name]?.weapon?.aa : catalog[u.name]?.weapon?.ag !== false).map((u) => u.id);
      if (ids.length) add(`strike_${target.id}`, `Attack visible ${target.name} #${target.id} using ${ids.length} ${name} units. Target HP ${target.hitPoints}/${target.maxHitPoints}.`,
        { type: 'special', kind: name === 'aircraft' ? 'air_strike' : 'naval_attack', ids, targetId: target.id,
          order: { type: api.OrderType.Attack, target: { objectId: target.id } } });
    }
  }
}

export function executeSpecial(api, action) {
  if (action.type === 'sell') {
    const building = api.units('self').find((u) => u.id === action.objectId);
    if (!building || building.type !== api.ObjectType.Building) return { accepted: false, reason: 'building_gone' };
    api.sell(action.objectId);
    return { accepted: true };
  }
  if (action.type !== 'special') return undefined;
  if (action.kind === 'demolish_bridge') {
    const tile = action.order.target;
    const bridge = api.map.tile(tile.x, tile.y)?.bridge;
    if (!bridge || !Number.isFinite(bridge.hitPoints)) return { accepted: false, reason: 'bridge_not_observable' };
    if (friendlyOnBridge(api, tile)) return { accepted: false, reason: 'friendly_on_bridge' };
    return { accepted: api.order(action.ids, action.order), ids: action.ids,
      bridge: { ...bridge, x: tile.x, y: tile.y },
      attackerNames: api.units('self').filter(u => action.ids.includes(u.id)).map(u => u.name) };
  }
  if (action.targetId !== undefined && !api.unit(action.targetId)) return { accepted: false, reason: 'target_no_longer_visible' };
  if (action.kind === 'garrison') {
    const target = api.unit(action.targetId);
    if (!target?.garrison?.canOccupy || target.garrison.count >= target.garrison.capacity)
      return { accepted: false, reason: 'garrison_changed' };
  }
  if (action.kind === 'load') {
    const target = api.unit(action.targetId);
    if (!api.units('self').some(u => u.id === action.targetId) || !target?.transport || target.transport.occupied >= target.transport.capacity)
      return { accepted: false, reason: 'transport_changed' };
    // Entry needs both participants: a previous squad order may already be moving the carrier.
    if (!api.order([action.targetId], { type: api.OrderType.Stop }))
      return { accepted: false, reason: 'transport_stop_rejected' };
  }
  if (['garrison', 'load', 'repair_bridge'].includes(action.kind)) {
    const deployed = api.units('self').filter((u) => action.ids.includes(u.id) && u.isDeployed).map((u) => u.id);
    if (deployed.length) return { accepted: api.deploy(deployed), ids: action.ids, phase: 'preparing' };
  }
  return { accepted: api.order(action.ids, action.order), ids: action.ids };
}

export function rememberSpecial(memory, action, execution, tick) {
  memory.specialTasks ??= [];
  memory.specialOrders ??= new Map();
  if (action.kind === 'demolish_bridge' && execution.accepted && execution.bridge) {
    memory.specialTasks.push({ action, bridge: execution.bridge, attackerNames: execution.attackerNames,
      started: tick, lastProgress: tick, hitPoints: execution.bridge.hitPoints });
    for (const id of action.ids) memory.specialOrders.set(id, { tick, kind: action.kind });
  }
  if (action.ids?.length && ['garrison', 'load'].includes(action.kind)) {
    memory.specialTasks.push({ action, phase: execution.phase ?? 'entering', started: tick, submitted: tick });
    for (const id of [...action.ids, ...(action.kind === 'load' ? [action.targetId] : [])])
      memory.specialOrders.set(id, { tick, kind: action.kind });
  }
}

// A multi-step player task; the engine still receives only ordinary independent commands.
export function maintainSpecial(api, memory, emit) {
  if (!memory.specialTasks?.length) return;
  const own = new Map(api.units('self').map((u) => [u.id, u]));
  const tick = api.tick();
  memory.specialTasks = memory.specialTasks.filter((task) => {
    const { action } = task;
    if (action.kind === 'demolish_bridge') return maintainDemolition(api, memory, task, own, tick, emit);
    const target = api.unit(action.targetId);
    const contained = action.kind === 'garrison' ? target?.garrison?.unitIds : target?.transport?.unitIds;
    const entered = action.ids.filter((id) => contained?.includes(id));
    const remaining = action.ids.filter((id) => !entered.includes(id) && own.has(id));
    const finish = (result) => {
      for (const id of [...action.ids, ...(action.kind === 'load' ? [action.targetId] : [])]) memory.specialOrders.delete(id);
      emit({ kind: result === 'completed' ? 'observed' : 'task', tick, task: action.kind,
        description: `${action.kind} ${result}: ${entered.length}/${action.ids.length}`,
        result, targetId: action.targetId, enteredIds: entered });
      return false;
    };
    if (entered.length === action.ids.length) return finish('completed');
    if (!target || !remaining.length || tick - task.started > 1200) return finish('incomplete');
    for (const id of remaining) memory.specialOrders.set(id, { tick, kind: action.kind });
    if (action.kind === 'load') {
      if (!own.has(target.id) || !target.transport || target.transport.occupied >= target.transport.capacity)
        return finish('incomplete');
      // Release a carrier taking damage so ordinary defense can react immediately.
      if (task.carrierHealth !== undefined && target.hitPoints < task.carrierHealth) return finish('interrupted');
      task.carrierHealth = target.hitPoints;
      memory.specialOrders.set(target.id, { tick, kind: action.kind });
    }
    if (task.phase === 'preparing') {
      if (remaining.some((id) => own.get(id).isDeployed) || tick - task.submitted < 20) return true;
      const execution = executeSpecial(api, { ...action, ids: remaining });
      if (!execution.accepted) return finish('rejected');
      task.phase = 'entering'; task.submitted = tick;
      emit({ kind: 'micro', tick, description: `${action.kind}: 姿态确认后进入目标`, targetId: action.targetId, ids: remaining });
    } else if (tick - task.submitted >= 120 && remaining.some(id => own.get(id).isIdle)) {
      const idleIds = remaining.filter(id => own.get(id).isIdle);
      const execution = executeSpecial(api, { ...action, ids: idleIds });
      if (!execution.accepted) return finish('rejected');
      task.phase = execution.phase ?? 'entering'; task.submitted = tick;
      emit({ kind: 'micro', tick, description: `${action.kind}: 空闲乘员重新进入目标`, targetId: action.targetId, ids: idleIds });
    }
    return true;
  });
}

function maintainDemolition(api, memory, task, own, tick, emit) {
  const { action, bridge } = task;
  const ids = action.ids.filter(id => own.has(id));
  const tile = api.map.tile(bridge.x, bridge.y);
  const current = tile?.bridge;
  const finish = result => {
    if (ids.length) api.order(ids, { type: api.OrderType.Stop });
    for (const id of action.ids) memory.specialOrders.delete(id);
    if (result === 'no_damage_progress') {
      memory.bridgeRetryAfter ??= new Map();
      for (const name of task.attackerNames) memory.bridgeRetryAfter.set(`${bridge.id}:${name}`, tick + 900);
    }
    emit({ kind: result === 'completed' ? 'observed' : 'task', tick, task: action.kind,
      description: `demolish_bridge ${result}`, result, bridgeId: bridge.id, x: bridge.x, y: bridge.y,
      initialHitPoints: bridge.hitPoints, lastHitPoints: current?.hitPoints ?? task.hitPoints });
    return false;
  };
  if (!tile) return finish('lost_visibility');
  if (!current) return finish('completed');
  if (current.id !== bridge.id) return finish('bridge_changed');
  if (!ids.length) return finish('units_lost');
  if (friendlyOnBridge(api, bridge)) return finish('friendly_on_bridge');
  if (current.hitPoints < task.hitPoints) {
    task.hitPoints = current.hitPoints;
    task.lastProgress = tick;
  }
  // AG/armor damage alone does not prove bridge damage (e.g. a non-wall-damaging warhead).
  // Observe the public health result and release the force if this attempt makes no progress.
  if (tick - task.lastProgress >= 300) return finish('no_damage_progress');
  if (tick - task.started >= 1800) return finish('time_limit');
  for (const id of ids) memory.specialOrders.set(id, { tick, kind: action.kind });
  return true;
}
