/**
 * @module botbuilder-lg
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ImportResolver, ImportResolverDelegate } from './importResolver';
import { LGImport } from './lgImport';
import { LGParser } from './lgParser';
import { LGTemplate } from './lgTemplate';

/**
 * LG Resource
 */
export class LGResource {

    public id: string;

    public templates: LGTemplate[];

    public imports: LGImport[];

    public content: string;

    public constructor(templates: LGTemplate[], imports: LGImport[], content: string, id: string = '') {
        this.templates = templates;
        this.imports = imports;
        this.id = id;
        this.content = content;
    }

    public discoverLGResources(importResolver: ImportResolverDelegate): LGResource[] {
        const resourcesFound: LGResource[] = [];
        importResolver = importResolver ? importResolver : ImportResolver.fileResolver;
        this.resolveImportResources(this, importResolver, resourcesFound);

        return resourcesFound;
    }

    /**
    * update an exist template.
    * @param templateName origin template name. the only id of a template.
    * @param newTemplateName new template Name.
    * @param parameters new params.
    * @param templateBody new template body.
    * @returns new LG resource.
    */
    public updateTemplate(templateName: string, newTemplateName: string, parameters: string[], templateBody: string): LGResource {
        const template: LGTemplate = this.templates.find((u: LGTemplate): boolean => u.name === templateName);
        if (template === undefined) {
            return this;
        }

        const templateNameLine: string = this.buildTemplateNameLine(newTemplateName, parameters);
        const newTemplateBody: string = this.convertTemplateBody(templateBody);
        const content = `${ templateNameLine }\r\n${ newTemplateBody }\r\n`;
        const startLine: number = template.parseTree.start.line - 1;
        const stopLine: number = template.parseTree.stop.line - 1;

        const newContent: string = this.replaceRangeContent(this.content, startLine, stopLine, content);

        return LGParser.parse(newContent, this.id);
    }

    /**
    * Add a new template and return LG resource.
    * @param templateName new template name.
    * @param parameters new params.
    * @param templateBody new  template body.
    * @returns new lg resource.
    */
    public addTemplate(templateName: string, parameters: string[], templateBody: string): LGResource {
        const template: LGTemplate = this.templates.find((u: LGTemplate): boolean => u.name === templateName);
        if (template !== undefined) {
            throw new Error(`template ${ templateName } already exists.`);
        }

        const templateNameLine: string = this.buildTemplateNameLine(templateName, parameters);
        const newTemplateBody: string = this.convertTemplateBody(templateBody);
        const newContent = `${ this.content.trimRight() }\r\n\r\n${ templateNameLine }\r\n${ newTemplateBody }\r\n`;

        return LGParser.parse(newContent, this.id);
    }

    /**
    * Delete an exist template.
    * @param templateName which template should delete.
    * @returns return the new lg resource.
    */
    public deleteTemplate(templateName: string): LGResource {
        const template: LGTemplate = this.templates.find((u: LGTemplate): boolean => u.name === templateName);
        if (template === undefined) {
            return this;
        }

        const startLine: number = template.parseTree.start.line - 1;
        const stopLine: number = template.parseTree.stop.line - 1;

        const newContent: string = this.replaceRangeContent(this.content, startLine, stopLine, undefined);

        return LGParser.parse(newContent, this.id);
    }

    public toString(): string {
        return this.content;
    }

    private replaceRangeContent(originString: string, startLine: number, stopLine: number, replaceString: string): string {
        const originList: string[] = originString.split('\n');
        const destList: string[] = [];

        if (startLine < 0 || startLine > stopLine || stopLine >= originList.length) {
            throw new Error(`index out of range.`);
        }

        destList.push(...this.trimList(originList.slice(0, startLine)));

        if (stopLine < originList.length - 1) {
            // insert at the middle of the content
            destList.push('\r\n');
            if (replaceString){
                destList.push(replaceString);
                destList.push('\r\n');
            }

            destList.push(...this.trimList(originList.slice(stopLine + 1)));
        } else {
            // insert at the tail of the content
            if (replaceString){
                destList.push('\r\n');
                destList.push(replaceString);
            }
        }

        return this.buildNewLGContent(this.trimList(destList));
    }

    /**
     * trim the newlines at the beginning or at the tail of the array
     * @param input input array
     */
    private trimList(input: string[]): string[] {
        if (input === undefined) {
            return undefined;
        }

        let startIndex = 0;
        let endIndex = input.length;

        for(let i = 0; i< input.length; i++) {
            if (input[i].trim() !== '') {
                startIndex = i;
                break;
            }
        }

        for(let i = input.length - 1; i >= 0; i--) {
            if (input[i].trim() !== '') {
                endIndex = i + 1;
                break;
            }
        }

        return input.slice(startIndex, endIndex);
    }

    private buildNewLGContent(destList: string[]): string {
        let result = '';
        for (let i = 0; i < destList.length; i++) {
            const currentItem: string = destList[i];
            result = result.concat(currentItem);
            if (currentItem.endsWith('\r')) {
                result = result.concat('\n');
            } else if (i < destList.length - 1 && !currentItem.endsWith('\r\n')) {
                result = result.concat('\r\n');
            }
        }

        return result;
    }

    private convertTemplateBody(templateBody: string): string {
        if (!templateBody) {
            return '';
        }

        const replaceList: string[] = templateBody.split('\n');
        const wrappedReplaceList: string[] = replaceList.map((u: string): string => this.wrapTemplateBodyString(u));

        return wrappedReplaceList.join('\n');
    }

    private wrapTemplateBodyString(replaceItem: string): string {
        // tslint:disable-next-line: newline-per-chained-call
        const isStartWithHash: boolean = replaceItem.trimLeft().startsWith('#');
        if (isStartWithHash) {
            return `- ${ replaceItem.trimLeft() }`;
        } else {
            return replaceItem;
        }
    }

    private buildTemplateNameLine(templateName: string, parameters: string[]): string {
        if (parameters === undefined || parameters === null) {
            return `# ${ templateName }`;
        } else {
            return `# ${ templateName }(${ parameters.join(', ') })`;
        }
    }

    private resolveImportResources(start: LGResource, importResolver: ImportResolverDelegate, resourcesFound: LGResource[]): void {
        const resourceIds: string[] = start.imports.map((lg: LGImport): string => lg.id);
        resourcesFound.push(start);

        resourceIds.forEach((resourceId: string): any => {
            try {
                const { content, id } = importResolver(start.id, resourceId);
                const childResource: LGResource = LGParser.parse(content, id);

                if (!(resourcesFound.some((x: LGResource): boolean => x.id === childResource.id))) {
                    this.resolveImportResources(childResource, importResolver, resourcesFound);
                }
            } catch (e) {
                throw new Error(`[Error]${ resourceId }:${ e.message }`);
            }
        });
    }
}
