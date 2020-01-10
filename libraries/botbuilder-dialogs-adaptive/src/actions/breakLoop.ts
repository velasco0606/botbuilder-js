/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, Dialog, DialogContext, Configurable, DialogConfiguration } from 'botbuilder-dialogs';
import { Expression, ExpressionEngine } from 'botframework-expressions';
import { ActionScopeResult, ActionScopeCommands } from './actionScope';

export interface BreakLoopConfiguration extends DialogConfiguration {
    disabled?: string;
}

export class BreakLoop<O extends object = {}> extends Dialog<O> implements Configurable {
    public static declarativeType = 'Microsoft.BreakLoop';

    /**
     * Get an optional expression which if is true will disable this action.
     */
    public get disabled(): string {
        return this._disabled ? this._disabled.toString() : undefined;
    }

    /**
     * Set an optional expression which if is true will disable this action.
     */
    public set disabled(value: string) {
        this._disabled = value ? new ExpressionEngine().parse(value) : undefined;
    }

    private _disabled: Expression;

    public configure(config: BreakLoopConfiguration): this {
        return super.configure(config);
    }

    public async beginDialog(dc: DialogContext, options?: O): Promise<DialogTurnResult> {
        if (this._disabled) {
            const { value } = this._disabled.tryEvaluate(dc.state);
            if (!!value) {
                return await dc.endDialog();
            }
        }

        const actionScopeResult: ActionScopeResult = {
            actionScopeCommand: ActionScopeCommands.BreakLoop
        };

        return await dc.endDialog(actionScopeResult);
    }

    protected onComputeId(): string {
        return `BreakLoop[]`;
    }
}