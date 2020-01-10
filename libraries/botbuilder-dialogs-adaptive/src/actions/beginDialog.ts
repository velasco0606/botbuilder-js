/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogContext, DialogReason } from 'botbuilder-dialogs';
import { BaseInvokeDialog, BaseInvokeDialogConfiguration } from './baseInvokeDialog';

export interface BeginDialogConfiguration extends BaseInvokeDialogConfiguration {
    resultProperty?: string;
}

export class BeginDialog<O extends object = {}> extends BaseInvokeDialog<O> {

    public static declarativeType = 'Microsoft.BeginDialog';

    /**
     * Creates a new `BeginDialog` instance.
     * @param dialogIdToCall ID of the dialog to call.
     * @param options (Optional) static options to pass the called dialog.
     */
    public constructor();
    public constructor(dialogIdToCall: string, options?: O)
    public constructor(dialogIdToCall?: string, options?: O) {
        super(dialogIdToCall, options);
    }

    /**
     * (Optional) property path to store the dialog result in.
     */
    public resultProperty?: string;

    public configure(config: BeginDialogConfiguration): this {
        return super.configure(config);
    }

    public async beginDialog(dc: DialogContext, options?: O): Promise<DialogTurnResult> {
        const dialog = this.resolveDialog(dc);
        const boundOptions = this.bindOptions(dc, options);
        if (this.includeActivity) {
            dc.state.setValue('turn.activityProcessed', false);
        }
        return await dc.beginDialog(dialog.id, boundOptions);
    }

    public async resumeDialog(dc: DialogContext, reason: DialogReason, result: any = null): Promise<DialogTurnResult> {
        if (this.resultProperty) {
            dc.state.setValue(this.resultProperty, result);
        }
        return await dc.endDialog(result);
    }
}