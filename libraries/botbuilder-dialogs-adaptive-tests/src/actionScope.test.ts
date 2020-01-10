/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'mocha';
import { TestRunner } from './testing';

describe('ActionScope', ()  => {
    const testRunner = new TestRunner('resources/actionScopeTests');

    it('Break', async () => {
        await testRunner.runTestScript('ActionScope_Break');
    });

    it('Continue', async () => {
        await testRunner.runTestScript('ActionScope_Continue');
    });

    it('Goto_Nowhere', async () => {
        await testRunner.runTestScript('ActionScope_Goto_Nowhere');
    });

    it('Goto_OnIntent', async () => {
        await testRunner.runTestScript('ActionScope_Goto_OnIntent');
    });

    it('Goto_Parent', async () => {
        await testRunner.runTestScript('ActionScope_Goto_Parent');
    });

    it('Goto_Switch', async () => {
        await testRunner.runTestScript('ActionScope_Goto_Switch');
    });

    it('Goto', async () => {
        await testRunner.runTestScript('ActionScope_Goto');
    });
});