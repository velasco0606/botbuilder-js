import { IResource, ResourceExplorer } from 'botbuilder-dialogs-declarative';
import { LanguagePolicy } from  './languagePolicy';
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
    public static async load(resourceExplorer: ResourceExplorer): Promise<Map<string, IResource[]>> {
        const resourceMapping: Map<string, IResource[]> = new Map<string, IResource[]>();
        const allResouces: IResource[] =  await resourceExplorer.getResources('lg');
        const languagePolicy = LanguagePolicy.getDefaultPolicy();
        for (const locale in languagePolicy) {
            let suffixs = languagePolicy[locale];
            const existNames = new Set<string>();
            for (const index in suffixs) {
                const suffix = suffixs[index];
                if ((locale === undefined || locale ==='') || (suffix !== undefined && suffix !== '')) {
                    const resourcesWithSuffix = allResouces.filter(u => this.ParseLGFileName(u.id()).language === suffix);
                    resourcesWithSuffix.forEach(u => {
                        const resourceName = u.id();
                        const length = (suffix !== undefined && suffix !== '')? 3 : 4;
                        const prefixName = resourceName.substring(0, resourceName.length - suffix.length - length);
                        if (!existNames.has(prefixName)) {
                            existNames.add(prefixName);
                            if (!resourceMapping.has(locale)) {
                                resourceMapping.set(locale, [u]);
                            } else {
                                resourceMapping.get(locale).push(u);
                            }
                        }
                    });
                } else {
                    if (resourceMapping.has(locale)) {
                        const resourcesWithEmptySuffix = allResouces.filter(u => this.ParseLGFileName(u.id()).language === '');
                        resourcesWithEmptySuffix.forEach(u => {
                            const resourceName = u.id();
                            const prefixName = resourceName.substring(0, resourceName.length - 3);
                            if (!existNames.has(prefixName)) {
                                existNames.add(prefixName);
                                resourceMapping.get(locale).push(u);
                            }
                        });
                    }
                }
            }
        }

        return this.fallbackMultiLangResource(resourceMapping);
    }

    public static ParseLGFileName(lgFileName: string): LgFileParsedResult {
        if (lgFileName === undefined || !lgFileName.endsWith('.lg')) {
            return {prefix: lgFileName, language: ''};
        }

        const fileName = lgFileName.substring(0, lgFileName.length - '.lg'.length);
        const lastDot = fileName.lastIndexOf('.');
        if (lastDot > 0) {
            return {prefix: fileName.substring(0, lastDot), language: fileName.substring(lastDot + 1)}
        } else {
            return {prefix: fileName, language: ''};
        }
    }

    public static fallbackLocale(locale: string, optionalLocales: string[]): string {
        if (optionalLocales === undefined) {
            throw new TypeError('Invalid Arguments');
        }

        if (optionalLocales.includes(locale)) {
            return locale;
        }

        const languagePolicy = LanguagePolicy.getDefaultPolicy();
        if (languagePolicy[locale] !== undefined) {
            const fallbackLocales = languagePolicy[locale];
            for (const i in fallbackLocales) {
                const fallbackLocale = fallbackLocales[i];
                if (optionalLocales.includes(fallbackLocale)) {
                    return fallbackLocale;
                }
            }
        } else if (optionalLocales.includes('')) {
            return '';
        }

        throw Error(`there is no locale fallback for ${ locale }`);
    }

    private static fallbackMultiLangResource(resourceMapping: Map<string, IResource[]>): Map<string, IResource[]> {
        const resourcePoolDict = new Map<string, IResource[]>();
        for (const currentLocale of resourceMapping.keys()) {
            const currentResourcePool: IResource[] = resourceMapping[currentLocale];
            const existLocale  = Object.keys(resourcePoolDict).filter(u => this.hasSameResourcePool(resourcePoolDict[u], currentResourcePool))[0];
            if (existLocale === undefined) {
                resourcePoolDict.set(currentLocale, currentResourcePool);
            } else {
                const newLocale: string = this.findCommonAncestorLocale(existLocale, currentLocale);
                if (!(newLocale === undefined || newLocale.trim() === '')) {
                    resourcePoolDict.delete(existLocale);
                    resourcePoolDict.set(newLocale, currentResourcePool);
                }
            }
        }

        return resourcePoolDict;
    }


    private static findCommonAncestorLocale(locale1: string, locale2: string): string {
        const languagePolicy = LanguagePolicy.getDefaultPolicy();
        if (languagePolicy[locale1] === undefined || languagePolicy[locale2] === undefined) {
            return '';
        }

        const key1Policy = languagePolicy[locale1];
        const key2Policy = languagePolicy[locale2];
        for (const key1Language of key1Policy) {
            for (const key2Language of key2Policy) {
                if (key1Language === key2Language) {
                    return key1Language;
                }
            }
        }
        
        return '';
    }

    private static hasSameResourcePool(resourceMapping1: IResource[], resourceMapping2: IResource[]): boolean {
        if (resourceMapping1 === undefined && resourceMapping2 === undefined) {
            return true;
        }

        if ((resourceMapping1 === undefined && resourceMapping2 !== undefined)
        || (resourceMapping1 !== undefined && resourceMapping2 === undefined)
        || resourceMapping1.length != resourceMapping2.length) {
            return false;
        }

        const sortedResourceMapping1 = Array.from(resourceMapping1.sort());
        const sortedResourceMapping2 = Array.from(resourceMapping2.sort());
        for (const i in resourceMapping1){
            if (sortedResourceMapping1[i].id() != sortedResourceMapping2[i].id())
            {
                return false;
            }
        }

        return true;
    }
}

interface LgFileParsedResult  {
    prefix: string;
    language: string;
} 