import { specialGroups, executeSpecial, rememberSpecial, maintainSpecial } from "./werhd-jev-special.mjs?v=8.8.15";
import { assessStrategy, investmentGroups, chooseBuildingSite, chooseRallySite, weaponEffectiveness, effectiveness, infantryProfile, scoutScore, currentWeapon as combatWeapon, activeWeapons, canFireAt, baseThreats, ATTACK_FORCE_SIZE, ATTACK_AA_ESCORTS, vehicleOptions } from "./werhd-jev-strategy.mjs?v=8.8.15";
import { updateCamera } from "./werhd-jev-camera.mjs?v=8.8.15";
import { refreshCatalog } from "./werhd-jev-catalog.mjs";
// Ordinary page-side player: every observation and command uses window.werhd.
// Start the local adapter, then import its /player.mjs from the game console.
export const DEFAULT_BRIDGE = "http://127.0.0.1:5174";
const distance = (a, b) => Math.hypot(a.rx - b.rx, a.ry - b.ry);
const round = (value) => Math.round(value * 100) / 100;

// Score the weapon actually active in this posture, not a generic target-type bonus.
// Mission preference is deliberately small so it cannot erase armor/air matchups.
export function combatTargetScore(api, catalog, unit, target, missionTargetId) {
  const power = Math.max(0, ...activeWeapons(unit, catalog)
    .map(w => weaponEffectiveness(w, [target], catalog, api)));
  if (!power) return 0;
  const armed = activeWeapons(target, catalog).some(w => w.damage > 0);
  const air = target.zone === (api.ZoneType?.Air ?? 1);
  return power / Math.sqrt(Math.max(1, target.hitPoints ?? 100)) *
    (armed ? 1.5 : 1) * (air ? 2 : 1) *
    (target.id === missionTargetId ? 1.1 : 1) /
    (1 + distance(unit.tile, target.tile) / 20);
}

export function collectState(api, catalog) {
  refreshCatalog(api, catalog);
  const units = api.units("self");
  const enemies = api.units("enemy");
  const inventory = {};
  for (const unit of units) {
    const rule = catalog[unit.name] ?? {};
    inventory[unit.name] ??= {
      name: rule.label ?? unit.name,
      count: 0,
      role: roleOf(rule),
    };
    inventory[unit.name].count++;
  }
  const buildings = units.filter((u) => u.type === api.ObjectType.Building);
  const army = units.filter(
    (u) =>
      u.type !== api.ObjectType.Building &&
      u.primaryWeapon &&
      !catalog[u.name]?.harvester &&
      !catalog[u.name]?.engineer &&
      !catalog[catalog[u.name]?.deploysInto]?.yard,
  );
  const base =
    buildings.find((u) => catalog[u.name]?.yard) ?? buildings[0] ?? units[0];
  const nearby = enemies.filter(
    (enemy) => base && distance(base.tile, enemy.tile) < 22,
  );
  const unitSummary = (u) => ({
    id: u.id,
    name: catalog[u.name]?.label ?? u.name,
    kind: u.name,
    hp: u.hitPoints,
    hpFraction: round((u.hitPoints ?? 0) / (u.maxHitPoints || 1)),
    tile: { x: u.tile.rx, y: u.tile.ry },
    idle: u.isIdle,
    canDeploy: u.canDeploy,
    isDeployed: u.isDeployed,
    zone: u.zone,
  });
  const queues = api.production.queues();
  const committedCredits = queues.reduce(
    (sum, q) =>
      sum +
      q.items.reduce(
        (subtotal, item) =>
          subtotal +
          Math.max(0, item.creditsEach * item.quantity - item.creditsSpent),
        0,
      ),
    0,
  );
  return {
    raw: { units, enemies, buildings, army, base },
    state: {
      tick: api.tick(),
      gameSeconds: round(api.time()),
      self: api.me(),
      inventory,
      base: base ? { x: base.tile.rx, y: base.tile.ry } : null,
      ownArmyCount: army.length,
      deployedCombatCount: army.filter((u) => u.isDeployed).length,
      antiAirCount: army.filter((u) => activeWeapons(u, catalog).some(w=>w.aa)).length,
      harvesters: units.filter((u) => catalog[u.name]?.harvester).length,
      baseUnderAttack: baseThreats(api, catalog, buildings, enemies).length > 0,
      visibleEnemyCount: enemies.length,
      visibleEnemies: enemies.slice(0, 24).map(unitSummary),
      army: army.slice(0, 24).map(unitSummary),
      queues,
      committedCredits,
      uncommittedCredits: Math.max(0, stateCredits(api) - committedCredits),
      mobileTankCount: army.filter((u) => catalog[u.name]?.category === "AFV")
        .length,
      averageArmyHealth: army.length
        ? round(
            army.reduce(
              (n, u) => n + (u.hitPoints ?? 0) / (u.maxHitPoints || 1),
              0,
            ) / army.length,
          )
        : 1,
      nearbyEnemyCount: nearby.length,
    },
  };
}

function stateCredits(api) {
  return api.me().credits;
}

function roleOf(rule) {
  if (rule.yard) return "construction yard";
  if (rule.refinery) return "ore refinery; supplies a free miner";
  if (rule.harvester) return "ore miner";
  if (rule.power > 0) return "power producer";
  if (rule.factory) return `factory: ${rule.factory}`;
  return rule.category ?? "support or technology";
}

export function frontierPoints(api, base, memory) {
  const size = api.map.size();
  const points = [];
  const now = api.tick();
  for (let x = 2; x < size.width; x += 3)
    for (let y = 2; y < size.height; y += 3) {
      const tile = api.map.tile(x, y);
      if (!tile || [2, 7].includes(tile.landType)) continue;
      if (
        [...memory.frontiers.entries()].some(([key, t]) => {
          const [vx, vy] = key.split(",").map(Number);
          return now - t < 1800 && Math.hypot(x - vx, y - vy) < 7;
        })
      )
        continue;
      let fog = 0;
      for (const [dx, dy] of [
        [7, 0],
        [-7, 0],
        [0, 7],
        [0, -7],
        [5, 5],
        [-5, -5],
        [5, -5],
        [-5, 5],
      ]) {
        if (
          x + dx >= 0 &&
          y + dy >= 0 &&
          x + dx < size.width &&
          y + dy < size.height &&
          !api.map.visible(x + dx, y + dy)
        )
          fog++;
      }
      if (!fog) continue;
      const vx = size.width / 2 - (base?.tile.rx ?? size.width / 2),
        vy = size.height / 2 - (base?.tile.ry ?? size.height / 2),
        norm = Math.hypot(vx, vy) || 1;
      const forward = base
        ? ((x - base.tile.rx) * vx + (y - base.tile.ry) * vy) / norm
        : 0;
      const lateral = base
        ? Math.abs((x - base.tile.rx) * vy - (y - base.tile.ry) * vx) / norm
        : 0;
      points.push({
        x,
        y,
        fog,
        score: fog * 3 + forward * 0.8 - lateral * 0.3,
      });
    }
  points.sort((a, b) => b.score - a.score);
  const distinct = [];
  for (const p of points)
    if (distinct.every((q) => Math.hypot(p.x - q.x, p.y - q.y) > 10)) {
      distinct.push(p);
      if (distinct.length === 3) break;
    }
  return distinct;
}

