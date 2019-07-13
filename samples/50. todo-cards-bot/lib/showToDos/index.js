"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_dialogs_adaptive_1 = require("botbuilder-dialogs-adaptive");
const recognizer_1 = require("../recognizer");
const showToDosCard = require('../../cards/showToDos.json');
class ShowToDos extends botbuilder_dialogs_adaptive_1.AdaptiveDialog {
    constructor() {
        super('ShowToDos', [
            new botbuilder_dialogs_adaptive_1.IfCondition(`user.todos != null`, [
                new botbuilder_dialogs_adaptive_1.DebugBreak(),
                new botbuilder_dialogs_adaptive_1.SendAdaptiveCard(showToDosCard, 'user')
            ]).else([
                new botbuilder_dialogs_adaptive_1.SendActivity(`You have no todos.`)
            ])
        ]);
        // Use parents recognizer
        this.recognizer = recognizer_1.getRecognizer();
    }
}
exports.ShowToDos = ShowToDos;
//# sourceMappingURL=index.js.map