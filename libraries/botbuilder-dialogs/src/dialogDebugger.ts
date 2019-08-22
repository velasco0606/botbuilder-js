/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogContext } from './dialogContext';
import { Activity, ActivityTypes } from 'botbuilder-core';

export enum TraceLevel {
    off = 'off',
    error = 'error',
    warning = 'warning',
    info = 'info',
    verbose = 'verbose'
}


/** @private */
const TraceLevelMap = {
    off: 0,
    error: 1,
    warning: 2,
    info: 3,
    verbose: 4   
}

export class DialogDebugger {
    private readonly dc: DialogContext;

    constructor(dc: DialogContext) {
        this.dc = dc;
    }

    public isDebugging(): boolean {
        const debugging = this.dc.context.turnState.get('https://www.botframework.com/state/debugging');
        return typeof debugging == 'boolean' ? debugging : false;
    }

    public get traceLevel(): TraceLevel {
        if (this.isDebugging) {
            const level = this.dc.context.turnState.get('https://www.botframework.com/state/traceLevel');
            return level || TraceLevel.off;
        }

        return TraceLevel.off;
    }

    public async sendTrace(label: string, memory?: object): Promise<void>;
    public async sendTrace(level: TraceLevel, label: string, memory?: object): Promise<void>;
    public async sendTrace(level: TraceLevel, label?: string|object, memory?: object): Promise<void> {
        if (typeof label != 'string') {
            memory = label;
            label = level;
            level = TraceLevel.info;
        }

        // Should we trace
        const traceLevel = TraceLevelMap[this.traceLevel]
        if (traceLevel > 0 && TraceLevelMap[level] <= traceLevel) {
            // Send trace activity
            const activity: Partial<Activity> = {
                type: ActivityTypes.Trace,
                timestamp: new Date(),
                name: level,
                label: label,
                value: memory,
                valueType: 'https://www.botframework.com/schemas/trace'
            };
            await this.dc.context.sendActivity(activity);
        }
    }
}
