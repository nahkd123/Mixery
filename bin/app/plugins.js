import { GeneratorExplorerContent } from "../mixeryui/explorer.js";
import { ExampleGenerator } from "../mixerycore/generator.js";
export var MixeryGenerators;
(function (MixeryGenerators) {
    class ExampleGeneratorExplorerContent extends GeneratorExplorerContent {
        constructor() {
            super(...arguments);
            this.name = "Example Generator";
            this.author = ["nahkd123"];
            this.color = "rgb(252, 186, 3)";
        }
        constructPlugin(preset) {
            return new ExampleGenerator();
        }
    }
    MixeryGenerators.ExampleGeneratorExplorerContent = ExampleGeneratorExplorerContent;
})(MixeryGenerators || (MixeryGenerators = {}));