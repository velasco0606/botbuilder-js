/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogConfiguration, Dialog, DialogContext, DialogTurnResult, DialogEvent, DialogReason, Choice, ListStyle, ChoiceFactoryOptions, ChoiceFactory, DialogEvents, TurnPath } from 'botbuilder-dialogs';
import { ActivityTypes, Activity, InputHints, MessageFactory } from 'botbuilder-core';
import { ExpressionEngine, Expression } from 'botframework-expressions';
import { AdaptiveEventNames } from '../sequenceContext';
import { Template } from '../template';
import { TextTemplate } from '../templates/textTemplate';

export interface InputDialogConfiguration extends DialogConfiguration {
    allowInterruptions?: string;
    alwaysPrompt?: boolean;
    value?: string;
    prompt?: Template;
    unrecognizedPrompt?: Template;
    invalidPrompt?: Template;
    property?: string;
    validations?: string[];
    maxTurnCount?: number;
    defaultValue?: string;
}

export enum InputState {
    missing = 'missing',
    unrecognized = 'unrecognized',
    invalid = 'invalid',
    valid = 'valid'
}

export abstract class InputDialog extends Dialog {
    public static OPTIONS_PROPERTY = 'this.options';
    public static VALUE_PROPERTY = 'this.value';
    public static TURN_COUNT_PROPERTY = 'this.turnCount';

    private _allowInterruptions: Expression;

    /**
     * A value indicating whether the input should always prompt the user regardless of there being a value or not.
     */
    public alwaysPrompt = false;

    /**
     * Get interruption policy.
     */
    public get allowInterruptions(): string {
        return this._allowInterruptions ? this._allowInterruptions.toString() : undefined;
    }

    /**
     * Set interruption policy.
     */
    public set allowInterruptions(value: string) {
        this._allowInterruptions = value ? new ExpressionEngine().parse(value) : undefined;
    }

    /**
     * The value expression which the input will be bound to.
     */
    public property: string;

    /**
     * A value expression which can be used to initialize the input prompt.
     */
    public value: string;

    /**
     * The activity to send to the user.
     */
    public prompt: Template;

    /**
     * The activity template for retrying prompt.
     */
    public unrecognizedPrompt: Template;

    /**
     * The activity template to send to the user whenever the value provided is invalid or not.
     */
    public invalidPrompt: Template;

    /**
     * The activity template to send when maxTurnCount has be reached and the default value is used.
     */
    public defaultValueResponse: Template;

    /**
     * The expressions to run to validate the input.
     */
    public validations: string[] = [];

    /**
     * Maximum number of times to ask the user for this value before the dialog gives up.
     */
    public maxTurnCount?: number;

    /**
     * The default value for the input dialog when maxTurnCount is exceeded.
     */
    public defaultValue?: string;

    public async beginDialog(dc: DialogContext, options?: any): Promise<DialogTurnResult> {
        // Initialize and persist options
        const opts = this.onInitializeOptions(dc, options || {});
        dc.state.setValue(InputDialog.OPTIONS_PROPERTY, opts);

        // Initialize turn count & input
        dc.state.setValue(InputDialog.TURN_COUNT_PROPERTY, 0);
        if (this.property && this.alwaysPrompt) {
            dc.state.deleteValue(this.property);
        }

        // Recognize input
        const state = this.alwaysPrompt ? InputState.missing : await this.recognizeInput(dc, 0);
        if (state == InputState.valid) {
            // Return input
            const value = dc.state.getValue(InputDialog.VALUE_PROPERTY);
            dc.state.setValue(this.property, value);
            return await dc.endDialog(value);
        } else {
            // Prompt user
            dc.state.setValue(InputDialog.TURN_COUNT_PROPERTY, 1);
            return await this.promptUser(dc, state);
        }
    }

    public async continueDialog(dc: DialogContext): Promise<DialogTurnResult> {
        // Filter to only message activities
        const activity = dc.context.activity;
        if (activity.type !== ActivityTypes.Message) {
            return Dialog.EndOfTurn;
        }

        // Are we continuing after an interruption?
        const interrupted = dc.state.getValue(TurnPath.INTERRUPTED, false);
        const turnCount = dc.state.getValue(InputDialog.TURN_COUNT_PROPERTY, 0);
        const state = await this.recognizeInput(dc, interrupted ? 0 : turnCount);
        if (state === InputState.valid) {
            const input = dc.state.getValue(InputDialog.VALUE_PROPERTY);
            if (this.property) {
                dc.state.setValue(this.property, input);
            }
            return await dc.endDialog(input);
        } else if (!this.maxTurnCount || turnCount < this.maxTurnCount) {
            dc.state.setValue(InputDialog.TURN_COUNT_PROPERTY, turnCount + 1);
            return await this.promptUser(dc, state);
        } else {
            if (this.defaultValue) {
                const { value } = new ExpressionEngine().parse(this.defaultValue).tryEvaluate(dc.state);
                if (this.defaultValueResponse) {
                    const response = await this.defaultValueResponse.bindToData(dc.context, dc.state);
                    await dc.context.sendActivity(response);
                }

                dc.state.setValue(this.property, value);
                return await dc.endDialog(value);
            }
        }

        return await dc.endDialog();
    }

    public async resumeDialog(dc: DialogContext, reason: DialogReason, result?: any): Promise<DialogTurnResult> {
        // Re-send initial prompt
        return await this.promptUser(dc, InputState.missing);
    }

