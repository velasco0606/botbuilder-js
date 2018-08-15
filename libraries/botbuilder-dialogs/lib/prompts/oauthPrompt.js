"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const botbuilder_core_1 = require("botbuilder-core");
const dialog_1 = require("../dialog");
/**
 * Creates a new prompt that asks the user to sign in using the Bot Frameworks Single Sign On (SSO)
 * service.
 *
 * @remarks
 * The prompt will attempt to retrieve the users current token and if the user isn't signed in, it
 * will send them an `OAuthCard` containing a button they can press to signin. Depending on the
 * channel, the user will be sent through one of two possible signin flows:
 *
 * - The automatic signin flow where once the user signs in and the SSO service will forward the bot
 * the users access token using either an `event` or `invoke` activity.
 * - The "magic code" flow where where once the user signs in they will be prompted by the SSO
 * service to send the bot a six digit code confirming their identity. This code will be sent as a
 * standard `message` activity.
 *
 * Both flows are automatically supported by the `OAuthPrompt` and the only thing you need to be
 * careful of is that you don't block the `event` and `invoke` activities that the prompt might
 * be waiting on.
 *
 * > [!NOTE]
 * > You should avoid persisting the access token with your bots other state. The Bot Frameworks
 * > SSO service will securely store the token on your behalf. If you store it in your bots state
 * > it could expire or be revoked in between turns.
 * >
 * > When calling the prompt from within a waterfall step you should use the token within the step
 * > following the prompt and then let the token go out of scope at the end of your function.
 *
 * #### Prompt Usage
 *
 * When used with your bots `DialogSet` you can simply add a new instance of the prompt as a named
 * dialog using `DialogSet.add()`. You can then start the prompt from a waterfall step using either
 * `DialogContext.begin()` or `DialogContext.prompt()`. The user will be prompted to signin as
 * needed and their access token will be passed as an argument to the callers next waterfall step:
 *
 * ```JavaScript
 * const { DialogSet, OAuthPrompt } = require('botbuilder-dialogs');
 *
 * const dialogs = new DialogSet();
 *
 * dialogs.add('loginPrompt', new OAuthPrompt({
 *    connectionName: 'GitConnection',
 *    title: 'Login To GitHub',
 *    timeout: 300000   // User has 5 minutes to login
 * }));
 *
 * dialogs.add('taskNeedingLogin', [
 *      async function (dc) {
 *          await dc.begin('loginPrompt');
 *      },
 *      async function (dc, token) {
 *          if (token) {
 *              // Continue with task needing access token
 *          } else {
 *              await dc.context.sendActivity(`Sorry... We couldn't log you in. Try again later.`);
 *              await dc.end();
 *          }
 *      }
 * ]);
 * ```
 */
