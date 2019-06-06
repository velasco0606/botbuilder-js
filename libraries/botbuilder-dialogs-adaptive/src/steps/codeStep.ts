/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogContext, Dialog, DialogConfiguration } from 'botbuilder-dialogs';
import { SequenceContext } from '../sequenceContext';

export interface CodeStepConfiguration extends DialogConfiguration {
    handler?: CodeStepHandler;
}

export type CodeStepHandler<T extends DialogContext = SequenceContext> = (context: T, options?: object) => Promise<DialogTurnResult>;

export class CodeStep<T extends DialogContext = SequenceContext> extends Dialog {
    private handler: CodeStepHandler<T>;

    constructor(handler?: CodeStepHandler<T>) {
        super();
        this.inheritState = true;
        this.handler = handler;
    }
    
    protected onComputeID(): string {
        return `codeStep[${this.hashedLabel(this.handler.toString())}]`;
    }
 
    public configure(config: CodeStepConfiguration): this {
        return super.configure(config);
    }
   
    public async beginDialog(context: T, options: object): Promise<DialogTurnResult> {
        return await this.handler(context, options);
    }
}