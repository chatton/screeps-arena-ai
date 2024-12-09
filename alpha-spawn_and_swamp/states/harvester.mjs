import {findClosestByPath, getObjectsByPrototype} from "game/utils";
import {Creep, StructureContainer, StructureSpawn} from "game/prototypes";
import {ROLE_HARVESTER} from "../constants/constants.mjs";
import {ERR_NOT_IN_RANGE, RESOURCE_ENERGY} from "game/constants";

// StateHarvestStarterResources is the state where the harvesters will harvest the initial 3 containers.
export class StateHarvestStarterResources {
    tick(gameState) {
        const spawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);
        const harvesters = getObjectsByPrototype(Creep).filter(c => c.my && c.job === ROLE_HARVESTER);
        const containers = getObjectsByPrototype(StructureContainer).filter(c => c.store[RESOURCE_ENERGY] <= c.store.getCapacity() && c.store[RESOURCE_ENERGY] !== 0);

        // TODO: find 3 closest containers to check.
        // let firstThreeContainersEmpty = true;

        // should be safe to do, will always be more than 3 containers, and the closest three while in this state
        // should be the starter ones.
        // for (let i = 0; i < 3; i++) {
        //     if (containers[i].store[RESOURCE_ENERGY] !== 0) {
        //         firstThreeContainersEmpty = false;
        //         break;
        //     }
        // }

        // no more starting resources, this will trigger a transition to a different state.
        // starterResourcesMinedOut = firstThreeContainersEmpty;

        for (let harvester of harvesters) {
            // find closest container in case we end up on the other side of the map.
            const container = findClosestByPath(harvester, containers);

            if (harvester.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                // if there are no containers around, there's no energy to collect.
                if (!container) {
                    continue;
                }

                if (harvester.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    harvester.moveTo(container);
                }
            } else {
                if (harvester.transfer(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    harvester.moveTo(spawn);
                }
            }
        }
    }
}

// TODO: create an additional state where they go out and look at other containers.
export class StateHarvestRemoteResources {
    tick(gameState) {

    }
}
