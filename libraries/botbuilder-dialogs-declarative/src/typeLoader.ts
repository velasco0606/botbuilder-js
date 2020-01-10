/**
 * @module botbuilder-dialogs-declarative
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TypeFactory } from './factory/typeFactory';
import { ComponentRegistration } from './componentRegistration';
import { ResourceExplorer } from './resources/resourceExplorer';
import { Configurable } from 'botbuilder-dialogs';

export class TypeLoader {

    private factory: TypeFactory;
    private resourceExplorer: ResourceExplorer;

    public constructor(factory?: TypeFactory, resourceExplorer?: ResourceExplorer) {
        if (factory) {
            this.factory = factory;
        }
        if (!this.factory) {
            this.factory = new TypeFactory();
        }
        if (resourceExplorer) {
            this.resourceExplorer = resourceExplorer;
        }
    }

    public addComponent(component: ComponentRegistration): void {
        const types = component.getTypes();
        for (let i = 0; i < types.length; i++) {
            const type = types[i];
            this.factory.register(type.name, type.builder);
        }
    }

    public async load(json: string): Promise<object> {
        const jsonObj = typeof json === 'string' ? JSON.parse(json) : json;
        return await this.loadObjectTree(jsonObj);
    }

    private async loadObjectTree(obj: object, path: string = 'root'): Promise<object> {
        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                const childPath = `${ path }[${ i }]`;
                obj[i] = await this.loadObjectTree(obj[i], childPath);
            }
        } else if (typeof obj == 'object') {
            const type = obj['$kind'] || obj['$type'];
            if (type) {
                obj = this.factory.build(type, obj);
            }
            for (const key in obj) {
                if (key != '$kind' && key != '$type') {
                    const childPath = `${ path }.${ key }`;
                    if (key == 'dialog' && typeof obj[key] == 'string' && this.resourceExplorer) {
                        const resource = await this.resourceExplorer.getResource(`${ obj[key] }.dialog`);
                        if (resource) {
                            const text = await resource.readText();
                            obj[key] = await this.loadObjectTree(JSON.parse(text), childPath);
                        }
                    } else {
                        obj[key] = await this.loadObjectTree(obj[key], childPath);
                    }
                }
            }
            if (obj instanceof Configurable) {
                (obj as Configurable).path = path;
            }
        }
        return obj;
    }
}