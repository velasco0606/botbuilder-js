/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogConfiguration, Dialog, DialogContext } from 'botbuilder-dialogs';
import { Activity, InputHints, MessageFactory, CardFactory } from 'botbuilder-core';
import { format } from '../stringTemplate';
import * as jsonpath from 'jsonpath';

export interface SendAdaptiveCardConfiguration extends DialogConfiguration {
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

export class SendAdaptiveCard extends Dialog {

    public adaptiveCard: string;
    public cardDataProperty?: string;


    /**
     * Creates a new `SendAdaptiveCard` instance.
     */
    constructor(adaptiveCard?: object|string, cardDataProperty?: string) {
        super();
        this.inheritState = true;
        if (adaptiveCard) { this.adaptiveCard = typeof adaptiveCard == 'string' ? adaptiveCard : JSON.stringify(adaptiveCard) }
        if (cardDataProperty) { this.cardDataProperty = cardDataProperty }
    }

    protected onComputeID(): string {
        return `SendAdaptiveCard[${this.hashedLabel(this.adaptiveCard)}]`;
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
        return super.configure(config);
    }
    
    public async beginDialog(dc: DialogContext): Promise<DialogTurnResult> {
        if (!this.adaptiveCard) { throw new Error(`${this.id}: no adaptive card assigned.`) }

        // Clone adaptive card and data bind
        const card = JSON.parse(this.adaptiveCard);
        const memory = dc.state.toJSON();
        const data = this.cardDataProperty ? jsonpath.value(memory, this.cardDataProperty) || {} : memory;
        SendAdaptiveCard.fillCard(card, data);

        // Send card as attachment
        const activity = MessageFactory.attachment(CardFactory.adaptiveCard(card));
        const result = await dc.context.sendActivity(activity);
        return await dc.endDialog(result);
    }

