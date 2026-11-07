// Generated from PlayerConsoleTypes.ts during the werhd build.
export declare enum FactoryType {
  None = 0,
  BuildingType = 1,
  InfantryType = 2,
  UnitType = 3,
  NavalUnitType = 4,
  AircraftType = 5,
}

export declare enum BuildCat {
  Combat = 0,
  Tech = 1,
  Resource = 2,
  Power = 3,
}

export declare enum ArmorType {
  None = 0,
  Flak = 1,
  Plate = 2,
  Light = 3,
  Medium = 4,
  Heavy = 5,
  Wood = 6,
  Steel = 7,
  Concrete = 8,
  Special_1 = 9,
  Special_2 = 10,
}

export declare enum ObjectType {
  None = 0,
  Aircraft = 1,
  Building = 2,
  Infantry = 3,
  Overlay = 4,
  Smudge = 5,
  Terrain = 6,
  Vehicle = 7,
  Animation = 8,
  Projectile = 9,
  VoxelAnim = 10,
  Debris = 11,
}

export declare enum LandType {
  Clear = 0,
  Road = 1,
  Rock = 2,
  Beach = 3,
  Rough = 4,
  Railroad = 5,
  Weeds = 6,
  Water = 7,
  Wall = 8,
  Tiberium = 9,
  Cliff = 10,
}

export declare enum ZoneType {
  Ground = 0,
  Air = 1,
  Water = 2,
}

export declare enum VeteranLevel {
  None = 0,
  Veteran = 1,
  Elite = 2,
}

export declare enum OrderType {
  Move = 0,
  ForceMove = 1,
  Attack = 2,
  ForceAttack = 3,
  AttackMove = 4,
  Guard = 5,
  GuardArea = 6,
  Capture = 7,
  Occupy = 8,
  Deploy = 9,
  DeploySelected = 10,
  Stop = 11,
  Cheer = 12,
  Dock = 13,
  Gather = 14,
  Repair = 15,
  Scatter = 16,
  EnterTransport = 17,
  PlaceBomb = 18,
}

export declare enum QueueType {
  Structures = 0,
  Armory = 1,
  Infantry = 2,
  Vehicles = 3,
  Aircrafts = 4,
  Ships = 5,
}

export declare enum QueueStatus {
  Idle = 0,
  Active = 1,
  OnHold = 2,
  Ready = 3,
}

export declare enum SuperWeaponType {
  MultiMissile = 0,
  IronCurtain = 1,
  LightningStorm = 2,
  ChronoSphere = 3,
  ChronoWarp = 4,
  ParaDrop = 5,
  AmerParaDrop = 6,
}


export type PlayerConsoleUnitRelation = 'self' | 'allied' | 'hostile' | 'enemy';


export interface PlayerConsoleTile {
  landType: LandType | undefined;
  onBridge?: boolean;
  bridge?: { id: number; elevation: number; isLow: boolean; hitPoints?: number; maxHitPoints?: number };
  rampType: number;
  rx: number;
  ry: number;
  z: number;
}


export interface PlayerConsoleWeapon {
  aa: boolean;
  ag: boolean;
  cooldownTicks?: number;
  maxRange: number;
  minRange: number;
  subjectToElevation: boolean;
}


export interface PlayerConsoleUnit {
  /** Own units only. Capability, not a guarantee that the current tile permits deployment. */
  canDeploy?: boolean;
  /** Own reversible deployers only; undefined for morphing vehicles and non-deployers. */
  isDeployed?: boolean;
  /** Own aircraft only. Actual remaining ammunition. */
  ammo?: number;
  /** Own buildings only; repair() toggles this state. */
  hasWrenchRepair?: boolean;
  /** Visible building capacity; occupant identities are own-only. */
  garrison?: { count: number; capacity: number; canOccupy: boolean; unitIds?: number[] };
  /** Own transport capacity and passengers, counted in size slots. */
  transport?: { occupied: number; capacity: number; unitIds: number[] };
  direction?: number;
  elevation: number;
  hitPoints?: number;
  id: number;
  isIdle: boolean;
  maxHitPoints?: number;
  name: string;
  onBridge?: boolean;
  owner?: string;
  primaryWeapon?: PlayerConsoleWeapon;
  secondaryWeapon?: PlayerConsoleWeapon;
  sight?: number;
  tile: PlayerConsoleTile;
  tileElevation: number;
  type: ObjectType;
  velocity?: { x: number; y: number; z: number };
  veteranLevel?: VeteranLevel;
  worldPosition?: { x: number; y: number; z: number };
  zone?: ZoneType;
}


export interface PlayerConsolePlayer {
  allied: boolean;
  combatant: boolean;
  country?: string;
  credits?: number;
  defeated: boolean;
  isAi: boolean;
  isObserver: boolean;
  name: string;
  power?: { drain: number; isLowPower: boolean; total: number };
  radarDisabled?: boolean;
}


