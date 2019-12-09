import { IResource } from "../../botbuilder-dialogs-declarative/src";
import { ResourceExplorer } from '../../botbuilder-dialogs-declarative/src'
import { LanguagePolicy } from  './languagePolicy'
/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * load all lg resource and split them into different language group.
 */
export class MultiLanguageResourceLoader {
    public static load(resourceExplorer: ResourceExplorer): Map<string, IResource[]> {
        const resourceMapping: Map<string, IResource[]> = new Map<string, IResource[]>();
        const allResouces: IResource[] = await resourceExplorer.getResources("lg");
        const languagePolicy = LanguagePolicy.getDefaultPolicy();
        for (const locale in languagePolicy) {
            let suffixs = languagePolicy[locale];
            const existNames = new Set<string>();
            for (const index in suffixs) {
                const suffix = suffixs[index];
                if ((locale === undefined || locale ==="") || (suffix !== undefined && suffix !== "")) {
                    const resourcesWithSuffix = allResouces.filter(u => ParseLGFileName(u.id() === suffix));
                    resourcesWithSuffix.forEach(u => {
                        const resourceName = u.id();
                        const length = (suffix !== undefined && suffix !== "")? 3 : 4;
                        const prefixName = resourceName.substring(0, resourceName.length - suffix.length - length);
                        if (!existNames.has(prefixName)) {
                            existNames.add(prefixName);
                            if (!resourceMapping.has(locale)) {
                                resourceMapping.set(locale, [u]);
                            } else {
                                resourceMapping[locale].add(u);
                            }
                        }
                    });
                } else {
                    if (resourceMapping.has(locale)) {
                        const resourcesWithEmptySuffix = allResouces.filter(u => this.ParseLGFileName(u.id()).language === "");
                        resourcesWithEmptySuffix.forEach(u => {
                            const resourceName = u.id();
                            const prefixName = resourceName.substring(0, resourceName.length - 3);
                            if (!existNames.has(prefixName)) {
                                existNames.add(prefixName);
                                resourceMapping[locale].add(u);
                            }
                        });
                    }
                }
            }
        }

        return fallbackMultiLangResource(resourceMapping);
    }

    public static ParseLGFileName(lgFileName: string): lgFileParsedResult {
        if (lgFileName === undefined || !lgFileName.endsWith(".lg")) {
            return {prefix: lgFileName, language: ""};
        }

        const fileName = lgFileName.substring(0, lgFileName.length - ".lg".length);
        const lastDot = fileName.lastIndexOf(".");
        if (lastDot > 0) {
            return {prefix: fileName.substring(0, lastDot), language: fileName.substring(lastDot + 1)}
        } else {
            return {prefix: fileName, language: ""};
        }
    }

    public static fallbackLocale(locale: string, optionalLocales: string[]) {
        if (optionalLocales === undefined) {
            throw new TypeError("Invalid Arguments");
        }

        if (optionalLocales.includes(locale)) {
            return locale;
        }

        const languagePolicy = LanguagePolicy.getDefaultPolicy();
        if (languagePolicy.has(locale)) {
            const fallbackLocales = languagePolicy[locale];
            for (const i in fallbackLocales) {
                const fallbackLocale = fallbackLocales[i]
                if (optionalLocales.includes(fallbackLocale)) {
                    return fallbackLocale;
                }
            }
        } else if (optionalLocales.includes("")) {
            return "";
        }

        throw Error(`there is no locale fallback for ${locale}`);
    }

    private static fallbackMultiLangResource(resourceMapping: Map<string, IResource[]>): Map<string, IResource[]> {
        const resourcePoolDict = new Map<string, IResource[]>();
        for (const currentLocale of resourceMapping.keys()) {
            const currentResourcePool = resourceMapping[currentLocale];
            const existLocale  = this.matchingPoolDict(currentResourcePool, resourceMapping);
            
            if (existLocale === undefined) {
                resourcePoolDict.set(currentLocale, currentResourcePool);
            } else {
                const newLocale: string = this.findCommonAncestorLocale(existLocale, currentLocale);
                if (!(newLocale === undefined || newLocale.trim() === "")) {
                    resourcePoolDict.delete(existLocale);
                    resourcePoolDict.set(newLocale, currentResourcePool);
                }
            }
        }

        return resourcePoolDict;
    }

    

}

type lgFileParsedResult = {
    prefix: string, 
    language: string
} 