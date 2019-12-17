// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as restify from 'restify';
import { BotFrameworkAdapter, MemoryStorage, ConversationState, UserState } from 'botbuilder';
import { AdaptiveDialog, OnUnknownIntent, SendActivity, TextInput, IfCondition, RegExpRecognizer, OnIntent, EndTurn, BeginDialog, EndDialog } from 'botbuilder-dialogs-adaptive';
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
const rootDialog = new AdaptiveDialog();
bot.rootDialog = rootDialog;

//=================================================================================================
// Rules
//=================================================================================================

rootDialog.recognizer = new RegExpRecognizer().addIntent('JokeIntent', /tell .*joke/i);

// Tell the user a joke
rootDialog.triggers.push(new OnIntent('#JokeIntent', [], [
    new BeginDialog('TellJokeDialog')
]));

// Handle unknown intents
rootDialog.triggers.push(new OnUnknownIntent([
    new BeginDialog('AskNameDialog')
]));


//=================================================================================================
// Child Dialogs
//=================================================================================================

const askNameDialog = new AdaptiveDialog('AskNameDialog')
askNameDialog.triggers.push(new OnUnknownIntent([
    new IfCondition('user.name == null', [
        new TextInput('user.name', `Hi! what's your name?`)
    ]),
    new SendActivity(`Hi @{user.name}. It's nice to meet you.`),
    new EndDialog()
]));
rootDialog.dialogs.add(askNameDialog);

const tellJokeDialog = new AdaptiveDialog('TellJokeDialog')
tellJokeDialog.triggers.push(new OnUnknownIntent([
    new SendActivity(`Why did the 🐔 cross the 🛣️?`),
    new EndTurn(),
    new SendActivity(`To get to the other side...`),
    new EndDialog()
]));
rootDialog.dialogs.add(tellJokeDialog);