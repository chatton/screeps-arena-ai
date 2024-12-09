import {getObjectsByPrototype} from 'game/utils';
import {StructureSpawn, Creep} from 'game/prototypes';
import {} from 'arena';

// custom library imports
import {StateMachine} from "./lib/statemachine.mjs";
import {SpawnStateHealer, SpawnStateRangedAttacker, SpawnStateHarvester, SpawnStateBuilder} from "./states/spawn.mjs";
import {getCreepsWithRole} from "./lib/utils.mjs"
import {ROLE_HARVESTER, ROLE_HEALER, ROLE_RANGED_ATTACKER} from "./constants/constants.mjs";
import {StateRangedAttackersAttackEnemyBase, StateRangedAttackersDefendBase} from "./states/rangedAttacker.mjs";
import {StateHarvestRemoteResources, StateHarvestStarterResources} from "./states/harvester.mjs";
import {StateHealerAttack, StateHealerDefend} from "./states/healer.mjs";


const numHarvesters = 3;
const numBuilders = 2;
const numHealers = 3;

// TODO: build units that can build stuff. (CARRY, CARRY, WORK, MOVE, MOVE, MOVE, MOVE, MOVE), build extensions near containers (2 or 3 per energy site).
// TODO: move units away from spawn when spawned.
// TODO: build ramparts to defend, build one on spawn.
// TODO: build extension next to containers with resources.
// TODO: group up outside of enemy base.
// TODO: hunt down buildings on the way over to enemy base. (destroy extensions)
// TODO: claim dropped resources on the ground with harvesters once they have mined out the original three storage containers.

// stateMachines holes all of the state machines that should run on each tick of the game loop.
// they should all be registered and added to this list on the first tick.
const stateMachines = [];

// gameState is an object that can be passed to the tick function of the state machine states.
// this can be modified as required.
const gameState = {
    // harvestInitialResources indicates if we should be harvesting the first 3 containers of resources.
    // once these are depleted, this value should be set to false, and we move on to harvesting the remote resources.
    harvestInitialResources: true
};

function initSpawnStateMachine(spawn) {
    const sm = new StateMachine("spawn");
    sm.setStateTransition("harvester state", () => getCreepsWithRole(ROLE_HARVESTER).length < numHarvesters, new SpawnStateHarvester(spawn))
    // sm.setStateTransition("builder state", () => getCreepsWithRole(ROLE_BUILDER).length < numBuilders, new SpawnStateBuilder(spawn, ROLE_BUILDER))
    sm.setStateTransition("healer state", () => getCreepsWithRole(ROLE_HEALER).length < numHealers && getCreepsWithRole(ROLE_RANGED_ATTACKER).length > 2, new SpawnStateHealer(spawn))
    sm.setStateTransition("ranged attacker state", () => true, new SpawnStateRangedAttacker(spawn))
    return sm;
}

function initHarvesterStateMachine() {
    const sm = new StateMachine("harvester");
    sm.setStateTransition("harvest initial resources", () => gameState.harvestInitialResources, new StateHarvestStarterResources());
    sm.setStateTransition("harvest remote resources", () => !gameState.harvestInitialResources, new StateHarvestRemoteResources());
    return sm;
}

function initRangedAttackerStateMachine() {
    const sm = new StateMachine("ranged attacker");
    // TODO: condition is arbitrary, make this better!
    sm.setStateTransition("attack enemy base", () => getObjectsByPrototype(Creep).filter(c => c.my).length >= 8, new StateRangedAttackersAttackEnemyBase());
    sm.setStateTransition("defend home base", () => true, new StateRangedAttackersDefendBase());
    return sm;
}

function initHealerStateMachine() {
    const sm = new StateMachine("healer");
    // TODO: condition is arbitrary, make this better!
    sm.setStateTransition("attack enemy base", () => getObjectsByPrototype(Creep).filter(c => c.my).length >= 8, new StateHealerAttack());
    sm.setStateTransition("defend home base", () => true, new StateHealerDefend());
    return sm;
}

export function loop() {
    console.log(gameState);
    if (stateMachines.length === 0) {
        const spawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);
        stateMachines.push(
            initSpawnStateMachine(spawn),
            initHarvesterStateMachine(),
            initRangedAttackerStateMachine(),
            initHealerStateMachine()
        )
    }

    for (const sm of stateMachines) {
        sm.tick(gameState);
    }
}