    static fillCard(card: object, data: object): void {
        if (Array.isArray(card)) {
            // Fill each child element
            card.forEach(value => SendAdaptiveCard.fillCard(value, data));
        } else if (typeof card == 'object') {
            // Fill child elements
            for (const prop in card) {
                if (card.hasOwnProperty(prop)) {
                    SendAdaptiveCard.fillCard(card[prop], data);
                }
            }

            // Format string templates
            const type = card['type'] || '';
            if (textFields.hasOwnProperty(type)) {
                const fields = textFields[type];
                for (let i = 0; i < fields.length; i++) {
                    const prop = fields[i];
                    if (card.hasOwnProperty(prop)) {
                        const value = card[prop];
                        switch (fields[i]) {
                            case 'inlines':
                                // Special case array of inlines
                                if (Array.isArray(value)) {
                                    for (let j = 0; j < value.length; j++) {
                                        if (typeof value[j] == 'string') {
                                            value[j] = format(value[j], data);
                                        }
                                    }
                                }
                                break;
                            case 'facts':
                            case 'choices':
                                // Special case fact & choice arrays
                                if (Array.isArray(value)) {
                                    for (let j = 0; j < value.length; j++) {
                                        if (typeof value[j] == 'object') {
                                            value[j]['title'] = format(value[j]['title'] || '', data);
                                            value[j]['value'] = format(value[j]['value'] || '', data);
                                        }
                                    }
                                }
                                break;
                            default:
                                // Format value
                                card[prop] = format(value || '', data);
                                break;
                        }
                    }
                }
            }


            // Data bind this element
            const id = card['id'];
            if (id) {
                // Get backing value
                const dataValue = jsonpath.value(data, id);
                const dataType = typeof dataValue;

                // Lookup mapping function for type
                const mapper = dataMappers[type];
                if (mapper) {
                    // Map data to element
                    mapper(card, dataValue, dataType);
                }
            }
        }

    }
}

const textFields: { [type: string]: string[]; } = {
    'AdaptiveCard': ['fallbackText', 'speak'],

    // Card elements
    'TextBlock': ['text'],
    'Image': ['altText'],
    'Media': ['altText'],
    'RichTextBlock': ['inlines'],
    'TextRun': ['text'],

    // Containers
    'FactSet': ['facts'],

    // Actions
    'Action.OpenUrl': ['title'],
    'Action.Submit': ['title'],
    'Action.ShowCard': ['title'],
    'Action.ToggleVisibility': ['title'],

    // Inputs
    'Input.Text': ['placeholder', 'value'],
    'Input.Number': ['placeholder'],
    'Input.Date': ['placeholder', 'value'],
    'Input.Time': ['placeholder', 'value'],
    'Input.Toggle': ['placeholder', 'value', 'valueOff', 'valueOn'],
    'Input.ChoiceSet': ['choices', 'value']
};

type DataMapper = (card: object, value: any, type: string) => void;

const dataMappers: { [type: string]: DataMapper; } = {
    // Card Elements
    'TextBlock': (card, value, type) => copyStringProp('text', card, value, type, true),
    'Image': (card, value, type) => copyStringProp('url', card, value, type, true),
    'Media': (card, value, type) => {
        if (Array.isArray(value)) {
            card['sources'] = value;
        } else if (type == 'object') {
            if (value['url'] && value['mimeType']) {
                card['sources'] = [value];
            } else {
                copyTo(value, card);
            }
        }
    },
    'RichTextBlock': (card, value, type) => copyArrayProp('inlines', card, value, type),
    'TextRun': (card, value, type) => copyStringProp('text', card, value, type, true),

    // Containers
    'ActionSet': (card, value, type) => copyArrayProp('actions', card, value, type),
    'Container': (card, value, type) => copyArrayProp('items', card, value, type),
    'ColumnSet': (card, value, type) => copyArrayProp('columns', card, value, type),
    'Column': (card, value, type) => copyArrayProp('items', card, value, type),
    'FactSet': (card, value, type) => copyArrayProp('facts', card, value, type),
    'ImageSet': (card, value, type) => copyArrayProp('images', card, value, type),

    // Actions
    'Action.OpenUrl': (card, value, type) => copyStringProp('url', card, value, type),
    'Action.Submit': (card, value, type) => copyTo(value, card),
    'Action.ShowCard': (card, value, type) => copyTo(value, card),
    'Action.ToggleVisibility': (card, value, type) => copyTo(value, card),

    // Inputs
    'Input.Text': (card, value, type) => copyStringProp('value', card, value, type),
    'Input.Number': (card, value, type) => copyNumberProp('value', card, value, type),
    'Input.Date': (card, value, type) => copyStringProp('value', card, value, type),
    'Input.Time': (card, value, type) => copyStringProp('value', card, value, type),
    'Input.Toggle': (card, value, type) => {
        if (type == 'object') {
            copyTo(value, card);
        } else if (value) {
            card['value'] = card['valueOn'] || 'true';
        }
    },
    'Input.ChoiceSet': (card, value, type) => copyStringProp('value', card, value, type)
}

function copyArrayProp(prop: string, card: object, value: any, type: string): void {
    if (Array.isArray(value)) {
        card[prop] = value;
    } else if (type == 'object') {
        copyTo(value, card);
    }
}

function copyStringProp(prop: string, card: object, value: any, type: string, required = false): void {
    if (type == 'object') {
        copyTo(value, card);
    } else if (type == 'string' || required) {
        card[prop] = value || '';
    }
}

function copyNumberProp(prop: string, card: object, value: any, type: string): void {
    if (type == 'object') {
        copyTo(value, card);
    } else if (type == 'number') {
        card[prop] = value;
    } else if (type == 'string') {
        card[prop] = Number(value);
    }
}

function copyTo(from: object, to: object): void {
    for (const key in from) {
        if (from.hasOwnProperty(key)) {
            to[key] = from[key];
        }
    }
}