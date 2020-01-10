import { Template } from '../template';
import { TurnContext, Activity } from 'botbuilder-core';
import { LanguageGenerator } from '../languageGenerator';
import { ActivityFactory } from 'botbuilder-lg';

export class ActivityTemplate implements Template {
    
    public declarativeType: string = 'Microsoft.ActivityTemplate';
    public template: string;

    public constructor(template: string) {
        this.template = template;
    }

    public async bindToData(context: TurnContext, data: object): Promise<Partial<Activity> | undefined> {
        if(this.template) {
            const languageGenerator: LanguageGenerator = context.turnState.get('LanguageGenerator');
            if (languageGenerator) {
                const lgStringResult = await languageGenerator.generate(context, this.template, data);
                const result = ActivityFactory.createActivity(lgStringResult);
                return Promise.resolve(result);
            } else {
                let message = ActivityFactory.createActivity('');
                message.text = this.template;
                message.speak = this.template;
                return Promise.resolve(message);
            }  
        }

        return Promise.resolve(undefined);
    }

    public toString = (): string => { return `ActivityTemplate(${ this.template })`;};
}