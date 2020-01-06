/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogConfiguration, DialogContext, Dialog } from 'botbuilder-dialogs';
import { Activity, InputHints } from 'botbuilder-core';
import { ActivityTemplate } from '../templates/activityTemplate';
import { StaticActivityTemplate } from '../templates/staticActivityTemplate';
import { Template } from '../template';

export interface SendActivityConfiguration extends DialogConfiguration {
    /**
     * Activity or message text to send the user.
     */
    activityOrText?: Partial<Activity>|string;

    /**
     * (Optional) Structured Speech Markup Language (SSML) to speak to the user.
     */
    speak?: string;

    /**
     * (Optional) input hint for the message. Defaults to a value of `InputHints.acceptingInput`.
     */
    inputHint?: InputHints;
}

export class SendActivity extends Dialog {

    /**
     * Creates a new `SendActivity` instance.
     * @param activityOrText Activity or message text to send the user.
     * @param speak (Optional) Structured Speech Markup Language (SSML) to speak to the user.
     * @param inputHint (Optional) input hint for the message. Defaults to a value of `InputHints.acceptingInput`.
     */
    constructor();
    constructor(activityOrText: Partial<Activity>|string);
    constructor(activityOrText?: Partial<Activity>|string) {
        super();
        if (activityOrText && typeof activityOrText === 'string') { 
            this.activity = new ActivityTemplate(activityOrText); 
        } else {
            this.activity = new StaticActivityTemplate(activityOrText as Activity); 
        }
    }

    protected onComputeId(): string {
        if (this.activity instanceof ActivityTemplate) {
            return `SendActivity(${ this.ellipsis(this.activity.template.trim(), 30) })`;
        }
        return `SendActivity(${ this.ellipsis(this.activity.toString().trim(), 30) })`;
    }

    public configure(config: SendActivityConfiguration): this {
        return super.configure(config);
    }

    /**
     * Activity to send the user.
     */
    public activity: Template;

    public async beginDialog(dc: DialogContext, options: object): Promise<DialogTurnResult> {
        if (!this.activity) {
            // throw new Error(`SendActivity: no activity assigned for action '${this.id}'.`)
            throw new Error(`SendActivity: no activity assigned for action.`);
        }

        const activity = await this.activity.bindToData(dc.context, dc.state);
        const result = await dc.context.sendActivity(activity);
        return await dc.endDialog(result);
    }

    private ellipsis(text: string, length: number): string {
        if (text.length <= length) {
            return text;
        }

        const pos: number = text.indexOf(' ', length);
        if (pos > 0) {
            return text.substr(0, pos) + '...';
        }

        return text;
    }
}