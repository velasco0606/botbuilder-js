import { BotAdapter } from "botbuilder-core";
import { ResourceExplorer } from "../../botbuilder-dialogs-declarative/lib";
import { LanguageGenerator } from "./languageGenerator"
import { ResourceMultiLanguageGenerator } from "./generators/resourceMultiLanguageGenerator";
/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export class LGAdapterExtensions {
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
                LGAdapterExtensions.useLanguageGeneration(botAdapter, resourceExplorer, new ResourceMultiLanguageGenerator(defaultLg));
            } else {
                LGAdapterExtensions.useLanguageGeneration(botAdapter, resourceExplorer, new ResourceMultiLanguageGenerator());
            }

            return botAdapter;
        } else {
            const languageGenerator = <LanguageGenerator> thirdParam;
            LGAdapterExtensions.useLanguageGeneration(botAdapter, resourceExplorer, languageGenerator);
            return botAdapter;
        }
    }
}