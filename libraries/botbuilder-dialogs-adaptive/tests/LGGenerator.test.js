
import { MultiLanguageGenerator, MultiLanguageResourceLoader } from '../../botbuilder-dialogs-adaptive'

describe("LGLanguageGenerator", function() {
    this.timeout(5000);
    it("MultiLangGenerator",  async function () {
        const lg = new MultiLanguageGenerator();
        lg.languageGenerators = await MultiLanguageResourceLoader.load(resourseExplorer);
    })
})