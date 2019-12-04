/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MultiLanguageGeneratorBase } from './multiLanguageGeneratorBase';
/**
 * ILanguageGenerator which uses implements a map of locale->ILanguageGenerator for the locale 
 * and has a policy which controls fallback (try en-us -> en -> default).
 */
export class MultiLanguageGenerator extends MultiLanguageGeneratorBase{
    // TODO
}