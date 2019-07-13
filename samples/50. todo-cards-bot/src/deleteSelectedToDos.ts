// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AdaptiveDialog, EditArray, ArrayChangeType, SendActivity, IfCondition, ChoiceInput, LogStep, SetProperty, SaveAdaptiveCardInput, ForEach, DebugBreak } from "botbuilder-dialogs-adaptive";
import { getRecognizer } from "./recognizer";

const showToDosCard = require('../cards/showToDos.json');

export class DeleteSeletedToDos extends AdaptiveDialog {
    constructor() {
        super('DeleteSeletedToDos', [
            new SaveAdaptiveCardInput(showToDosCard, 'dialog'),
            new SetProperty('dialog.count', '0'),
            new ForEach('dialog.todos', [
                new EditArray(ArrayChangeType.remove, 'user.todos', 'dialog.value'),
                new SetProperty('dialog.count', 'dialog.count + 1')
            ]),
            new IfCondition(`dialog.count > 0`, [
                new SendActivity(`Deleted {dialog.count} todos.`)
            ]).else([
                new SendActivity(`No todos deleted.`)
            ])
        ]);
    }
}

