// Ordinary player-side strategy; no engine objects, private map data, or unit-name tables.
const dist = (a, b) => Math.hypot(a.rx - b.rx, a.ry - b.ry);
const hp = u => (u.hitPoints ?? 100) / (u.maxHitPoints || 100);
export const isAirSupport = r => r?.factory === 'AircraftType';
export const ATTACK_FORCE_SIZE = 8;
export const ATTACK_AA_ESCORTS = 2;

// Planning and the model share this eligibility set, even before starting cash arrives.
export function vehicleOptions(api, catalog, state) {
  const incomingMiners = state.queues.reduce((n,q)=>n+q.items.reduce((s,i)=>s+
    (catalog[i.name]?.harvester||catalog[i.name]?.refinery ? i.quantity : 0),0),0);
  const aaTarget = Math.min(3,Math.max(2,state.airThreatCount));
  return api.production.available(api.QueueType?.Vehicles ?? 3).flatMap(item=>{
    const r=catalog[item.name];
    if(!r||r.naval||r.engineer||catalog[r.deploysInto]?.yard)return [];
    const economic=r.harvester&&state.harvesters+incomingMiners<3;
    const combat=!r.harvester&&[r.weapon,r.secondary].some(w=>w?.damage>0&&w.range>=4);
    const antiAir=[r.weapon,r.secondary].some(w=>w?.damage>0&&w.aa);
    const groundPower=antiAir&&r.category==='AFV' ? effectiveness(r,
      [api.ArmorType?.Light??3,api.ArmorType?.Medium??4,api.ArmorType?.Heavy??5].map(armor=>({type:api.ObjectType.Vehicle,armor})),catalog,api):0;
    const airPower=antiAir ? effectiveness(r,
      [api.ArmorType?.None??0,api.ArmorType?.Light??3].map(armor=>({type:api.ObjectType.Aircraft,zone:api.ZoneType?.Air??1,armor})),catalog,api):0;
    const groundCore=groundPower>0&&groundPower>=airPower;
    if(!economic&&!combat)return [];
    if(combat&&state.airThreatCount>0&&state.mobileAntiAirCount<aaTarget&&!antiAir)return [];
    if(combat&&antiAir&&!groundCore&&state.mobileAntiAirCount>=aaTarget)return [];
    if(combat&&state.harvesters<2&&!state.baseUnderAttack)return [];
    if(economic&&state.baseUnderAttack&&state.mobileTankCount<5)return [];
    return [{...item,economic,antiAir}];
  });
}

// Reversible deployment selects one slot; ordinary dual-purpose units can use both.
export function activeWeapons(unit, catalog) {
  const rule = catalog[unit.name] ?? {};
  const slots = rule.deployer ? [unit.isDeployed ? 'secondary' : 'weapon'] : ['weapon', 'secondary'];
  return slots.map(slot => {
    const weapon = rule[slot], actual = slot === 'secondary' ? unit.secondaryWeapon : unit.primaryWeapon;
    if (!weapon && !actual) return undefined;
    return { ...weapon, ...(actual ? {
      aa: actual.aa ?? weapon?.aa, ag: actual.ag ?? weapon?.ag,
      range: actual.maxRange ?? actual.range ?? weapon?.range,
      minRange: actual.minRange ?? weapon?.minRange,
    } : {}) };
  }).filter(Boolean);
}

export function currentWeapon(unit, catalog) {
  return activeWeapons(unit, catalog)[0] ?? {};
}

export function canFireAt(api, catalog, attacker, target) {
  const weapons = activeWeapons(attacker, catalog).filter(w => weaponEffectiveness(w, [target], catalog, api) > 0);
  if (!weapons.length) return false;
  const actual = api.weaponVs?.(attacker.id, target.id, 'current');
  if (actual) return actual.inRange;
  const d = dist(attacker.tile, target.tile);
  return weapons.some(w => d <= (w.range ?? 0) && d >= (w.minRange ?? 0));
}

export function baseThreats(api, catalog, buildings, enemies) {
  const core = buildings.filter(b => !catalog[b.name]?.wall && !catalog[b.name]?.tickTank && !b.garrison);
  return enemies.filter(e => e.primaryWeapon && core.some(b =>
    weaponEffectiveness(currentWeapon(e, catalog), [b], catalog, api) > 0 &&
    (dist(e.tile, b.tile) < 18 || canFireAt(api, catalog, e, b))));
}

export function weaponEffectiveness(w, targets, catalog, api) {
  if (!w) return 0;
  const samples = targets.length ? targets : [{ type: api.ObjectType.Infantry }, { type: api.ObjectType.Vehicle }];
  return samples.reduce((sum, t) => {
    if (t.zone === (api.ZoneType?.Air ?? 1) ? !w.aa : w.ag === false) return sum;
    const armor = catalog[t.name]?.armor;
    const index = t.armor ?? Object.entries(api.ArmorType ?? {}).find(([k, v]) => /^\d+$/.test(k) && String(v).toLowerCase() === armor)?.[0]
      ?? (t.type === api.ObjectType.Infantry ? (api.ArmorType?.None ?? 0) : (api.ArmorType?.Heavy ?? 5));
    const verses = w.verses?.[index] ?? w.versus?.[index] ?? 1;
    return sum + (w.damage || 0) * verses * 15 / (w.rof || 30) * Math.max(0.5, (w.range || 4) / 5);
  }, 0) / samples.length;
}