class OAuthPrompt extends dialog_1.Dialog {
    /**
     * Creates a new `OAuthPrompt` instance.
     * @param dialogId Unique ID of the dialog within its parent `DialogSet`.
     * @param settings Settings used to configure the prompt.
     * @param validator (Optional) validator that will be called each time the user responds to the prompt. If the validator replies with a message no additional retry prompt will be sent.
     */
    constructor(dialogId, settings, validator) {
        super(dialogId);
        this.settings = settings;
        this.validator = validator;
    }
    dialogBegin(dc, options) {
        return __awaiter(this, void 0, void 0, function* () {
            // Ensure prompts have input hint set
            const o = Object.assign({}, options);
            if (o.prompt && typeof o.prompt === 'object' && typeof o.prompt.inputHint !== 'string') {
                o.prompt.inputHint = botbuilder_core_1.InputHints.ExpectingInput;
            }
            if (o.retryPrompt && typeof o.retryPrompt === 'object' && typeof o.retryPrompt.inputHint !== 'string') {
                o.retryPrompt.inputHint = botbuilder_core_1.InputHints.ExpectingInput;
            }
            // Initialize prompt state
            const timeout = typeof this.settings.timeout === 'number' ? this.settings.timeout : 54000000;
            const state = dc.activeDialog.state;
            state.state = {};
            state.options = o;
            state.expires = new Date().getTime() + timeout;
            // Attempt to get the users token
            const output = yield this.getUserToken(dc.context);
            if (output !== undefined) {
                // Return token
                return yield dc.end(output);
            }
            else {
                // Prompt user to login
                yield this.sendOAuthCardAsync(dc.context, state.options.prompt);
                return dialog_1.Dialog.EndOfTurn;
            }
        });
    }
    dialogContinue(dc) {
        return __awaiter(this, void 0, void 0, function* () {
            // Recognize token
            const recognized = yield this.recognizeToken(dc.context);
            // Check for timeout
            const state = dc.activeDialog.state;
            const isMessage = dc.context.activity.type === botbuilder_core_1.ActivityTypes.Message;
            const hasTimedOut = isMessage && (new Date().getTime() > state.expires);
            if (hasTimedOut) {
                return yield dc.end(undefined);
            }
            else {
                // Validate the return value
                let end = false;
                let endResult;
                if (this.validator) {
                    yield this.validator(dc.context, {
                        recognized: recognized,
                        state: state.state,
                        options: state.options,
                        end: (output) => {
                            end = true;
                            endResult = output;
                        }
                    });
                }
                else if (recognized.succeeded) {
                    end = true;
                    endResult = recognized.value;
                }
                // Return recognized value or re-prompt
                if (end) {
                    return yield dc.end(endResult);
                }
                else {
                    // Send retry prompt
                    if (!dc.context.responded && isMessage && state.options.retryPrompt) {
                        yield dc.context.sendActivity(state.options.retryPrompt);
                    }
                    return dialog_1.Dialog.EndOfTurn;
                }
            }
        });
    }
    getUserToken(context, code) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate adapter type
            if (!('getUserToken' in context.adapter)) {
                throw new Error(`OAuthPrompt.getUserToken(): not supported for the current adapter.`);
            }
            // Get the token and call validator
            const adapter = context.adapter; // cast to BotFrameworkAdapter
            return yield adapter.getUserToken(context, this.settings.connectionName, code);
        });
    }
    /**
     * Signs the user out of the service.
     *
     * @remarks
     * This example shows creating an instance of the prompt and then signing out the user.
     *
     * ```JavaScript
     * const prompt = new OAuthPrompt({
     *    connectionName: 'GitConnection',
     *    title: 'Login To GitHub'
     * });
     * await prompt.signOutUser(context);
     * ```
     * @param context
     */
    signOutUser(context) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate adapter type
            if (!('signOutUser' in context.adapter)) {
                throw new Error(`OAuthPrompt.signOutUser(): not supported for the current adapter.`);
            }
            // Sign out user
            const adapter = context.adapter; // cast to BotFrameworkAdapter
            return adapter.signOutUser(context, this.settings.connectionName);
        });
    }
    sendOAuthCardAsync(context, prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate adapter type
            if (!('getUserToken' in context.adapter)) {
                throw new Error(`OAuthPrompt.prompt(): not supported for the current adapter.`);
            }
            // Initialize outgoing message
            const msg = typeof prompt === 'object' ? Object.assign({}, prompt) : botbuilder_core_1.MessageFactory.text(prompt, undefined, botbuilder_core_1.InputHints.ExpectingInput);
            if (!Array.isArray(msg.attachments)) {
                msg.attachments = [];
            }
            // Add login card as needed
            if (this.channelSupportsOAuthCard(context.activity.channelId)) {
                const cards = msg.attachments.filter((a) => a.contentType === botbuilder_core_1.CardFactory.contentTypes.oauthCard);
                if (cards.length == 0) {
                    // Append oauth card
                    msg.attachments.push(botbuilder_core_1.CardFactory.oauthCard(this.settings.connectionName, this.settings.title, this.settings.text));
                }
            }
            else {
                const cards = msg.attachments.filter((a) => a.contentType === botbuilder_core_1.CardFactory.contentTypes.signinCard);
                if (cards.length == 0) {
                    // Append signin card
                    const link = yield context.adapter.getSignInLink(context, this.settings.connectionName);
                    msg.attachments.push(botbuilder_core_1.CardFactory.signinCard(this.settings.title, link, this.settings.text));
                }
            }
            // Send prompt
            yield context.sendActivity(msg);
        });
    }
    recognizeToken(context) {
        return __awaiter(this, void 0, void 0, function* () {
            let token;
            if (this.isTokenResponseEvent(context)) {
                token = context.activity.value;
            }
            else if (this.isTeamsVerificationInvoke(context)) {
                const code = context.activity.value.state;
                yield context.sendActivity({ type: 'invokeResponse', value: { status: 200 } });
                token = yield this.getUserToken(context, code);
            }
            else if (context.activity.type === botbuilder_core_1.ActivityTypes.Message) {
                const matched = /(\d{6})/.exec(context.activity.text);
                if (matched && matched.length > 1) {
                    token = yield this.getUserToken(context, matched[1]);
                }
            }
            return token !== undefined ? { succeeded: true, value: token } : { succeeded: false };
        });
    }
    isTokenResponseEvent(context) {
        const activity = context.activity;
        return activity.type === botbuilder_core_1.ActivityTypes.Event && activity.name == "tokens/response";
    }
    isTeamsVerificationInvoke(context) {
        const activity = context.activity;
        return activity.type === botbuilder_core_1.ActivityTypes.Invoke && activity.name == "signin/verifyState";
    }
    channelSupportsOAuthCard(channelId) {
        switch (channelId) {
            case "msteams":
            case "cortana":
            case "skype":
            case "skypeforbusiness":
                return false;
        }
        return true;
    }
}
exports.OAuthPrompt = OAuthPrompt;
//# sourceMappingURL=oauthPrompt.js.map