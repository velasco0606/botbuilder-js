/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogConfiguration, DialogContext, Dialog } from 'botbuilder-dialogs';
import { NamedDialogOption, BeginDialog } from './beginDialog';
import { ExpressionProperty, ExpressionPropertyValue } from '../expressionProperty';

export interface RepeatDialogConfiguration extends DialogConfiguration {
    /**
     * (Optional) list of computed options to pass called dialog.
     */
    options?: NamedDialogOption[];
}

export class RepeatDialog extends Dialog {
    /**
     * (Optional) Computed options to pass called dialog.
     */
    public options: { [name: string]: ExpressionProperty<any>; } = {};

    /**
     * Creates a new `RepeatDialog` instance.
     */
    constructor() {
        super();
        this.inheritState = true;
    }

    protected onComputeID(): string {
        return `repeatDialog[${this.bindingPath()}]`;
    }

    public addOption(name: string, value: ExpressionPropertyValue<any>): this {
        if (this.options.hasOwnProperty(name)) { throw new Error(`${this.id}: an option named "${name}" has already been added.`) }
        this.options[name] = new ExpressionProperty(value);
        return this;
    }

    public configure(config: RepeatDialogConfiguration): this {
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
        if (!dc.parent) { throw new Error(`${this.id}: step should only ever be used within a container dialog.`) }

        // Compute options and reload parent dialog
        const options = BeginDialog.computeOptions(this.options, this.id, dc.state.toJSON());
        const dialogId = dc.parent.activeDialog.id;
        return await dc.parent.replaceDialog(dialogId, options);
    }
}