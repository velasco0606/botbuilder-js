/**
 * @module botbuilder-planning
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogContext, DialogConfiguration, Dialog } from 'botbuilder-dialogs';
import { ExpressionPropertyValue, ExpressionProperty } from '../expressionProperty';

export interface CancelDialogConfiguration extends DialogConfiguration {
    eventName?: string;
    eventValue?: ExpressionPropertyValue<any>;
}

export class CancelAllDialogs extends Dialog {

    constructor(eventName?: string, eventValue?: ExpressionPropertyValue<any>) {
        super();
        this.inheritState = true;
        this.eventName = eventName;
        if (eventValue) { this.eventValue = new ExpressionProperty(eventValue) }
    }
    
    protected onComputeID(): string {
        return `cancelAllDialogs[${this.hashedLabel(this.eventName || '')}]`;
    }

    public eventName?: string;

    public eventValue?: ExpressionProperty<any>;

    public configure(config: CancelDialogConfiguration): this {
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
    
    public async beginDialog(dc: DialogContext, options: object): Promise<DialogTurnResult> {
        const value = this.eventValue ? this.eventValue.evaluate(this.id, dc.state.toJSON()) : undefined;
        return await dc.cancelAllDialogs(this.eventName, value);
    }
}