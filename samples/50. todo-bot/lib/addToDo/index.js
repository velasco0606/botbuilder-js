"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_dialogs_adaptive_1 = require("botbuilder-dialogs-adaptive");
const recognizer_1 = require("../recognizer");
class AddToDo extends botbuilder_dialogs_adaptive_1.AdaptiveDialog {
    constructor() {
        super('AddToDo');
        this.triggers.push(new botbuilder_dialogs_adaptive_1.OnBeginDialog([
            new botbuilder_dialogs_adaptive_1.TextInput('$title', '@title', `What would you like to call your new todo?`),
            new botbuilder_dialogs_adaptive_1.EditArray(botbuilder_dialogs_adaptive_1.ArrayChangeType.push, 'user.todos', '$title'),
            new botbuilder_dialogs_adaptive_1.SendActivity(`Added a todo named "{$title}". You can delete it by saying "delete todo named {$title}".`),
            new botbuilder_dialogs_adaptive_1.IfCondition(`user.tips.showToDos != true`, [
                new botbuilder_dialogs_adaptive_1.SendActivity(`To view your todos just ask me to "show my todos".`),
                new botbuilder_dialogs_adaptive_1.SetProperty('user.tips.showToDos', 'true')
            ])
        ]));
        // Add interruption rules
        this.triggers.push(new botbuilder_dialogs_adaptive_1.OnIntent('#Cancel', [], [
            new botbuilder_dialogs_adaptive_1.CancelAllDialogs('cancelAdd')
        ]));
        // Use parents recognizer
        this.recognizer = recognizer_1.getRecognizer();
    }
}
exports.AddToDo = AddToDo;
//# sourceMappingURL=index.js.map