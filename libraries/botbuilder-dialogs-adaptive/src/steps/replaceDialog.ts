/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogConfiguration, Dialog, DialogContext } from 'botbuilder-dialogs';
import { NamedDialogOption, BeginDialog } from './beginDialog';
import { ExpressionProperty, ExpressionPropertyValue } from '../expressionProperty';

export interface ReplaceDialogConfiguration extends DialogConfiguration {
    /**
     * ID of the dialog to replace the current one with.
     */
    dialogId: string;

    /**
     * (Optional) list of computed options to pass called dialog.
     */
    options?: NamedDialogOption[];
}

export class ReplaceDialog extends Dialog {

    /**
     * ID of the dialog to goto.
     */
    public dialogId: string;

    /**
     * (Optional) Computed options to pass called dialog.
     */
    public options: { [name: string]: ExpressionProperty<any>; } = {};

    /**
     * Creates a new `ReplaceDialog` instance.
     * @param dialogId ID of the dialog to goto.
     */
    constructor(dialogId?: string) {
        super();
        if (dialogId) { this.dialogId = dialogId }
    }

    protected onComputeID(): string {
        return `replaceDialog[${this.hashedLabel(this.dialogId)}]`;
    }

    public addOption(name: string, value: ExpressionPropertyValue<any>): this {
        if (this.options.hasOwnProperty(name)) { throw new Error(`${this.id}: an option named "${name}" has already been added.`) }
        this.options[name] = new ExpressionProperty(value);
        return this;
    }

    public configure(config: ReplaceDialogConfiguration): this {
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

        // Compute options and replace parent dialog
        const options = BeginDialog.computeOptions(this.options, this.id, dc.state.toJSON());
        return await dc.parent.replaceDialog(this.dialogId, options);
    }
}