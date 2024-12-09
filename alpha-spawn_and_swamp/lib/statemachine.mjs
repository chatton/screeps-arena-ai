// StateMachine enables the setting transition functions and types that implement a "tick" method.
// the state machine will call the first tick function whose "conditionFn" returns true.
export class StateMachine {
    constructor(name) {
        this.states = [];
        this.name = name;
        this.lastState = "none";
    }

    setStateTransition(stateName, conditionFn, ticker) {
        this.states.push({
            name: stateName,
            conditionFn: conditionFn,
            ticker: ticker
        })
    }

    tick(gameState) {
        for (let state of this.states) {
            if (state.conditionFn()) {
                if (state.name !== this.lastState) {
                    console.log(`${this.name}: ${this.lastState} -> ${state.name}`);
                    this.lastState = state.name;
                }
                state.ticker.tick(gameState);
                return;
            }
        }
        console.log("no conditionFn returned true, invalid wiring of this state machine.");
    }
}