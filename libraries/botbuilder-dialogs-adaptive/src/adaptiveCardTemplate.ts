/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as jsonpath from 'jsonpath';
import { ExpressionEngine } from '../../botbuilder-expression-parser/lib';

export class AdaptiveCardTemplate {
    private transforms: TransformFunction[];

    public readonly asObject: object;
    public readonly asString: string;

    constructor(card: string|object) {
        // Save card in both string & object form
        if (typeof card == 'object') {
            this.asObject = card;
            this.asString = JSON.stringify(card);
        } else {
            this.asString = card;
            this.asObject = JSON.parse(card);
        }
    }

    public render(data: object): object {
        // Parse template on first use
        if (this.transforms == undefined) {
            this.transforms = [];
            this.parse(this.asObject, '$');
        }

        // Create clone of card
        const card = JSON.parse(this.asString);

        // Apply transforms
        this.transforms.forEach((xform) => xform(card, data));

        return card;
    }

    public select(type: string): object[] {
        // Check for prefix search
        let prefixSearch = false;
        if (type.endsWith('*')) {
            type = type.substr(0, type.length - 1);
            prefixSearch = true;
        }

        // Search for elements
        return this.findNodes(this.asObject, type, prefixSearch); 
    }

    private findNodes(node: any, type: string, prefixSearch: boolean): object[] {
        const results: object[] = [];
        if (Array.isArray(node)) {
            node.forEach(element => {
                const found = this.findNodes(element, type, prefixSearch);
                Array.prototype.push.apply(results, found);
            });
        } else if (typeof node == 'object') {
            // Check for matching node
            const t: string = node['type'] || '';
            if (prefixSearch && t.startsWith(type)) {
                results.push(node);
            } else if (t == type) {
                results.push(node);
            }

            // Check children for match
            for (const prop in node) {
                if (node.hasOwnProperty(prop)) {
                    const found = this.findNodes(node[prop], type, prefixSearch);
                    Array.prototype.push.apply(results, found);
                }
            }
        }

        return results;
    }

    private parse(node: any, path: string): void {
        const type = typeof node;
        if (Array.isArray(node)) {
            // Parse array elements
            for (let i = 0; i < node.length; i++) {
                this.parse(node[i], `${path}[${i}]`);
            }
        } else if (type == 'object') {
            // Parse child properties
            for (const prop in node) {
                if (node.hasOwnProperty(prop)) {
                    this.parse(node[prop], `${path}.${prop}`);
                }
            }

            // Add data bind transform
            if (node.hasOwnProperty('id')) {
                const xform = getDataBindTransform(node, path);
                if (xform) {
                    this.transforms.push(xform);
                }
            }
        } else if (type == 'string') {
            // Get list of string transforms
            const xform = getTextTransform(node, path);
            if (xform) {
                // Append to master list of transforms
                this.transforms.push(xform);
            }
        }
    }
}

type TransformFunction = (card: object, data: object) => void;
type TextPart = (data: object) => string;

const engine = new ExpressionEngine();

function getTextTransform(text: string, path: string): TransformFunction|undefined {
    // Find text parts
    let inExpression = false;
    let expressionCount = 0;
    let part = '';
    const parts: TextPart[] = [];
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        switch (ch) {
            case '/':
                i++; 
                if (i < text.length) {
                    part += text[i];
                } else {
                    throw new Error(`AdaptiveCardTemplate[${path}]: unescaped '/' found at position '${i - 1}'.`);
                }
                break;
            case '{':
                if (!inExpression) {
                    // Add static text part
                    if (part.length > 0) {
                        parts.push(staticTextPart(part));
                    }

                    // Start expression
                    part = '';
                    inExpression = true;
                } else {
                    throw new Error(`AdaptiveCardTemplate[${path}]: unescaped '{' found at position '${i}'.`);
                }
                break;
            case '}':
                if (inExpression) {
                    // Save expression
                    if (part.length > 0) {
                        parts.push(expressionTextPart(part, path));
                    } else {
                        throw new Error(`AdaptiveCardTemplate[${path}]: empty expression found at position '${i - 1}'.`);
                    }

                    // End expression
                    part = '';
                    inExpression = false;
                    expressionCount++;
                } else {
                    throw new Error(`AdaptiveCardTemplate[${path}]: unescaped '}' found at position '${i}'.`);
                }
                break;
            default:
                part += ch;
                break;
        }
    }
    if (inExpression) { 
        throw new Error(`AdaptiveCardTemplate[${path}]: closing '}' missing from expression.`);
    }
    if (part.length > 0) {
        parts.push(staticTextPart(part));
    }

    // Return transform
    if (expressionCount > 0) {
        return (card, data) => {
            // Build up text string from parts
            let text = '';
            parts.forEach((part) => {
                text += part(data);
            });

            // Save text to card
            jsonpath.value(card, path, text);
        }
    } else {
        return undefined;
    }
}

