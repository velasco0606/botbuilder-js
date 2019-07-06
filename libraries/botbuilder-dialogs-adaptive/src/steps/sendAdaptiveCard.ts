/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogConfiguration, Dialog, DialogContext } from 'botbuilder-dialogs';
import { MessageFactory, CardFactory } from 'botbuilder-core';
import * as jsonpath from 'jsonpath';
import { AdaptiveCardTemplate } from '../adaptiveCardTemplate';

export interface SendAdaptiveCardConfiguration extends DialogConfiguration {
    template?: object|string;
    dataProperty?: string;
    resultProperty?: string;
}

export class SendAdaptiveCard extends Dialog {

    public template: AdaptiveCardTemplate;
    public dataProperty?: string;

    /**
     * Creates a new `SendAdaptiveCard` instance.
     */
    constructor(template?: object|string, dataProperty?: string) {
        super();
        this.inheritState = true;
        if (template) { this.template = new AdaptiveCardTemplate(template) }
        if (dataProperty) { this.dataProperty = dataProperty }
    }

    protected onComputeID(): string {
        return `SendAdaptiveCard[${this.hashedLabel(this.template.asString)}]`;
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

    public configure(config: SendAdaptiveCardConfiguration): this {
        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                const value = config[key];
                switch(key) {
                    case 'template':
                        this.template = new AdaptiveCardTemplate(value);
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
        if (!this.template) { throw new Error(`${this.id}: no adaptive card template assigned.`) }

        // Render card
        const memory = dc.state.toJSON();
        const data = this.dataProperty ? jsonpath.value(memory, this.dataProperty) || {} : memory;
        const card = this.template.render(data);

        // Send card as attachment
        const activity = MessageFactory.attachment(CardFactory.adaptiveCard(card));
        const result = await dc.context.sendActivity(activity);
        return await dc.endDialog(result);
    }
}
