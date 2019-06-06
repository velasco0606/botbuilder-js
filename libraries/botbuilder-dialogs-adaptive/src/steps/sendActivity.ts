/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogConfiguration, Dialog, DialogContext } from 'botbuilder-dialogs';
import { Activity, InputHints } from 'botbuilder-core';
import { ActivityProperty } from '../activityProperty';

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

    /**
     * (Optional) in-memory state property that the result of the send should be saved to.
     * 
     * @remarks
     * This is just a convenience property for setting the dialogs [outputBinding](#outputbinding). 
     */
    resultProperty?: string;
}

export class SendActivity extends Dialog {

    /**
     * Activity to send the user.
     */
    public activity = new ActivityProperty();

    /**
     * Creates a new `SendActivity` instance.
     * @param activityOrText Activity or message text to send the user. 
     * @param speak (Optional) Structured Speech Markup Language (SSML) to speak to the user.
     * @param inputHint (Optional) input hint for the message. Defaults to a value of `InputHints.acceptingInput`.
     */
    constructor();
    constructor(activityOrText: Partial<Activity>|string, speak?: string, inputHint?: InputHints);
    constructor(activityOrText?: Partial<Activity>|string, speak?: string, inputHint?: InputHints) {
        super();
        this.inheritState = true;
        if (activityOrText) { this.activity.value = activityOrText }
        if (speak) { this.activity.speak = speak }
        this.activity.inputHint = inputHint || InputHints.AcceptingInput;
    }

    protected onComputeID(): string {
        return `sendActivity[${this.hashedLabel(this.activity.displayLabel)}]`;
    }

    /**
     * (Optional) in-memory state property that the result of the send should be saved to.
     * 
     * @remarks
     * This is just a convenience property for setting the dialogs [outputBinding](#outputbinding). 
     */
    public set resultProperty(value: string) {
        this.outputProperty = value;
    }

    public get resultProperty(): string {
        return this.outputProperty;
    }

    public configure(config: SendActivityConfiguration): this {
        return super.configure(config);
    }
    
    public async beginDialog(dc: DialogContext): Promise<DialogTurnResult> {
        if (!this.activity.hasValue()) { throw new Error(`${this.id}: no activity assigned.`) } 

        // Send activity and return result
        const activity = this.activity.format(dc, dc.state.toJSON());
        const result = await dc.context.sendActivity(activity);
        return await dc.endDialog(result);
    }
}