export function candidateGroups(api, catalog, snapshot, memory) {
  const { units, buildings, army: allArmy, enemies, base } = snapshot.raw,
    state = snapshot.state;
  const army = allArmy.filter((u) => !catalog[u.name]?.naval && !catalog[u.name]?.aircraft && api.tick() - (memory.specialOrders?.get(u.id)?.tick ?? -10000) > 450);
  memory.frontiers ??= new Map();
  memory.enemyBuildings ??= new Map();
  const groups = {};
  function group(id, instructions) {
    const g = {
      instructions,
      criteria: {
        wait: "No useful action is needed in this category, or insufficient funds. Keep the current mission. Do not wait when a supplied urgent action is affordable.",
      },
      actions: { wait: { type: "wait" } },
    };
    groups[id] = g;
    return (key, label, action) => {
      g.criteria[key] = label;
      g.actions[key] = action;
    };
  }
  const owned = (test) =>
    units.filter((u) => test(catalog[u.name] ?? {})).length;
  const refineries = owned((r) => r.refinery),
    miners = state.harvesters;
  const barracks = owned((r) => r.factory === "InfantryType"),
    factories = owned((r) => r.factory === "UnitType" && !r.naval);
  const powerMargin =
    (state.self.power?.total ?? 0) - (state.self.power?.drain ?? 0);
  state.economy = {
    refineries,
    miners,
    targetMiners: 3,
    barracks,
    factories,
    powerMargin,
  };
  assessStrategy(api, catalog, snapshot, memory);
  state.airThreatCount = enemies.filter((u) => u.zone === 1).length;
  state.antiAirCount = army.filter((u) => activeWeapons(u, catalog).some(w=>w.aa)).length;
  state.mobileAntiAirCount = army.filter(u=>u.type===api.ObjectType.Vehicle&&!catalog[u.name]?.naval&&catalog[u.name]?.category!=='AirPower'&&activeWeapons(u,catalog).some(w=>w.aa)).length;
  state.mission = memory.mission?.label ?? "待命";
  state.activeMission = memory.mission
    ? {
        mode: memory.mission.mode,
        x: memory.mission.x,
        y: memory.mission.y,
        ageTicks: api.tick() - memory.mission.since,
      }
    : null;
  const build = group(
    "construction",
    "Choose the needed base investment. Establish power, refinery, barracks, vehicle factory, then 2 refineries and 3 ore miners for continuous tank production. Restore lost essential infrastructure immediately. Keep at least 50 spare power. Unlock technology and counter-weapons before duplicating the vehicle factory; a second factory is useful only with surplus income. Only proposed buildings currently contribute to these needs.",
  );
  const mcv = units.find((u) => catalog[catalog[u.name]?.deploysInto]?.yard);
  if (mcv)
    build(
      "deploy_base",
      "URGENT: deploy the construction vehicle so the base can start.",
      { type: "deploy", ids: [mcv.id] },
    );
  const queueOf = (type) => state.queues.find((q) => q.type === type);
  const constructionType = api.QueueType?.Structures ?? 0;
  if (!queueOf(constructionType)?.size)
    for (const item of api.production.available(constructionType)) {
      const r = catalog[item.name];
      if (!r || r.naval) continue;
      let need = false;
      if (powerMargin < 50 || !buildings.length) need = r.power > 0;
      else if (!refineries) need = r.refinery;
      else if (!barracks) need = r.factory === "InfantryType";
      else if (!factories) need = r.factory === "UnitType";
      else if (refineries < 2 && miners < 3) need = r.refinery;
      else if (state.self.credits > 6000 && factories < 2)
        need = r.factory === "UnitType";
      if (need && state.self.credits >= Math.min(500, r.cost))
        build(
          `produce_${item.name}`,
          `Build ${r.label}; cost ${r.cost}; ${roleOf(r)}. Needed now by our development plan.`,
          {
            type: "produce",
            name: item.name,
            queue: constructionType,
            cost: r.cost,
            minCredits: Math.min(500, r.cost),
          },
        );
    }
  groups.construction.criteria.wait =
    "The construction queue is already occupied, or credits are below the cost of every offered building. Neither infrastructure recovery nor production expansion is affordable.";
  const vehicleType = api.QueueType?.Vehicles ?? 3;
  const train = group(
    "vehicles",
    "Choose what the vehicle factory should produce next. Three ore miners are the economy target. Before there are 3 miners, buy a miner unless the base is under attack and needs a tank. After 3 miners, produce effective counters while preserving the strategy investment budget. Maintain 2 mobile anti-air escorts after 4 tanks, even before spotting aircraft. Use mobileAntiAirCount: deployed infantry guarding the base are not mobile escorts. URGENT: when airThreatCount is positive and mobileAntiAirCount is below 3, build mobile anti-air first; tanks cannot hit flying enemies. A completed queue should be refilled while affordable. Saving for the selected defensive or technology investment is intentional.",
  );
  if (!queueOf(vehicleType)?.size && factories)
    for (const item of vehicleOptions(api,catalog,state)) {
      const r = catalog[item.name], { economic, antiAir } = item;
      if (state.self.credits < Math.min(250, r.cost)) continue;
      train(
        `produce_${item.name}`,
        `${economic ? "ECONOMY" : antiAir ? "ANTI-AIR" : "ARMY"}: produce ${r.label}; cost ${r.cost}; currently owned ${state.inventory[item.name]?.count ?? 0}; weapons ${[r.weapon,r.secondary].filter(w=>w?.damage>0).map(w=>`damage ${w.damage}, range ${w.range}, air ${!!w.aa}, ground ${w.ag!==false}`).join("; ")}. ${economic ? "Needed to reach 3 miners." : "Reinforce the tank army."}`,
        {
          type: "produce",
          name: item.name,
          queue: vehicleType,
          cost: r.cost,
          minCredits: Math.min(250, r.cost),
        },
      );
    }
  groups.vehicles.criteria.wait =
    "Vehicle production is already busy or credits are below all offered vehicle costs. If idle and affordable, strengthen the armored force or add its missing anti-air escort.";
  const infantryType = api.QueueType?.Infantry ?? 2;
  const footCount = army.filter(
    (u) => u.type === api.ObjectType.Infantry,
  ).length;
  const infantryOffers=api.production.available(infantryType).filter(i=>catalog[i.name]&&!catalog[i.name].engineer);
  const preferredScout=[...infantryOffers].filter(i=>catalog[i.name].weapon?.damage>0)
    .sort((a,b)=>scoutScore(catalog[b.name])-scoutScore(catalog[a.name]))[0];
  const scoutUnits=army.filter(u=>u.type===api.ObjectType.Infantry).sort((a,b)=>scoutScore(catalog[b.name])-scoutScore(catalog[a.name]));
  const bestScout=scoutUnits[0];
  if(bestScout)memory.scoutId=bestScout.id;
  const needsScout=!memory.enemyBuildings.size&&!state.baseUnderAttack&&preferredScout&&
    !scoutUnits.some(u=>u.name===preferredScout.name)&&!state.queues.some(q=>q.items.some(i=>i.name===preferredScout.name));
  const roles={antiInfantry:0,antiArmor:0};
  for(const u of scoutUnits)if(u.id!==memory.scoutId&&catalog[u.name]?.weapon?.range>=3)roles[infantryProfile(catalog[u.name],api).role]++;
  state.infantryRoles={...roles,targetAntiInfantry:3,targetAntiArmor:state.airThreatCount>0?3:2,preferredScout:preferredScout?.name,needsScout:!!needsScout};
  const foot = group(
    "infantry",
    "Choose infantry by role and cost effectiveness: maintain anti-infantry firepower plus limited anti-armor/anti-air support, not six copies of one specialist. Read the armor-adjusted normal/deployed scores; higher tech and raw damage do not imply better anti-infantry performance. Before the enemy base is found, train one affordable fast scout identified by speed and cost (often a dog); keep it mobile. Preserve funds for miners and tanks.",
  );
  if (
    !queueOf(infantryType)?.size &&
    barracks &&
    (footCount < 6 || needsScout) &&
    (footCount < 1 || state.self.credits > 1000 || needsScout && state.self.credits >= catalog[preferredScout.name].cost)
  )
    for (const item of infantryOffers) {
      const r = catalog[item.name];
      const isScout=needsScout&&item.name===preferredScout.name;
      const profile=infantryProfile(r,api);
      if (
        !r ||
        r.engineer ||
        r.cost > 1500 ||
        r.weapon?.damage <= 0 ||
        (!isScout && (r.weapon?.range < 3 || roles[profile.role] >= (profile.role==='antiInfantry'?3:state.infantryRoles.targetAntiArmor))) ||
        r.cost > state.self.credits
      )
        continue;
      foot(
        `produce_${item.name}`,
        `${isScout?'SCOUT FIRST: one fast expendable scout to locate the enemy base':'COMBAT ROLE: '+profile.role}. Produce ${r.label}, cost ${r.cost}; speed ${r.speed??0}; current role counts ${JSON.stringify(roles)}. Armor-adjusted anti-infantry score normal ${round(profile.normalInfantry)}, deployed ${round(profile.deployedInfantry)}; best anti-armor ${round(profile.antiArmor)}. Anti-infantry score per 100 credits ${round(profile.antiInfantry/r.cost*100)}. Deployment can reduce damage against infantry.`,
        {
          type: "produce",
          name: item.name,
          queue: infantryType,
          cost: r.cost,
          minCredits: r.cost,
        },
      );
    }
  if(needsScout) {
    groups.infantry.instructions+=` SCOUT FIRST: prefer ${preferredScout.name} before adding another slow combat specialist while the enemy base is unknown.`;
  }
  const posture = group(
    "deployment",
    "Choose deployment posture using armor-adjusted damage against nearby visible targets. Deployment is not always stronger: anti-armor missiles can perform worse against infantry than the mobile weapon. Prefer the better stance for the actual target; reserve deployed anti-armor/AA units for those threats. Keep the scout mobile. Undeploy to follow a mission when no useful target is in range. Never toggle a unit already in the desired state.",
  );
  const deployable = army.filter(
    (u) =>
      u.canDeploy &&
      typeof u.isDeployed === "boolean" &&
      catalog[u.name]?.deployer,
  );
  const scoutId =
    memory.scoutId ?? army.find((u) => u.type === api.ObjectType.Infantry)?.id;
  const holdingBase = (u) =>
    u.id !== scoutId &&
    u.isIdle &&
    base &&
    distance(u.tile, base.tile) < 20 &&
    !memory.mission?.ids.includes(u.id);
  const needsMovement = (u) =>
    memory.mission?.ids.includes(u.id) &&
    Math.hypot(u.tile.rx - memory.mission.x, u.tile.ry - memory.mission.y) > 4;
  const nearbyTargets=u=>enemies.filter(e=>distance(u.tile,e.tile)<=Math.max(catalog[u.name]?.weapon?.range??0,catalog[u.name]?.secondary?.range??0));
  const stanceScores=u=>{const targets=nearbyTargets(u),r=catalog[u.name];
    const score=w=>{if(!targets.length)return weaponEffectiveness(w,[],catalog,api);const reachable=targets.filter(e=>distance(u.tile,e.tile)<=(w?.range??0)&&distance(u.tile,e.tile)>=(w?.minRange??0));return reachable.length?weaponEffectiveness(w,reachable,catalog,api):0;};
    return {targets,normal:score(r.weapon),deployed:score(r.secondary)};};
  state.deployment = deployable.map((u) => {
    const r = catalog[u.name];
    return {
      id: u.id,
      kind: u.name,
      deployed: u.isDeployed,
      holdingBase: !!holdingBase(u),
      needsMovement: !!needsMovement(u),
      normal: r.weapon,
      deployedWeapon: r.secondary,
      matchup:{normal:round(stanceScores(u).normal),deployed:round(stanceScores(u).deployed)},
      nearestEnemy: enemies.length
        ? round(Math.min(...enemies.map((e) => distance(u.tile, e.tile))))
        : null,
    };
  });
  const toDeploy = deployable.filter(
    (u) =>
      !u.isDeployed &&
      (u.id !== scoutId || nearbyTargets(u).length && !memory.mission?.ids.includes(u.id)) &&
      (!nearbyTargets(u).length || stanceScores(u).deployed >= stanceScores(u).normal) &&
      (holdingBase(u) ||
        enemies.some(
          (e) =>
            (e.zone !== 1 || catalog[u.name]?.secondary?.aa) &&
            distance(u.tile, e.tile) <=
              (catalog[u.name]?.secondary?.range ?? 0),
        )),
  );
  const toUndeploy = deployable.filter(
    (u) =>
      u.isDeployed &&
      ((needsMovement(u) && !enemies.some((e) => api.inRange(u.id, e.id, "current"))) ||
        nearbyTargets(u).some(e=>distance(u.tile,e.tile)<=(catalog[u.name]?.weapon?.range??0)) && stanceScores(u).normal>stanceScores(u).deployed*1.25),
  );
  if (toDeploy.length)
    posture(
      "deploy_combat",
      `Deploy ${toDeploy.length} units now: they are holding base defense or an enemy is within deployed range; deployment improves sustained damage/range. The scout is excluded from idle base deployment. See per-unit weapon comparison in state.deployment.`,
      { type: "set_deployed", deployed: true, ids: toDeploy.map((u) => u.id) },
    );
  if (toUndeploy.length)
    posture(
      "undeploy_mobile",
      `Undeploy ${toUndeploy.length} units: the normal weapon is stronger against nearby target armor, or the movement mission needs mobility without an in-range target. See per-unit matchup scores.`,
      {
        type: "set_deployed",
        deployed: false,
        ids: toUndeploy.map((u) => u.id),
      },
    );
  groups.deployment.criteria.wait =
    "Preserve current deployment if there is no useful posture change; avoid leaving an engaged GI undeployed when its deployed weapon is more effective.";
  for (const enemy of enemies)
    if (enemy.type === api.ObjectType.Building)
      memory.enemyBuildings.set(enemy.id, {
        id: enemy.id,
        name: enemy.name,
        x: enemy.tile.rx,
        y: enemy.tile.ry,
        tick: api.tick(),
      });
  // Once a remembered position is observed empty, remove it instead of repeatedly attacking a ruin.
  for (const [id, known] of memory.enemyBuildings)
    if (api.map.visible(known.x, known.y) && !enemies.some((e) => e.id === id))
      memory.enemyBuildings.delete(id);
  state.knownEnemyBuildings = [...memory.enemyBuildings.values()].map(({name,x,y,tick})=>({name,x,y,lastSeenTick:tick}));
  const tanks = army.filter((u) => u.type === api.ObjectType.Vehicle&&!catalog[u.name]?.naval&&catalog[u.name]?.category!=='AirPower');
  const support = army.filter(u=>u.type===api.ObjectType.Infantry&&u.id!==memory.scoutId&&
    api.tick()-(memory.specialOrders?.get(u.id)?.tick??-10000)>450);
  const active = [...tanks,...support];
  const rallySite=chooseRallySite(api,catalog,units,base);
  const tactics = group(
    "tactics",
    `Choose the combat mission to win by destroying the enemy base. Protect the base from nearby attackers, then press the enemy base with at least ${ATTACK_FORCE_SIZE} ground combat vehicles while production builds toward the force goal. Use numerical strength and health already computed in state. Keep a useful active attack; do not oscillate between attack and retreat. When the enemy base is unknown, advance through a supplied visible frontier to scout it. Combat orders use existing units and cost zero credits. Production savings and current credits do not restrict these actions. If a force is ready but still rallying, choose a supplied attack mission instead of continuing to wait.`,
  );
  groups.tactics.criteria.wait = "Keep an active useful combat mission, or wait when no suitable mission is supplied. Do not keep rallying after the force is ready and an attack target is supplied. Credit balance is irrelevant to movement and attack orders.";
  state.combat = {
    tanks: tanks.length,
    army: army.length,
    enemyVisible: enemies.length,
    health: state.averageArmyHealth,
    baseThreat: state.baseUnderAttack,
  };
  const threatening = baseThreats(api, catalog, buildings, enemies).sort((a,b) =>
    Number(buildings.some(u=>canFireAt(api,catalog,b,u))) - Number(buildings.some(u=>canFireAt(api,catalog,a,u))) ||
    (combatWeapon(b,catalog).range??0)-(combatWeapon(a,catalog).range??0));
  if (active.length) {
    const ids = active.map((u) => u.id);
    const committedAttack =
      memory.mission?.mode === "attack" && tanks.length >= 4;
    const ready =
      (tanks.length >= ATTACK_FORCE_SIZE || committedAttack) &&
      (state.airThreatCount === 0 || state.mobileAntiAirCount >= ATTACK_AA_ESCORTS);
    if (!ready && !threatening.length && rallySite && memory.enemyBuildings.size)
      tactics(
        "assemble_force",
        `Gather ${ids.length} troops near our base and accumulate ${ATTACK_FORCE_SIZE} ground combat vehicles including 2 anti-air escorts if air threats exist. Do not feed reinforcements into the enemy base one at a time.`,
        {
          type: "mission",
          mode: "rally",
          label: "集结装甲编队",
          ids,
          x: rallySite.x,
          y: rallySite.y,
        },
      );
    if (threatening.length)
      tactics(
        "defend_base",
        `URGENT: intercept ${threatening.length} visible base threats. Priority target #${threatening[0].id}, range ${combatWeapon(threatening[0],catalog).range}. Attack the hostile units directly; remaining at a rally point outside weapon range does not defend the base. Use compatible mobile counters, undeploy when movement is required, and stop chasing after targets leave the base area.`,
        {
          type: "mission",
          mode: "defend",
          label: "保卫基地",
          ids,
          targetId: threatening[0].id,
          x: threatening[0].tile.rx,
          y: threatening[0].tile.ry,
        },
      );
    const targets = enemies
      .filter((e) => e.type === api.ObjectType.Building)
      .sort(
        (a, b) =>
          Number(!!catalog[b.name]?.yard) - Number(!!catalog[a.name]?.yard),
      );
    if (ready && !threatening.length)
      for (const enemy of targets.slice(0, 2))
        tactics(
          `assault_${enemy.id}`,
          `Assault visible enemy ${catalog[enemy.name]?.label ?? enemy.name} at (${enemy.tile.rx},${enemy.tile.ry}) with ${ids.length} units.`,
          {
            type: "mission",
            mode: "attack",
            label: `进攻 ${enemy.name}`,
            ids,
            targetId: enemy.id,
            x: enemy.tile.rx,
            y: enemy.tile.ry,
          },
        );
    if (!targets.length && ready && !threatening.length && memory.enemyBuildings.size) {
      const known = [...memory.enemyBuildings.values()][0];
      tactics(
        "assault_known_base",
        `Attack-move to enemy building last seen at tick ${known.tick}; current hidden state unknown.`,
        {
          type: "mission",
          mode: "attack",
          label: "推进已侦察敌军基地",
          ids,
          x: known.x,
          y: known.y,
        },
      );
    }
    const mobileEnemy = enemies.filter(e=>e.primaryWeapon && e.type!==api.ObjectType.Building && e.zone!==(api.ZoneType?.Air??1))
      .map(e=>({enemy:e,score:active.reduce((sum,u)=>sum+combatTargetScore(api,catalog,u,e),0)}))
      .filter(e=>e.score>0).sort((a,b)=>b.score-a.score)[0]?.enemy;
    if (ready && mobileEnemy && !threatening.length) {
      const e = mobileEnemy;
      tactics(
        "engage_visible",
        `Engage visible enemy units with ${ids.length} troops; health ${(state.averageArmyHealth * 100).toFixed(0)}%.`,
        {
          type: "mission",
          mode: "attack",
          label: "迎击可见敌军",
          ids,
          targetId: e.id,
          x: e.tile.rx,
          y: e.tile.ry,
        },
      );
    }
    if (state.averageArmyHealth < 0.35 && !state.baseUnderAttack && rallySite)
      tactics(
        "regroup",
        `Health is low; fall back to base and rebuild force.`,
        {
          type: "mission",
          mode: "retreat",
          label: "撤回整补",
          ids,
          x: rallySite.x,
          y: rallySite.y,
        },
      );
  }
  const oldMission = memory.mission;
  const explorers =
    oldMission?.mode === "explore"
      ? army.filter((u) => oldMission.ids.includes(u.id))
      : [];
  const travelling =
    explorers.length &&
    explorers.every(
      (u) => Math.hypot(u.tile.rx - oldMission.x, u.tile.ry - oldMission.y) > 4,
    ) &&
    api.tick() - oldMission.since < 450;
  const shouldExplore =
    !memory.enemyBuildings.size && !travelling && !state.baseUnderAttack;
  const scoutChoice = group(
    "scouting",
    "Choose a frontier to reveal the unknown enemy base. Use one expendable infantry early; do not wait for tanks to scout. If an idle scout is available and the enemy base is unknown, scouting now is useful. An existing travelling scout is handled separately.",
  );
  if (shouldExplore && army.length) {
    const scout =
      army.find((u) => u.id === memory.scoutId) ??
      bestScout ??
      army[0];
    memory.scoutId = scout.id;
    if (!memory.points || api.tick() - (memory.pointsAt ?? -10000) > 120) {
      memory.points = frontierPoints(api, base, memory);
      memory.pointsAt = api.tick();
    }
    const mobilize =
      tanks.length >= 8 &&
      (state.airThreatCount === 0 || state.mobileAntiAirCount >= ATTACK_AA_ESCORTS);
    groups.scouting.criteria.wait =
      "Wait only if a scout is already moving or the enemy base has already been discovered. With idle troops and an unknown enemy base, choose one of the frontiers.";
    for (const p of memory.points.slice(0, 2))
      scoutChoice(
        `explore_${p.x}_${p.y}`,
        `${mobilize ? "Advance " + tanks.length + " tanks" : "Scout with one expendable unit"} to known frontier (${p.x},${p.y}), ${p.fog} unexplored adjacent samples. Reveal the enemy base, attack any opposition.`,
        {
          type: "mission",
          mode: "explore",
          label: mobilize ? "装甲推进侦察" : "前沿侦察",
          ids: mobilize ? tanks.map((u) => u.id) : [scout.id],
          x: p.x,
          y: p.y,
        },
      );
  }
  specialGroups(api, catalog, snapshot, memory, groups);
  investmentGroups(api, catalog, snapshot, memory, groups);
  return groups;
}

