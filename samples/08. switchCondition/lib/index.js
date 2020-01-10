"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
const restify = require("restify");
const botbuilder_1 = require("botbuilder");
const botbuilder_dialogs_adaptive_1 = require("botbuilder-dialogs-adaptive");
const botbuilder_dialogs_1 = require("botbuilder-dialogs");
const case_1 = require("botbuilder-dialogs-adaptive/lib/actions/case");
// Create HTTP server.
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
    console.log(`\nTo talk to your bot, open echobot.bot file in the Emulator.`);
});
// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about .bot file its use and bot configuration.
const adapter = new botbuilder_1.BotFrameworkAdapter({
    appId: process.env.microsoftAppID,
    appPassword: process.env.microsoftAppPassword,
});
// Create bots DialogManager and bind to state storage
const bot = new botbuilder_dialogs_1.DialogManager();
bot.conversationState = new botbuilder_1.ConversationState(new botbuilder_1.MemoryStorage());
// Listen for incoming activities.
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        // Route activity to bot.
        await bot.onTurn(context);
    });
});
// Initialize bots root dialog
const dialogs = new botbuilder_dialogs_adaptive_1.AdaptiveDialog();
bot.rootDialog = dialogs;
// Handle unknown intents
dialogs.triggers.push(new botbuilder_dialogs_adaptive_1.OnUnknownIntent([
    new botbuilder_dialogs_adaptive_1.SetProperty('dialog.age', "'22'"),
    new botbuilder_dialogs_adaptive_1.SwitchCondition('dialog.age', null, [
        new case_1.Case("21", [
            new botbuilder_dialogs_adaptive_1.SendActivity("age is 21!")
        ]),
        new case_1.Case("22", [
            new botbuilder_dialogs_adaptive_1.SendActivity("age is 22!")
        ])
    ])
]));
//# sourceMappingURL=index.js.map