import {getObjectsByPrototype, findClosestByPath, findInRange} from 'game/utils';
import {StructureSpawn, Creep, StructureContainer} from 'game/prototypes';
import {
    MOVE,
    WORK,
    CARRY,
    RESOURCE_ENERGY,
    ERR_NOT_IN_RANGE,
    RANGED_ATTACK,
    HEAL, ATTACK
} from 'game/constants';
import {} from 'arena';

const ROLE_HARVESTER = "harvester";
const ROLE_RANGED_ATTACKER = "ranged_attacker";
const ROLE_HEALER = "healer";

const numHarvesters = 3;
const numHealers = 3;

// TODO: move units away from spawn when spawned.
// TODO: build units that can build stuff. (CARRY, CARRY, WORK, MOVE, MOVE, MOVE, MOVE, MOVE), build extensions near containers (2 or 3 per energy site).
// TODO: build ramparts to defend, build one on spawn.
// TODO: build extension next to containers with resources.
// TODO: group up outside of enemy base.

// spawnStateMachine is the state machine which controls spawning of units, it must be initialized in the first tick.
let spawnStateMachine;
// creepStateMachine is the state machine which controls the movements and actions of creeps, it must be initialized in the first tick.
let creepStateMachine;

function initSpawnStateMachine() {
    const spawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);

    const sm = new StateMachine();
    sm.setStateTransition("harvester state", () => getObjectsByPrototype(Creep).filter(c => c.my && c.job === ROLE_HARVESTER).length < numHarvesters, new SpawnStateHarvester(spawn))
    sm.setStateTransition("healer state", () => getObjectsByPrototype(Creep).filter(c => c.my && c.job === ROLE_HEALER).length < numHealers && getObjectsByPrototype(Creep).filter(c => c.my && c.job === ROLE_RANGED_ATTACKER).length > 2, new SpawnStateHealer(spawn))
    sm.setStateTransition("ranged attacker state", () => true, new SpawnStateRangedAttacker(spawn))
    return sm;
}

function initCreepStateMachine() {
    const sm = new StateMachine();
    sm.setStateTransition("attack enemy base", () => getObjectsByPrototype(Creep).filter(c => c.my).length >= 8, new CreepAttackEnemyBase());
    sm.setStateTransition("gather initial resources", () => true, new CreepStateGatherInitialResourcesAndDefend());
    return sm;
}

export function loop() {
    if (!spawnStateMachine) {
        spawnStateMachine = initSpawnStateMachine();
        creepStateMachine = initCreepStateMachine();
        return;
    }

    spawnStateMachine.tick();
    creepStateMachine.tick();
}

// SpawnState is a base class with access to a spawn point.
class SpawnState {
    constructor(spawn) {
        this.spawn = spawn;
    }
}

// SpawnStateHarvester spawns harvesters.
class SpawnStateHarvester extends SpawnState {
    tick() {
        const c = this.spawn.spawnCreep([MOVE, MOVE, WORK, CARRY, CARRY, CARRY]).object;
        if (c) {
            c.job = ROLE_HARVESTER
        }
    }
}

// SpawnStateRangedAttacker spawns ranged attackers.
class SpawnStateRangedAttacker extends SpawnState {
    tick() {
        const c = this.spawn.spawnCreep([MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK]).object;
        if (c) {
            c.job = ROLE_RANGED_ATTACKER;
        }
    }
}

// SpawnStateHealer spawns healers.
class SpawnStateHealer extends SpawnState {
    tick() {
        const c = this.spawn.spawnCreep([MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, HEAL, HEAL]).object;
        if (c) {
            c.job = ROLE_HEALER;
        }
    }
}

class CreepStateGatherInitialResourcesAndDefend {
    tick() {
        const myCreeps = getObjectsByPrototype(Creep).filter(c => c.my);
        const spawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);
        const harvesters = getObjectsByPrototype(Creep).filter(c => c.my && c.job === ROLE_HARVESTER);
        const rangedAttackers = getObjectsByPrototype(Creep).filter(c => c.my && c.job === ROLE_RANGED_ATTACKER);
        const healers = getObjectsByPrototype(Creep).filter(c => c.my && c.job === ROLE_HEALER);
        const enemyCreeps = getObjectsByPrototype(Creep).filter(c => !c.my);
        const containers = getObjectsByPrototype(StructureContainer).filter(c => c.store[RESOURCE_ENERGY] <= c.store.getCapacity() && c.store[RESOURCE_ENERGY] !== 0);
        const enemySpawn = getObjectsByPrototype(StructureSpawn).find(s => !s.my);

