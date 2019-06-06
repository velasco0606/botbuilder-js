/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogContext, DialogConfiguration, Dialog } from 'botbuilder-dialogs';
import { ExpressionPropertyValue, ExpressionProperty } from '../expressionProperty';

export interface EditArrayConfiguration extends DialogConfiguration {
    changeType?: ArrayChangeType;

    arrayProperty?: string;
    
    resultProperty?: string;
    
    value?: ExpressionPropertyValue<any>;
}

export enum ArrayChangeType {
    push = 'push',
    pop = 'pop',
    take = 'take',
    remove = 'remove',
    clear = 'clear'
}

export class EditArray extends Dialog {

    constructor();
    constructor(changeType: ArrayChangeType, arrayProperty: string, valueOrResult?: ExpressionPropertyValue<any>|string);
    constructor(changeType?: ArrayChangeType, arrayProperty?: string, valueOrResult?: ExpressionPropertyValue<any>|string) {
        super();
        this.inheritState = true;
        if (changeType) { 
            this.changeType = changeType;
            this.arrayProperty = arrayProperty;
            if (valueOrResult) {
                switch (changeType) {
                    case ArrayChangeType.clear:
                    case ArrayChangeType.pop:
                    case ArrayChangeType.take:
                        if (typeof valueOrResult == 'string') {
                            this.resultProperty = valueOrResult;
                        }
                        break;
                    case ArrayChangeType.push:
                    case ArrayChangeType.remove:
                        this.value = new ExpressionProperty(valueOrResult);
                        break; 
                }
            }
        }
    }
    
    protected onComputeID(): string {
        return `editArray[${this.hashedLabel(this.changeType + ': ' + this.arrayProperty)}]`;
    }

    public changeType: ArrayChangeType;

    public arrayProperty: string;

    public resultProperty?: string;
    
    public value?: ExpressionProperty<any>;

    public configure(config: EditArrayConfiguration): this {
        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                const value = config[key];
                switch(key) {
                    case 'value':
                        this.value = new ExpressionProperty(value);
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
        if (!this.arrayProperty) { throw new Error(`${this.id}: "${this.changeType}" operation couldn't be performed because the listProperty wasn't specified.`) }

        // Get list and ensure populated
        let list: any[] = dc.state.getValue(this.arrayProperty);
        if (!Array.isArray(list)) { list = [] }

        // Manipulate list
        let item: any;
        let serialized: string;
        let result: any;
        switch (this.changeType) {
            case ArrayChangeType.pop:
                item = list.pop();
                result = item;
                break;
            case ArrayChangeType.push:
                this.ensureValue();
                item = this.value.evaluate(this.id, dc.state.toJSON());
                if (item !== undefined) {
                    list.push(item);
                }
                break;
            case ArrayChangeType.take:
                item = list.shift();
                result = item;
                break;
            case ArrayChangeType.remove:
                this.ensureValue();
                item = this.value.evaluate(this.id, dc.state.toJSON());
                if (item != undefined) {
                    serialized = Array.isArray(item) || typeof item == 'object' ? JSON.stringify(item) : undefined;
                    result = false;
                    for (let i = 0; i < list.length; i++) {
                        if ((serialized && JSON.stringify(list[i]) == serialized) || item === list[i]) {
                            list.splice(i, 1);
                            result = true;
                            break;
                        } 
                    }
                }
                break;
            case ArrayChangeType.clear:
                result = list.length > 0;
                list = [];
                break;
        }

        // Save list
        dc.state.setValue(this.arrayProperty, list);
        return await dc.endDialog();
    }

    private ensureValue(): void {
        if (!this.value) { throw new Error(`${this.id}: "${this.changeType}" operation couldn't be performed for list "${this.arrayProperty}" because a value wasn't specified.`) }
    }
}