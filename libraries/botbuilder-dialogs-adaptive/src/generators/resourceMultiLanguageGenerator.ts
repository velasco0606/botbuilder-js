/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MultiLanguageGeneratorBase } from './multiLanguageGeneratorBase';
import { TurnContext } from 'botbuilder-core';
import { LanguageGenerator } from '../languageGenerator';
import { LanguageGeneratorManager } from './languageGeneratorManager';

/**
 * Initializes a new instance of the ResourceMultiLanguageGenerator class.
 */
export class ResourceMultiLanguageGenerator extends MultiLanguageGeneratorBase {
    public declarative: string = 'Microsoft.ResourceMultiLanguageGenerator';

    public resourceId: string;

    public constructor(resourceId: string = undefined) {
        super();
        this.resourceId = resourceId;
    }

    public tryGetGenerator(context: TurnContext, locale: string): {exist: boolean; result: LanguageGenerator} {
        const lgm: LanguageGeneratorManager = context.turnState.get('LanguageGeneratorManager');
        const resourceId = (locale === undefined || locale === '')? this.resourceId : this.resourceId.replace('.lg', `.${ locale }.lg`);
        if (lgm._languageGenerator.has(resourceId)) {
            return {exist: true, result: lgm._languageGenerator.get(resourceId)};
        } else {
            return {exist: false, result: undefined};
        }
    }
}