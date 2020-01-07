/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogConfiguration, DialogContext, Dialog } from 'botbuilder-dialogs';
import { ActivityTemplate } from '../templates/activityTemplate';

export interface SendListConfiguration extends DialogConfiguration {
    /**
     * In-memory state property that contains the map or list.
     */
    listProperty?: string;

    /**
     * Template to use for the main message body.
     */
    messageTemplate?: string;

    /**
     * (Optional) template used to format individual items.
     */
    itemTemplate?: string;
}

export class SendList extends Dialog {
    private _messageTemplate: ActivityTemplate;
    private _itemTemplate: ActivityTemplate;

    /**
     * Creates a new `SendList` instance.
     * @param listProperty In-memory state property that contains the map or list.
     * @param messageTemplate Template to use for the main message body.
     * @param itemTemplate (Optional) template used to format individual items.
     */
    constructor();
    constructor(listProperty: string, messageTemplate: string, itemTemplate?: string);
    constructor(listProperty?: string, messageTemplate?: string, itemTemplate?: string) {
        super();
        if (listProperty) { this.listProperty = listProperty; }
        if (messageTemplate) { this.messageTemplate = messageTemplate; }
        if (itemTemplate) { this.itemTemplate = itemTemplate; }
    }

    protected onComputeId(): string {
        return `SendList[${ this.listProperty }]`;
    }

    /**
     * In-memory state property that contains the map or list.
     */
    public listProperty: string;

    /**
     * Template to use for the main message body.
     */
    public set messageTemplate(value: string) {
        this._messageTemplate = new ActivityTemplate(value);
    }

    public get messageTemplate(): string {
        return this._messageTemplate.template;
    }

    /**
     * (Optional) template used to format individual items.
     */
    public set itemTemplate(value: string) {
        this._itemTemplate = new ActivityTemplate(value);
    }

    public get itemTemplate(): string {
        return this._itemTemplate.template;
    }

    public configure(config: SendListConfiguration): this {
        return super.configure(config);
    }

    public async beginDialog(dc: DialogContext): Promise<DialogTurnResult> {
        // Ensure templates configured
        if (!this.messageTemplate) {
            this.messageTemplate = '{list}';
        } else if (this.messageTemplate.indexOf('{list') < 0) {
            this.messageTemplate += '\n\n{list}';
        }
        if (!this.itemTemplate) {
            this.itemTemplate = '- {item}\n';
        } else if (this.itemTemplate.indexOf('{item') < 0) {
            this.itemTemplate += ' {item}\n';
        }

        // Render list content
        let list = '';
        const value = dc.state.getValue(this.listProperty);
        if (Array.isArray(value) && value.length > 0) {
            value.forEach(async (item): Promise<void> => {
                list += (await this._itemTemplate.bindToData(dc.context, { item: item })).text;
            });
        } else if (typeof value === 'object') {
            for (const key in value) {
                list += (await this._itemTemplate.bindToData(dc.context, { key: key, item: value[key] })).text;
            }
        }

        // Render message
        const activity = await this._messageTemplate.bindToData(dc.context, { utterance: dc.context.activity.text || '', list: list });
        const result = await dc.context.sendActivity(activity);
        return await dc.endDialog(result);
    }
}