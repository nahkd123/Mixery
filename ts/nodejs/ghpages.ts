/*
This NodeJS script will commit all files in /temp/production to gh-pages branch, then push to
origin remote
*/

import * as ghpages from "gh-pages";

interface GHPagesOptions {
    src?: string | string[];

    /** @default "gh-pages" */
    branch?: string;

    /** @default "." */
    dest?: string;

    /** @default false */
    dotfiles?: boolean;
    
    /** @default false */
    add?: boolean;
    
    /** @default origin remote URL */
    repo?: boolean;
    
    /** @default "origin" */
    remote?: string;

    /** @default "Update" */
    message?: string;
}

ghpages.publish("./temp/production", <GHPagesOptions> {
    remote: "origin",
    message: "🦴 Auto-generated commit (ghpages.ts)"
}, err => {
    if (err) console.error(err);
});