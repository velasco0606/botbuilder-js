/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogContext } from './dialogContext';
import { MessageFactory, CardFactory, Activity, ActivityTypes } from 'botbuilder-core';

export class DialogDebugger {
    private readonly dc: DialogContext;

    constructor(dc: DialogContext) {
        this.dc = dc;
    }

    public isDebugging(): boolean {
        const debugging = this.dc.context.turnState.get('https://www.botframework.com/state/debugging');
        return typeof debugging == 'boolean' ? debugging : false;
    }

    public isTracing(category = '*'): boolean {
        const filters = this.traceFilters;
        return filters.indexOf(category) >= 0;
    }

    public get traceFilters(): string[] {
        const filters = this.dc.context.turnState.get('https://www.botframework.com/state/traceFilters');
        return Array.isArray(filters) ? filters : [];
    }

    public async trace(label: string, memory?: object): Promise<void>;
    public async trace(category: string, label: string, memory?: object): Promise<void>;
    public async trace(category: string, label?: string|object, memory?: object): Promise<void> {
        if (typeof label != 'string') {
            memory = label;
            label = category;
            category = undefined;

        }

        if (this.isTracing(category)) {
            // Send trace activity
            const activity: Partial<Activity> = {
                type: ActivityTypes.Trace,
                timestamp: new Date(),
                name: 'BotState',
                label: label,
                value: memory,
                valueType: 'https://www.botframework.com/schemas/botState'
            };
            await this.dc.context.sendActivity(activity);
        }
    }
}