function staticTextPart(text: string): TextPart {
    return (data: object) => text;
}

function expressionTextPart(expression: string, path: string): TextPart {
    const exp = engine.parse(expression);
    return (data: object) => {
        const { value, error } = exp.tryEvaluate(data);
        if (error) { throw new Error(`AdaptiveCardTemplate: Error evaluating expression for '${path}' - ${error}`) }
        return value != undefined ? value.toString() : '';
    };
}

function getDataBindTransform(node: object, path: string): TransformFunction|undefined {
    switch (node['type']) {
        // Card Elements
        case 'TextBlock': 
            return bindStringProp('text', path, true);
        case 'Image': 
            return bindStringProp('url', path, true);
        case 'Media': 
            return bindMediaProp(path);
        case 'RichTextBlock': 
            return bindArrayProp('inlines', path);
        case 'TextRun': 
            return bindStringProp('text', path, true);

        // Containers
        case 'ActionSet': 
            return bindArrayProp('actions', path);
        case 'Container': 
            return bindArrayProp('items', path);
        case 'ColumnSet': 
            return bindArrayProp('columns', path);
        case 'Column': 
            return bindArrayProp('items', path);
        case 'FactSet': 
            return bindArrayProp('facts', path);
        case 'ImageSet': 
            return bindArrayProp('images', path);

        // Actions
        case 'Action.OpenUrl': 
            return bindStringProp('url', path);
        case 'Action.Submit': 
            return bindObjectProp(path);
        case 'Action.ShowCard': 
            return bindObjectProp(path);
        case 'Action.ToggleVisibility': 
            return bindObjectProp(path);

        // Inputs
        case 'Input.Text': 
            return bindStringProp('value', path);
        case 'Input.Number': 
            return bindNumberProp('value', path);
        case 'Input.Date': 
            return bindStringProp('value', path);
        case 'Input.Time': 
            return bindStringProp('value', path);
        case 'Input.Toggle': 
            return bindInputToggleProp(path);
        case 'Input.ChoiceSet': 
            return bindStringProp('value', path);

        default:
            return undefined;
    }
}

function bindInputToggleProp(path: string): TransformFunction {
    return (card, data) => {
        resolveBinding(card, data, path, (node, value, type) => {
            if (type == 'object') {
                copyTo(value, node);
            } else if (value) {
                node['value'] = node['valueOn'] || 'true';
            }
        });
    }
}

function bindObjectProp(path: string): TransformFunction {
    return (card, data) => {
        resolveBinding(card, data, path, (node, value, type) => {
            if (type == 'object') {
                copyTo(value, node);
            }
        });
    }
}

function bindMediaProp(path: string): TransformFunction {
    return (card, data) => {
        resolveBinding(card, data, path, (node, value, type) => {
            if (Array.isArray(value)) {
                node['sources'] = value;
            } else if (type == 'object') {
                if (value['url'] && value['mimeType']) {
                    node['sources'] = [value];
                } else {
                    copyTo(value, node);
                }
            }
        });
    }
}

function bindArrayProp(prop: string, path: string): TransformFunction {
    return (card, data) => {
        resolveBinding(card, data, path, (node, value, type) => {
            if (Array.isArray(value)) {
                node[prop] = value;
            } else if (type == 'object') {
                copyTo(value, node);
            }
        });
    }
}

function bindStringProp(prop: string, path: string, required = false): TransformFunction {
    return (card, data) => {
        resolveBinding(card, data, path, (node, value, type) => {
            if (type == 'object') {
                copyTo(value, node);
            } else if (type == 'string' || required) {
                node[prop] = value || '';
            }
        });
    }
}

function bindNumberProp(prop: string, path: string): TransformFunction {
    return (card, data) => {
        resolveBinding(card, data, path, (node, value, type) => {
            if (type == 'object') {
                copyTo(value, node);
            } else if (type == 'number') {
                node[prop] = value;
            } else if (type == 'string') {
                node[prop] = Number(value);
            }
        });
    }
}

function resolveBinding(card: object, data: object, path: string, cb: (node: object, value: any, type: string) => void): void {
    const node = jsonpath.value(card, path);
    if (typeof node == 'object') {
        let dataPath: string = node['id'];
        if (dataPath) {
            if (!dataPath.startsWith('$.')) { dataPath = '$.' + dataPath }
            const value = jsonpath.value(data, dataPath);
            const type = typeof value;
            cb(node, value, type);
        }
    }
}

function copyTo(from: object, to: object): void {
    for (const key in from) {
        if (from.hasOwnProperty(key)) {
            to[key] = from[key];
        }
    }
}