import { ExternalHTMLDocument } from "../utils/htmlinsert.js";

export class MixeryHTMLDocuments {
    ccRecommendation: ExternalHTMLDocument;

    constructor() {
        this.ccRecommendation = new ExternalHTMLDocument("/app/ccrecommendation.html");
    }
}