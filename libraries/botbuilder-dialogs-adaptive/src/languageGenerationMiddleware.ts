import { Middleware, TurnContext } from 'botbuilder-core';
import { ResourceExplorer } from 'botbuilder-dialogs-declarative';
import { LanguageGenerator } from './languageGenerator';
import { ResourceMultiLanguageGenerator } from './generators/resourceMultiLanguageGenerator';
import { TemplateEngineLanguageGenerator } from './generators';

/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export class LanguageGeneratorMiddleWare implements Middleware {
    private readonly _resourceExplorer: ResourceExplorer;
    private readonly _defaultLg: string;
    private _languageGenerator: LanguageGenerator;
    private resourceExplorerKey = Symbol('resourceExplorer');
    private languageGeneratorKey = Symbol('languageGeneratorManager');

    public constructor(resourceExpolrer: ResourceExplorer = undefined, defaultLg: string = undefined) {
        this._resourceExplorer = resourceExpolrer? resourceExpolrer : new ResourceExplorer();
        this._defaultLg = defaultLg? defaultLg : 'main.lg';
    }

    /**
     * Store the incoming activity on the App Insights Correlation Context and optionally calls the TelemetryLoggerMiddleware
     * @param context The context object for this turn.
     * @param next The delegate to call to continue the bot middleware pipeline
     */
    public async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
        if (context === null) {
            throw new Error('context is null');
        }

        if (this._languageGenerator === undefined) {
            const resource =  await this._resourceExplorer.getResource(this._defaultLg);
            if (resource !== undefined) {
                this._languageGenerator = new ResourceMultiLanguageGenerator(this._defaultLg);
            } else {
                this._languageGenerator = new TemplateEngineLanguageGenerator();
            }
        }

        // miss LanguageGenerationComponentRegistration
        
        context.turnState.set(this.resourceExplorerKey, this._resourceExplorer);
        if (this._languageGenerator === undefined) {
            throw new Error('no language generator defined');
        } else{
            context.turnState.set(this.languageGeneratorKey, this._languageGenerator);
        }
        
        if (next !== null) {
            await next();
        }
    }



}