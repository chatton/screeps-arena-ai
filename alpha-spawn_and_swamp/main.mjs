import {getObjectsByPrototype, findClosestByPath, getTicks} from 'game/utils';
import {StructureSpawn, Creep, StructureContainer} from 'game/prototypes';
import {MOVE, WORK, CARRY, ATTACK, RESOURCE_ENERGY, ERR_NOT_IN_RANGE, RANGED_ATTACK, HEAL, TOUGH} from 'game/constants';
import {} from 'arena';


const squadNum = 4;
const squads = [];

export function loop() {
    const harvesters = getObjectsByPrototype(Creep).filter(c => c.my && c.job == "harvester");
    // const attackers = getObjectsByPrototype(Creep).filter(c => c.my && c.job == "attacker");
    const enemyCreeps = getObjectsByPrototype(Creep).filter(c => !c.my);
    const spawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);
    const enemySpawn = getObjectsByPrototype(StructureSpawn).find(s => !s.my);
    const containers = getObjectsByPrototype(StructureContainer).filter(c => c.store[RESOURCE_ENERGY] <= c.store.getCapacity() && c.store[RESOURCE_ENERGY] !== 0);

    if (harvesters.length < 3) {
        const c = spawn.spawnCreep([MOVE, MOVE, WORK, CARRY, CARRY, CARRY]).object;
        if (c) {
            c.job = "harvester";
            return;
        }
    }


    for (let i = 0; i < harvesters.length; i++) {
        const harvester = harvesters[i];

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

    const attacker = spawnRangedAttacker(spawn);

    const availableSquad = squads.find(s => !s.ready());
    if (!availableSquad && attacker) {
        // create a new squad with the attacker and defined behaviour.
        squads.push(new Squad([attacker], squadNum, creep => {
            const closestEnemy = findClosestByPath(creep, enemyCreeps);
            const target = closestEnemy === null ? enemySpawn : closestEnemy;
            if (creep.rangedAttack(target) === ERR_NOT_IN_RANGE) {
                // yolo attack enemy spawn, doesn't account for any defences.
                // if (creep.hits < creep.hitsMax) {
                //     creep.heal(attacker);
                // } else {
                creep.moveTo(target);
                // }
            }
        }));
    } else {
        // add an attacker to an existing squad.
        if (attacker) {
            availableSquad.addMember(attacker);
        }
    }

    for (const squad of squads) {
        if (squad.ready()) {
            squad.moveOut();
        }
    }
}

function spawnRangedAttacker(spawn) {
    const c = spawn.spawnCreep([MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK]).object;
    if (c) {
        c.job = "attacker";
    }
    return c;
}

class Squad {
    constructor(creeps, desiredNum, fn) {
        this.name = "squad-" + getTicks();
        this.creeps = creeps;
        this.desiredNum = desiredNum;
        this.run = fn;
        this.movedOut = false;
    }

    ready() {
        return this.movedOut || this.creeps.length >= this.desiredNum;
    }

    numMembers() {
        return this.creeps.length;
    }

    addMember(creep) {
        if (creep.squad) {
            console.log(`tried to add creep to squad ${this.name} when it was already in squad ${creep.squad}`);
            return;
        }
        creep.squad = this.name;
        this.creeps.push(creep);
    }

    moveOut() {
        this.movedOut = true;
        for (const creep of this.creeps) {
            this.run(creep);
        }
    }

    setRun(fn) {
        this.run = fn;
    }
}