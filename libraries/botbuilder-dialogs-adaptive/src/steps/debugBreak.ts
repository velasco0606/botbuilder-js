/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Dialog, DialogContext, DialogTurnResult, DialogContextVisibleState } from 'botbuilder-dialogs';
import { SequenceContext, StepState } from '../sequenceContext';

export class DebugBreak extends Dialog {
    constructor() {
        super();
        this.inheritState = true;
    }
    
    protected onComputeID(): string {
        return `debugBreak[]`;
    }
    
    public async beginDialog(dc: DialogContext): Promise<DialogTurnResult> {
        // Get memory
        const memory = dc.state.toJSON();
        if (typeof memory.turn.stepCount != 'number') {
            memory.turn.stepCount = 0;
        }

        // Compute path
        let path = '';
        let connector = '';
        let current = dc.parent;
        while (current != undefined) {
            path = current.activeDialog.id + connector + path;
            connector = '/';
            current = current.parent;
        }

        // Get list of steps
        const stepState: StepState[] = dc instanceof SequenceContext ? (dc as SequenceContext).steps : [];
        const steps = stepState.map(s => s.dialogId);

        // Break into debugger
        debugBreak(memory, path, steps);
        return await dc.endDialog();
    }
}

function debugBreak(memory: DialogContextVisibleState, path: string, steps: string[]): void {
    console.log(`${path}: ${memory.turn.stepCount} steps executed and ${steps.length} remaining.`)
    debugger;
}