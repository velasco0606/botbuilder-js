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
import { IResource, ResourceExplorer } from 'botbuilder-dialogs-declarative';
import { MultiLanguageResourceLoader } from '../multiLanguageResourceLoader';
import { LanguageGenerator } from '../languageGenerator'
import { TemplateEngineLanguageGenerator } from './templateEngineLanguageGenerator';
import { normalize } from 'path';
import { ImportResolverDelegate } from '../../../botbuilder-lg/lib';

export class LanguageGeneratorManager {
    private _resourceExporer: ResourceExplorer;
    
    /// <summary>
    /// multi language lg resources. en -> [resourcelist].
    /// </summary>
    private _multilanguageResources: Map<string, IResource[]>;

    public constructor(resourceManager: ResourceExplorer) {
        this._resourceExporer = resourceManager;
        //this._multilanguageResources = MultiLanguageResourceLoader.load(resourceManager);

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

    public static resourceExplorerResolver(locale: string, resourceMapping: Map<string, IResource[]>): ImportResolverDelegate {
        return (source: string, id: string) => {
            const fallbaclLocale = MultiLanguageResourceLoader.fallbackLocale(locale, Array.from(resourceMapping.keys()));
            const resources: IResource[] = resourceMapping[fallbaclLocale];

            const resourceName = normalize(id);
            const resource:IResource = resources.filter(u => {
                MultiLanguageResourceLoader.ParseLGFileName(u.id()).prefix.toLowerCase() === MultiLanguageResourceLoader.ParseLGFileName(resourceName).prefix.toLowerCase();
            })[0];

            if (resource === undefined) {
                return {content:"", id: resource.id()};
            } else {
                resource.readText().then(
                    text => {
                        return {content: text, id: resource.id()};
                    }
                );
            }
        }
    }

    // private  ResourceExplorer_Changed(resources: IResource[]): void {
    //     resources.filter(u => extname(u.id()).toLowerCase() === '.lg').forEach(resource => 
    //         this._languageGenerator[resource.id()] = this.getTemplateEngineLanguageGenerator(resource))
    // }

    private async getTemplateEngineLanguageGenerator(resource: IResource): Promise<TemplateEngineLanguageGenerator> {
        this._multilanguageResources = await MultiLanguageResourceLoader.load(this._resourceExporer);
        const text = await resource.readText();
        return Promise.resolve(new TemplateEngineLanguageGenerator(text, resource.id(), this._multilanguageResources));
        
    }
}