/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ActionTypes,
    Activity,
    AttachmentLayout,
    CardAction,
    MessagingExtensionActionResponse,
    MessagingExtensionAttachment,
    MessagingExtensionResponse,
    MessagingExtensionResult,
    MessagingExtensionSuggestedAction,
    TaskModuleContinueResponse,
    TaskModuleMessageResponse,
    TaskModuleTaskInfo,
    TaskModuleResponse
} from 'botbuilder-core';

/**
 * Helper class for sending correct Invoke Responses to Microsoft Teams Invoke activities.
 */
export class TeamsInvokeResponseFactory {
    static messagingExtensionResultResponse(attachments: MessagingExtensionAttachment[], attachmentLayout: AttachmentLayout): MessagingExtensionActionResponse | MessagingExtensionResponse {
        return {
            composeExtension: {
                type: 'result',
                attachmentLayout,
                attachments
            } as MessagingExtensionResult
        } as MessagingExtensionResponse;
    }

    /**
     * @remarks
     * Used in:
     * - TeamsActivityHandler.onTeamsMessagingExtensionFetchTask()
     * - TeamsActivityHandler.onTeamsMessagingExtensionQuery()
     * - TeamsActivityHandler.onTeamsMessagingExtensionSubmitAction()
     * - TeamsActivityHandler.onTeamsMessagingExtensionSubmitActionDispatch()
     * @param title 
     * @param signInLink 
     */
    static messagingExtensionAuthResponse(title: string, signInLink: string): MessagingExtensionActionResponse | MessagingExtensionResponse {
        return {
            composeExtension: {
                type: 'auth',
                suggestedActions: {
                    actions: [
                        {
                            title: title,
                            type: ActionTypes.OpenUrl,
                            value: signInLink
                        }
                    ] as CardAction[]
                } as MessagingExtensionSuggestedAction
            } as MessagingExtensionResult
        };
    }

    static messagingExtensionConfigResponse(title: string, configUrl: string): MessagingExtensionResponse {
        return {
            composeExtension: {
                type: 'config',
                suggestedActions: {
                    actions: [
                        {
                            title: title,
                            type: ActionTypes.OpenUrl,
                            value: configUrl,
                        }
                    ] as CardAction[]
                } as MessagingExtensionSuggestedAction
            } as MessagingExtensionResult
        } as MessagingExtensionResponse
    }

    /**
     * @remarks
     * Usable in:
     *  - TeamsActivityHandler.onTeamsMessagingExtensionSubmitAction()
     */
    static botMessagePreviewResponse(preview: Activity): MessagingExtensionActionResponse {
        return {
            composeExtension: {
                type: 'botMessagePreview',
                activityPreview: preview
            } as MessagingExtensionResult
        } as MessagingExtensionActionResponse;
    }

    static messagingExtensionTaskModuleBotMessagePreviewEditResponse(taskInfo: TaskModuleTaskInfo): MessagingExtensionActionResponse {
        return {
            task: {
                type: 'continue',
                value: taskInfo
            } as TaskModuleContinueResponse
        }
    }

    /**
     * @remarks
     * Usable in:
     * - TeamsActivityHandler.handleTeamsMessagingExtensionFetchTask()
     * - TeamsActivityHandler.handleTeamsMessagingExtensionBotMessagePreviewEdit()
     * - TeamsActivityHandler.handleTeamsTaskModuleFetch()
     * - TeamsActivityHandler.handleTeamsTaskModuleSubmit()
     */
    static taskModuleContinueResponse(taskModuleInfo: TaskModuleTaskInfo): MessagingExtensionActionResponse | TaskModuleResponse {
        return {
            task: {
                type: 'continue',
                value: taskModuleInfo
            } as TaskModuleContinueResponse
        } as MessagingExtensionActionResponse;
    }

    static messagingExtensionMessageResponse(text: string): MessagingExtensionActionResponse | MessagingExtensionResponse {
        return {
            composeExtension: {
                text,
                type: 'message'
            } as MessagingExtensionResult
        };
    }

    static taskModuleMessageResponse(text: string): MessagingExtensionActionResponse | MessagingExtensionResponse {
        return {
            task: {
                type: 'message',
                value: text
            } as TaskModuleMessageResponse
        };
    }
}