export function effectiveness(rule, targets, catalog, api) {
  const weapons = [rule?.weapon, rule?.secondary].filter(Boolean);
  const samples = targets.length ? targets : [{ type: api.ObjectType.Infantry }, { type: api.ObjectType.Vehicle }];
  return samples.reduce((sum,t) => sum + Math.max(0,...weapons.map(w=>weaponEffectiveness(w,[t],catalog,api))),0)/samples.length;
}

export function infantryProfile(rule, api) {
  const infantry = [0,1,2].map(armor=>({type:api.ObjectType.Infantry,armor}));
  const armor = [3,4,5].map(armor=>({type:api.ObjectType.Vehicle,armor}));
  const normal = weaponEffectiveness(rule?.weapon,infantry,{},api);
  const deployed = rule?.deployer ? weaponEffectiveness(rule.secondary,infantry,{},api) : normal;
  const antiInfantry = Math.max(normal,deployed), antiArmor=effectiveness(rule,armor,{},api);
  return {normalInfantry:normal,deployedInfantry:deployed,antiInfantry,antiArmor,
    role:antiArmor>antiInfantry*1.25?'antiArmor':'antiInfantry'};
}

export function scoutScore(rule) {
  return rule && !rule.engineer && rule.category !== 'AirPower' && rule.speed > 0 && rule.cost > 0
    ? rule.speed / Math.sqrt(rule.cost) : 0;
}

const segmentDistance = (p,a,b) => {
  const dx=b.rx-a.rx,dy=b.ry-a.ry,l=dx*dx+dy*dy;
  const t=l?Math.max(0,Math.min(1,((p.rx-a.rx)*dx+(p.ry-a.ry)*dy)/l)):0;
  return Math.hypot(p.rx-a.rx-t*dx,p.ry-a.ry-t*dy);
};

export function trafficClearance(p, buildings, own, catalog) {
  const hubs=buildings.filter(b=>catalog[b.name]?.refinery||catalog[b.name]?.factory==='UnitType');
  if(hubs.some(b=>dist(p,b.tile)<6))return false;
  const refineries=buildings.filter(b=>catalog[b.name]?.refinery);
  for(const miner of own.filter(u=>catalog[u.name]?.harvester)) {
    const refinery=[...refineries].sort((a,b)=>dist(a.tile,miner.tile)-dist(b.tile,miner.tile))[0];
    if(refinery&&dist(refinery.tile,miner.tile)<30&&segmentDistance(p,refinery.tile,miner.tile)<3)return false;
  }
  return true;
}

export function chooseRallySite(api,catalog,own,base,preferred=base?.tile) {
  if(!base)return undefined;
  const buildings=own.filter(u=>u.type===api.ObjectType.Building);
  const points=[];
  for(let dx=-12;dx<=12;dx++)for(let dy=-12;dy<=12;dy++) {
    const p={rx:base.tile.rx+dx,ry:base.tile.ry+dy};
    if(Math.hypot(dx,dy)<6||Math.hypot(dx,dy)>14)continue;
    const tile=api.map.tile(p.rx,p.ry);
    if(!tile||![api.LandType?.Clear??0,api.LandType?.Road??1,api.LandType?.Rough??4].includes(tile.landType))continue;
    if(buildings.some(b=>dist(p,b.tile)<5)||!trafficClearance(p,buildings,own,catalog))continue;
    points.push({x:p.rx,y:p.ry,score:dist(p,preferred)+dist(p,base.tile)*.1+own.filter(u=>dist(p,u.tile)<3).length});
  }
  return points.sort((a,b)=>a.score-b.score)[0];
}

export function assessStrategy(api, catalog, snapshot, memory) {
  const { units, buildings, enemies, base } = snapshot.raw;
  const state = snapshot.state, tick = api.tick();
  const core = buildings.filter(b => !catalog[b.name]?.wall && !catalog[b.name]?.tickTank && !b.garrison);
  const threats = baseThreats(api, catalog, core, enemies);
  const defenders = units.filter(u => u.primaryWeapon && !catalog[u.name]?.harvester && base && dist(u.tile, base.tile) < 24);
  memory.pressure ??= { since: tick, lastThreatTick: -10000 };
  const history = memory.pressure;
  if (threats.length) {
    if (tick - history.lastThreatTick > 450) history.since = tick;
    history.lastThreatTick = tick;
    history.approach = { rx: threats.reduce((s, u) => s + u.tile.rx, 0) / threats.length,
      ry: threats.reduce((s, u) => s + u.tile.ry, 0) / threats.length };
  }
  const ownPower = defenders.reduce((s, u) => s + effectiveness(catalog[u.name], threats, catalog, api) * hp(u), 0);
  const enemyPower = threats.reduce((s, u) => s + effectiveness(catalog[u.name], defenders, catalog, api) * hp(u), 0);
  const underPressure = threats.length > 0;
  const sustained = underPressure && tick - history.since > 450;
  const suppressed = underPressure && (sustained || threats.length >= 3 && enemyPower > ownPower * 0.8);
  const critical = core.some(b => hp(b) < 0.35 && threats.some(e => dist(e.tile, b.tile) < 8));
  const approach = tick - history.lastThreatTick < 1800 ? history.approach : undefined;
  state.strategy = { underPressure, sustained, suppressed, critical,
    pressureTicks: underPressure ? tick - history.since : 0,
    localStrengthEstimate: Math.round(ownPower), enemyStrengthEstimate: Math.round(enemyPower),
    enemyMix: { infantry: threats.filter(u => u.type === api.ObjectType.Infantry && u.zone !== 1).length,
      vehicles: threats.filter(u => u.type === api.ObjectType.Vehicle && u.zone !== 1).length,
      air: threats.filter(u => u.zone === 1).length },
    approach, reserve: 0, investment: null,
    intent: critical ? '保住核心建筑，紧急反制' : suppressed ? '防御设施稳住阵地，预留科技突破' : '维持经济，推进科技与合成部队' };
  const guns = core.filter(b => catalog[b.name]?.isBaseDefense);
  state.strategy.rangeThreats = threats.filter(e => core.some(b => canFireAt(api, catalog, e, b)) &&
    !guns.some(b => canFireAt(api, catalog, b, e))).map(e => ({ id: e.id, name: e.name,
      range: currentWeapon(e, catalog).range ?? 0, x: e.tile.rx, y: e.tile.ry }));
  memory.strategy = state.strategy;
  return state.strategy;
}

