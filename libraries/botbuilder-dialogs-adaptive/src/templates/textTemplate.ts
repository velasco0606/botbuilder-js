import { Template } from '../template';
import { TurnContext } from 'botbuilder-core';
import { LanguageGenerator } from '../languageGenerator';

export class TextTemplate implements Template {

    public declarativeType: string = 'Microsoft.TextTemplates';

    public template: string;

    public constructor(template: string) {
        this.template = template;
    }

    public bindToData(context: TurnContext, data: object): Promise<string | undefined> {
        if (!this.template) {
            throw new Error(`ArgumentNullException: ${ this.template }`);
        }

        const languageGenerator: LanguageGenerator = context.turnState.get('LanguageGenerator');
        if (languageGenerator !== undefined) {
            const result = languageGenerator.generate(context, this.template, data);
            return Promise.resolve(result);
        }
        
        return Promise.resolve(undefined);
    }

    public toString = (): string => { return `TextTemplate(${ this.template })`;};
}