export function executeCandidate(api, action, catalog) {
  if (!action || action.type === "wait")
    return { accepted: false, reason: "wait" };
  if (api.me().defeated || api.me().isObserver)
    return { accepted: false, reason: "not_commandable" };
  if (action.ids) {
    const owned = new Set(api.units("self").map((u) => u.id));
    action = { ...action, ids: action.ids.filter((id) => owned.has(id)) };
    if (!action.ids.length) return { accepted: false, reason: "unit_gone" };
  }
  const special = executeSpecial(api, action);
  if (special) return special;
  if (action.type === "set_deployed") {
    const current = api.units("self");
    const eligible = action.ids.filter((id) => {
      const u = current.find((u) => u.id === id);
      return (
        u?.canDeploy &&
        typeof u.isDeployed === "boolean" &&
        u.isDeployed !== action.deployed
      );
    });
    if (!eligible.length)
      return { accepted: false, reason: "deployment_state_changed" };
    return {
      accepted: api.deploy(eligible),
      ids: eligible,
      deployed: action.deployed,
    };
  }
  if (action.type === "cancel") {
    if (!api.production.queues().find(q => q.type === action.queue)?.items.some(i => i.name === action.name)) return { accepted: false, reason: "queue_changed" };
    api.cancel(action.name);
    return { accepted: true };
  }
  if (action.type === "produce") {
    if (api.production.queues().find((q) => q.type === action.queue)?.size > 0)
      return { accepted: false, reason: "queue_changed" };
    if (
      !api.production
        .available(action.queue)
        .some((u) => u.name === action.name) ||
      api.me().credits < (action.minCredits ?? action.cost)
    )
      return { accepted: false, reason: "production_changed" };
    api.produce(action.name);
    return { accepted: true };
  }
  if (action.type === "mission") {
    if (action.mode === "defend") {
      const own = api.units('self');
      const threats = baseThreats(api, catalog, own.filter(u=>u.type===api.ObjectType.Building), api.units('enemy'));
      threats.sort((a,b)=>Number(b.id===action.targetId)-Number(a.id===action.targetId));
      if (!threats.length) return { accepted: false, reason: 'base_threat_changed' };
      const ids = [], undeployIds = [];
      for (const id of action.ids) {
        const u = own.find(u=>u.id===id);
        const compatible = threats.filter(e=>effectiveness(catalog[u.name],[e],catalog,api)>0);
        const target = compatible.find(e=>canFireAt(api,catalog,u,e)) ?? compatible[0];
        if (!target) continue;
        ids.push(id);
        if (u.isDeployed && !threats.some(e=>canFireAt(api,catalog,u,e))) undeployIds.push(id);
        else api.attack([id],target.id);
      }
      if (undeployIds.length) api.deploy(undeployIds);
      return { accepted: ids.length > 0, ids, undeployIds, reason: ids.length ? undefined : 'no_compatible_defender' };
    }
    if (action.mode !== "retreat") {
      const own = api.units("self"),
        enemies = api.units("enemy");
      action = {
        ...action,
        ids: action.ids.filter((id) => {
          const u = own.find((u) => u.id === id);
          return !u?.isDeployed || !enemies.some((e) => api.inRange(id, e.id, "current"));
        }),
      };
      if (!action.ids.length)
        return { accepted: false, reason: "deployed_holding" };
    }
    if (
      action.targetId &&
      api.units("enemy").some((u) => u.id === action.targetId)
    )
      api.attack(action.ids, action.targetId);
    else
      api[action.mode === "retreat" ? "move" : "attackMove"](
        action.ids,
        action.x,
        action.y,
      );
    return { accepted: true, ids: action.ids };
  }
  if (action.type === "deploy") return { accepted: api.deploy(action.ids) };
  if (action.type === "attack") {
    if (!api.units("enemy").some((u) => u.id === action.targetId))
      return { accepted: false, reason: "enemy_no_longer_visible" };
    api.attack(action.ids, action.targetId);
    return { accepted: true };
  }
  if (["move", "scout", "attackMove"].includes(action.type)) {
    if (!api.map.tile(action.x, action.y))
      return { accepted: false, reason: "destination_no_longer_visible" };
    api[action.type === "attackMove" ? "attackMove" : "move"](
      action.ids,
      action.x,
      action.y,
    );
    return { accepted: true };
  }
  return { accepted: false, reason: "unknown_action" };
}