export function chooseBuildingSite(api, catalog, name, own, memory, limit = 200, targets = []) {
  const buildings = own.filter(u => u.type === api.ObjectType.Building && !catalog[u.name]?.wall);
  const base = buildings.find(u => catalog[u.name]?.yard) ?? buildings[0];
  if (!base) return undefined;
  const r = catalog[name] ?? {}, approach = memory.strategy?.approach;
  const defense = r.isBaseDefense || r.wall;
  const vector = approach ? { x: approach.rx - base.tile.rx, y: approach.ry - base.tile.ry } : { x: 1, y: 1 };
  const length = Math.hypot(vector.x, vector.y) || 1;
  const offset = defense ? Math.min(6, length * 0.5) : -4;
  const desired = { rx: base.tile.rx + vector.x / length * offset, ry: base.tile.ry + vector.y / length * offset };
  const candidates = new Map();
  for (const anchor of buildings.slice(0, 12)) for (let dx = -10; dx <= 10; dx++) for (let dy = -10; dy <= 10; dy++) {
    const x = anchor.tile.rx + dx, y = anchor.tile.ry + dy;
    const tile = api.map.tile(x, y);
    if (!tile) continue;
    const p = { rx: x, ry: y };
    if (defense && targets.length && !targets.some(e =>
      weaponEffectiveness(r.weapon, [e], catalog, api) > 0 &&
      dist(p, e.tile) <= (r.weapon?.range ?? 0) && dist(p, e.tile) >= (r.weapon?.minRange ?? 0))) continue;
    // canPlace answers legality; spacing and access are ordinary player strategy.
    if (buildings.some(b => dist(p,b.tile) < (catalog[b.name]?.yard ? 4 : defense ? 3 : 4)) || !trafficClearance(p,buildings,own,catalog)) continue;
    if (r.wall && buildings.some(b => catalog[b.name]?.factory && dist(b.tile, p) < 4)) continue;
    let score = -dist(p, desired) - dist(p, base.tile) * 0.15;
    if (approach && defense) {
      const range = r.weapon?.range || 4, enemyDistance = dist(p, approach);
      score += enemyDistance <= range + 2 ? 6 : -Math.max(0, enemyDistance - range - 2);
      if (enemyDistance < 2) score -= 12;
    }
    candidates.set(`${x},${y}`, { x, y, score });
  }
  for (const p of [...candidates.values()].sort((a, b) => b.score - a.score).slice(0, limit))
    if (api.canPlace(name, p.x, p.y)) return { x: p.x, y: p.y };
  return undefined;
}

