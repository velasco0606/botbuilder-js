const { Configurable, TextPrompt, Dialog, DialogManager } = require('botbuilder-dialogs');
const { MemoryStorage, TestAdapter } = require('botbuilder-core');
const { FileResource } = require('../lib');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

describe('FileResource', function() {
    this.timeout(5000);

    it('FileResource load existing file relative path', () => {
        const fileResource = new FileResource(`${ __dirname }/resources/00 - TextPrompt/SimplePrompt.main.dialog`);
        assert.equal(fileResource.id(), 'SimplePrompt.main.dialog');
        const text = fileResource.readText();
        assert.equal(text[0], '{');
    });

    it('FileResource load existing file absolute path', () => {
        const absolutePath = path.resolve(`${ __dirname }/resources/00 - TextPrompt/SimplePrompt.main.dialog`);
        const fileResource = new FileResource(absolutePath);
        assert.equal(fileResource.id(), 'SimplePrompt.main.dialog');
        const text = fileResource.readText();
        assert.equal(text[0], '{');
    });
});
