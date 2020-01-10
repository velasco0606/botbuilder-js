/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'mocha';
import { TestRunner } from './testing';

describe('Actions', ()  => {
    const testRunner = new TestRunner('resources/actionsTests');

    it('BeginDialog', async () => {
        await testRunner.runTestScript('Action_BeginDialog');
    });

    it('BeginDialogWithActivity', async () => {
        await testRunner.runTestScript('Action_BeginDialogWithActivity');
    });

    it('ChoiceInput', async () => {
        await testRunner.runTestScript('Action_ChoiceInput');
    });

    it('ChoiceInputWithLocale', async () => {
        await testRunner.runTestScript('Action_ChoiceInput_WithLocale');
    });

    it('ChoicesInMemory', async () => {
        await testRunner.runTestScript('Action_ChoicesInMemory');
    });

    it('ChoiceStringInMemory', async () => {
        await testRunner.runTestScript('Action_ChoiceStringInMemory');
    });

    it('ConfirmInput', async () => {
        await testRunner.runTestScript('Action_ConfirmInput');
    });

    it('DeleteActivity', async () => {
        await testRunner.runTestScript('Action_DeleteActivity');
    });

    it('DatetimeInput', async () => {
        await testRunner.runTestScript('Action_DatetimeInput');
    });

    it('DeleteProperties', async () => {
        await testRunner.runTestScript('Action_DeleteProperties');
    });

    it('DeleteProperty', async () => {
        await testRunner.runTestScript('Action_DeleteProperty');
    });

    it('DoActions', async () => {
        await testRunner.runTestScript('Action_DoActions');
    });

    it('EditActionReplaceSequence', async () => {
        await testRunner.runTestScript('Action_EditActionReplaceSequence');
    });

    it('EmitEvent', async () => {
        await testRunner.runTestScript('Action_EmitEvent');
    });

    it('EndDialog', async () => {
        await testRunner.runTestScript('Action_EndDialog');
    });

    it('Foreach', async () => {
        await testRunner.runTestScript('Action_Foreach');
    });

    it('ForeachPage_Empty', async () => {
        await testRunner.runTestScript('Action_ForeachPage_Empty');
    });

    // Missing LG support
    /*
    it('ForeachPage_Partial', async () => {
        await testRunner.runTestScript('Action_ForeachPage_Partial');
    });
    */

    // Missing LG support
    /*
    it('ForeachPage', async () => {
        await testRunner.runTestScript('Action_ForeachPage');
    });
    */

    it('GetActivityMembers', async () => {
        await testRunner.runTestScript('Action_GetActivityMembers');
    });

    it('GetConversationMembers', async () => {
        await testRunner.runTestScript('Action_GetConversationMembers');
    });

    it('GotoAction', async () => {
        await testRunner.runTestScript('Action_GotoAction');
    });

    it('IfCondition', async () => {
        await testRunner.runTestScript('Action_IfCondition');
    });

    it('InputDialog_ActivityProcessed', async () => {
        await testRunner.runTestScript('InputDialog_ActivityProcessed');
    });

    it('NumerInput', async () => {
        await testRunner.runTestScript('Action_NumberInput');
    });

    it('NumerInputWithDefaultValue', async () => {
        await testRunner.runTestScript('Action_NumberInputWithDefaultValue');
    });

    // Missing EntityRecognizer support
    /*
    it('NumerInputWithValueExpression', async () => {
        await testRunner.runTestScript('Action_NumberInputWithValueExpression');
    });
    */

    it('RepeatDialog', async () => {
        await testRunner.runTestScript('Action_RepeatDialog');
    });

    it('ReplaceDialog', async () => {
        await testRunner.runTestScript('Action_ReplaceDialog');
    });

    it('SendActivity', async () => {
        await testRunner.runTestScript('Action_SendActivity');
    });

    it('SetProperties', async () => {
        await testRunner.runTestScript('Action_SetProperties');
    });

    it('SetProperty', async () => {
        await testRunner.runTestScript('Action_SetProperty');
    });

    it('SignOutUser', async () => {
        await testRunner.runTestScript('Action_SignOutUser');
    });

    it('Switch_Bool', async () => {
        await testRunner.runTestScript('Action_Switch_Bool');
    });

    it('Switch_Default', async () => {
        await testRunner.runTestScript('Action_Switch_Default');
    });

    it('Switch_Number', async () => {
        await testRunner.runTestScript('Action_Switch_Number');
    });

    it('Switch', async () => {
        await testRunner.runTestScript('Action_Switch');
    });

    it('TextInput', async () => {
        await testRunner.runTestScript('Action_TextInput');
    });

    it('TextInputWithInvalidPrompt', async () => {
        await testRunner.runTestScript('Action_TextInputWithInvalidPrompt');
    });

    it('TextInputWithValueExpression', async () => {
        await testRunner.runTestScript('Action_TextInputWithValueExpression');
    });

    it('TraceActivity', async () => {
        await testRunner.runTestScript('Action_TraceActivity');
    });

    it('UpdateActivity', async () => {
        await testRunner.runTestScript('Action_UpdateActivity');
    });

    it('WaitForInput', async () => {
        await testRunner.runTestScript('Action_WaitForInput');
    });
});
