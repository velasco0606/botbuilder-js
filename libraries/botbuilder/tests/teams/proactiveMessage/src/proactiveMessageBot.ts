// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    Activity,
    ChannelAccount,
    TeamsActivityHandler,
    TeamInfo,
    TurnContext
} from 'botbuilder';

//
// This bot should be added to a team, but could work in group chat (with updated onMembersAdded implementations). If you 
// @mention the bot and send it a message it will "proactivly" message you. See the comment below on the continueConversation call 
// since proactive messaging can work 2 ways.
//
export class ProactiveMessageBot extends TeamsActivityHandler {
    constructor() {
        super();

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (const member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    await context.sendActivity('Hello and welcome!');
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onTeamsMembersAddedEvent(async (membersAdded: ChannelAccount[], teamInfo: TeamInfo, context: TurnContext, next: () => Promise<void>): Promise<void> => {
           
            await next();
        });

        this.onTeamsMembersRemovedEvent(async (membersRemoved: ChannelAccount[], teamInfo: TeamInfo, context: TurnContext, next: () => Promise<void>): Promise<void> => {
            await next();
        });
    }
}
