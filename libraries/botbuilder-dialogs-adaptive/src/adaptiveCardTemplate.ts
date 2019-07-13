/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as jsonpath from 'jsonpath';
import { ExpressionEngine } from '../../botbuilder-expression-parser/lib';

export type AdaptiveCardTransform = (card: object, data: object) => void;
export type AdaptiveCardTransformFactory = (element: AdaptiveCardElementInfo, node: object, path: string) => AdaptiveCardTransform;

export interface AdaptiveCardElementInfo {
    type: string;
    factory?: AdaptiveCardTransformFactory;
    isContainer?: boolean;
    collection?: string;
    property?: string;
    required?: boolean;
    itemTemplate?: object;
}

export class AdaptiveCardTemplate {
    private transforms: AdaptiveCardTransform[];

    public asObject: object;
    public asString: string;

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
            // Extract item template for containers
            const id = node['id'];
            let element: AdaptiveCardElementInfo = elements[node['type'] || ''];
            if (id && element && element.isContainer) {
                const collection = node[element.collection || element.property];
                if (Array.isArray(collection) && collection.length > 0) {
                    // Collections first item is the template
                    const tmpl = collection[0];
                    if (typeof tmpl == 'object') {
                        // Remove template from collection
                        collection.splice(0, 1);
                        this.asString = JSON.stringify(this.asObject);

                        // Update clone of element info to include item template
                        element = Object.assign({}, element, { itemTemplate: tmpl });
                    }
                }
            }

            // Parse child properties
            for (const prop in node) {
                if (node.hasOwnProperty(prop)) {
                    this.parse(node[prop], `${path}.${prop}`);
                }
            }

            // Add data bind transform
            if (id && element && element.factory) {
                const xform = element.factory(element, node, path);
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

    static addElement(element: AdaptiveCardElementInfo): void {
        elements[element.type] = element;
    }
}

const elements: { [type: string]: AdaptiveCardElementInfo; } = {};

type TextPart = (data: object) => string;

const engine = new ExpressionEngine();

function getTextTransform(text: string, path: string): AdaptiveCardTransform|undefined {
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

// Card Elements
AdaptiveCardTemplate.addElement({ type: 'TextBlock', property: 'text', factory: stringElement, required: true });
AdaptiveCardTemplate.addElement({ type: 'Image', property: 'url', factory: stringElement, required: true });
AdaptiveCardTemplate.addElement({ type: 'Media', factory: mediaElement });
AdaptiveCardTemplate.addElement({ type: 'RichTextBlock', property: 'inlines', factory: arrayElement, required: true });
AdaptiveCardTemplate.addElement({ type: 'TextRun', property: 'text', factory: stringElement, required: true });

// Containers
AdaptiveCardTemplate.addElement({ type: 'ActionSet', property: 'actions', factory: containerElement, isContainer: true });
AdaptiveCardTemplate.addElement({ type: 'Container', property: 'items', factory: containerElement, isContainer: true });
AdaptiveCardTemplate.addElement({ type: 'ColumnSet', property: 'columns', factory: containerElement, isContainer: true });
AdaptiveCardTemplate.addElement({ type: 'Column', property: 'items', factory: containerElement, isContainer: true });
AdaptiveCardTemplate.addElement({ type: 'FactSet', property: 'facts', factory: containerElement, isContainer: true });
AdaptiveCardTemplate.addElement({ type: 'ImageSet', property: 'images', factory: containerElement, isContainer: true });

// Actions
AdaptiveCardTemplate.addElement({ type: 'Action.OpenUrl', property: 'url', factory: stringElement });
AdaptiveCardTemplate.addElement({ type: 'Action.Submit', factory: objectElement });
AdaptiveCardTemplate.addElement({ type: 'Action.ShowCard', factory: objectElement });
AdaptiveCardTemplate.addElement({ type: 'Action.ToggleVisibility', factory: objectElement });

// Inputs
AdaptiveCardTemplate.addElement({ type: 'Input.Text', property: 'value', factory: stringElement });
AdaptiveCardTemplate.addElement({ type: 'Input.Number', property: 'value', factory: numberElement });
AdaptiveCardTemplate.addElement({ type: 'Input.Date', property: 'value', factory: stringElement });
AdaptiveCardTemplate.addElement({ type: 'Input.Time', property: 'value', factory: stringElement });
AdaptiveCardTemplate.addElement({ type: 'Input.Toggle', property: 'value', factory: inputToggleElement });
AdaptiveCardTemplate.addElement({ type: 'Input.ChoiceSet', property: 'value', factory: inputChoiceSetElement, isContainer: true, collection: 'choices' });

function containerElement(element: AdaptiveCardElementInfo, node: object, path: string): AdaptiveCardTransform {
    // Compile child template
    const itemTemplate = element.itemTemplate ? new AdaptiveCardTemplate(element.itemTemplate) : undefined;
    return (card, data) => {
        resolveBinding(card, data, path, (node, value, type) => {
            if (itemTemplate) {
                // Render child items
                let items: object[] = [];
                if (typeof value == 'string') { value = value.split(/(?:,|;)/g) }
                if (Array.isArray(value)) {
                    for (let i = 0; i < value.length; i++) {
                        items.push(itemTemplate.render({ value: value[i], index: i }));
                    }
                } else if (type == 'object') {
                    items = [];
                    for (const key in value) {
                        if (value.hasOwnProperty(key)) {
                            items.push(itemTemplate.render({ value: value[key], index: key }));
                        }
                    }
                }

                // Update node and prune out template
                if (items.length > 0) { node[element.collection || element.property] = items }
            } else if (Array.isArray(value)) {
                node[element.property] = value;
            } else if (type == 'object') {
                copyTo(value, node);
            }
        });
    }
}

function inputChoiceSetElement(element: AdaptiveCardElementInfo, node: object, path: string): AdaptiveCardTransform {
    // A choice is both an input and a container...
    const input = stringElement(element, node, path);
    const container = containerElement(element, node, path);
    return (card, data) => {
        input(card, data);
        container(card, data);
    };
}

function inputToggleElement(element: AdaptiveCardElementInfo, node: object, path: string): AdaptiveCardTransform {
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

function objectElement(element: AdaptiveCardElementInfo, node: object, path: string): AdaptiveCardTransform {
    return (card, data) => {
        resolveBinding(card, data, path, (node, value, type) => {
            if (type == 'object') {
                copyTo(value, node);
            }
        });
    }
}

function mediaElement(element: AdaptiveCardElementInfo, node: object, path: string): AdaptiveCardTransform {
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

function arrayElement(element: AdaptiveCardElementInfo, node: object, path: string): AdaptiveCardTransform {
    return (card, data) => {
        resolveBinding(card, data, path, (node, value, type) => {
            if (Array.isArray(value)) {
                node[element.property] = value;
            } else if (type == 'object') {
                copyTo(value, node);
            }
        });
    }
}

function stringElement(element: AdaptiveCardElementInfo, node: object, path: string): AdaptiveCardTransform {
    return (card, data) => {
        resolveBinding(card, data, path, (node, value, type) => {
            if (type == 'object') {
                copyTo(value, node);
            } else if (type == 'string' || element.required) {
                node[element.property] = value || '';
            }
        });
    }
}

function numberElement(element: AdaptiveCardElementInfo, node: object, path: string): AdaptiveCardTransform {
    return (card, data) => {
        resolveBinding(card, data, path, (node, value, type) => {
            if (type == 'object') {
                copyTo(value, node);
            } else if (type == 'number') {
                node[element.property] = value;
            } else if (type == 'string') {
                node[element.property] = Number(value);
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