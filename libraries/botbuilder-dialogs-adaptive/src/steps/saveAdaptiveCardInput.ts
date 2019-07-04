/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogConfiguration, Dialog, DialogContext } from 'botbuilder-dialogs';
import { Activity, InputHints, MessageFactory, CardFactory } from 'botbuilder-core';

export interface SaveAdaptiveCardInputConfiguration extends DialogConfiguration {
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

export class SaveAdaptiveCardInput extends Dialog {
    private inputs: object[];

    public adaptiveCard: object;
    public cardDataProperty?: string;


    /**
     * Creates a new `SaveAdaptiveCardInput` instance.
     */
    constructor(adaptiveCard?: object|string, cardDataProperty?: string) {
        super();
        this.inheritState = true;
        if (adaptiveCard) { this.adaptiveCard = typeof adaptiveCard == 'string' ? JSON.parse(adaptiveCard) : adaptiveCard }
        if (cardDataProperty) { this.cardDataProperty = cardDataProperty }
    }

    protected onComputeID(): string {
        return `SaveAdaptiveCardInput[${this.hashedLabel(JSON.stringify(this.adaptiveCard))}]`;
    }

    public configure(config: SaveAdaptiveCardInputConfiguration): this {
        return super.configure(config);
    }
    
    public async beginDialog(dc: DialogContext): Promise<DialogTurnResult> {
        if (!this.adaptiveCard) { throw new Error(`${this.id}: no adaptive card assigned.`) }

        // Find all input elements on first call
        if (!this.inputs) { 
            this.inputs = SaveAdaptiveCardInput.findInputElements(this.adaptiveCard); 
        }

        // Save any recognized inputs
        for (let i = 0; i < this.inputs.length; i++) {
            const input = this.inputs[i];
            let id: string = input['id'];
            if (id) {
                // Get value from recognized entities
                let value = dc.state.getValue(`@${id}`);
                if (value !== undefined) {
                    // Ignore arrays
                    if (Array.isArray(value)) { value = value[0] }
                    
                    // Prefix ID with card data property
                    if (this.cardDataProperty) {
                        id = `${this.cardDataProperty}.${id}`;
                    }

                    // Save value to memory
                    switch (input['type']) {
                        case 'Input.Number':
                            dc.state.setValue(id, typeof value == 'string' ? parseFloat(value) : value);
                            break;
                        case 'Input.Toggle':
                            dc.state.setValue(id, value == (input['valueOn'] || 'true'));
                            break;
                        default:
                            dc.state.setValue(id, value);
                            break;
                    }
                }
            }
        }

        return await dc.endDialog();
    }

    static findInputElements(card: object): object[] {
        const inputs: object[] = [];
        if (Array.isArray(card)) {
            card.forEach(child => {
                const found = SaveAdaptiveCardInput.findInputElements(child);
                if (found.length > 0) {
                    // Append to output
                    Array.prototype.push.apply(inputs, found);
                }
            });
        } else if (typeof card == 'object') {
            // Process child elements
            for (const prop in card) {
                if (card.hasOwnProperty(prop)) {
                    const found = SaveAdaptiveCardInput.findInputElements(card[prop]);
                    if (found.length > 0) {
                        // Append to output
                        Array.prototype.push.apply(inputs, found);
                    }
                }
            }

            // Process this element
            const type: string = card['type'] || '';
            if (type.startsWith('Input.')) {
                // Append to output
                inputs.push(card);    
            }
        }

        return inputs;
    }
}