        // handler harvesters.
        // TODO: go out and mine from other containers, but return to an extension if it exists.
        for (let harvester of harvesters) {
            // find closest container in case we end up on the other side of the map.
            const container = findClosestByPath(harvester, containers);

            if (harvester.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                // if there are no containers around, there's no energy to collect.
                if (!container) {
                    continue;
                }

                if (harvester.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    harvester.moveTo(container);
                }
            } else {
                if (harvester.transfer(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    harvester.moveTo(spawn);
                }
            }
        }

        // handler ranged attackers.
        for (let rangedAttacker of rangedAttackers) {
            // simply attack anybody that is in range, don't go after the spawn yet.
            const closestEnemies = findInRange(rangedAttacker, enemyCreeps, 5);
            if (closestEnemies.length > 0) {
                const closestEnemy = findClosestByPath(rangedAttacker, closestEnemies);
                rangedAttacker.rangedAttack(closestEnemy)
            }
        }

        // heal anything that is damaged.
        for (const healer of healers) {
            const closestHealTarget = findClosestByPath(healer, myCreeps.concat(spawn).filter(c => c.hits < c.hitsMax))
            if (closestHealTarget && closestHealTarget.hits < closestHealTarget.hitsMax) {
                if (healer.heal(closestHealTarget) === ERR_NOT_IN_RANGE) {
                    healer.moveTo(closestHealTarget)
                }
            }
        }
    }
}


class CreepAttackEnemyBase {
    tick() {
        const myCreeps = getObjectsByPrototype(Creep).filter(c => c.my);
        const spawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);
        const harvesters = getObjectsByPrototype(Creep).filter(c => c.my && c.job === ROLE_HARVESTER);
        const rangedAttackers = getObjectsByPrototype(Creep).filter(c => c.my && c.job === ROLE_RANGED_ATTACKER);
        const healers = getObjectsByPrototype(Creep).filter(c => c.my && c.job === ROLE_HEALER);
        const enemyCreeps = getObjectsByPrototype(Creep).filter(c => !c.my);
        const containers = getObjectsByPrototype(StructureContainer).filter(c => c.store[RESOURCE_ENERGY] <= c.store.getCapacity() && c.store[RESOURCE_ENERGY] !== 0);
        const enemySpawn = getObjectsByPrototype(StructureSpawn).find(s => !s.my);

        // handler harvesters.
        for (let harvester of harvesters) {
            // find closest container in case we end up on the other side of the map.
            const container = findClosestByPath(harvester, containers);

            if (harvester.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                // if there are no containers around, there's no energy to collect.
                if (!container) {
                    continue;
                }

                if (harvester.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    harvester.moveTo(container);
                }
            } else {
                if (harvester.transfer(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    harvester.moveTo(spawn);
                }
            }
        }

        // handler ranged attackers.
        for (let rangedAttacker of rangedAttackers) {

            // only attack enemy creeps that have attacking parts, this means we ignore going after creeps
            // that are just workers.
            const enemyAttackers = enemyCreeps.filter(c => {
                for (const body of c.body) {
                    if (body.type === ATTACK || body.type === RANGED_ATTACK) {
                        return true;
                    }
                }
                return false;
            })

            const closestEnemy = findClosestByPath(rangedAttacker, enemyAttackers);
            const target = closestEnemy === null ? enemySpawn : closestEnemy;
            if (rangedAttacker.rangedAttack(target) === ERR_NOT_IN_RANGE) {
                rangedAttacker.moveTo(target);
            }
        }

        // heal anything that is damaged.
        for (const healer of healers) {
            const closestHealTarget = findClosestByPath(healer, rangedAttackers.filter(c => c.hits < c.hitsMax))
            if (closestHealTarget) {
                if (healer.heal(closestHealTarget) === ERR_NOT_IN_RANGE) {
                    healer.moveTo(closestHealTarget)
                }
            } else {
                const closestHealTarget = findClosestByPath(healer, rangedAttackers);
                healer.moveTo(closestHealTarget)
            }
        }
    }
}

// StateMachine enables the setting transition functions and types that implement a "tick" method.
// the state machine will call the first tick function whose "conditionFn" returns true.
class StateMachine {
    constructor() {
        this.states = [];
        this.lastState = "none";
    }

    setStateTransition(stateName, conditionFn, ticker) {
        this.states.push({
            name: stateName,
            conditionFn: conditionFn,
            ticker: ticker
        })
    }

    tick() {
        for (let state of this.states) {
            if (state.conditionFn()) {
                if (state.name !== this.lastState) {
                    console.log(`transitioning from state state: ${this.lastState} to ${state.name}`);
                    this.lastState = state.name;
                }
                state.ticker.tick();
                return;
            }
        }
        console.error("no conditionFn returned true, invalid wiring of this state machine.");
    }
}
