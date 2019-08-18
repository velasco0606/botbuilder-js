/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogContext } from './dialogContext';
import { MessageFactory, CardFactory } from 'botbuilder-core';

export class DialogDebugger {
    private readonly dc: DialogContext;

    constructor(dc: DialogContext) {
        this.dc = dc;
    }

    public set traceEnabled(value: boolean) {
        const scope = this.dc.state.getScope('conversation') ? 'conversation' : 'turn';
        this.dc.state.setValue(`${scope}.$traceEnabled`, value);
    }

    public get traceEnabled(): boolean {
        const scope = this.dc.state.getScope('conversation') ? 'conversation' : 'turn';
        return !!this.dc.state.getValue(`${scope}.$traceEnabled`);
    }

    public async trace(title: string, settings?: object): Promise<void> {
        if (this.traceEnabled) {
            // Initialize card
            const card = {
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                "type": "AdaptiveCard",
                "version": "1.0",
                "body": [
                    {
                        "type": "TextBlock",
                        "size": "Small",
                        "weight": "Bolder",
                        "text": '🔍 ' + title
                    },
                    {
                        "type": "Container",
                        "items": []
                    }
                ]
            };

            // Render state & settings
            const memory: any = {
                state: this.dc.state.getScope('dialog')
            }
            if (settings) { memory.settings = settings }
            this.renderObject(memory, card.body[1] as any, '$');

            // Send card
            const msg = MessageFactory.attachment(CardFactory.adaptiveCard(card));
            await this.dc.context.sendActivity(msg);
        }
    }


    private renderProperty(name: string, value: any, container: { items: object[]; }, path: string): void {
        const depth = this.getDepth(path);
        const type = Array.isArray(value) ? 'array' : typeof value;
        const hasChildren = ((type == 'array' || type == 'object') && depth <= 10);

        // Add column set
        const row = {
            'type': 'ColumnSet',
            'columns': []
        };
        container.items.push(row);
        
        // Add expando chevron
        const columns = row.columns;
        if (hasChildren) {
            columns.push(this.createChevron(path, true));
            columns.push(this.createChevron(path, false));
        } else {
            columns.push(this.createColumn([], {
                'spacing': 'None',
                'verticalContentAlignment': 'Center',
                'width': '20px'
            }));
        }

        // Add property name
        columns.push(this.createColumn([{
            'type': 'TextBlock',
            'text': name + ':',
            'weight': 'Bolder'
        }], {
            'spacing': 'Small'
        }));

        // Add value
        let v: string;
        switch (type) {
            case 'array':
                v = `[${value.length}]`;
                break;
            case 'object':
                v = 'object';
                break;
            default:
                v = value.toString();
                break;
        }
        columns.push(this.createColumn([{
            'type': 'TextBlock',
            'text': v
        }], {
            'spacing': 'Small',
            'width': 'stretch'
        }));

        // Append children
        if (hasChildren) {
            const childRow = {
                'type': 'ColumnSet',
                'id': `${path}#children`,
                'isVisible': false,
                'columns': [
                    this.createColumn([], {
                        'spacing': 'None',
                        'verticalContentAlignment': 'Center',
                        'width': '20px'
                    }),
                    this.createColumn([], {
                        'spacing': 'Small',
                        'width': 'stretch'
                    })
                ]
            };
            container.items.push(childRow);

            if (type == 'object') {
                this.renderObject(value, childRow.columns[1] as any, path);
            } else {
                this.renderArray(value, childRow.columns[1] as any, path);
            }
        }
    }

    private renderObject(value: object, container: { items: object[]; }, path: string): void {
        for (const name in value) {
            if (value.hasOwnProperty(name)) {
                this.renderProperty(name, value[name], container, `${path}.${name}`);
            }
        }
    }

    private renderArray(value: any[], container: { items: object[]; }, path: string): void {
        for (let i = 0; i < value.length; i++) {
            this.renderProperty(`[${i}]`, value[i], container, `${path}.${i}`);
        }
    }

    private getDepth(path: string): number {
        return path.split('.').length;
    }

    private createChevron(path: string, up: boolean): object {
        // Create image with toggle action
        const image = {
            'type': 'Image',
            'selectAction': {
                'type': 'Action.ToggleVisibility',
                'title': up ? 'collapse' : 'expand',
                'targetElements': [
                    `${path}#children`,
                    `${path}#chevronUp`,
                    `${path}#chevronDown`
                ]
            },
            'url': up ? 'https://adaptivecards.io/content/up.png' : 'https://adaptivecards.io/content/down.png',
            'width': '20px',
            'altText': up ? 'expanded' : 'collapsed'
        };

        // Create column
        const column = this.createColumn([image], {
            'id': `${path}#${up ? 'chevronUp' : 'chevronDown'}`,
            'spacing': 'None',
            'verticalContentAlignment': 'Center'
        });
        if (up) { column['isVisible'] = false }

        return column;
    }

    private createColumn(items: object[], extra?: object): object {
        const column = {
            'type': 'Column',
            'items': items,
            'width': 'auto'
        };
        if (extra) { Object.assign(column, extra) }

        return column;
    }
}
