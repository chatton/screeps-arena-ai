import { getObjectsByPrototype, createConstructionSite } from 'game/utils';
import { Creep, StructureTower, Source, StructureContainer } from 'game/prototypes';
import {  RESOURCE_ENERGY, ERR_NOT_IN_RANGE } from 'game/constants';


let constructionSite;
export function loop() {
    const container = getObjectsByPrototype(StructureContainer)[0];
    const creep = getObjectsByPrototype(Creep).find(i => i.my);

    if(!constructionSite) {
        constructionSite = createConstructionSite({x: 50, y: 55}, StructureTower).object;
        return;
    }

    if(creep.store[RESOURCE_ENERGY] === 0){
        if(creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE){
            creep.moveTo(container);
        }
    } else {
        if(creep.build(constructionSite)){
            creep.moveTo(constructionSite);
        }
    }
}