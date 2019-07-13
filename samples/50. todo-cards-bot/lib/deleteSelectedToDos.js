"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_dialogs_adaptive_1 = require("botbuilder-dialogs-adaptive");
const showToDosCard = require('../cards/showToDos.json');
class DeleteSeletedToDos extends botbuilder_dialogs_adaptive_1.AdaptiveDialog {
    constructor() {
        super('DeleteSeletedToDos', [
            new botbuilder_dialogs_adaptive_1.SaveAdaptiveCardInput(showToDosCard, 'dialog'),
            new botbuilder_dialogs_adaptive_1.SetProperty('dialog.count', '0'),
            new botbuilder_dialogs_adaptive_1.ForEach('dialog.todos', [
                new botbuilder_dialogs_adaptive_1.EditArray(botbuilder_dialogs_adaptive_1.ArrayChangeType.remove, 'user.todos', 'dialog.value'),
                new botbuilder_dialogs_adaptive_1.SetProperty('dialog.count', 'dialog.count + 1')
            ]),
            new botbuilder_dialogs_adaptive_1.IfCondition(`dialog.count > 0`, [
                new botbuilder_dialogs_adaptive_1.SendActivity(`Deleted {dialog.count} todos.`)
            ]).else([
                new botbuilder_dialogs_adaptive_1.SendActivity(`No todos deleted.`)
            ])
        ]);
    }
}
exports.DeleteSeletedToDos = DeleteSeletedToDos;
//# sourceMappingURL=deleteSelectedToDos.js.map