export interface PlayerConsoleSelf {
  combatant: boolean;
  country?: string;
  credits: number;
  defeated: boolean;
  isObserver: boolean;
  name: string;
  power?: { drain: number; isLowPower: boolean; total: number };
  radarDisabled: boolean;
}


export interface PlayerConsoleWeaponVs {
  distance: number;
  elevationBonus: number;
  hasHighGround: boolean;
  inRange: boolean;
  maxRange: number;
  minRange: number;
}


export interface PlayerConsoleTickContext {
  tick: number;
  time: number;
}


export type PlayerConsoleTickHandler = (context: PlayerConsoleTickContext) => void;


export interface PlayerConsoleTileTarget { x: number; y: number; onBridge?: boolean }

export interface PlayerConsoleObjectTarget { objectId: number }

export type PlayerConsoleNoTargetOrder = OrderType.Stop | OrderType.Scatter | OrderType.Cheer | OrderType.Guard | OrderType.DeploySelected;

export type PlayerConsoleObjectOrder = OrderType.Capture | OrderType.Occupy | OrderType.Repair | OrderType.EnterTransport | OrderType.Dock;

export type PlayerConsoleTileOrder = OrderType.Move | OrderType.ForceMove | OrderType.AttackMove | OrderType.GuardArea | OrderType.Gather;

export type PlayerConsoleAttackOrder = OrderType.Attack | OrderType.ForceAttack | OrderType.PlaceBomb;

export type PlayerConsoleOrder =
  | { type: PlayerConsoleNoTargetOrder; target?: never }
  | { type: PlayerConsoleObjectOrder; target: PlayerConsoleObjectTarget }
  | { type: PlayerConsoleTileOrder; target: PlayerConsoleTileTarget }
  | { type: PlayerConsoleAttackOrder; target: PlayerConsoleTileTarget | PlayerConsoleObjectTarget }
  | { type: OrderType.Deploy; target?: PlayerConsoleTileTarget };

/** Positional compatibility; structured targets additionally distinguish bridge decks. */
export type PlayerConsoleLegacyOrderArgs =
  | [type: PlayerConsoleNoTargetOrder | OrderType.Deploy]
  | [type: PlayerConsoleObjectOrder | PlayerConsoleAttackOrder, objectId: number]
  | [type: PlayerConsoleTileOrder | PlayerConsoleAttackOrder | OrderType.Deploy, x: number, y: number];


export interface PlayerConsoleWeaponRule {
  name: string;
  damage: number;
  range: number;
  minRange: number;
  rof: number;
  aa: boolean;
  ag: boolean;
  versus: Record<number, number>;
}

/** Effective match rules, including map/MOD overrides. Scalars and copied collections only. */
export interface PlayerConsoleRule {
  name: string;
  label: string;
  type: ObjectType;
  cost: number;
  power: number;
  factory: FactoryType;
  buildCat: BuildCat;
  armor: ArmorType;
  category: string;
  movementZone: string;
  speed: number;
  techLevel: number;
  prerequisite: string[];
  deploysInto?: string;
  undeploysInto?: string;
  tickTank: boolean;
  freeUnit?: string;
  ammo: number;
  passengers: number;
  size: number;
  sizeLimit: number;
  numberOfDocks: number;
  maxNumberOccupants: number;
  primary?: PlayerConsoleWeaponRule;
  secondary?: PlayerConsoleWeaponRule;
  refinery: boolean;
  harvester: boolean;
  constructionYard: boolean;
  naval: boolean;
  engineer: boolean;
  deployer: boolean;
  occupier: boolean;
  canBeOccupied: boolean;
  bridgeRepairHut: boolean;
  wall: boolean;
  isBaseDefense: boolean;
  unsellable: boolean;
  repairable: boolean;
  airportBound: boolean;
  gunner: boolean;
  c4: boolean;
  capturable: boolean;
  /** Already-loaded NeedsEngineer flag. The client uses it for tech-structure announcements. */
  techBuilding: boolean;
  insignificant: boolean;
  /** Player-facing name when the string table can resolve UIName; otherwise that key or the ini name. */
  displayName: string;
}


/** Local view offsets in projected screen pixels, independent of zoom. Data copies only. */
export interface PlayerConsoleCameraState {
  pan: { x: number; y: number };
  limits?: { x: number; y: number; width: number; height: number };
}


