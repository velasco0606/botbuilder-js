// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AdaptiveDialog, SendActivity, OnIntent, OnDialogEvent, OnUnknownIntent, IfCondition, SetProperty } from "botbuilder-dialogs-adaptive";
import { getRecognizer } from "../recognizer";
import { AddToDo } from "../addToDo";
import { DeleteToDo } from "../deleteToDo";
import { ClearToDos } from "../clearToDos";
import { ShowToDos } from "../showToDos";

export class RootDialog extends AdaptiveDialog {
    constructor() {
        super('main');

        // Bind to production/development recognizer
        this.recognizer = getRecognizer();

        // Handle recognized intents
        this.triggers.push(new OnIntent('#AddToDo', [], [
            new AddToDo()
        ]));

        this.triggers.push(new OnIntent('#DeleteToDo', [], [
            new DeleteToDo()
        ]));

        this.triggers.push(new OnIntent('#ClearToDos', [], [
            new ClearToDos()
        ]));

        this.triggers.push(new OnIntent('#ShowToDos', [], [
            new ShowToDos()
        ]));

        this.triggers.push(new OnUnknownIntent([
            new IfCondition(`user.greeted != true`, [
                new SendActivity(`Hi! I'm a ToDo bot. Say "add a todo named first one" to get started.`),
                new SetProperty(`user.greeted`, `true`)
            ]).else([
                new SendActivity(`Say "add a todo named first one" to get started.`)
            ])
        ]));

        // Define rules to handle cancel events
        this.triggers.push(new OnDialogEvent('cancelAdd', [
            new SendActivity(`Ok... Cancelled adding new todo.`)
        ]));

        this.triggers.push(new OnDialogEvent('cancelDelete', [
            new SendActivity(`Ok...`)
        ]));

        // Define rules for handling errors
        this.triggers.push(new OnDialogEvent('error', [
            new SendActivity(`Oops. An error occurred: @{message}`)
        ]));
    }
}
