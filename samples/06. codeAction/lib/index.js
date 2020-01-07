"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
const restify = require("restify");
const botbuilder_1 = require("botbuilder");
const botbuilder_dialogs_adaptive_1 = require("botbuilder-dialogs-adaptive");
const botbuilder_dialogs_1 = require("botbuilder-dialogs");
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
bot.userState = new botbuilder_1.UserState(new botbuilder_1.MemoryStorage());
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
// Add a default rule for handling incoming messages
dialogs.triggers.push(new botbuilder_dialogs_adaptive_1.OnUnknownIntent([
    new botbuilder_dialogs_adaptive_1.CodeAction(async (dc) => {
        const count = dc.state.getValue('conversation.count') || 0;
        dc.state.setValue('conversation.count', count + 1);
        return await dc.endDialog();
    }),
    new botbuilder_dialogs_adaptive_1.SendActivity('{conversation.count}')
]));
//# sourceMappingURL=index.js.map