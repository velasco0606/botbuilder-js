/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Dialog, TurnPath } from 'botbuilder-dialogs';
import { ExpressionParserInterface, Expression, ExpressionType } from 'botframework-expressions';
import { RecognizerResult } from 'botbuilder-core';
import { AdaptiveEventNames, SequenceContext, ActionChangeList, ActionState, ActionChangeType } from '../sequenceContext';
import { OnDialogEvent, OnDialogEventConfiguration } from './onDialogEvent';

export interface OnIntentConfiguration extends OnDialogEventConfiguration {
    intent?: string;
    entities?: string[];
}

/**
 * Actions triggered when an Activity has been received and the recognized intents and entities match specified list of intent and entity filters.
 */
export class OnIntent extends OnDialogEvent {

    public static declarativeType = 'Microsoft.OnIntent';

    /**
     * Gets or sets intent to match on.
     */
    public intent: string;

    /**
     * Gets or sets entities which must be recognized for this rule to trigger.
     */
    public entities: string[];

    /**
     * Creates a new `OnIntent` instance.
     * @param intent (Optional) Intent to match on.
     * @param entities (Optional) Entities which must be recognized for this rule to trigger.
     * @param actions (Optional) The actions to add to the plan when the rule constraints are met.
     * @param condition (Optional) The condition which needs to be met for the actions to be executed.
     */
    public constructor(intent?: string, entities: string[] = [], actions: Dialog[] = [], condition?: string) {
        super(AdaptiveEventNames.recognizedIntent, actions, condition);
        this.intent = intent;
        this.entities = entities;
    }

    public configure(config: OnIntentConfiguration): this {
        return super.configure(config);
    }

    public getExpression(parser: ExpressionParserInterface): Expression {
        if (!this.intent) {
            throw new Error('Intent cannot be null.');
        }

        const trimmedIntent = this.intent.startsWith('#') ? this.intent.substring(1) : this.intent;
        let intentExpression = parser.parse(`${ TurnPath.RECOGNIZED }.intent == '${trimmedIntent}'`)

        if (this.entities.length > 0) {
            intentExpression = Expression.makeExpression(ExpressionType.And,
                undefined, intentExpression, ...this.entities.map(entity => {
                    if (entity.startsWith('@') || entity.startsWith(TurnPath.RECOGNIZED)) {
                        return parser.parse(`exists(${entity})`);
                    }
                    return parser.parse(`exists(@${entity})`);
                }));
        }

        return Expression.makeExpression(ExpressionType.And, undefined, intentExpression, super.getExpression(parser));
    }

    protected onCreateChangeList(planning: SequenceContext, dialogOptions?: any): ActionChangeList {
        const recognizerResult = planning.state.getValue<RecognizerResult>(`${TurnPath.DIALOGEVENT}.value`);
        if (recognizerResult) {
            // Get top scoring intent
            let topIntent: string;
            let topScore = -1;
            for (const key in recognizerResult.intents) {
                if (recognizerResult.intents.hasOwnProperty(key)) {
                    if (topIntent == undefined) {
                        topIntent = key;
                        topScore = recognizerResult.intents[key].score;
                    } else if (recognizerResult.intents[key].score > topScore) {
                        topIntent = key;
                        topScore = recognizerResult.intents[key].score;
                    }
                }
            }

            const actionState: ActionState = {
                dialogId: this.actionScope.id,
                options: dialogOptions,
                dialogStack: []
            };

            const changeList: ActionChangeList = {
                changeType: ActionChangeType.insertActions,
                actions: [actionState]
            };

            return changeList;
        }

        return super.onCreateChangeList(planning, dialogOptions);
    }
}