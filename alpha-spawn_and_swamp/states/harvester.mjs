import {findClosestByPath, getObjectsByPrototype} from "game/utils";
import {StructureContainer, StructureExtension} from "game/prototypes";
import {NUM_INITIAL_CONTAINERS, ROLE_HARVESTER} from "../constants/constants.mjs";
import {ERR_NOT_IN_RANGE, RESOURCE_ENERGY} from "game/constants";
import {distanceBetweenPoints, getCreepsWithRole} from "../lib/utils.mjs";

// StateHarvestStarterResources is the state where the harvesters will harvest the initial 3 containers.
export class StateHarvestStarterResources {
    constructor() {
        this.initialContainers = [];
    }

    tick(gameState) {
        const harvesters = getCreepsWithRole(ROLE_HARVESTER);

        // if we have not initialized the initial containers, do so now.
        if (this.initialContainers.length === 0) {
            const containers = getObjectsByPrototype(StructureContainer);
            containers.sort((a, b) => {
                return distanceBetweenPoints(gameState.spawn, a) - distanceBetweenPoints(gameState.spawn, b);
            })

            // the initial containers will be the 3 closest to the spawn on this map.
            this.initialContainers = containers.slice(0, NUM_INITIAL_CONTAINERS);
        }

        const containers = this.initialContainers.filter(c => c.store[RESOURCE_ENERGY] !== 0);
        // if there are no more original containers, toggle this field, which will trigger a state transition.
        gameState.harvestInitialResources = containers.length === 0;

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
                if (harvester.transfer(gameState.spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    harvester.moveTo(gameState.spawn);
                }
            }
        }
    }
}

// StateHarvestRemoteResources will send harvesters out to harvest resources from remote containers.
export class StateHarvestRemoteResources {
    tick(gameState) {
        const harvesters = getCreepsWithRole(ROLE_HARVESTER);
        const containers = getObjectsByPrototype(StructureContainer).filter(c => c.store[RESOURCE_ENERGY] !== 0)
        for (const harvester of harvesters) {

            // TODO: don't just find closest, find closest that has an extension.
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
                const extensions = getObjectsByPrototype(StructureExtension).filter(s => s.my);
                const closestExtension = findClosestByPath(harvester, extensions);

                // go to an extension if one is available.
                if (closestExtension) {
                    if (harvester.transfer(closestExtension, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        harvester.moveTo(closestExtension);
                    }

                } else { // otherwise just bring it back to the spawn.
                    if (harvester.transfer(gameState.spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        harvester.moveTo(gameState.spawn);
                    }
                }
            }
        }
    }
}