export function investmentGroups(api, catalog, snapshot, memory, groups) {
  if (!api.QueueType || !api.canPlace) return;
  const { units, buildings, enemies } = snapshot.raw, s = snapshot.state, strategy = s.strategy;
  const available = api.production.available();
  const ownNames = new Set(buildings.map(u => u.name));
  const queue = type => s.queues.find(q => q.type === type);
  const free = type => { const q = queue(type); return q && !q.size && q.maxSize !== 0; };
  const group = (id, instructions) => groups[id] ??= { instructions, criteria: { wait: 'Wait only if the offered investment is unnecessary or unaffordable.' }, actions: { wait: { type: 'wait' } } };
  const add = (g, item, purpose, minCredits, placement) => {
    const r = catalog[item.name], key = `produce_${item.name}`;
    g.criteria[key] = `${purpose}: ${r.label}; cost ${r.cost}, technology level ${r.techLevel ?? 0}, power ${r.power ?? 0}, weapon range ${r.weapon?.range ?? 0}.`;
    g.actions[key] = { type: 'produce', name: item.name, queue: item.queue, cost: r.cost, minCredits, placement };
  };
  // Replace generic wall-first choices with actual counter-weapons and a firing position.
  const dg = groups.defenses = { instructions: 'Counter attackers only with static weapons that can reach them from the supplied legal site. Compare enemy and friendly range: a shorter-range tower is not a counter to a standoff attacker. Use mobile interception or technology when no static counter can reach. Reserve power; walls do not solve a range disadvantage.', criteria: { wait: 'Wait when existing defenses cover the threat or when no effective defense can reach it.' }, actions: { wait: { type: 'wait' } } };
  const defenseUnits = buildings.filter(u => catalog[u.name]?.isBaseDefense && !catalog[u.name]?.wall);
  const attackers = baseThreats(api, catalog, buildings, enemies);
  const defenseTargets = strategy.underPressure ? attackers : [];
  const targetDefenses = strategy.underPressure ? (strategy.suppressed ? 6 : 3) : 1;
  let defensePlan, coverage = 0;
  if (s.harvesters >= (strategy.underPressure ? 1 : 2) && free(api.QueueType.Armory)) {
    const options = api.production.available(api.QueueType.Armory).filter(i => catalog[i.name]?.isBaseDefense && !catalog[i.name]?.wall)
      .map(i => ({ ...i, queue: api.QueueType.Armory, value: effectiveness(catalog[i.name], defenseTargets, catalog, api) }));
    coverage = defenseUnits.filter(u => defenseTargets.length
      ? defenseTargets.some(e => canFireAt(api, catalog, u, e))
      : effectiveness(catalog[u.name], [], catalog, api) > 0).length;
    if (coverage < targetDefenses && (defenseUnits.length < 8 || strategy.underPressure && coverage < 2)) for (const item of options.sort((a, b) => b.value / Math.sqrt(catalog[b.name].cost) - a.value / Math.sqrt(catalog[a.name].cost))) {
      if (Object.keys(dg.actions).length >= 3) break;
      if (item.value <= 0) continue;
      const r = catalog[item.name];
      if (r.power < 0 && (s.economy?.powerMargin ?? 0) < -r.power) continue;
      // A nearby short-range escort must not disguise an uncovered siege threat.
      if (defenseTargets.some(e => strategy.rangeThreats.some(t => t.id === e.id) &&
        weaponEffectiveness(r.weapon, [e], catalog, api) > 0 &&
        (currentWeapon(e, catalog).range ?? 0) > (r.weapon?.range ?? 0))) continue;
      const reachableThreats = defenseTargets.filter(e => weaponEffectiveness(r.weapon, [e], catalog, api) > 0 &&
        (r.weapon?.range ?? 0) >= (currentWeapon(e, catalog).range ?? 0));
      if (defenseTargets.length && !reachableThreats.length) continue;
      const placement = chooseBuildingSite(api, catalog, item.name, units, memory, 200, reachableThreats);
      if (!placement || s.self.credits < Math.min(200, r.cost)) continue;
      add(dg, item, `${strategy.underPressure ? 'URGENT' : 'PREPARE'}: counter-fire at (${placement.x},${placement.y}), estimated effectiveness ${Math.round(item.value)}; enemy ranges ${reachableThreats.map(e=>currentWeapon(e,catalog).range).join(',') || 'no local target'}`, Math.min(200, r.cost), placement);
      defensePlan ??= { name: item.name, cost: r.cost, queue: item.queue };
    }
    if (!strategy.underPressure && defenseUnits.length && s.uncommittedCredits > 1800 && buildings.filter(u => catalog[u.name]?.wall).length < 4) {
      const wall = api.production.available(api.QueueType.Armory).find(i => catalog[i.name]?.wall);
      if (wall) { const placement = chooseBuildingSite(api, catalog, wall.name, units, memory); if (placement) add(dg, { ...wall, queue: api.QueueType.Armory }, 'Screen a defended approach without blocking factory exits', catalog[wall.name].cost, placement); }
    }
  }
  const cg = group('construction', 'Restore core infrastructure, then unlock higher technology. During suppression, build a firing line and develop a counter instead of spending forever on basic tanks. Aircraft factories and higher-tech buildings unlock new options. A repair dock is not an airfield.');
  // Remove the old special-layer air-support guess and rebuild the tech options from rule categories.
  for (const [key, a] of Object.entries(cg.actions)) if (a.type === 'produce' && !catalog[a.name]?.naval && !catalog[a.name]?.refinery && !(catalog[a.name]?.power > 0) && !['InfantryType', 'UnitType', 'BuildingType'].includes(catalog[a.name]?.factory)) {
    delete cg.actions[key]; delete cg.criteria[key];
  }
  const armorCount = units.filter(u => u.type === api.ObjectType.Vehicle && catalog[u.name]?.category === 'AFV' && !catalog[u.name]?.harvester).length;
  const incomingMiners = s.queues.reduce((n, q) => n + q.items.reduce((sum, i) => sum + (catalog[i.name]?.harvester || catalog[i.name]?.refinery ? i.quantity : 0), 0), 0);
  const economyDeficit = Math.max(0, (s.economy?.targetMiners ?? 3) - s.harvesters - incomingMiners);
  const miner = economyDeficit && !strategy.underPressure && s.economy?.factories && free(api.QueueType.Vehicles)
    ? api.production.available(api.QueueType.Vehicles).find(i => catalog[i.name]?.harvester) : undefined;
  const economyPlan = miner && { name: miner.name, cost: catalog[miner.name].cost, queue: api.QueueType.Vehicles };
  if (economyPlan && s.self.credits >= Math.min(500, economyPlan.cost)) {
    add(groups.vehicles, { ...miner, queue: api.QueueType.Vehicles }, 'ECONOMY FIRST: complete the miner target before discretionary technology and army expansion', Math.min(500, economyPlan.cost));
  }
  const standoff = attackers.filter(e => strategy.rangeThreats.some(t => t.id === e.id));
  const mobileCount = units.filter(u => u.type === api.ObjectType.Vehicle && u.primaryWeapon && !catalog[u.name]?.harvester && !catalog[u.name]?.naval && catalog[u.name]?.category !== 'AirPower').length;
  const escortNeeded = s.airThreatCount>0 && s.mobileAntiAirCount<ATTACK_AA_ESCORTS;
  const incompleteForce = mobileCount<ATTACK_FORCE_SIZE || escortNeeded;
  const mobileDefenseNeeded = strategy.underPressure && incompleteForce;
  const forceNeeded = incompleteForce && s.harvesters >= 2 && !economyPlan;
  const groundRole = name => !catalog[name]?.naval && !catalog[name]?.aircraft && catalog[name]?.category !== 'AirPower';
  const mobileOptions = vehicleOptions(api,catalog,s).filter(i=>!i.economic && groundRole(i.name))
    .map(i=>({...i,cost:catalog[i.name].cost,queue:api.QueueType.Vehicles}));
  const counterTargets = standoff.length ? standoff : attackers;
  const counterPurpose = standoff.length ? 'counter_range' : 'counter_pressure';
  let counterPlan;
  if ((standoff.length || mobileDefenseNeeded) && s.harvesters && free(api.QueueType.Vehicles)) {
    const options = mobileOptions
      .map(a => ({ ...a, value: effectiveness(catalog[a.name], counterTargets, catalog, api) /
        Math.sqrt(catalog[a.name].cost) * ((catalog[a.name].weapon?.range ?? 0) >= Math.max(...counterTargets.map(e=>currentWeapon(e,catalog).range??0)) ? 1.75 : 1) }))
      .filter(a => a.value > 0).sort((a,b) => b.value-a.value);
    const counter = options[0];
    if (counter) {
      counterPlan = { name: counter.name, cost: counter.cost, queue: api.QueueType.Vehicles, category: 'vehicles', purpose: counterPurpose };
      if(s.self.credits>=Math.min(250,counter.cost)) add(groups.vehicles, counter, standoff.length ? 'RANGE COUNTER: intercept exposed base attackers with a mobile counter; close the range gap or return fire at equal range' : 'MOBILE DEFENSE: build the missing mobile response; static guns cannot follow flanking attackers', Math.min(250, counter.cost));
    }
  }
  let forcePlan;
  if(forceNeeded&&!counterPlan&&free(api.QueueType.Vehicles)) {
    const localTargets=attackers.filter(e=>e.zone!==(api.ZoneType?.Air??1));
    const fortifications=armorCount>=4 ? enemies.filter(e=>e.type===api.ObjectType.Building &&
      catalog[e.name]?.isBaseDefense && activeWeapons(e,catalog).some(w=>w.damage>0&&w.ag!==false)) : [];
    const targets=localTargets.length ? localTargets : fortifications;
    const siege=targets===fortifications&&fortifications.length>0;
    const enemyRange=Math.max(0,...fortifications.flatMap(e=>activeWeapons(e,catalog)
      .filter(w=>w.damage>0&&w.ag!==false).map(w=>w.range??0)));
    const item=mobileOptions.map(i=>{
      const rule=catalog[i.name],range=Math.max(0,...[rule.weapon,rule.secondary]
        .filter(w=>w&&w.ag!==false&&weaponEffectiveness(w,targets,catalog,api)>0).map(w=>w.range??0));
      return {...i,value:effectiveness(rule,targets,catalog,api)/Math.sqrt(i.cost)*(siege&&range>enemyRange?1.75:1)};
    })
      .filter(i=>i.value>0).sort((a,b)=>b.value-a.value)[0];
    if(item) {
      forcePlan={name:item.name,cost:item.cost,queue:item.queue,category:'vehicles',purpose:'mobilize',...(siege?{targetRole:'fortifications'}:{})};
      if(s.self.credits>=Math.min(250,item.cost)) add(groups.vehicles,item,`FORM THE ATTACK FORCE: ${mobileCount}/${ATTACK_FORCE_SIZE} mobile combat vehicles; ${escortNeeded?`only ${s.mobileAntiAirCount}/${ATTACK_AA_ESCORTS} required anti-air escorts against observed air threats; `:''}${siege?'counter the visible enemy fortifications using building armor and weapon range; ':''}complete the group before more discretionary towers or technology`,Math.min(250,item.cost));
    }
  }
  const queuedCounter = (strategy.underPressure||forceNeeded) && queue(api.QueueType.Vehicles)?.items.find(i=>groundRole(i.name) && !catalog[i.name]?.harvester && catalog[i.name]?.weapon?.damage>0);
  if (!counterPlan && queuedCounter) counterPlan = { name:queuedCounter.name,
    cost:Math.max(0,queuedCounter.creditsEach*queuedCounter.quantity-queuedCounter.creditsSpent),
    queue:api.QueueType.Vehicles,category:'vehicles',purpose:strategy.underPressure?counterPurpose:'mobilize',pending:true };
  const coreReady = !economyPlan && !forcePlan && !((mobileDefenseNeeded||forceNeeded) && counterPlan) && s.harvesters >= 2 && s.economy?.factories > 0 && (armorCount >= 4 || strategy.suppressed && coverage >= 2 || standoff.length > 0);
  const candidates = available.filter(i => i.type === api.ObjectType.Building && !ownNames.has(i.name))
    .filter(i => { const r = catalog[i.name]; return r && !r.naval && !r.yard && !r.refinery && !r.isBaseDefense && !r.wall && !(r.power > 0) && (isAirSupport(r) || r.buildCategory === 'Tech' && !r.factory); })
    .sort((a, b) => Number(isAirSupport(catalog[b.name])) - Number(isAirSupport(catalog[a.name])) || (catalog[b.name].techLevel ?? 0) - (catalog[a.name].techLevel ?? 0));
  let techPlan;
  if (coreReady && free(api.QueueType.Structures) && !strategy.critical) {
    const item = candidates[0];
    if (item) {
      const r = catalog[item.name];
      techPlan = { name: item.name, cost: r.cost, queue: api.QueueType.Structures };
      if ((s.economy.powerMargin ?? 0) >= Math.max(0, -r.power) && s.self.credits >= Math.min(600, r.cost)) {
        add(cg, { ...item, queue: api.QueueType.Structures }, `${strategy.suppressed ? 'BREAK THE STALEMATE' : 'TECH ADVANCE'}: unlock stronger units, support and defenses; prerequisites ${r.prerequisite?.join(',') || 'already met'}`, Math.min(600, r.cost));
        cg.instructions += ' Prioritize the offered TECH ADVANCE/BREAK THE STALEMATE before duplicating a vehicle factory.';
      } else if ((s.economy.powerMargin ?? 0) < Math.max(0, -r.power)) {
        const power = api.production.available(api.QueueType.Structures).filter(i => catalog[i.name]?.power > 0).sort((a,b) => catalog[a.name].cost-catalog[b.name].cost)[0];
        if (power && s.self.credits >= 300) { techPlan = { name: power.name, cost: catalog[power.name].cost, queue: api.QueueType.Structures }; add(cg, {...power, queue:api.QueueType.Structures}, 'POWER FOR TECH: supply the planned technology and defenses',300); }
      }
    }
  }
  const urgentDefense = strategy.underPressure && coverage < (strategy.critical ? 6 : 2) && defensePlan;
  const mobileFirst = defenseUnits.length >= 2 && (counterPlan || forcePlan);
  const plan = mobileFirst || urgentDefense || counterPlan || economyPlan || forcePlan || techPlan || defensePlan;
  strategy.investment = plan;
  strategy.reserve = plan ? plan.cost + (strategy.critical ? 0 : 250) : 0;
  strategy.hasAirSupport = buildings.some(u => isAirSupport(catalog[u.name]));
  strategy.techChoices = candidates.map(i => i.name);
  strategy.economyDeficit = economyDeficit;
  strategy.escortDeficit = escortNeeded ? ATTACK_AA_ESCORTS-s.mobileAntiAirCount : 0;
  if (economyPlan) strategy.intent = '补足矿车，支撑科技、扩军和海军发展';
  if (plan === counterPlan && counterPlan) strategy.intent = standoff.length ? '机动部队接敌，反制射程外攻击基地的敌人' : '补足机动防守部队，阻止敌军绕过固定炮塔';
  if (plan?.purpose === 'mobilize') strategy.intent = `${plan.targetRole==='fortifications'?'补充攻坚反制':'补齐可出击编队'}：${mobileCount}/${ATTACK_FORCE_SIZE} 辆机动作战单位`;
  if (plan?.purpose === 'mobilize' && escortNeeded) strategy.intent = `补齐随军防空：${s.mobileAntiAirCount}/${ATTACK_AA_ESCORTS}，满足出击条件`;
  memory.strategy = strategy;
  // The separate choice groups share one wallet. Protect the chosen capital budget.
  for (const [id, g] of Object.entries(groups)) for (const [key, a] of Object.entries(g.actions)) {
    if (a.type !== 'produce' || a.name === plan?.name) continue;
    const r = catalog[a.name] ?? {};
    // One queue cannot build the reserved ground reinforcement and an optional
    // helicopter/carrier simultaneously, even when both are affordable.
    if (['mobilize','counter_range','counter_pressure'].includes(plan?.purpose) && a.queue === plan.queue) {
      delete g.actions[key]; delete g.criteria[key]; continue;
    }
    const essential = id === 'construction' && (r.power > 0 || r.refinery && !s.economy.refineries || r.factory === 'UnitType' && !r.naval && !s.economy.factories);
    if (!essential && s.uncommittedCredits - a.cost < strategy.reserve) { delete g.actions[key]; delete g.criteria[key]; }
  }
  // Explain upgraded unit advantages to the model using current target armor, range and rules.
  for (const id of ['vehicles', 'infantry', 'aircraft', 'navy']) {
    const g = groups[id]; if (!g) continue;
    g.instructions += ' Compare effective damage against the current enemy mix, range and technology level. Use newly unlocked counters instead of repeating the cheapest basic unit.';
    for (const [key,a] of Object.entries(g.actions)) if (a.type === 'produce') g.criteria[key] += ` Tech ${catalog[a.name]?.techLevel ?? 0}; estimated current-target effectiveness ${Math.round(effectiveness(catalog[a.name], enemies, catalog, api))}.`;
  }
  if (groups.vehicles && s.harvesters >= 2 && armorCount < 4 && !strategy.investment) {
    groups.vehicles.instructions += ' URGENT: the base has fewer than four mobile armored units. Build the offered combat reinforcement now when affordable; do not wait for an unplanned future technology investment.';
    groups.vehicles.criteria.wait = 'Wait only while the queue is busy or none of these reinforcements is affordable. There is no reserved capital project now; an idle affordable queue leaves the base exposed.';
  }
  recoveryGroups(api, catalog, snapshot, groups);
  operationalGoals(api, catalog, snapshot, groups);
}

