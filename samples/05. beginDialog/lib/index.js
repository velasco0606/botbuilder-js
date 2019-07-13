"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
const restify = require("restify");
const botbuilder_1 = require("botbuilder");
const botbuilder_dialogs_adaptive_1 = require("botbuilder-dialogs-adaptive");
const botbuilder_dialogs_1 = require("botbuilder-dialogs");
// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about .bot file its use and bot configuration.
const adapter = new botbuilder_1.BotFrameworkAdapter({
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
const bot = new botbuilder_dialogs_1.DialogManager();
bot.storage = new botbuilder_1.MemoryStorage();
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
const dialogs = new botbuilder_dialogs_adaptive_1.AdaptiveDialog();
bot.rootDialog = dialogs;
//=================================================================================================
// Rules
//=================================================================================================
dialogs.recognizer = new botbuilder_dialogs_adaptive_1.RegExpRecognizer().addIntent('EditProfile', /edit .*profile/i);
dialogs.addRule(new botbuilder_dialogs_adaptive_1.IntentRule('#EditProfile', [
    new botbuilder_dialogs_adaptive_1.SendAdaptiveCard(profileCard, 'user.profile')
]));
dialogs.addRule(new botbuilder_dialogs_adaptive_1.IntentRule('#UpdateProfile', [
    new botbuilder_dialogs_adaptive_1.SaveAdaptiveCardInput(profileCard, 'user.profile'),
    new botbuilder_dialogs_adaptive_1.TextInput('user.profile.name', `What is your name?`),
    new botbuilder_dialogs_adaptive_1.NumberInput('user.profile.age', `How old are you {user.profile.name}?`),
    new botbuilder_dialogs_adaptive_1.SendActivity(`Profile updated {user.profile.name}...`)
]));
dialogs.addRule(new botbuilder_dialogs_adaptive_1.UnknownIntentRule([
    new botbuilder_dialogs_adaptive_1.SendActivity(`Say "edit my profile" to get started`)
]));
//# sourceMappingURL=index.js.map