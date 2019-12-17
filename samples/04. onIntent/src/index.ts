// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as restify from 'restify';
import { BotFrameworkAdapter, MemoryStorage, ConversationState, UserState } from 'botbuilder';
import { AdaptiveDialog, OnUnknownIntent, SendActivity, TextInput, IfCondition, RegExpRecognizer, OnIntent, EndTurn } from 'botbuilder-dialogs-adaptive';
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
bot.conversationState = new ConversationState(new MemoryStorage());
bot.userState = new UserState(new MemoryStorage());

// Listen for incoming activities.
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        // Route activity to bot.
        await bot.onTurn(context);
    });
});

// Initialize bots root dialog
const dialogs = new AdaptiveDialog();
bot.rootDialog = dialogs;

// Create recognizer
dialogs.recognizer = new RegExpRecognizer().addIntent('JokeIntent', /tell .*joke/i);

// Tell the user a joke
dialogs.triggers.push(new OnIntent('#JokeIntent', [], [
    new SendActivity(`Why did the 🐔 cross the 🛣️?`),
    new EndTurn(),
    new SendActivity(`To get to the other side...`)
]));

// Handle unknown intents
dialogs.triggers.push(new OnUnknownIntent([
    new IfCondition('user.name == null', [
        new TextInput('user.name', `Hi! what's your name?`)
    ]),
    new SendActivity(`Hi @{user.name}. It's nice to meet you.`)
]));

