import { getObjectsByPrototype } from 'game/utils';
import { Creep, StructureSpawn, Source } from 'game/prototypes';
import {  RESOURCE_ENERGY, ERR_NOT_IN_RANGE } from 'game/constants';


export function loop() {
    const spawn = getObjectsByPrototype(StructureSpawn)[0];
    const source = getObjectsByPrototype(Source)[0];
    const creep = getObjectsByPrototype(Creep).find(i => i.my);

    if(creep.store[RESOURCE_ENERGY] === 0){
        if(creep.harvest(source) === ERR_NOT_IN_RANGE){
            creep.moveTo(source);
        }
    } else {
        if(creep.transfer(spawn, RESOURCE_ENERGY)){
            creep.moveTo(spawn);
        }
    }
}