function operationalGoals(api, catalog, snapshot, groups) {
  const { units } = snapshot.raw, s = snapshot.state;
  const ground = units.filter(u => u.type === api.ObjectType.Vehicle && u.primaryWeapon && !catalog[u.name]?.harvester && !catalog[u.name]?.naval && catalog[u.name]?.category !== 'AirPower');
  const aircraft = units.filter(u => catalog[u.name]?.aircraft && u.type !== api.ObjectType.Building);
  const target = Math.min(24, Math.max(12, Math.ceil((s.nearbyEnemyCount ?? 0) * 1.5)));
  s.objective = 'Win this skirmish by finding and destroying the enemy base, not merely surviving near our own base.';
  s.forceGoal = { groundCombatVehicles: { current:ground.length, target }, aircraft:{current:aircraft.length,target:4},
    attackThreshold:ATTACK_FORCE_SIZE, mobileAntiAir:{current:s.mobileAntiAirCount,attackMinimum:s.airThreatCount>0?ATTACK_AA_ESCORTS:0},
    enemyBaseKnown:!!s.knownEnemyBuildings?.length, reserve:s.strategy.reserve };
  s.decisionReadiness = {};
  for (const [id, queueType, current, desired] of [
    ['vehicles',api.QueueType.Vehicles,ground.length,target],['aircraft',api.QueueType.Aircrafts,aircraft.length,4],
  ]) {
    const g=groups[id]; if (!g) continue;
    const q=s.queues.find(q=>q.type===queueType);
    const candidates=Object.values(g.actions).filter(a=>a.type==='produce');
    const affordable=candidates.filter(a=>s.uncommittedCredits-a.cost>=s.strategy.reserve);
    const needed=current<desired;
    if (id === 'vehicles' && ['counter_range','counter_pressure','mobilize'].includes(s.strategy.investment?.purpose)) {
      const plan = s.strategy.investment;
      s.decisionReadiness[id] = { queueIdle: !q?.size, priority: plan.purpose, target: plan.name,
        minimumStartingCredits: Math.min(250, plan.cost), waitingSupported: !!q?.size || s.self.credits < Math.min(250,plan.cost) };
      g.instructions += ` MOBILE COUNTER FIRST: ${plan.name} is the reserved investment. Complete the ${ATTACK_FORCE_SIZE}-vehicle force and, when air threats are visible, at least ${ATTACK_AA_ESCORTS} mobile anti-air escorts so it can defend and then attack. Static guns cannot pursue flanking troops. Start it at the supplied minimum budget; protect any counter already in production and do not divert this reserve to more towers or technology.`;
      g.criteria.wait = 'Wait only if the counter is queued, unavailable, or its minimum starting credits are missing.';
      continue;
    }
    if (id === 'vehicles' && catalog[s.strategy.investment?.name]?.harvester) {
      const plan = s.strategy.investment;
      s.decisionReadiness[id] = { queueIdle: !q?.size, current: s.harvesters, target: s.economy?.targetMiners ?? 3,
        deficit: s.strategy.economyDeficit, priority: 'economy', affordableCandidates: candidates.filter(a => a.name === plan.name && s.uncommittedCredits >= a.cost).map(a => a.name),
        waitingSupported: !!q?.size || !candidates.some(a => a.name === plan.name) };
      g.instructions += ` ECONOMY FIRST: ${s.harvesters} miners are present; the target is ${s.economy?.targetMiners ?? 3}. The reserved investment is ${plan.name}, not a combat unit. Produce the offered miner now; defer discretionary army expansion until this economic deficit is filled.`;
      g.criteria.wait = 'Wait only if the miner is already queued or unavailable, or its minimum starting budget is unavailable. Do not reserve this miner budget forever without starting the miner.';
      continue;
    }
    const blocked=s.strategy.recovery || s.harvesters<2 || q?.size>0 || !affordable.length;
    s.decisionReadiness[id]={queueIdle:!q?.size,current,target:desired,deficit:Math.max(0,desired-current),
      credits:s.self.credits,committedCredits:s.committedCredits,reserve:s.strategy.reserve,
      affordableCandidates:affordable.map(a=>a.name),waitingSupported:!needed||!!blocked};
    if (!needed || blocked) continue;
    g.instructions += id==='vehicles'
      ? ` Choose the next vehicle to win by destroying the enemy base. Our attack force target is ${desired} ground combat vehicles, but only ${current} are present. The factory is idle and the listed affordableCandidates can be paid for after preserving ${s.strategy.reserve} credits for capital projects. Build a useful combat vehicle now to reach the force target. Prefer effective newly unlocked weapons and range; keep anti-air escorts. Waiting has no benefit while the army is below target and funds are plentiful.`
      : ` Prepare a ${desired}-aircraft wing for scouting and concentrated strikes to find and destroy the enemy base. Only ${current} aircraft exist; the queue is idle and production is affordable after reservations. Build an offered aircraft now, even when enemies are out of sight. Use ready aircraft to scout or strike, and let empty aircraft rearm.`;
    g.criteria.wait=`Wait only if the queue is busy, no useful unit is affordable after the ${s.strategy.reserve}-credit reservation, or the ${desired}-unit force is already assembled. Current count ${current}, uncommitted credits ${s.uncommittedCredits}.`;
    for(const [key,a] of Object.entries(g.actions)) if(a.type==='produce' && !catalog[a.name]?.harvester)g.criteria[key]+=` Build-up deficit: ${desired-current}; this production advances the winning force, even without a currently visible enemy.`;
  }
}

