import {getObjectsByPrototype} from "game/utils";
import {Creep} from "game/prototypes";

export function getCreepsWithRole(roleName) {
    return getObjectsByPrototype(Creep).filter(c => c.my && c.job === roleName)
}
