/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Activity, ConversationReference, TokenPollingSettings, TokenResponse, TurnContext } from 'botbuilder-core';
import uuidv4 = require('uuid/v4');
import { BotFrameworkAdapter } from './botFrameworkAdapter';
import { TurnStateConstants } from './turnStateConstants';

 export class TokenResolver {
    private static readonly PollingInterval = 60000;   // Poll for token every 1 second.


    private static createTokenResponse(relatesTo: Partial<ConversationReference>, token: string,  connectionName: string): Activity {
        var tokenResponse = {} as Activity;

        // IActivity properties
        tokenResponse.id = this.generateGuid();
        tokenResponse.localTimestamp = new Date();
        tokenResponse.from = relatesTo.user;
        tokenResponse.recipient = relatesTo.bot;
        tokenResponse.replyToId = relatesTo.activityId;
        tokenResponse.serviceUrl = relatesTo.serviceUrl;
        tokenResponse.channelId = relatesTo.channelId;
        tokenResponse.conversation = relatesTo.conversation;
        tokenResponse.attachments = [];
        tokenResponse.entities = [];

        // IEventActivity properties
        tokenResponse.name = "tokens/response";
        tokenResponse.relatesTo = relatesTo as ConversationReference;
        tokenResponse.value  =  {
            Token:  token,
            ConnectionName: connectionName,
         };

        return tokenResponse;
    }

    public static generateGuid(): string {
        return uuidv4();
    }

    private static async pollForTokenAsync (adapter: BotFrameworkAdapter, turnContext: TurnContext, activity: Activity, connectionName: string, cancellationToken: any)
    {
        let tokenResponse: TokenResponse = null;
        
        let shouldEndPolling: boolean = false;
        var pollingRequestsInterval = this.PollingInterval;
        var loginTimeout = turnContext.turnState.get(TurnStateConstants.OAuthLoginTimeoutKey);        
        var pollingTimeout = loginTimeout ? loginTimeout : TurnStateConstants.OAuthLoginTimeoutValue;
        let sentToken = false;

        var stopwatch = null;

        while (stopwatch.Elapsed < pollingTimeout && !shouldEndPolling)
        {
            tokenResponse = await adapter.getUserToken(turnContext, connectionName, null);

            if (tokenResponse != null) {
                // This can be used to short-circuit the polling loop.
                if (tokenResponse.properties != null)
                {
                    let tokenPollingSettingsToken: any = tokenResponse.properties[TurnStateConstants.TokenPollingSettingsKey];;
                    let tokenPollingSettings: TokenPollingSettings = null;                    

                    if (tokenPollingSettingsToken != null)
                    {
                        tokenPollingSettings = tokenResponse.properties[TurnStateConstants.TokenPollingSettingsKey];

                        if (tokenPollingSettings != null)
                        {
                            // logger.LogInformation($"PollForTokenAsync received new polling settings: timeout={tokenPollingSettings.Timeout}, interval={tokenPollingSettings.Interval}", tokenPollingSettings);
                            shouldEndPolling = tokenPollingSettings.timeout <= 0 ? true : shouldEndPolling; // Timeout now and stop polling
                            pollingRequestsInterval = tokenPollingSettings.interval > 0 ? tokenPollingSettings.interval : pollingRequestsInterval; // Only overrides if it is set.
                        }
                    }
                }

                // once there is a token, send it to the bot and stop polling
                if (tokenResponse.token != null)
                {
                    const conversation: Partial<ConversationReference> = TurnContext.getConversationReference(turnContext.activity);
                    var tokenResponseActivityEvent = this.createTokenResponse(conversation, tokenResponse.token, connectionName);
                    var identity = turnContext.turnState.get(BotFrameworkAdapter.botIdentityKey);
                    // var callback = turnContext.TurnState.Get<BotCallbackHandler>();
                    // await adapter.processActivity(identity, tokenResponseActivityEvent, callback).ConfigureAwait(false);
                    shouldEndPolling = true;
                    sentToken = true;

                    //logger.LogInformation("PollForTokenAsync completed with a token", turnContext.Activity);
                }
            }

            if (!shouldEndPolling)
            {
                //await Task.Delay(pollingRequestsInterval).ConfigureAwait(false);
            }
        }

        if (!sentToken)
        {
            //logger.LogInformation("PollForTokenAsync completed without receiving a token", turnContext.Activity);
        }

        stopwatch.Stop();
    }

 }