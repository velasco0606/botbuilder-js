/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { LanguageGenerator } from '../languageGenerator';
import { TurnContext } from 'botbuilder-core';
/**
 * LanguageGenerator implementation which uses TemplateEngine. 
 */
export class TemplateEngineLanguageGenerator implements LanguageGenerator{
    // TODO
    public generate(turnContext: TurnContext, template: string, data: object): Promise<string> {
        throw new Error("Method not implemented.");
    }
}