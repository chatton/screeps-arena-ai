import {getObjectsByPrototype, findClosestByPath, getTicks} from 'game/utils';
import {StructureSpawn, Creep, StructureContainer} from 'game/prototypes';
import {MOVE, WORK, CARRY, ATTACK, RESOURCE_ENERGY, ERR_NOT_IN_RANGE, RANGED_ATTACK, HEAL, TOUGH} from 'game/constants';
import {} from 'arena';

const ROLE_HARVESTER = "harvester";
const ROLE_RANGED_ATTACKER = "ranged_attacker";

// spawnStateMachine is the state machine which controls spawning of units, it must be initialized in the first tick.
let spawnStateMachine;
// creepStateMachine is the state machine which controls the movements and actions of creeps, it must be initialized in the first tick.
let creepStateMachine;

function initSpawnStateMachine() {
    const spawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);

    const sm = new StateMachine();
    sm.setStateTransition("harvester state", () => getObjectsByPrototype(Creep).filter(c => c.my && c.job === ROLE_HARVESTER).length < 3, new SpawnStateHarvester(spawn))
    sm.setStateTransition("ranged attacker state", () => true, new SpawnStateRangedAttacker(spawn))
    return sm;
}

function initCreepStateMachine() {
    const sm = new StateMachine();
    sm.setStateTransition("gather initial resources", () => true, new CreepStateGatherInitialResources());
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
        const c = this.spawn.spawnCreep([MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK]).object;
        if (c) {
            c.job = ROLE_RANGED_ATTACKER;
        }
    }
}

class CreepStateGatherInitialResources {
    tick() {

        const spawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);
        const harvesters = getObjectsByPrototype(Creep).filter(c => c.my && c.job === ROLE_HARVESTER);
        const rangedAttackers = getObjectsByPrototype(Creep).filter(c => c.my && c.job === ROLE_RANGED_ATTACKER);
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
            const closestEnemy = findClosestByPath(rangedAttacker, enemyCreeps);
            const target = closestEnemy === null ? enemySpawn : closestEnemy;
            if (rangedAttacker.rangedAttack(target) === ERR_NOT_IN_RANGE) {
                rangedAttacker.moveTo(target);
            }
        }
    }
}

// StateMachine enables the setting transition functions and types that implement a "tick" method.
// the state machine will call the first tick function whose "conditionFn" returns true.
class StateMachine {
    constructor() {
        this.states = [];
        this.lastState = "";
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
                    this.lastState = state.name;
                    console.log("executing state: " + state.name);
                }
                state.ticker.tick();
                return;
            }
        }
        console.error("no conditionFn returned true, invalid wiring of this state machine.");
    }
}
