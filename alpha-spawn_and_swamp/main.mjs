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
const ROLE_BUILDER = "builder";

const numHarvesters = 3;
const numBuilders = 2;
const numHealers = 3;

// TODO: build units that can build stuff. (CARRY, CARRY, WORK, MOVE, MOVE, MOVE, MOVE, MOVE), build extensions near containers (2 or 3 per energy site).
// TODO: move units away from spawn when spawned.
// TODO: build ramparts to defend, build one on spawn.
// TODO: build extension next to containers with resources.
// TODO: group up outside of enemy base.
// TODO: hunt down buildings on the way over to enemy base. (destroy extensions)
// TODO: claim dropped resources on the ground with harvesters once they have mined out the original three storage containers.

// stateMachines holes all of the state machines that should run on each tick of the game loop.
// they should all be registered and added to this list on the first tick.
const stateMachines = [];

function getCreepsWithRole(roleName) {
    return getObjectsByPrototype(Creep).filter(c => c.my && c.job === roleName)
}

function initSpawnStateMachine(spawn) {
    const sm = new StateMachine("spawn");
    sm.setStateTransition("harvester state", () => getCreepsWithRole(ROLE_HARVESTER).length < numHarvesters, new SpawnStateHarvester(spawn))
    // sm.setStateTransition("builder state", () => getCreepsWithRole(ROLE_BUILDER).length < numBuilders, new SpawnStateBuilder(spawn))
    sm.setStateTransition("healer state", () => getCreepsWithRole(ROLE_HEALER).length < numHealers && getCreepsWithRole(ROLE_RANGED_ATTACKER).length > 2, new SpawnStateHealer(spawn))
    sm.setStateTransition("ranged attacker state", () => true, new SpawnStateRangedAttacker(spawn))
    return sm;
}

function initHarvesterStateMachine() {
    const sm = new StateMachine("harvester");
    // TODO: condition for this should be that all 3 starter resources are empty.
    sm.setStateTransition("harvest initial resources", () => true, new StateHarvestStarterResources());
    return sm;
}

function initRangedAttackerStateMachine() {
    const sm = new StateMachine("ranged attacker");
    // TODO: condition is arbitrary, make this better!
    sm.setStateTransition("attack enemy base", () => getObjectsByPrototype(Creep).filter(c => c.my).length >= 8, new StateRangedAttackersAttackEnemyBase());
    sm.setStateTransition("defend home base", () => true, new StateRangedAttackersDefendBase());
    return sm;
}

function initHealerStateMachine() {
    const sm = new StateMachine("healer");
    // TODO: condition is arbitrary, make this better!
    sm.setStateTransition("attack enemy base", () => getObjectsByPrototype(Creep).filter(c => c.my).length >= 8, new StateHealerAttack());
    sm.setStateTransition("defend home base", () => true, new StateHealerDefend());
    return sm;
}

export function loop() {
    if (stateMachines.length === 0) {
        const spawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);
        stateMachines.push(
            initSpawnStateMachine(spawn),
            initHarvesterStateMachine(),
            initRangedAttackerStateMachine(),
            initHealerStateMachine()
        )
    }

    for (const sm of stateMachines) {
        sm.tick();
    }
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
        // TODO: based on amount of energy,spawn a bigger creep.
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

// SpawnStateBuilder spawns builders.
class SpawnStateBuilder extends SpawnState {
    tick() {
        const c = this.spawn.spawnCreep([CARRY, CARRY, WORK, MOVE, MOVE, MOVE, MOVE, MOVE]).object;
        if (c) {
            c.job = ROLE_BUILDER;
        }
    }
}


// StateHarvestStarterResources is the state where the harvesters will harvest the initial 3 containers.
// TODO: create an additional state where they go out and look at other containers.
class StateHarvestStarterResources {
    tick() {
        const spawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);
        const harvesters = getObjectsByPrototype(Creep).filter(c => c.my && c.job === ROLE_HARVESTER);
        const containers = getObjectsByPrototype(StructureContainer).filter(c => c.store[RESOURCE_ENERGY] <= c.store.getCapacity() && c.store[RESOURCE_ENERGY] !== 0);

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
    }
}


// StateRangedAttackersDefendBase is the state where the ranged attackers will stay at the base and defend.
class StateRangedAttackersDefendBase {
    tick() {
        const rangedAttackers = getCreepsWithRole(ROLE_RANGED_ATTACKER);
        const enemyCreeps = getObjectsByPrototype(Creep).filter(c => !c.my);
        // handler ranged attackers.
        for (let rangedAttacker of rangedAttackers) {
            // simply attack anybody that is in range, don't go after the spawn yet.
            const closestEnemies = findInRange(rangedAttacker, enemyCreeps, 5);
            if (closestEnemies.length > 0) {
                const closestEnemy = findClosestByPath(rangedAttacker, closestEnemies);
                rangedAttacker.rangedAttack(closestEnemy)
            }
        }
    }
}


// StateRangedAttackersAttackEnemyBase is the state where the ranged attackers will attack the enemy base.
class StateRangedAttackersAttackEnemyBase {
    tick() {
        const rangedAttackers = getCreepsWithRole(ROLE_RANGED_ATTACKER);
        const enemyCreeps = getObjectsByPrototype(Creep).filter(c => !c.my);
        const enemySpawn = getObjectsByPrototype(StructureSpawn).find(s => !s.my);

        let closestEnemy;
        // handler ranged attackers.
        for (let rangedAttacker of rangedAttackers) {
            // only attack enemy creeps that have attacking parts, this means we ignore going after creeps
            // that are just workers.
            const enemyAttackers = enemyCreeps.filter(c => {
                // don't shoot creeps if they are spawning.
                if (c.spawning) {
                    return false;
                }

                for (const body of c.body) {
                    if (body.type === ATTACK || body.type === RANGED_ATTACK) {
                        return true;
                    }
                }
                return false;
            })

            if (!closestEnemy) {
                closestEnemy = findClosestByPath(rangedAttacker, enemyAttackers);
            }

            const target = closestEnemy === null ? enemySpawn : closestEnemy;
            if (rangedAttacker.rangedAttack(target) === ERR_NOT_IN_RANGE) {
                rangedAttacker.moveTo(target);
            }
        }
    }
}

// StateHealerDefend is the state where the healer hangs around and just heals units and the spawn.
class StateHealerDefend {
    tick() {
        const myCreeps = getObjectsByPrototype(Creep).filter(c => c.my);
        const spawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);
        const healers = getCreepsWithRole(ROLE_HEALER)

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


// StateHealerAttack is the state entered when units should move out and attack the enemy base.
class StateHealerAttack {
    tick() {
        const rangedAttackers = getCreepsWithRole(ROLE_RANGED_ATTACKER);
        const healers = getCreepsWithRole(ROLE_HEALER);

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
    constructor(name) {
        this.states = [];
        this.name = name;
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
                    console.log(`${this.name}: ${this.lastState} -> ${state.name}`);
                    this.lastState = state.name;
                }
                state.ticker.tick();
                return;
            }
        }
        console.error("no conditionFn returned true, invalid wiring of this state machine.");
    }
}