function recoveryGroups(api, catalog, snapshot, groups) {
  const { units, buildings } = snapshot.raw, s = snapshot.state;
  const hasYard = buildings.some(u => catalog[u.name]?.yard);
  const refineryCount = buildings.filter(u => catalog[u.name]?.refinery).length;
  const miners = units.filter(u => catalog[u.name]?.harvester).length;
  if (hasYard && refineryCount && miners || !buildings.length) return;
  const builder = units.find(u => catalog[catalog[u.name]?.deploysInto]?.yard);
  const miner = refineryCount && !miners && api.production.available(api.QueueType.Vehicles).find(i => catalog[i.name]?.harvester);
  if (!hasYard && builder && !miner) return;
  const queue = miner ? api.QueueType.Vehicles : hasYard ? api.QueueType.Structures : api.QueueType.Vehicles;
  const candidate = miner || api.production.available(queue).find(i => hasYard ? catalog[i.name]?.refinery : catalog[catalog[i.name]?.deploysInto]?.yard);
  if (!candidate) return;
  const r = catalog[candidate.name];
  const category = queue === api.QueueType.Structures ? 'construction' : 'vehicles';
  const targetQueue = s.queues.find(q=>q.type===queue);
  const pending = targetQueue?.items.find(i=>i.name===candidate.name);
  const required = pending ? Math.max(0,pending.creditsEach-pending.creditsSpent) : r.cost;
  s.strategy.intent = miner ? '恢复矿车，解除收入中断' : hasYard ? '恢复矿场，解除收入中断' : '重建基地车，恢复建造能力';
  s.strategy.recovery = true;
  s.strategy.investment = {name:candidate.name,cost:required,queue,category};
  s.strategy.reserve = required;
  for (const g of Object.values(groups)) for (const [key,a] of Object.entries(g.actions)) if (a.type==='produce' && a.name!==candidate.name) {
    delete g.actions[key]; delete g.criteria[key];
  }
  if (!targetQueue?.size && s.self.credits >= Math.min(500,required)) {
    const key=`recover_${candidate.name}`;
    groups[category].criteria[key]=`SURVIVAL: rebuild ${r.label} to restore ${miner || hasYard?'ore income':'construction'}. Cost ${r.cost}; stop discretionary investment until recovery completes.`;
    groups[category].actions[key]={type:'produce',name:candidate.name,queue,cost:r.cost,minCredits:Math.min(500,required)};
  }
  if (s.self.credits >= required) return;
  const g=groups.salvage ??= {instructions:'Recover a destroyed economy or construction capability. Cancel discretionary spending and sell expendable technology to fund recovery. Preserve the factory and all prerequisites needed to rebuild.',criteria:{wait:'Wait only when no safe liquidation is available.'},actions:{wait:{type:'wait'}}};
  g.instructions='URGENT ECONOMIC RECOVERY: income or construction is gone and recovery is underfunded. Cancel optional spending or sell a nonessential technology building. Keeping unused high technology without a functioning miner-and-refinery chain will lose the match. Preserve recovery prerequisites.';
  for (const q of s.queues) for (const item of q.items) if (item.name!==candidate.name && item.creditsSpent>0) {
    const key=`cancel_${item.name}`;
    g.criteria[key]=`Cancel ${item.name}, releasing its ${item.creditsSpent} paid credits to fund ${candidate.name}.`;
    g.actions[key]={type:'cancel',name:item.name,queue:q.type};
  }
  for (const b of buildings) {
    const rule=catalog[b.name];
    if (!rule || rule.unsellable || rule.yard || rule.refinery || rule.power>0 || rule.factory==='UnitType' || r.prerequisite?.includes(b.name) || b.garrison?.count) continue;
    const key=`recover_sell_${b.id}`;
    g.criteria[key]=`Sell expendable ${rule.label} #${b.id} to finance ${candidate.name}; original cost ${rule.cost}.`;
    g.actions[key]={type:'sell',objectId:b.id};
  }
}