function placeReadyBuilding(api, catalog, memory, emit) {
  if (api.tick() - memory.lastPlaceTick < 20) return;
  const queue = api.production
    .queues()
    .find(
      (q) =>
        [api.QueueType.Structures, api.QueueType.Armory].includes(q.type) &&
        q.status === 3 &&
        q.items.length,
    );
  if (!queue) return;
  const name = queue.items[0].name;
  const planned = memory.plannedSites?.get(name);
  if (planned && api.canPlace(name, planned.x, planned.y)) {
    api.place(name, planned.x, planned.y);
    memory.plannedSites.delete(name);
    memory.lastPlaceTick = api.tick();
    memory.lastPlaced = { ...planned, tick: api.tick() };
    emit({ kind: "place", tick: api.tick(), name, ...planned });
    return;
  }
  const site = chooseBuildingSite(api, catalog, name, api.units("self"), memory, 500);
  if (site) {
    api.place(name, site.x, site.y);
    memory.lastPlaceTick = api.tick();
    memory.lastPlaced = { ...site, tick: api.tick() };
    emit({ kind: "place", tick: api.tick(), name, ...site, purpose: catalog[name]?.isBaseDefense ? "counter_fire" : "base_development" });
  }
}

// Search and ranking are player strategy. The engine only observes tiles and orders a target.
export function findVisibleOre(api, origin) {
  const { width, height } = api.map.size();
  for (let radius = 0; radius < Math.max(width, height); radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (const dy of radius ? [-radius, radius] : [0]) {
        const tile = api.map.tile(origin.rx + dx, origin.ry + dy);
        if (tile?.landType === (api.LandType?.Tiberium ?? 9)) return tile;
      }
    }
    for (let dy = -radius + 1; dy < radius; dy++) {
      for (const dx of [-radius, radius]) {
        const tile = api.map.tile(origin.rx + dx, origin.ry + dy);
        if (tile?.landType === (api.LandType?.Tiberium ?? 9)) return tile;
      }
    }
  }
  return undefined;
}

