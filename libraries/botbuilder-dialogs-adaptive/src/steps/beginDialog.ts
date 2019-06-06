/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Dialog, DialogTurnResult, DialogConfiguration, DialogContext, DialogContextVisibleState } from 'botbuilder-dialogs';
import { ExpressionPropertyValue, ExpressionProperty } from '../expressionProperty';

export interface BeginDialogConfiguration extends DialogConfiguration {
    /**
     * ID of the dialog to call.
     */
    dialogId?: string;

    /**
     * (Optional) list of computed options to pass called dialog.
     */
    options?: NamedDialogOption[];

    resultProperty?: string;

    /**
     * (Optional) in-memory property to bind the dialogs input and output to.
     * 
     * @remarks
     * The called dialog will be able to access the passed in value via `dialog.value` or
     * the shortcut of `$value`.
     */
    valueProperty?: string;
}

export interface NamedDialogOption {
    name: string;
    value: ExpressionPropertyValue<any>; 
}

export class BeginDialog extends Dialog {
    /**
     * ID of the dialog to call.
     */
    public dialogId: string;

    /**
     * (Optional) Computed options to pass called dialog.
     */
    public options: { [name: string]: ExpressionProperty<any>; } = {};


    /**
     * Creates a new `BeginDialog` instance.
     * @param dialogId ID of the dialog to call.
     * @param valueProperty (Optional) in-memory property to bind the dialogs input and output to.
     */
    constructor();
    constructor(dialogId: string, valueProperty?: string)
    constructor(dialogId?: string, valueProperty?: string) {
        super();
        this.inheritState = true;
        if (dialogId) { this.dialogId = dialogId }
        if (valueProperty) { this.valueProperty = valueProperty }
    }

    public set resultProperty(value: string) {
        this.outputProperty = value;
    }

    public get resultProperty(): string {
        return this.outputProperty;
    }

    /**
     * (Optional) in-memory property to bind the dialogs input and output to.
     * 
     * @remarks
     * The called dialog will be able to access the passed in value via `dialog.value` or
     * the shortcut of `$value`.
     */
    public set valueProperty(value: string) {
        this.options['value'] = new ExpressionProperty(value);
        this.resultProperty = value;
    }

    public get valueProperty(): string {
       return this.options.hasOwnProperty('value') ? this.resultProperty : undefined; 
    }

    protected onComputeID(): string {
        return `beginDialog[${this.hashedLabel(this.dialogId + ':' + this.bindingPath(false))}]`;
    }

    public addOption(name: string, value: ExpressionPropertyValue<any>): this {
        if (this.options.hasOwnProperty(name)) { throw new Error(`${this.id}: an option named "${name}" has already been added.`) }
        this.options[name] = new ExpressionProperty(value);
        return this;
    }

    public configure(config: BeginDialogConfiguration): this {
        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                const value = config[key];
                switch(key) {
                    case 'options':
                        if (Array.isArray(value)) {
                            (value as NamedDialogOption[]).forEach(opt => this.addOption(opt.name, opt.value))
                        }
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
        // Compute options and begin dialog
        const options = BeginDialog.computeOptions(this.options, this.id, dc.state.toJSON());
        return await dc.beginDialog(this.dialogId, options);
    }

    static computeOptions(options: { [name:string]: ExpressionProperty<any>; }, stepId: string, memory: DialogContextVisibleState): object {
        const output: object = {};
        for (const name in options) {
            if (options.hasOwnProperty(name)) {
                output[name] = options[name].evaluate(stepId, memory);
            }
        }

        return output;
    }
}