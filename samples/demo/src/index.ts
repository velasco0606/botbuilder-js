/* eslint-disable @typescript-eslint/explicit-function-return-type */
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { BotFrameworkAdapter, MemoryStorage, ConversationState, UserState } from 'botbuilder';
import { DialogManager } from 'botbuilder-dialogs';
import { AdaptiveDialog } from 'botbuilder-dialogs-adaptive';
import { TypeLoader, ResourceExplorer, TypeFactory } from 'botbuilder-dialogs-declarative';
import fs = require('fs');
import * as restify from 'restify';
import { AdaptiveComponentRegistration } from './adaptiveComponentRegistration';

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

const io = require('socket.io')(server.server);
io.on('connect', socket => {
    console.log('connect', socket.conn.id);
    adapter.emitEvent = (name: string, value: string) => {
        console.log(name, value);
        socket.emit(name, value);
    };
});

const dialogPath = 'resources/Main.dialog';
const resourcePath = 'resources';

let dialogManager: DialogManager;

function readPackageJson(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, buffer) => {
            if (err) { reject(err); }
            const json = JSON.parse(buffer.toString().trim());
            resolve(json);
        });
    });
};

async function loadDialog() {
    const typeFactory = new TypeFactory();
    const resourceExplorer = new ResourceExplorer();
    resourceExplorer.addFolder(resourcePath, true, false);

    const typeLoader = new TypeLoader(typeFactory, resourceExplorer);
    typeLoader.addComponent(new AdaptiveComponentRegistration());

    const json = await readPackageJson(dialogPath);
    const dialog = await typeLoader.load(json) as AdaptiveDialog;

    dialogManager = new DialogManager();
    dialogManager.conversationState = new ConversationState(new MemoryStorage());
    dialogManager.userState = new UserState(new MemoryStorage());
    dialogManager.rootDialog = dialog;
}

server.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, Authorization, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

server.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
    } else {
        next();
    }
});

server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        // Route activity to bot.
        await dialogManager.onTurn(context);
    });
});

server.get('/api/dialog', (req, res) => {
    const json = JSON.stringify(dialogManager.rootDialog);
    res.setHeader('Content-Type', 'application/json');
    res.end(json.replace(/\$kind/g, '$type'));
});

server.get('/api/resource', (req, res) => {
    fs.readdir(resourcePath, (err, files) => {
        const result = {};
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const name = file.replace('.dialog', '');
            const data = fs.readFileSync(`${ resourcePath }/${ file }`);
            result[name] = JSON.parse(data.toString());
        }
        const json = JSON.stringify(result);
        res.setHeader('Content-Type', 'application/json');
        res.end(json.replace(/\$kind/g, '$type'));
    });
});

loadDialog();