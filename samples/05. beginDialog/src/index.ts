// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as restify from 'restify';
import { BotFrameworkAdapter, MemoryStorage } from 'botbuilder';
import { AdaptiveDialog, UnknownIntentRule, SendActivity, TextInput, IfCondition, RegExpRecognizer, IntentRule, EndTurn, BeginDialog, EndDialog, SendAdaptiveCard, SetProperty, SaveAdaptiveCardInput, NumberInput } from 'botbuilder-dialogs-adaptive';
import { DialogManager } from 'botbuilder-dialogs';

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about .bot file its use and bot configuration.
const adapter = new BotFrameworkAdapter({
    appId: process.env.microsoftAppID,
    appPassword: process.env.microsoftAppPassword,
});

// Create HTTP server.
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
    console.log(`\nTo talk to your bot, open echobot.bot file in the Emulator.`);
});

// Create bots DialogManager and bind to state storage
const bot = new DialogManager();
bot.storage = new MemoryStorage();

// Listen for incoming activities.
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        // Route activity to bot.
        await bot.onTurn(context);
    });
});

const profileCard = {
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "type": "AdaptiveCard",
    "version": "1.0",
    "body": [
        {
            "type": "Input.Text",
            "id": "name",
            "placeholder": "Name"
        },
        {
            "type": "Input.Number",
            "id": "age",
            "placeholder": "Age",
            "min": "1",
            "max": "101"
        }
    ],
    "actions": [
        {
            "type": "Action.Submit",
            "title": "Update Profile {name}",
            "data": {
                "intent": "UpdateProfile"
            }
        }
    ]
};

// Initialize bots root dialog
const dialogs = new AdaptiveDialog();
bot.rootDialog = dialogs;

//=================================================================================================
// Rules
//=================================================================================================

dialogs.recognizer = new RegExpRecognizer().addIntent('EditProfile', /edit .*profile/i);

dialogs.addRule(new IntentRule('#EditProfile', [
    new SendAdaptiveCard(profileCard, 'user.profile')
]));

dialogs.addRule(new IntentRule('#UpdateProfile', [
    new SaveAdaptiveCardInput(profileCard, 'user.profile'),
    new TextInput('user.profile.name', `What is your name?`),
    new NumberInput('user.profile.age', `How old are you {user.profile.name}?`),
    new SendActivity(`Profile updated {user.profile.name}...`)
]));

dialogs.addRule(new UnknownIntentRule([
    new SendActivity(`Say "edit my profile" to get started`)
]));
