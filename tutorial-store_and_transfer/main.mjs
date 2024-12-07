import {getObjects, getObjectsByPrototype} from 'game/utils';
import { Creep, StructureTower, StructureContainer } from 'game/prototypes';
import { ERR_NOT_IN_RANGE, ATTACK, RANGED_ATTACK, HEAL, RESOURCE_ENERGY } from 'game/constants';

export function loop() {

    const tower = getObjectsByPrototype(StructureTower)[0];
    const container = getObjectsByPrototype(StructureContainer)[0];
    const creep = getObjectsByPrototype(Creep).find(c => c.my);
    const enemyCreep = getObjectsByPrototype(Creep).find(creep => !creep.my);

    if(creep.store[RESOURCE_ENERGY] === 0){
        if(creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE){
            creep.moveTo(container);
        }
    } else {
        if(creep.transfer(tower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE){
            creep.moveTo(tower);
        }
    }

    tower.attack(enemyCreep)
}