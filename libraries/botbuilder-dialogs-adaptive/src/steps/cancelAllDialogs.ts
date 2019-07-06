/**
 * @module botbuilder-planning
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogContext, DialogConfiguration, Dialog } from 'botbuilder-dialogs';

export interface CancelAllDialogsConfiguration extends DialogConfiguration {
    eventName?: string;
    eventValue?: string;
    eventValueProperty?: string;
}

export class CancelAllDialogs extends Dialog {

    constructor();
    constructor(eventName: string, eventValue?: string|object);
    constructor(eventName?: string, eventValue?: string|object) {
        super();
        this.eventName = eventName;
        if (typeof eventValue == 'string') {
            this.eventValueProperty = eventValue;
        } else {
            this.eventValue = eventValue
        }
    }
    
    protected onComputeID(): string {
        return `cancelAllDialogs[${this.hashedLabel(this.eventName || '')}]`;
    }

    public eventName: string;

    public eventValue: object;

    public set eventValueProperty(value: string) {
        this.inputProperties['eventValue'] = value;
    }

    public get eventValueProperty(): string {
        return this.inputProperties['eventValue'];
    }

    public configure(config: CancelAllDialogsConfiguration): this {
        return super.configure(config);
    }
    
    public async beginDialog(dc: DialogContext, options: object): Promise<DialogTurnResult> {
        const opt = Object.assign({
            eventName: this.eventName,
            eventValue: this.eventValue
        }, options);
        return await dc.cancelAllDialogs(opt.eventName, opt.eventValue);
    }
}