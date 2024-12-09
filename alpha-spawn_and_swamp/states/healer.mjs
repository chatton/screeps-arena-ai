import {getCreepsWithRole} from "../lib/utils.mjs";
import {ROLE_HEALER, ROLE_RANGED_ATTACKER} from "../constants/constants.mjs";
import {findClosestByPath, getObjectsByPrototype} from "game/utils";
import {ERR_NOT_IN_RANGE} from "game/constants";
import {Creep, StructureSpawn} from "game/prototypes";

// StateHealerAttack is the state entered when units should move out and attack the enemy base.
export class StateHealerAttack {
    tick(gameState) {
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

// StateHealerDefend is the state where the healer hangs around and just heals units and the spawn.
export class StateHealerDefend {
    tick(gameState) {
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

