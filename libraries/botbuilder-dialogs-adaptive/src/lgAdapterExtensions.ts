import { BotAdapter } from "botbuilder-core";
import { ResourceExplorer } from "../../botbuilder-dialogs-declarative/src";
import { LanguageGenerator } from "./languageGenerator"
import { ResourceMultiLanguageGenerator } from "./generators/resourceMultiLanguageGenerator";
import { LanguageGeneratorManager } from "./generators/languageGeneratorManager";
/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export class LGAdapterExtensions {
    // TODO
    public static useLanguageGeneration(botAdapter: BotAdapter, resourceExplorer: ResourceExplorer, thirdParam: string | LanguageGenerator): BotAdapter {
        if (typeof thirdParam === "string") {
            let defaultLg = <string> thirdParam;
            if (defaultLg === undefined) {
                defaultLg = "main.lg";
            }

            if (resourceExplorer === undefined) {
                resourceExplorer = new ResourceExplorer();
            }

            if (resourceExplorer.getResource(defaultLg) !== undefined) {
                botAdapter.useLanguageGeneration(resourceExplorer, new ResourceMultiLanguageGenerator(defaultLg));
            } else {
                botAdapter.useLanguageGeneration(resourceExplorer, new ResourceMultiLanguageGenerator());
            }

            return botAdapter;
        } else {
            DeclarativeTypeLoader.AddComponent(new LanguageGenerationComponentRegistration());
            botAdapter.use(new LanguageGeneratorManager( resourceExplorer !== undefined?))
            botAdapter.use();
            return botAdapter;
        }
    }
}