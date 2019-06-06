/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogConfiguration, DialogContext, Dialog } from 'botbuilder-dialogs';
import { ExpressionPropertyValue, ExpressionProperty } from '../expressionProperty';

export interface EndDialogConfiguration extends DialogConfiguration {
    /**
     * (Optional) specifies an in-memory state property that should be returned to the calling
     * dialog.
     */
    returnValue?: ExpressionPropertyValue<any>;
}

export class EndDialog extends Dialog {

    /**
     * Creates a new `EndDialog` instance.
     * @param returnValue (Optional) in-memory state property to return to the called dialog.
     */
    constructor(returnValue?: ExpressionPropertyValue<any>) {
        super();
        this.inheritState = true;
        if (returnValue) { this.returnValue = new ExpressionProperty(returnValue) }
    }

    public configure(config: EndDialogConfiguration): this {
        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                const value = config[key];
                switch(key) {
                    case 'returnValue':
                        this.returnValue = new ExpressionProperty(value);
                        break;
                    default:
                        super.configure({ [key]: value });
                        break;
                }
            }
        }

        return this;
    }

    protected onComputeID(): string {
        const label = this.returnValue ? this.returnValue.toString() : '';
        return `endDialog[${this.hashedLabel(label)}]`;
    }

    /**
     * (Optional) specifies an in-memory state property that should be returned to the calling
     * dialog.
     */
    public returnValue?: ExpressionProperty<any>;

    public async beginDialog(dc: DialogContext): Promise<DialogTurnResult> {
        if (!dc.parent) { throw new Error(`${this.id}: step should only ever be used within a container dialog.`) }

        // Compute return value and end parent dialog
        const returnValue = this.returnValue ? this.returnValue.evaluate(this.id, dc.state.toJSON()) : undefined;
        return await dc.parent.endDialog(returnValue);
    }
}