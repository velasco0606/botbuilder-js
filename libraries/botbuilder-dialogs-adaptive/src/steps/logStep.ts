/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogConfiguration, DialogContext, Dialog } from 'botbuilder-dialogs';
import { format } from '../stringTemplate';
import { Activity, ActivityTypes } from 'botbuilder-core';

export interface LogStepConfiguration extends DialogConfiguration {
    /**
     * The text template to log.
     */
    text?: string;

    /**
     * If true, the message will both be logged to the console and sent as a trace activity.
     * Defaults to a value of false.
     */
    traceActivity?: boolean;
}

export class LogStep extends Dialog {
    /**
     * The text template to log. 
     */
    public text: string;

    /**
     * If true, the message will both be logged to the console and sent as a trace activity. 
     * Defaults to a value of false.
     */
    public traceActivity: boolean;

    /**
     * Creates a new `LogStep` instance.
     * @param text The text template to log.  
     * @param traceActivity (Optional) If true, the message will both be logged to the console and sent as a trace activity.  Defaults to a value of false.
     */
    constructor();
    constructor(text: string, traceActivity?: boolean);
    constructor(text?: string, traceActivity = false) {
        super();
        if (text) { this.text = text }
        this.traceActivity = traceActivity;
    }

    protected onComputeID(): string {
        return `logStep[${this.hashedLabel(this.text)}]`;
    }

    public configure(config: LogStepConfiguration): this {
        return super.configure(config);
    }
    
    public async beginDialog(dc: DialogContext): Promise<DialogTurnResult> {
        if (!this.text) { throw new Error(`${this.id}: no 'message' specified.`) } 

        // Format message
        const msg = format(this.text, dc.state.toJSON());

        // Log to console and send trace if needed
        console.log(msg);
        if (this.traceActivity) {
            const activity: Partial<Activity> = {
                type: ActivityTypes.Trace,
                name: 'Log',
                valueType: 'Text',
                value: msg
            };
            await dc.context.sendActivity(activity);
        }

        return await dc.endDialog();
    }
}