export function maintainBattle(api, catalog, memory, emit) {
  maintainSpecial(api, memory, emit);
  const tick = api.tick(),
    own = api.units("self"),
    enemies = api.units("enemy");
  const mobile = own.filter(
    (u) =>
      u.type !== api.ObjectType.Building &&
      !catalog[u.name]?.harvester &&
      !catalog[u.name]?.engineer && !catalog[u.name]?.naval && !catalog[u.name]?.aircraft &&
      api.tick() - (memory.specialOrders?.get(u.id)?.tick ?? -10000) > 450 &&
      u.primaryWeapon,
  );
  const living = new Set(own.map((u) => u.id));
  const mission = memory.mission;
  const defending = mission?.mode === 'defend';
  const defenseThreats = defending ? baseThreats(api, catalog, own.filter(u=>u.type===api.ObjectType.Building), enemies) : [];
  memory.deploymentStates ??= new Map();
  for (const u of mobile)
    if (typeof u.isDeployed === "boolean") {
      const before = memory.deploymentStates.get(u.id);
      if (before !== undefined && before !== u.isDeployed)
        emit({
          kind: "observed",
          tick,
          description: `${u.name} #${u.id} ${u.isDeployed ? "已展开" : "已收起"}`,
          id: u.id,
          isDeployed: u.isDeployed,
        });
      memory.deploymentStates.set(u.id, u.isDeployed);
    }
  for (const id of memory.deploymentStates.keys())
    if (!living.has(id)) memory.deploymentStates.delete(id);
  memory.observedSpecial ??= new Map();
  for (const unit of own) {
    const observed = { deployed: unit.isDeployed, ammo: unit.ammo,
      passengers: unit.transport?.unitIds, garrison: unit.garrison?.unitIds };
    const previous = memory.observedSpecial.get(unit.id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(observed))
      emit({ kind: "observed", tick, id: unit.id, description: `${unit.name} #${unit.id} 载员 / 驻扎 / 弹药 / 姿态变化`, before: previous, after: observed });
    memory.observedSpecial.set(unit.id, observed);
  }
  if (tick - memory.lastMaintenance >= 60) {
    memory.lastMaintenance = tick;
    const buildings=own.filter(u=>u.type===api.ObjectType.Building);
    const base=buildings.find(u=>catalog[u.name]?.yard)??buildings[0];
    const exits=buildings.filter(b=>catalog[b.name]?.refinery||catalog[b.name]?.factory==='UnitType');
    const clearing=mobile.filter(u=>u.type===api.ObjectType.Vehicle&&u.isIdle&&!u.isDeployed&&
      !(defending && defenseThreats.length && mission.ids.includes(u.id))&&
      !enemies.some(e=>distance(e.tile,u.tile)<10)&&exits.some(b=>distance(u.tile,b.tile)<6)&&
      tick-(memory.orders.get(u.id)?.tick??-10000)>150);
    if(clearing.length) {
      const site=chooseRallySite(api,catalog,own,base);
      if(site) {
        api.move(clearing.map(u=>u.id),site.x,site.y);
        for(const u of clearing)memory.orders.set(u.id,{tick});
        emit({kind:'micro',tick,description:`让 ${clearing.length} 辆闲置战车离开矿场 / 工厂通道`,ids:clearing.map(u=>u.id),target:{x:site.x,y:site.y}});
      }
    }
    const idleMiners = own.filter(
      (u) => catalog[u.name]?.harvester && u.isIdle,
    );
    for (const miner of idleMiners) {
      const ore = findVisibleOre(api, miner.tile);
      if (!ore) continue;
      api.gather([miner.id], ore.rx, ore.ry);
      emit({ kind: "micro", tick, description: `恢复矿车 #${miner.id} 采矿`,
        target: { x: ore.rx, y: ore.ry } });
    }
    for (const building of own.filter(
      (u) => u.type === api.ObjectType.Building,
    )) {
      if (building.hitPoints >= building.maxHitPoints)
        memory.repairing.delete(building.id);
      if (
        building.hitPoints / building.maxHitPoints < 0.8 &&
        !memory.repairing.has(building.id) &&
        api.me().credits > 200
      ) {
        api.repair(building.id);
        memory.repairing.add(building.id);
        emit({ kind: "micro", tick, description: `维修 ${building.name}` });
      }
    }
  }
  // Mechanics: focus on a reachable in-range enemy, without replacing the model's macro mission.
  let issued = 0;
  for (const u of mobile) {
    if (tick - (memory.postureOrders?.get(u.id) ?? -1000) < 20) continue;
    const last = memory.orders.get(u.id);
    if (last && tick - last.tick < 18) continue;
    if (defending && mission.ids.includes(u.id)) {
      const targets = defenseThreats.filter(e=>effectiveness(catalog[u.name],[e],catalog,api)>0)
        .sort((a,b)=>Number(b.id===mission.targetId)-Number(a.id===mission.targetId) ||
          (combatWeapon(b,catalog).range??0)-(combatWeapon(a,catalog).range??0));
      const target = targets.find(e=>canFireAt(api,catalog,u,e)) ?? targets[0];
      if (target) {
        if (u.isDeployed && !canFireAt(api,catalog,u,target)) {
          if (tick-(memory.postureOrders?.get(u.id)??-1000)>150) {
            api.deploy([u.id]);
            memory.postureOrders ??= new Map();
            memory.postureOrders.set(u.id,tick);
            emit({kind:'micro',tick,description:`收起 #${u.id} 以接敌，目标 #${target.id}`,ids:[u.id],targetId:target.id});
          }
        } else if (last?.defenseTargetId!==target.id || u.isIdle || tick-last.tick>150) {
          api.attack([u.id],target.id);
          memory.orders.set(u.id,{tick,targetId:target.id,defenseTargetId:target.id});
          emit({kind:'micro',tick,description:`基地接敌 #${u.id} → #${target.id}`,ids:[u.id],targetId:target.id,inRange:canFireAt(api,catalog,u,target)});
        }
      } else if (last?.defenseTargetId) {
        const base=own.find(b=>catalog[b.name]?.yard)??own.find(b=>b.type===api.ObjectType.Building);
        const site=chooseRallySite(api,catalog,own,base);
        if(site)api.move([u.id],site.x,site.y);
        memory.orders.set(u.id,{tick});
      }
      continue;
    }
    const current = enemies.find((e) => e.id === last?.targetId);
    const canHit = (e) => e.zone !== 1 || activeWeapons(u, catalog).some(w=>w.aa);
    const options = enemies.filter(
      (e) =>
        canHit(e) && canFireAt(api, catalog, u, e),
    );
    options.sort((a,b) => combatTargetScore(api,catalog,u,b,mission?.targetId) -
      combatTargetScore(api,catalog,u,a,mission?.targetId));
    if (current && options[0]?.id === current.id && !u.isIdle) continue;
    if (options.length) {
      api.attack([u.id], options[0].id);
      memory.orders.set(u.id, { targetId: options[0].id, tick });
      issued++;
    } else if (
      !u.isDeployed &&
      mission?.ids.includes(u.id) &&
      u.isIdle &&
      (!last || tick - last.tick > 90)
    ) {
      if (Math.hypot(u.tile.rx - mission.x, u.tile.ry - mission.y) > 3) {
        const target = mission.mode === 'attack' && enemies.find(e=>e.id===mission.targetId);
        if (target && effectiveness(catalog[u.name],[target],catalog,api)>0) {
          api.attack([u.id],target.id);
          memory.orders.set(u.id,{tick,targetId:target.id});
        } else {
          api[mission.mode === "retreat" ? "move" : "attackMove"]([u.id],mission.x,mission.y);
          memory.orders.set(u.id,{tick});
        }
        issued++;
      }
    }
  }
  for (const id of memory.orders.keys())
    if (!living.has(id)) memory.orders.delete(id);
  if (issued && tick - memory.lastMicroReport > 60) {
    memory.lastMicroReport = tick;
    emit({
      kind: "micro",
      tick,
      description: `集火 / 补发 ${issued} 条单位指令`,
    });
  }
}

