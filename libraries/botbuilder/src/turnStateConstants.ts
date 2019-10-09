/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export  class TurnStateConstants {
    /// <summary>
    /// TurnState key for the OAuth login timeout.
    /// </summary>
    public static readonly OAuthLoginTimeoutKey: string = "loginTimeout";

    /// <summary>
    /// Name of the token polling settings key.
    /// </summary>
    public static readonly TokenPollingSettingsKey: string = "tokenPollingSettings";

    /// <summary>
    /// Default amount of time an OAuthCard will remain active (clickable and actively waiting for a token).
    /// After this time:
    /// (1) the OAuthCard will not allow the user to click on it.
    /// (2) any polling triggered by the OAuthCard will stop.
    /// </summary>
    public static readonly OAuthLoginTimeoutValue: number = 900000; 
}
