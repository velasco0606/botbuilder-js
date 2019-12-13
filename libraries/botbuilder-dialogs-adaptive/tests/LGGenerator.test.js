
const { MultiLanguageGenerator, MultiLanguageResourceLoader, TemplateEngineLanguageGenerator,ResourceMultiLanguageGenerator } = require('../lib');
const { ResourceExplorer } = require('../../botbuilder-dialogs-declarative');
const assert = require('assert');
const should = require('should')

function GetExampleFilePath() {
    return `${__dirname}/tests/`;
}


function getTurnContext(locale, generator) {

}

describe("LGLanguageGenerator", function() {
    this.timeout(5000);
    resourseExplorer = ResourceExplorer.loadProject(GetExampleFilePath(), [], false);
    it("MultiLangGenerator",  async function () {
        const lg = new MultiLanguageGenerator();
        const multiLanguageResources = await MultiLanguageResourceLoader.load(resourseExplorer);
        lg.languageGenerators[""] = new TemplateEngineLanguageGenerator(resourseExplorer.getResources("test.lg").text(), "test.lg", multiLanguageResources);
        lg.languageGenerators["de"] = new TemplateEngineLanguageGenerator(resourseExplorer.getResources("test.de.lg").text(), "test.de.lg", multiLanguageResources);
        lg.languageGenerators["en-US"] = new TemplateEngineLanguageGenerator(resourseExplorer.getResources("test.en-US.lg").text(), "test.en-US.lg", multiLanguageResources);
        lg.languageGenerators["en-GB"] = new TemplateEngineLanguageGenerator(resourseExplorer.getResources("test.en-GB.lg").text(), "test.en-GB.lg", multiLanguageResources);
        lg.languageGenerators["fr"] = new TemplateEngineLanguageGenerator(resourseExplorer.getResources("test.fr.lg").text(), "test.de.lg", multiLanguageResources);
        
        const result1 = await lg.generate(getTurnContext("en-US"), "@{test()}", undefined);
        assert.equal(result1, "english-us");

        const result2 = await lg.generate(getTurnContext("en-gb"), "@{test()}", undefined);
        assert.equal(result2, "english-gb");

        const result3 = await lg.generate(getTurnContext("en"), "@{test()}", undefined);
        assert.equal(result3, "english");
        
        const result4 = await lg.generate(getTurnContext(""), "@{test()}", undefined);
        assert.equal(result4, "default");

        const result5 = await lg.generate(getTurnContext("foo"), "@{test()}", undefined);
        assert.equal(result5, "default");
        
        const result6 = await lg.generate(getTurnContext("en-us"), "@{test2()}", undefined);
        assert.equal(result6, "default2");

        const result7 = await lg.generate(getTurnContext("en-gb"), "@{test2()}", undefined);
        assert.equal(result7, "default2");

        const result8 = await lg.generate(getTurnContext("en"), "@{test2()}", undefined);
        assert.equal(result8, "default2");

        const result9 = await lg.generate(getTurnContext(""), "@{test2()}", undefined);
        assert.equal(result9, "default2");

        const result10 = await lg.generate(getTurnContext("foo"), "@{test2()}", undefined);
        assert.equal(result10, "default2");
    });

    it("MultiLangGenerator",  async function () {
        const lg = ResourceMultiLanguageGenerator("test.lg");

        const result1 = await lg.generate(getTurnContext("en-us", lg), "@{test()}", undefined);
        assert.equal(result1, "english-us");

        const result2 = await lg.generate(getTurnContext("en-us", lg), "@{test()}", {country: "us"});
        assert.equal(result2, "english-us");

        const result3 = await lg.generate(getTurnContext("en-gb", lg), "@{test()}", undefined);
        assert.equal(result3, "english-gb");

        const result4 = await lg.generate(getTurnContext("en", lg), "@{test()}", undefined);
        assert.equal(result4, "english");

        const result5 = await lg.generate(getTurnContext("", lg), "@{test()}", undefined);
        assert.equal(result5, "default");

        const result6 = await lg.generate(getTurnContext("foo", lg), "@{test()}", undefined);
        assert.equal(result6, "default");

        const result7 = await lg.generate(getTurnContext("en-gb", lg), "@{test2()}", undefined);
        assert.equal(result7, "default2");

        const result8 = await lg.generate(getTurnContext("en", lg), "@{test2()}", undefined);
        assert.equal(result8, "default2");

        const result9 = await lg.generate(getTurnContext("", lg), "@{test2()}", undefined);
        assert.equal(result9, "default2");

        const result10 = await lg.generate(getTurnContext("foo", lg), "@{test2()}", undefined);
        assert.equal(result10, "default2");

        const result11 = await lg.generate(getTurnContext("en-us", lg), "@{test2()}", undefined);
        assert.equal(result11, "default2");

    });
});