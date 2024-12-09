import {getObjectsByPrototype} from "game/utils";
import {Creep} from "game/prototypes";

// getCreepsWithRole returns a list of owned creeps with the specified role.
export function getCreepsWithRole(roleName) {
    return getObjectsByPrototype(Creep).filter(c => c.my && c.role === roleName)
}

// distanceBetweenPoints returns the distance between two different points.
export function distanceBetweenPoints(pointA, pointB) {
    return Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
}
