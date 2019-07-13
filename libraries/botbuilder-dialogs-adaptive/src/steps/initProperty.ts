/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogConfiguration, DialogContext, Dialog } from 'botbuilder-dialogs';

export interface InitPropertyConfiguration extends DialogConfiguration {
    /**
     * The in-memory property to initialize.
     */
    property?: string;

    /**
     * Type, either `array` or `object`.
     */
    type?: string;

}

export class InitProperty extends Dialog {
    /**
     * The in-memory property to initialize.
     */
    public property: string;

    /**
     * Type, either `array` or `object`.
     */
    public type: string;

    /**
     * Creates a new `InitProperty` instance.
     * @param property The in-memory property to initialize.
     * @param type Type, either `array` or `object`.
     */
    constructor();
    constructor(property: string, type: string);
    constructor(property?: string, type?: string) {
        super();
        this.inheritState = true;
        if (property) { this.property = property }
        if (type) { this.type = type }
    }

    protected onComputeID(): string {
        return `initProperty[${this.hashedLabel(this.property)}]`;
    }

    public configure(config: InitPropertyConfiguration): this {
        return super.configure(config);
    }

    public async beginDialog(dc: DialogContext): Promise<DialogTurnResult> {
        // Initialize property
        if (!this.property) { throw new Error(`${this.id}: no 'property' specified.`) }
        switch (this.type) {
            case 'array':
                dc.state.setValue(this.property, []);
                break;
            case 'object':
                dc.state.setValue(this.property, {});
                break;
            default:
                throw new Error(`${this.id}: invalid type of "${this.type}" specified.`)
        }

        return await dc.endDialog();
    }
}
