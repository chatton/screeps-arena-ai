// SpawnState is a base class with access to a spawn point.
import {CARRY, HEAL, MOVE, RANGED_ATTACK, WORK} from "game/constants";
import {ROLE_BUILDER, ROLE_HARVESTER, ROLE_HEALER, ROLE_RANGED_ATTACKER} from "../constants/constants.mjs";

export class SpawnState {
    constructor(spawn) {
        this.spawn = spawn;
    }
}


// SpawnStateHarvester spawns harvesters.
export class SpawnStateHarvester extends SpawnState {
    tick(gameState) {
        const c = this.spawn.spawnCreep([MOVE, MOVE, WORK, CARRY, CARRY, CARRY]).object;
        if (c) {
            c.job = ROLE_HARVESTER;
        }
    }
}

// SpawnStateRangedAttacker spawns ranged attackers.
export class SpawnStateRangedAttacker extends SpawnState {
    tick(gameState) {
        // TODO: based on amount of energy,spawn a bigger creep.
        const c = this.spawn.spawnCreep([MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK]).object;
        if (c) {
            c.job = ROLE_RANGED_ATTACKER;
        }
    }
}

// SpawnStateHealer spawns healers.
export class SpawnStateHealer extends SpawnState {
    tick(gameState) {
        const c = this.spawn.spawnCreep([MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, HEAL, HEAL]).object;
        if (c) {
            c.job = ROLE_HEALER;
        }
    }
}

// SpawnStateBuilder spawns builders.
export class SpawnStateBuilder extends SpawnState {
    tick(gameState) {
        const c = this.spawn.spawnCreep([CARRY, CARRY, WORK, MOVE, MOVE, MOVE, MOVE, MOVE]).object;
        if (c) {
            c.job = ROLE_BUILDER;
        }
    }
}

