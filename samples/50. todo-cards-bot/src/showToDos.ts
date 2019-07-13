// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AdaptiveDialog, SendActivity, IfCondition, SendAdaptiveCard, } from "botbuilder-dialogs-adaptive";
import { getRecognizer } from "./recognizer";

const showToDosCard = require('../cards/showToDos.json');

export class ShowToDos extends AdaptiveDialog {
    constructor() {
        super('ShowToDos', [
            new IfCondition(`user.todos != null`, [
                new SendAdaptiveCard(showToDosCard, 'user')
            ]).else([
                new SendActivity(`You have no todos.`)
            ])
        ]);

        // Use parents recognizer
        this.recognizer = getRecognizer();
    }
}
