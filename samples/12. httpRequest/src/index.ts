// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as restify from 'restify';
import { BotFrameworkAdapter, MemoryStorage, ConversationState } from 'botbuilder';
import { AdaptiveDialog, OnUnknownIntent, SendActivity, SetProperty, SwitchCondition, InitProperty, EditArray, ArrayChangeType, TextInput, TraceActivity, DatetimeInput, NumberInput, HttpRequest, HttpMethod, ResponsesTypes, SequenceContext } from 'botbuilder-dialogs-adaptive';
import { DialogManager } from 'botbuilder-dialogs';

// Create HTTP server.
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
    console.log(`\nTo talk to your bot, open echobot.bot file in the Emulator.`);
});

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about .bot file its use and bot configuration.
const adapter = new BotFrameworkAdapter({
    appId: process.env.microsoftAppID,
    appPassword: process.env.microsoftAppPassword,
});

// Create bots DialogManager and bind to state storage
const bot = new DialogManager();
bot.conversationState = new ConversationState(new MemoryStorage());

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

// Handle unknown intents
dialogs.addRule(new OnUnknownIntent([
    new TextInput("dialog.petname", "Welcome! Here is a http request sample, please enter a name for you visual pet."),
    new SendActivity("Great! Your pet's name is {dialog.petname}"),
    new NumberInput("dialog.petid", "Now please enter the id of your pet, this could help you find your pet later."),
    new HttpRequest(HttpMethod.POST, "http://petstore.swagger.io/v2/pet", {
        "test": "test",
        "test2": "test2"
    },
    {
        "id": "{dialog.petid}",
        "category": {
            "id": 0,
            "name": "string"
        },
        "name": "{dialog.petname}",
        "photoUrls": [
            "string"
        ],
        "tags": [
            {
                "id": 0,
                "name": "string"
            }
        ],
        "status": "available"
    }, ResponsesTypes.Json, "dialog.postResponse"
    ),
    new SendActivity("Done! You have added a pet named \"{dialog.postResponse.content.name}\" with id \"{dialog.postResponse.content.id}\""),
    new NumberInput("dialog.id", "Now try to specify the id of your pet, and I will help your find it out from the store."),
    new HttpRequest(HttpMethod.GET, "http://petstore.swagger.io/v2/pet/{dialog.id}", null, null, null, "dialog.getResponse"),
    new SendActivity("Great! I found your pet named \"{dialog.getResponse.content.name}\"")
]));
