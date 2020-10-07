import { GeneratorExplorerContent } from "../mixeryui/explorer.js";
import { ExampleGenerator } from "../mixerycore/generator.js";

export namespace MixeryGenerators {
    export class ExampleGeneratorExplorerContent extends GeneratorExplorerContent {
        name = "Example Generator";
        color = "rgb(252, 186, 3)";
        constructPlugin(preset: object) {
            return new ExampleGenerator();
        }
    }
}