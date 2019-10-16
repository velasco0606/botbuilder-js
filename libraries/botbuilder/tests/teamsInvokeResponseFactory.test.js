const assert = require('assert');
const { ActionTypes } = require('botbuilder-core');

const { TeamsInvokeResponseFactory } = require('../lib');

describe('TeamsInvokeResponseFactory', () => {
    describe('Messaging Extension methods', () => {
        it('messagingExtensionAuthResponse() should return a correct auth MessagingExtensionResponse', () => {
            const authResponse = TeamsInvokeResponseFactory.messagingExtensionAuthResponse('title', 'https://bing.com');
    
            const messageExtension = authResponse.composeExtension;
            assert(messageExtension);
            assert.strictEqual(messageExtension.type, 'auth');
            assert.strictEqual(messageExtension.suggestedActions.actions.length, 1);
    
            const cardAction = messageExtension.suggestedActions.actions[0];
            assert.strictEqual(cardAction.title, 'title');
            assert.strictEqual(cardAction.type, ActionTypes.OpenUrl);
            assert.strictEqual(cardAction.value, 'https://bing.com');
        });
    
        it('messagingExtensionConfigResponse() should return a correct config MessagingExtensionResponse', () => {
            const authResponse = TeamsInvokeResponseFactory.messagingExtensionConfigResponse('title', 'https://bing.com');
    
            const messageExtension = authResponse.composeExtension;
            assert(messageExtension);
            assert.strictEqual(messageExtension.type, 'config');
            assert.strictEqual(messageExtension.suggestedActions.actions.length, 1);
    
            const cardAction = messageExtension.suggestedActions.actions[0];
            assert.strictEqual(cardAction.title, 'title');
            assert.strictEqual(cardAction.type, ActionTypes.OpenUrl);
            assert.strictEqual(cardAction.value, 'https://bing.com');
        });
    });
});
