/**
 * @module botbuilder-dialogs-adaptive-tests
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Activity, ActivityTypes } from 'botbuilder-core';
import { AssertReplyActivity, AssertReplyActivityConfiguration } from './assertReplyActivity';

export interface AssertReplyConfiguration extends AssertReplyActivityConfiguration {
    text?: string;
    exact?: boolean;
}

export class AssertReply extends AssertReplyActivity {

    public static readonly declarativeType: string = 'Microsoft.Test.AssertReply';

    /**
     * The text value to look for in the reply.
     */
    public text: string;

    /**
     * A value indicating whether text should be an exact match.
     */
    public exact: boolean = true;

    public configure(config: AssertReplyConfiguration): this {
        return super.configure(config);
    }

    public getConditionDescription(): string {
        return this.text;
    }

    public validateReply(activity: Activity) {
        if (this.text) {
            if (this.exact) {
                if (activity.type == ActivityTypes.Message && activity.text != this.text) {
                    throw new Error(this.description || `Text ${activity.text} didn't match expected text: ${this.text}`);
                }
            } else {
                if (activity.type == ActivityTypes.Message && !activity.text.toLowerCase().trim().includes(this.text.toLowerCase().trim())) {
                    throw new Error(this.description || `Text ${activity.text} didn't match expected text: ${this.text}`);
                }
            }
        }

        super.validateReply(activity);
    }
}