    public configure(config: InputDialogConfiguration): this {
        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                const value = config[key];
                switch (key) {
                    case 'prompt':
                        this.prompt = new TextTemplate(value);
                        break;
                    case 'unrecognizedPrompt':
                        this.unrecognizedPrompt = new TextTemplate(value);
                        break;
                    case 'invalidPrompt':
                        this.invalidPrompt = new TextTemplate(value);
                        break;
                    case 'validations':
                        (value as any[]).forEach((exp) => this.validations.push(exp));
                        break;
                    case 'value':
                        this.value = value;
                    case 'defaultValue':
                        this.defaultValue = value;
                    default:
                        super.configure({ [key]: value });
                        break;
                }
            }
        }

        return this;
    }

    protected async onPreBubbleEvent(dc: DialogContext, event: DialogEvent): Promise<boolean> {
        if (event.name === DialogEvents.activityReceived && dc.context.activity.type === ActivityTypes.Message) {
            if (dc.parent) {
                dc.parent.emitEvent(AdaptiveEventNames.recognizeUtterance, dc.context.activity, false);
            }
            let canInterrupt = true;
            if (this.allowInterruptions) {
                const { value, error } = this._allowInterruptions.tryEvaluate(dc.state);
                canInterrupt = !error && !!value;
            }
            return !canInterrupt;
        }

        return false;
    }

    protected abstract onRecognizeInput(dc: DialogContext): Promise<InputState>;

    protected onInitializeOptions(dc: DialogContext, options: any): any {
        return Object.assign({}, options);
    }

    protected async onRenderPrompt(dc: DialogContext, state: InputState):  Promise<Partial<Activity>> {
        switch (state) {
            case InputState.unrecognized:
                if (this.unrecognizedPrompt) {
                    return await this.unrecognizedPrompt.bindToData(dc.context, dc.state);
                } else if (this.invalidPrompt) {
                    return await this.invalidPrompt.bindToData(dc.context, dc.state);
                }
                break;
            case InputState.invalid:
                if (this.invalidPrompt) {
                    return await this.invalidPrompt.bindToData(dc.context, dc.state);
                } else if (this.unrecognizedPrompt) {
                    return await this.unrecognizedPrompt.bindToData(dc.context, dc.state);
                }
                break;
        }

        return await this.prompt.bindToData(dc.context, dc.state);
    }

    protected getDefaultInput(dc: DialogContext): any {
        const text = dc.context.activity.text;
        return typeof text == 'string' && text.length > 0 ? text : undefined;
    }


    /**
     * Helper function to compose an output activity containing a set of choices.
     * @param prompt The prompt to append the users choices to.
     * @param channelId ID of the channel the prompt is being sent to.
     * @param choices List of choices to append.
     * @param style Configured style for the list of choices.
     * @param options (Optional) options to configure the underlying ChoiceFactory call.
     */
    protected appendChoices(
        prompt: Partial<Activity>,
        channelId: string,
        choices: (string | Choice)[],
        style: ListStyle,
        options?: ChoiceFactoryOptions
    ): Partial<Activity> {
        // Create temporary msg
        let msg: Partial<Activity>;
        const text = prompt.text || '';
        switch (style) {
            case ListStyle.inline:
                msg = ChoiceFactory.inline(choices, text, null, options);
                break;

            case ListStyle.list:
                msg = ChoiceFactory.list(choices, text, null, options);
                break;

            case ListStyle.suggestedAction:
                msg = ChoiceFactory.suggestedAction(choices, text);
                break;

            case ListStyle.heroCard:
                msg = ChoiceFactory.heroCard(choices as Choice[], text);
                break;

            case ListStyle.none:
                msg = MessageFactory.text(text);
                break;

            default:
                msg = ChoiceFactory.forChannel(channelId, choices, text, null, options);
                break;
        }

        // Update clone of prompt with text, actions and attachments
        const clone = JSON.parse(JSON.stringify(prompt)) as Activity;
        clone.text = msg.text;
        if (msg.suggestedActions && Array.isArray(msg.suggestedActions.actions) && msg.suggestedActions.actions.length > 0) {
            clone.suggestedActions = msg.suggestedActions;
        }

        if (msg.attachments) {
            clone.attachments = msg.attachments;
        }

        if (!clone.inputHint) {
            clone.inputHint = InputHints.ExpectingInput;
        }

        return clone;
    }

    private async recognizeInput(dc: DialogContext, turnCount: number): Promise<InputState> {
        let input: any;
        if (this.property) {
            input = dc.state.getValue(this.property);
            dc.state.deleteValue(this.property);
        }

        if (!input && this.value) {
            const { value, error } = new ExpressionEngine().parse(this.value).tryEvaluate(dc.state);
            if (error) {
                throw new Error(`In InputDialog, this.value expression evaluation resulted in an error. Expression: ${ this.value }. Error: ${ error }`);
            }
            input = value;
        }

        const activityProcessed = dc.state.getValue(TurnPath.ACTIVITYPROCESSED);
        if (!activityProcessed && !input && turnCount > 0) {
            if ((this.constructor.name) == 'AttachmentInput') {
                input = dc.context.activity.attachments;
            } else {
                input = dc.context.activity.text;
            }
        }

        dc.state.setValue(InputDialog.VALUE_PROPERTY, input);
        if (input) {
            const state = await this.onRecognizeInput(dc);
            if (state == InputState.valid) {
                for (let i = 0; i < this.validations.length; i++) {
                    const validation = this.validations[i];
                    const exp = new ExpressionEngine().parse(validation);
                    const { value } = exp.tryEvaluate(dc.state);
                    if (!value) {
                        return InputState.invalid;
                    }
                }

                dc.state.setValue(TurnPath.ACTIVITYPROCESSED, true);
                return InputState.valid;
            } else {
                return state;
            }
        } else {
            return InputState.missing;
        }
    }

    private async promptUser(dc: DialogContext, state: InputState): Promise<DialogTurnResult> {
        const prompt = await this.onRenderPrompt(dc, state);
        await dc.context.sendActivity(prompt);
        return Dialog.EndOfTurn;
    }
}
