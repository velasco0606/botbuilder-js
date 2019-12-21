/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { LanguageGenerator } from '../languageGenerator';
import { TurnContext } from 'botbuilder-core';
import{ TemplateEngine } from '../../../botbuilder-lg/lib';
import { IResource } from 'botbuilder-dialogs-declarative';
import { MultiLanguageResourceLoader } from '../multiLanguageResourceLoader';
import { LanguageGeneratorManager } from './languageGeneratorManager';
import { normalize, basename } from 'path';

/**
 * LanguageGenerator implementation which uses TemplateEngine. 
 */
export class TemplateEngineLanguageGenerator implements LanguageGenerator{
    public declarative: string = 'Microsoft.TemplateEngMineLanguageGenerator';
    
    private  DEFAULTLABEL: string  = 'Unknown';

    private readonly multiLangEngines: Map<string, TemplateEngine> = new Map<string, TemplateEngine>();

    private engine: TemplateEngine;

    public id: string = '';

    public constructor(lgTextOrFilePathOrEngine?: string | TemplateEngine, id?: string, resourceMapping?: Map<string,IResource[]>) {
        if (typeof lgTextOrFilePathOrEngine === 'string' && id !== undefined && resourceMapping !== undefined) {
            this.id = id !== undefined? id : this.DEFAULTLABEL;
            const {prefix: _, language: locale} = MultiLanguageResourceLoader.ParseLGFileName(id);
            //console.log(_+ ',' + locale);
            const fallbackLocale: string = MultiLanguageResourceLoader.fallbackLocale(locale.toLocaleLowerCase(), Array.from(resourceMapping.keys()));
            console.log('constructor.fallbackLocale:' + fallbackLocale);
            for (const mappingKey of resourceMapping.keys()) {
                if (fallbackLocale === ''  || fallbackLocale === mappingKey) {
                   // console.log('constructor.mappingKey.engine:'+mappingKey+'; content'+lgTextOrFilePathOrEngine);
                    const engine = new TemplateEngine().addText(lgTextOrFilePathOrEngine !== undefined? lgTextOrFilePathOrEngine : '', id, LanguageGeneratorManager.resourceExplorerResolver(mappingKey, resourceMapping));
                    //console.log('engine:'+ engine);
                    this.multiLangEngines.set(mappingKey, engine);
                    //console.log('keys: ' + Array.from(this.multiLangEngines.keys()));
                }
            }
        } else if (typeof lgTextOrFilePathOrEngine === 'string'&& id === undefined && resourceMapping !== undefined) {
            const filePath = normalize(lgTextOrFilePathOrEngine);
            this.id = basename(filePath);

            const {prefix: _, language: locale} = MultiLanguageResourceLoader.ParseLGFileName(id);
            const fallbackLocale: string = MultiLanguageResourceLoader.fallbackLocale(locale.toLocaleLowerCase(), Array.from(resourceMapping.keys()));
            for (const mappingKey of resourceMapping.keys()) {
                if (fallbackLocale === '' || fallbackLocale === mappingKey) {
                    const engine = new TemplateEngine().addFile(filePath, LanguageGeneratorManager.resourceExplorerResolver(mappingKey, resourceMapping));
                    this.multiLangEngines.set(mappingKey, engine);
                }
            }
        } else if (lgTextOrFilePathOrEngine instanceof TemplateEngine) {
            this.engine = lgTextOrFilePathOrEngine;
        } else {
            this.engine = new TemplateEngine();
        }

        console.log('constructor final keys: ' + Array.from(this.multiLangEngines.keys()));
    }
    
    public generate(turnContext: TurnContext, template: string, data: object): Promise<string> {
        console.log('generate'+template);
        this.engine = this.initTemplateEngine(turnContext);

        try {
            return Promise.resolve(this.engine.evaluate(template, data).toString());
        } catch(e) {
            if (this.id !== undefined && this.id === '') {
                throw Error(`${ this.id }:${ e }`);
            }
        }
    }

    private initTemplateEngine(turnContext: TurnContext): TemplateEngine {
        const locale = turnContext.activity.locale? turnContext.activity.locale.toLocaleLowerCase() : '';
        if (this.multiLangEngines.size > 0) {
            const fallbackLocale = MultiLanguageResourceLoader.fallbackLocale(locale.toLocaleLowerCase(), Array.from(this.multiLangEngines.keys()));
            console.log('init.fallbackLocale:' + fallbackLocale);
            console.log('init.keys:' +Array.from(this.multiLangEngines.keys()));
            this.engine = this.multiLangEngines.get(fallbackLocale);
            //console.log("keys:" + Array.from(this.multiLangEngines.keys()));
            //console.log("locale:" + locale + ";" + fallbackLocale);
            //console.log("engine"  + this.engine);
        } else {
            this.engine = this.engine? this.engine : new TemplateEngine();
        }

        return this.engine;
    }
}