export interface PlayerConsolePublicApi {
  ObjectType: typeof ObjectType;
  FactoryType: typeof FactoryType;
  BuildCat: typeof BuildCat;
  ArmorType: typeof ArmorType;
  LandType: typeof LandType;
  ZoneType: typeof ZoneType;
  VeteranLevel: typeof VeteranLevel;
  QueueStatus: typeof QueueStatus;
  OrderType: typeof OrderType;
  QueueType: typeof QueueType;
  SuperWeaponType: typeof SuperWeaponType;
  ally(name: string, on: boolean): void;
  attack(unitIds: number[], targetId: number): void;
  attackMove(unitIds: number[], x: number, y: number): void;
  canPlace(name: string, x: number, y: number): boolean;
  camera: {
    /** Local rendering state; undefined when no renderer is attached. */
    state(): PlayerConsoleCameraState | undefined;
    /** Center on integer map coordinates, clamped by the normal camera bounds. No game command. */
    centerAt(x: number, y: number): boolean;
  };
  cancel(name: string, quantity?: number): void;
  crates(): Array<{ id: number; name: string; tile: PlayerConsoleTile; water: boolean }>;
  deploy(unitIds: number[]): boolean;
  elevation(target: number | { x: number; y: number }): number | undefined;
  gather(unitIds: number[], x: number, y: number): void;
  help(): string;
  rules(name: string, type: ObjectType): PlayerConsoleRule | undefined;
  inRange(attackerId: number, targetId: number, mode?: 'primary' | 'current'): boolean;
  map: {
    size(): { height: number; width: number };
    tile(x: number, y: number): PlayerConsoleTile | undefined;
    visible(x: number, y: number): boolean;
  };
  me(): PlayerConsoleSelf;
  move(unitIds: number[], x: number, y: number): void;
  offTick(): void;
  onTick(handler: PlayerConsoleTickHandler): void;
  order(unitIds: number[], command: PlayerConsoleOrder): boolean;
  order(unitIds: number[], ...args: PlayerConsoleLegacyOrderArgs): boolean;
  pause(queueType: QueueType): void;
  ping(x: number, y: number): void;
  place(name: string, x: number, y: number): void;
  players(): PlayerConsolePlayer[];
  produce(name: string, quantity?: number): void;
  production: {
    available(queueType?: QueueType): Array<{ name: string; type: ObjectType }>;
    queues(): Array<{
      items: Array<{ creditsEach: number; creditsSpent: number; name: string; progress: number; quantity: number }>;
      maxSize: number;
      size: number;
      status: QueueStatus;
      type: QueueType;
    }>;
  };
  repair(buildingId: number): void;
  resign(): void;
  resume(queueType: QueueType): void;
  select(unitIds: number[]): void;
  selected(): PlayerConsoleUnit[];
  sell(objectId: number): void;
  stop(unitIds: number[]): void;
  superweapon(type: SuperWeaponType, x: number, y: number, x2?: number, y2?: number): void;
  tick(): number;
  time(): number;
  /** Returns undefined for invalid, removed, destroyed or unobservable object IDs. */
  unit(id: number): PlayerConsoleUnit | undefined;
  units(relation?: PlayerConsoleUnitRelation): PlayerConsoleUnit[];
  weaponVs(attackerId: number, targetId: number, mode?: 'primary' | 'current'): PlayerConsoleWeaponVs | undefined;
  /** Loaded map identity. Briefing is only the text already resolved for this battle. */
  missionInfo(): PlayerConsoleMissionInfo;
  /** Most recent command decision made before the lockstep queue. */
  lastCommand(): PlayerConsoleCommandResult | undefined;
}


export type PlayerConsoleRejectReason =
  | 'observer-or-defeated'
  | 'invalid-order'
  | 'no-units'
  | 'unit-missing'
  | 'not-owned'
  | 'target-missing'
  | 'target-hidden'
  | 'invalid-tile'
  | 'cannot-place';


export interface PlayerConsoleCommandResult {
  accepted: boolean;
  reason?: PlayerConsoleRejectReason;
}


export interface PlayerConsoleMissionInfo {
  mapName: string;
  gameMode?: number;
  campaign: boolean;
  missionId?: string;
  briefing?: string;
}


export type WerhdClientPhase = 'boot' | 'menu' | 'loading' | 'briefing' | 'inGame' | 'paused' | 'score';

export type WerhdGameOutcome = 'victory' | 'defeat' | 'quit' | 'disconnect';


export type WerhdClientEvent =
  | { seq: number; type: 'gameEnd'; battleId?: string; outcome: WerhdGameOutcome }
  | { seq: number; type: 'message'; battleId?: string; channel: 'eva' | 'screen'; key?: string; text: string };


export interface WerhdClientPublicApi {
  readonly version: string;
  readonly capabilities: readonly string[];
  readonly phase: WerhdClientPhase;
  readonly battleId?: string;
  readonly mission?: PlayerConsoleMissionInfo;
  on(handler: (event: WerhdClientEvent) => void): () => void;
  since(seq: number): WerhdClientEvent[];
}
declare global { interface Window { werhd?: PlayerConsolePublicApi; werhdClient?: WerhdClientPublicApi } }
