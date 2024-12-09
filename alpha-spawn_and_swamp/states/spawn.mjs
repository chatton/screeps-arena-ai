// SpawnState is a base class with access to a spawn point.
import {CARRY, HEAL, MOVE, RANGED_ATTACK, WORK} from "game/constants";
import {ROLE_BUILDER, ROLE_HARVESTER, ROLE_HEALER, ROLE_RANGED_ATTACKER} from "../constants/constants.mjs";

// SpawnStateHarvester spawns harvesters.
export class SpawnStateHarvester{
    tick(gameState) {
        const c = gameState.spawn.spawnCreep([MOVE, MOVE, WORK, CARRY, CARRY, CARRY]).object;
        if (c) {
            c.role = ROLE_HARVESTER;
        }
    }
}

// SpawnStateRangedAttacker spawns ranged attackers.
export class SpawnStateRangedAttacker{
    tick(gameState) {
        // TODO: based on amount of energy,spawn a bigger creep.
        const c = gameState.spawn.spawnCreep([MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK]).object;
        if (c) {
            c.role = ROLE_RANGED_ATTACKER;
        }
    }
}

// SpawnStateHealer spawns healers.
export class SpawnStateHealer {
    tick(gameState) {
        const c = gameState.spawn.spawnCreep([MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, HEAL, HEAL]).object;
        if (c) {
            c.role = ROLE_HEALER;
        }
    }
}

// SpawnStateBuilder spawns builders.
export class SpawnStateBuilder {
    tick(gameState) {
        const c = gameState.spawn.spawnCreep([CARRY, CARRY, WORK, MOVE, MOVE, MOVE, MOVE, MOVE]).object;
        if (c) {
            c.role = ROLE_BUILDER;
        }
    }
}

