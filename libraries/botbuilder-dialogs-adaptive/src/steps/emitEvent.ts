/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogContext, DialogConfiguration, Dialog } from 'botbuilder-dialogs';
import { ExpressionPropertyValue, ExpressionProperty } from '../expressionProperty';

export interface EmitEventConfiguration extends DialogConfiguration {
    eventName?: string;
    eventValue?: ExpressionPropertyValue<any>;
    eventValueProperty?: string;
    bubbleEvent?: boolean;
    resultProperty?: string;
}

export class EmitEvent extends Dialog {

    constructor();
    constructor(eventName: string, eventValue?: ExpressionPropertyValue<any>, bubbleEvent?: boolean);
    constructor(eventName?: string, eventValue?: ExpressionPropertyValue<any>, bubbleEvent = true) {
        super();
        this.inheritState = true;
        this.eventName = eventName;
        if (eventValue) { this.eventValue = new ExpressionProperty(eventValue) }
        this.bubbleEvent = bubbleEvent;
    }
    
    protected onComputeID(): string {
        return `emitEvent[${this.hashedLabel(this.eventName || '')}]`;
    }

    public eventName: string;

    public eventValue: ExpressionProperty<any>;

    public bubbleEvent: boolean;

    public set resultProperty(value: string) {
        this.outputProperty = value;
    }

    public get resultProperty(): string {
        return this.outputProperty;
    }

    public configure(config: EmitEventConfiguration): this {
        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                const value = config[key];
                switch(key) {
                    case 'eventValue':
                        this.eventValue = new ExpressionProperty(value);
                        break;
                    default:
                        super.configure({ [key]: value });
                        break;
                }
            }
        }

        return this;
    }
    
    public async beginDialog(dc: DialogContext): Promise<DialogTurnResult> {
        const value = this.eventValue ? this.eventValue.evaluate(this.id, dc.state.toJSON()) : undefined
        const handled = await dc.emitEvent(this.eventName, value, this.bubbleEvent);
        if (handled) {
            // Defer continuation of plan until next turn
            return Dialog.EndOfTurn;
        } else {
            // Continue execution of plan
            return await dc.endDialog(false);
        }
    }

    public async continueDialog(dc: DialogContext): Promise<DialogTurnResult> {
        // Continue plan execution after interruption
        return await dc.endDialog(true);
    }
}