/**
 * @module botbuilder-dialogs-declarative
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Configurable } from "botbuilder-dialogs";
import { TypeFactory } from "./factory/typeFactory";
import { IResourceProvider } from "./resources/resourceProvider";
import { ResourceExplorer } from "./resources/resourceExplorer";

export class TypeLoader {

    constructor(private factory?: TypeFactory, private resourceExplorer?: ResourceExplorer) {
        if (!this.factory) {
            this.factory = new TypeFactory();
        }
    }

    public async load(json: string): Promise<object> {
        const jsonObj = typeof json === 'string' ? JSON.parse(json) : json;
        return await this.loadObjectTree(jsonObj);
    }

    private async loadObjectTree(jsonObj: object) : Promise<object> {
        if (!jsonObj) {
            return null;
        }

        // Recursively load object tree leaves to root, calling the factory to build objects from json tokens
        if (jsonObj['$type']) {
            const type = jsonObj['$type'];
            const obj = this.factory.build(type, jsonObj);

            if(!obj) {
                return obj;
            }

            // Iterate through json object properties and check whether
            // there are typed objects that require factory calls
            for (const key in jsonObj) {
                if (jsonObj.hasOwnProperty(key) && key != "$type") {
                    const setting = jsonObj[key];

                    // Process arrays
                    if (Array.isArray(setting)) {
                        if (Array.isArray(obj[key])) {
                            obj[key] = [];

                            // Recursively check for factory
                            for (let item of setting) {
                                let loadedItem = await this.loadObjectTree(item);
                                obj[key].push(loadedItem);
                            }
                        } else {
                            obj[key] = setting;
                        }
                    // Process objects in case recursion is needed
                    } else if (typeof setting == 'object' && setting.hasOwnProperty('$type')) {
                        obj[key] = await this.loadObjectTree(setting);
                    // Process string references where an object is expected using resourceProvider
                    } else if (setting && typeof setting == 'string' && !setting.includes('=') && obj.hasOwnProperty(key) && typeof obj[key] != 'string' && this.resourceExplorer) {
                        let resource = await this.resourceExplorer.getResource(`${setting}.dialog`)

                        if (resource) {
                            const text = await resource.readText();
                            obj[key] = JSON.parse(text);
                        } else if (!obj[key]){
                            obj[key] = setting;
                        }
                    }
                    else if (!obj[key]) {
                        obj[key] = setting;
                    }
                }
            }
            return obj;
        }
        // Implicit copy: we receive a string in a leaf node but actually expect an object.
        else if (typeof jsonObj == 'string') {
            let resource = await this.resourceExplorer.getResource(`${jsonObj}.dialog`)
            if (resource) {
                const text = await resource.readText();

                return await this.loadObjectTree(JSON.parse(text));
            }
        }

        return null;
    }
}