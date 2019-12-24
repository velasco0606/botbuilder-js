const {
    MultiLanguageGenerator,
    MultiLanguageResourceLoader,
    TemplateEngineLanguageGenerator,
    LanguageGeneratorMiddleWare,
    LanguageGeneratorManager,
    ResourceMultiLanguageGenerator } = require('../');
const { ResourceExplorer } = require('../../botbuilder-dialogs-declarative');
const assert = require('assert');
const { TestAdapter, TurnContext } = require('botbuilder-core');

function GetExampleFilePath() {
    return `${__dirname}/tests/`;
}

const resourceExplorer = ResourceExplorer.loadProject(GetExampleFilePath(), [], false);
//resourceExplorer.getResource('test.lg').then(e => e.readText().then(f => console.log(f)));

class MockLanguageGegerator {
    generate(turnContex, template, data) {
        return Promise.resolve(template);
    }
}

async function getTurnContext(locale, generator) {
    const context = await new TurnContext(
        await new TestAdapter().use(
            await new LanguageGeneratorMiddleWare(resourceExplorer, generator ? generator : new MockLanguageGegerator())), { locale: locale, text: '' });
    const lgm = new LanguageGeneratorManager(resourceExplorer);
    await lgm.loadResources();
    context.turnState.set('LanguageGeneratorManager', lgm);
    if (generator !== undefined) {
        context.turnState.set('LanguageGenerator', generator);
    }

    return context;
}

describe('LGLanguageGenerator', function() {
    this.timeout(30000);

    it('TestMultiLangGenerator', async function() {
        const lg = new MultiLanguageGenerator();
        const multiLanguageResources = await MultiLanguageResourceLoader.load(resourceExplorer);

        let resource = await resourceExplorer.getResource('test.lg');
        let text = await resource.readText();

        lg.languageGenerators.set('', new TemplateEngineLanguageGenerator().addTemplateEngineFromText(text, 'test.lg', multiLanguageResources));

        resource = await resourceExplorer.getResource('test.de.lg');
        text = await resource.readText();
        lg.languageGenerators.set('de', new TemplateEngineLanguageGenerator().addTemplateEngineFromText(text, 'test.de.lg', multiLanguageResources));

        resource = await resourceExplorer.getResource('test.en.lg');
        text = await resource.readText();
        lg.languageGenerators.set('en', new TemplateEngineLanguageGenerator().addTemplateEngineFromText(text, 'test.en.lg', multiLanguageResources));

        resource = await resourceExplorer.getResource('test.en-US.lg');
        text = await resource.readText();
        lg.languageGenerators.set('en-us', new TemplateEngineLanguageGenerator().addTemplateEngineFromText(text, 'test.en-US.lg', multiLanguageResources));


        resource = await resourceExplorer.getResource('test.en-GB.lg');
        text = await resource.readText();
        lg.languageGenerators.set('en-gb', new TemplateEngineLanguageGenerator().addTemplateEngineFromText(text, 'test.en-GB.lg', multiLanguageResources));


        resource = await resourceExplorer.getResource('test.fr.lg');
        text = await resource.readText();
        lg.languageGenerators.set('fr', new TemplateEngineLanguageGenerator().addTemplateEngineFromText(text, 'test.fr.lg', multiLanguageResources));
        
        const result1 = await lg.generate(await getTurnContext('en-US'), '@{test()}', undefined);
        assert.equal(result1, 'english-us');

        const result2 = await lg.generate(await getTurnContext('en-GB'), '@{test()}', undefined);
        assert.equal(result2, 'english-gb');

        const result3 = await lg.generate(await getTurnContext('en'), '@{test()}', undefined);
        assert.equal(result3, 'english');

        const result4 = await lg.generate(await getTurnContext(''), '@{test()}', undefined);
        assert.equal(result4, 'default');

        const result5 = await lg.generate(await getTurnContext('foo'), '@{test()}', undefined);
        assert.equal(result5, 'default');

        const result6 = await lg.generate(await getTurnContext('en-us'), '@{test2()}', undefined);
        assert.equal(result6, 'default2');

        const result7 = await lg.generate(await getTurnContext('en-gb'), '@{test2()}', undefined);
        assert.equal(result7, 'default2');

        const result8 = await lg.generate(await getTurnContext('en'), '@{test2()}', undefined);
        assert.equal(result8, 'default2');

        const result9 = await lg.generate(await getTurnContext(''), '@{test2()}', undefined);
        assert.equal(result9, 'default2');

        const result10 = await lg.generate(await getTurnContext('foo'), '@{test2()}', undefined);
        assert.equal(result10, 'default2');
    });

    it('TestResourceMultiLangGenerator', async function() {
        const lg = new ResourceMultiLanguageGenerator('test.lg');

        const result1 = await lg.generate(await getTurnContext('en-us', lg), '@{test()}', undefined);
        assert.equal(result1, 'english-us');

        const result2 = await lg.generate(await getTurnContext('en-us', lg), '@{test()}', { country: 'us' });
        assert.equal(result2, 'english-us');

        const result3 = await lg.generate(await getTurnContext('en-gb', lg), '@{test()}', undefined);
        assert.equal(result3, 'english-gb');

        const result4 = await lg.generate(await getTurnContext('en', lg), '@{test()}', undefined);
        assert.equal(result4, 'english');

        const result5 = await lg.generate(await getTurnContext('', lg), '@{test()}', undefined);
        assert.equal(result5, 'default');

        const result6 = await lg.generate(await getTurnContext('foo', lg), '@{test()}', undefined);
        assert.equal(result6, 'default');

        const result7 = await lg.generate(await getTurnContext('en-gb', lg), '@{test2()}', undefined);
        assert.equal(result7, 'default2');

        const result8 = await lg.generate(await getTurnContext('en', lg), '@{test2()}', undefined);
        assert.equal(result8, 'default2');

        const result9 = await lg.generate(await getTurnContext('', lg), '@{test2()}', undefined);
        assert.equal(result9, 'default2');

        const result10 = await lg.generate(await getTurnContext('foo', lg), '@{test2()}', undefined);
        assert.equal(result10, 'default2');

        const result11 = await lg.generate(await getTurnContext('en-us', lg), '@{test2()}', undefined);
        assert.equal(result11, 'default2');

    });
});