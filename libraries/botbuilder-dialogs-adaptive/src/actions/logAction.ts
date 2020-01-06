/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogConfiguration, DialogContext, Dialog } from 'botbuilder-dialogs';
import { Template } from '../template';
import { TextTemplate } from '../templates/textTemplate';
import { Activity, ActivityTypes } from 'botbuilder-core';

export class LogAction extends Dialog {
    /**
     * The text template to log.
     */
    public text: Template;

    /**
     * If true, the message will both be logged to the console and sent as a trace activity.
     * Defaults to a value of false.
     */
    public sendTrace: boolean;

    /**
     * Creates a new `SendActivity` instance.
     * @param template The text template to log.
     * @param sendTrace (Optional) If true, the message will both be logged to the console and sent as a trace activity.  Defaults to a value of false.
     */
    constructor();
    constructor(template: string, sendTrace?: boolean);
    constructor(template?: string, sendTrace = false) {
        super();
        if (template) { this.text = new TextTemplate(template); }
        this.sendTrace = sendTrace;
    }

    protected onComputeId(): string {
        return `LogAction[${ this.text }]`;
    }

    public async beginDialog(dc: DialogContext, options: object): Promise<DialogTurnResult> {
        const msg = await this.text.bindToData(dc.context, dc.state);

        // Log to console and send trace if needed
        console.log(msg);
        if (this.sendTrace) {
            const activity: Partial<Activity> = {
                type: ActivityTypes.Trace,
                name: 'LogAction',
                valueType: 'string',
                value: msg
            };
            await dc.context.sendActivity(activity);
        }

        return await dc.endDialog();
    }
}