export async function attachJevPlayer(api, options = {}) {
  if (!api) throw new Error("Enter a battle before attaching Jev.");
  const bridge = options.bridge ?? DEFAULT_BRIDGE;
  const catalog = options.catalog ?? {};
  if (!options.catalog && !api.rules) throw new Error("This player requires werhd.rules() from the current player API.");
  refreshCatalog(api, catalog);
  const maxDecisions = options.maxDecisions ?? 600,
    maxStaleTicks = options.maxStaleTicks ?? 180;
  const memory = {
    autoCamera: options.autoCamera !== false,
    frontiers: new Map(),
    enemyBuildings: new Map(),
    lastPlaceTick: -1000,
    lastMaintenance: -1000,
    lastMicroReport: -1000,
    repairing: new Set(),
    orders: new Map(),
    postureOrders: new Map(),
    specialOrders: new Map(), specialTargets: new Map(), plannedSites: new Map(),
    observedSpecial: new Map(),
    mission: undefined,
  };
  const status = {
    running: true,
    busy: false,
    decisions: 0,
    accepted: 0,
    rejected: 0,
    failures: 0,
    last: undefined,
    observations: [],
    events: [],
  };
  const controller = new AbortController();
  let decisionTimer,
    microTimer,
    lastTick = -1,
    lastObservationTick = -1,
    progressTick = -1,
    progressAt = performance.now();
  const emit = (event) => {
    status.events.push(event);
    if (status.events.length > 400) status.events.shift();
    fetch(`${bridge}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).catch(() => {});
    if (event.kind !== "observation") console.info("[werhd-jev]", event);
  };
  const stop = (reason = "manual") => {
    if (!status.running) return;
    status.running = false;
    clearTimeout(decisionTimer);
    clearTimeout(microTimer);
    controller.abort();
    emit({
      kind: "stop",
      reason,
      decisions: status.decisions,
      accepted: status.accepted,
    });
  };
  const micro = () => {
    if (!status.running) return;
    try {
      if (api.tick() !== progressTick) {
        progressTick = api.tick();
        progressAt = performance.now();
      } else if (performance.now() - progressAt > 30000) {
        stop("simulation_not_advancing");
        return;
      }
      const me = api.me();
      if (me.defeated || me.isObserver) {
        emit({
          kind: "outcome",
          result: me.defeated ? "defeat" : "observer",
          tick: api.tick(),
        });
        stop("defeated_or_observer");
        return;
      }
      const opponents =
        api
          .players?.()
          .filter((p) => !p.allied && p.combatant && !p.isObserver) ?? [];
      if (opponents.length && opponents.every((p) => p.defeated)) {
        emit({ kind: "outcome", result: "victory", tick: api.tick() });
        stop("victory");
        return;
      }
      maintainBattle(api, catalog, memory, emit);
      placeReadyBuilding(api, catalog, memory, emit);
      updateCamera(api, catalog, memory, emit);
      if (api.tick() - lastObservationTick >= 60) {
        const snap = collectState(api, catalog),
          o = {
            kind: "observation",
            tick: api.tick(),
            credits: snap.state.self.credits,
            power: snap.state.self.power,
            inventory: snap.state.inventory,
            visibleEnemies: snap.state.visibleEnemies,
            queues: snap.state.queues,
            state: { ...snap.state, strategy: memory.strategy },
            mission: memory.mission?.label,
          };
        status.observations.push(o);
        if (status.observations.length > 180) status.observations.shift();
        emit(o);
        lastObservationTick = api.tick();
      }
    } catch (e) {
      if (/outside a running battle/.test(e.message)) stop("battle_ended");
      else {
        emit({ kind: "error", message: e.message });
        stop("executor_error");
      }
    }
    if (status.running) microTimer = setTimeout(micro, 150);
  };
  const decide = async () => {
    if (!status.running) return;
    try {
      const tick = api.tick();
      if (tick === lastTick) return;
      lastTick = tick;
      if (status.decisions >= maxDecisions) {
        stop("decision_budget");
        return;
      }
      const snap = collectState(api, catalog),
        groups = candidateGroups(api, catalog, snap, memory);
      const requestGroups = Object.fromEntries(
        Object.entries(groups)
          .filter(([, g]) => Object.keys(g.criteria).length > 1)
          .sort(([a], [b]) => {
            const priority = id => ["construction", "defenses", "tactics", "salvage"].includes(id) ? -1000000 : (memory.questionTicks?.get(id) ?? -100000);
            return priority(a) - priority(b);
          })
          .slice(0, 8)
          .map(([id, g]) => [
            id,
            { instructions: g.instructions, criteria: g.criteria },
          ]),
      );
      if (!Object.keys(requestGroups).length) return;
      memory.questionTicks ??= new Map();
      for (const id of Object.keys(requestGroups)) memory.questionTicks.set(id, tick);
      status.busy = true;
      const started = performance.now();
      const response = await fetch(`${bridge}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: snap.state, groups: requestGroups }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Bridge HTTP ${response.status}`);
      const result = await response.json();
      status.decisions++;
      status.last = { tick, ...result };
      if (!status.running) return;
      const ageTicks = api.tick() - tick;
      if (ageTicks > maxStaleTicks) {
        status.rejected++;
        emit({
          kind: "stale",
          tick,
          currentTick: api.tick(),
          latencyMs: result.latencyMs,
        });
        return;
      }
      for (const [id, answer] of Object.entries(result.answers).sort(
        ([a], [b]) => { const rank = id => id === "deployment" ? 9 : id === (snap.state.strategy?.investment?.category ?? (snap.state.strategy?.investment?.queue === api.QueueType.Armory ? "defenses" : "construction")) ? -1 : 0; return rank(a) - rank(b); },
      )) {
        let action = groups[id]?.actions[answer.choice];
        if (action?.ids) action = { ...action, ids: action.ids.filter(
          (unitId) => api.tick() - (memory.specialOrders.get(unitId)?.tick ?? -10000) > 450) };
        if (action?.type === "mission") {
          const old = memory.mission;
          if (
            old &&
            old.mode === action.mode &&
            old.targetId === action.targetId &&
            old.ids.length === action.ids.length && action.ids.every(id=>old.ids.includes(id)) &&
            Math.hypot(old.x - action.x, old.y - action.y) < 5 &&
            api.tick() - old.since < 180
          ) {
            emit({
              kind: "action",
              tick: api.tick(),
              choice: answer.choice,
              accepted: false,
              reason: "mission_continues",
              confidence: answer.confidence,
            });
            continue;
          }
        }
        const execStarted = performance.now(),
          execution = executeCandidate(api, action, catalog);
        if (execution.accepted) {
          status.accepted++;
          if (action.type === "produce" && action.placement) memory.plannedSites.set(action.name, action.placement);
          if (action.type === "special") {
            rememberSpecial(memory, action, execution, api.tick());
            for (const unitId of execution.ids ?? []) memory.specialOrders.set(unitId, { tick: api.tick(), kind: action.kind });
            if (action.targetId !== undefined) memory.specialTargets.set(`repair_${action.targetId}`, api.tick());
          }
          if (action.type === "set_deployed")
            for (const unitId of execution.ids ?? [])
              memory.postureOrders.set(unitId, api.tick());
          for (const unitId of execution.undeployIds ?? []) memory.postureOrders.set(unitId, api.tick());
          if (action.type === "mission") {
            memory.mission = {
              ...action,
              ids: execution.ids ?? action.ids,
              since: api.tick(),
            };
            memory.frontiers.set(`${action.x},${action.y}`, api.tick());
            memory.points = undefined;
          }
        } else if (execution.reason !== "wait") status.rejected++;
        emit({
          kind: "action",
          tick: api.tick(),
          sourceTick: tick,
          ageTicks,
          question: id,
          choice: answer.choice,
          confidence: answer.confidence,
          latencyMs: result.latencyMs,
          roundTripMs: Math.round(performance.now() - started),
          executionMs: performance.now() - execStarted,
          action,
          ...execution,
        });
      }
    } catch (e) {
      if (/outside a running battle/.test(e.message)) {
        stop("battle_ended");
        return;
      }
      if (status.running) {
        status.failures++;
        emit({ kind: "error", message: e.message });
      }
      if (status.failures >= 5) stop("repeated_errors");
    } finally {
      status.busy = false;
      if (status.running)
        decisionTimer = setTimeout(decide, options.intervalMs ?? 600);
    }
  };
  emit({ kind: "start", tick: api.tick(), maxDecisions, policy: "v8.8.15-tactics-wait" });
  if (!options.disableMicro) microTimer = setTimeout(micro, 0);
  decisionTimer = setTimeout(decide, 0);
  return { status, stop, catalog, memory, setAutoCamera: (enabled) => { memory.autoCamera = !!enabled; } };
}
