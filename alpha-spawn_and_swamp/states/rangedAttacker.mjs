import {getCreepsWithRole} from "../lib/utils.mjs";
import {findClosestByPath, findInRange, getObjectsByPrototype} from "game/utils";
import {Creep, StructureSpawn} from "game/prototypes";
import {ATTACK, ERR_NOT_IN_RANGE, RANGED_ATTACK} from "game/constants";
import {ROLE_RANGED_ATTACKER} from "../constants/constants.mjs";

// StateRangedAttackersAttackEnemyBase is the state where the ranged attackers will attack the enemy base.
export class StateRangedAttackersAttackEnemyBase {
    tick(gameState) {
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


// StateRangedAttackersDefendBase is the state where the ranged attackers will stay at the base and defend.
export class StateRangedAttackersDefendBase {
    tick(gameState) {
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
