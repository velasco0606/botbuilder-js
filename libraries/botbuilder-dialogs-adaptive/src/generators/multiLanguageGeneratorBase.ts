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
 * Class which manages cache of all LG resources from a ResourceExplorer. 
 * This class automatically updates the cache when resource change events occure.
 */
export class MultiLanguageGeneratorBase implements LanguageGenerator{
    // TODO
    public generate(turnContext: TurnContext, template: string, data: object): Promise<string> {
        throw new Error("Method not implemented.");
    }
}