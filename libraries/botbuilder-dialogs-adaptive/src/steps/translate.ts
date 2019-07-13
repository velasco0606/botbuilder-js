/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogConfiguration, DialogContext, Dialog } from 'botbuilder-dialogs';
import { ExpressionPropertyValue, ExpressionProperty } from '../expressionProperty';
import fetch from 'node-fetch';

export interface TranslateConfiguration extends DialogConfiguration {
    properties?: string[];

    locale?: ExpressionPropertyValue<string>;
}

export class Translate extends Dialog {
    public properties: string[] = [];

    public locale: ExpressionProperty<string>;

    public subscriptionKey: string;

    /**
     * Creates a new `Translate` instance.
     */
    constructor();
    constructor(properties: string|string[], locale: ExpressionPropertyValue<string>, subscriptionKey: string);
    constructor(properties?: string|string[], locale?: ExpressionPropertyValue<string>, subscriptionKey?: string) {
        super();
        this.inheritState = true;
        if (properties) { 
            this.properties = Array.isArray(properties) ? properties : [properties];
            this.locale = new ExpressionProperty(locale); 
        }
    }

    protected onComputeID(): string {
        return `translate[${this.hashedLabel(this.properties.join(','))}]`;
    }

    public configure(config: TranslateConfiguration): this {
        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                const value = config[key];
                switch(key) {
                    case 'locale':
                        this.locale = new ExpressionProperty(value);
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
        // Ensure planning context and condition
        if (this.properties.length == 0) { throw new Error(`${this.id}: no 'properties' specified.`) }
        if (!this.locale) { throw new Error(`${this.id}: no 'locale' expression specified.`) }
        if (!this.subscriptionKey) { throw new Error(`${this.id}: no 'subscriptionKey' specified.`) }

        // Determine locale to translate to
        const memory = dc.state.toJSON();
        const locale = this.locale.evaluate(this.id, memory);

        // Get properties to translate
        const props: string[] = [];
        const translations: Translation[] = [];
        for (let i = 0; i < this.properties.length; i++) {
            const prop = this.properties[i];
            const value = dc.state.getValue(prop);
            if (typeof value == 'string' && value.length > 0) {
                props.push(prop);
                translations.push({ text: value });
            }
        }

        // Perform translations
        if (translations.length > 0) {
            const traceId = `${this.id}-${new Date().getTime()}`;
            const results = await translate(translations, locale, this.subscriptionKey, traceId);

            // Copy translated results back to properties
            for (let i = 0; i < results.length; i++) {
                const prop = props[i];
                const text = results[i].text;
                dc.state.setValue(prop, text);
            }
        }

        return await dc.endDialog();
    }
}

interface Translation {
    text: string;
}

async function translate(translations: Translation[], locale: string, subscriptionKey: string, traceId: string): Promise<Translation[]> {
    const res = await fetch(`https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${locale}`, {
        method: 'post',
        body: JSON.stringify(translations),
        headers: { 
            'Ocp-Apim-Subscription-Key': subscriptionKey,
            'Content-Type': 'application/json',
            'X-ClientTraceId': traceId
        }
    });

    const output: Translation[] = [];
    const json = await res.json();
    if (Array.isArray(json)) {
        for (let i = 0; i < json.length; i++) {
            output.push(json[0].translations[0]);
        }
    }    
    return output;
}
