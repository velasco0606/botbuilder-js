/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Dialog, DialogContext, DialogTurnResult, DialogConfiguration } from 'botbuilder-dialogs';
import { SequenceContext } from '../sequenceContext';

export interface DeletePropertiesConfiguration extends DialogConfiguration {
    properties?: string[];
}

export class DeleteProperties<O extends object = {}> extends Dialog<O> {

    public static declarativeType = 'Microsoft.DeleteProperties';

    public constructor();
    public constructor(properties?: string[]) {
        super();
        if (properties) { this.properties = properties; }
    }

    /**
     * Collection of property paths to remove.
     */
    public properties: string[] = [];

    public configure(config: DeletePropertiesConfiguration): this {
        return super.configure(config);
    }

    public async beginDialog(dc: DialogContext, options?: O): Promise<DialogTurnResult> {
        if (dc instanceof SequenceContext) {
            if (this.properties && this.properties.length > 0) {
                for (let i = 0; i < this.properties.length; i++) {
                    dc.state.deleteValue(this.properties[i]);
                }
            }

            return await dc.endDialog();
        } else {
            throw new Error('`DeleteProperties` should only be used in the context of an adaptive dialog.');
        }
    }

    protected onComputeId(): string {
        return `DeleteProperties[${ this.properties.join(',') }]`;
    }
}