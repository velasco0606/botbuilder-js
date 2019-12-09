/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Class which manages cache of all LG resources from a ResourceExplorer. 
 * This class automatically updates the cache when resource change events occure.
 */
import { IResource, ResourceExplorer, FileResource } from '../../../botbuilder-dialogs-declarative/src';
import { MultiLanguageResourceLoader } from '../multiLanguageResourceLoader';
import { LanguageGenerator } from '../languageGenerator'
import { TemplateEngineLanguageGenerator } from './templateEngineLanguageGenerator';
import { normalize, extname } from 'path';

export class LanguageGeneratorManager {
    private _resourceExporer: ResourceExplorer;
    
    /// <summary>
    /// multi language lg resources. en -> [resourcelist].
    /// </summary>
    private readonly _multilanguageResources: Map<string, IResource[]>;

    public constructor(resourceManager: ResourceExplorer) {
        this._resourceExporer = resourceManager;
        this._multilanguageResources = MultiLanguageResourceLoader.load(resourceManager);

        // load all LG resources
        this._resourceExporer.getResources("lg").then(
            resourses => {resourses.forEach(
                resourse => {
                    this._languageGenerator[resourse.id()] = this.getTemplateEngineLanguageGenerator(resourse);
                }
            );
        //this._resourceExporer.Changed += ResourceExplorer_Changed;
        }); 
    }
    
    public _languageGenerator: Map<string, LanguageGenerator> = new Map<string, LanguageGenerator>();

    public static resourceExplorerResolver(locale: string, id: string, resourceMapping: Map<string, IResource[]>): Function {
        return (source: string, id: string) => {
            const fallbaclLocale = MultiLanguageResourceLoader.FallbackLocale(locale, Array.from(resourceMapping.keys()));
            const resources: IResource[] = resourceMapping[fallbaclLocale];

            const resourceName = normalize(id);
            const resource:IResource = resources.filter(u => {
                MultiLanguageResourceLoader.ParseLGFileName(u.id).prefix.toLowerCase() === MultiLanguageResourceLoader.ParseLGFileName(resourceName).prefix.toLowerCase();
            })[0];

            if (resource === undefined) {
                return {content:"", path: resource.id()};
            } else {
                resource.readText().then(
                    text => {
                        return {content: text, path: resource.id()};
                    }
                );
            }
        }
    }

    private  ResourceExplorer_Changed(resources: IResource[]): void {
        resources.filter(u => extname(u.id()).toLowerCase() === '.lg').forEach(resource => 
            this._languageGenerator[resource.id()] = this.getTemplateEngineLanguageGenerator(resource))
    }

    private getTemplateEngineLanguageGenerator(resource: IResource): TemplateEngineLanguageGenerator {
        FileResource
        return new TemplateEngineLanguageGenerator(await resource.readText(), resource.id(), this._multilanguageResources);
    }
}