import { getObjectsByPrototype } from 'game/utils';
import { Creep, Flag, StructureSpawn } from 'game/prototypes';
import { MOVE } from 'game/constants';


export function loop() {
    const spawn = getObjectsByPrototype(StructureSpawn)[0];
    const creeps = getObjectsByPrototype(Creep).filter(i => i.my);
    const flags = getObjectsByPrototype(Flag);

    if(creeps.length < 2){
        spawn.spawnCreep([MOVE])
    }

    for(let i = 0; i < creeps.length; i++){
        const creep = creeps[i];
        const flag = flags[i];
        creep.moveTo(flag);
    }
}