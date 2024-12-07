import { getObjectsByPrototype, createConstructionSite } from 'game/utils';
import { Creep, StructureTower, Source, StructureContainer, StructureSpawn } from 'game/prototypes';
import {RESOURCE_ENERGY, ERR_NOT_IN_RANGE, MOVE, CARRY, WORK, ATTACK} from 'game/constants';


let worker;
export function loop() {
    const spawn = getObjectsByPrototype(StructureSpawn)[0]
    const source = getObjectsByPrototype(Source)[0];
    // const creeps = getObjectsByPrototype(Creep).filter(i => i.my);
    const enemyCreeps = getObjectsByPrototype(Creep).filter(i => !i.my);
    const attackers = getObjectsByPrototype(Creep).filter(i => i.my && i.role !== "worker");

    // spawn worker and harvest energy;
    if(!worker){
        worker = spawn.spawnCreep([MOVE, CARRY, WORK]).object;
        worker.role = "worker";
        return;
    }

    if(worker.store.getFreeCapacity(RESOURCE_ENERGY) > 0){
        if(worker.harvest(source, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE){
            worker.moveTo(source);
        }
    } else {
        if(worker.transfer(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE){
            worker.moveTo(spawn);
        }
    }
    spawn.spawnCreep([MOVE, CARRY, ATTACK])

    for(let attacker of attackers){
        if(attacker.attack(enemyCreeps[0]) === ERR_NOT_IN_RANGE) {
            attacker.moveTo(enemyCreeps[0]);
        }
    }
}