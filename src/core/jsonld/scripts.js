/* @flow */
import LdJsonObject from './entities/LdJsonObject.js';

/* Loaded class, takes <scripts> from the document, parses them and applies mentions */

type LdJsonObjects = Array<LdJsonObject>

class LdJsonManager {
    blocks: LdJsonObjects;
    data: Array<Object>;

    constructor(scripts: HTMLCollection<HTMLElement>) {
        this.data = this.parseScripts(scripts);
        this.blocks =  this.mapMentions();
    }
    parseScripts(scripts : HTMLCollection<HTMLElement>) : Array<Object> {
        let  data :  Array<Object> = [];
        const scriptsArray : Array<HTMLElement> = [].slice.call(scripts); // to convert HtmlCollection to the Array, to address issues on the IE and mobile Safari
        for (let script of scripts) {
            if (script.type === 'application/ld+json') {
                let json = undefined;
                try {
                    json = JSON.parse(script.textContent);
                } catch (exception) {
                    json = undefined;
                    console.error('JSON-LD invalid: ' + exception);
                }
                if (typeof json === 'object') {
                    data.push(json);
                }
            }
        }
        return data;
    }
    mapMentions() : LdJsonObjects {
        return this.data.map((jsn) => LdJsonObject.LdJsonFactory(jsn));
    }

    getBlocks() : LdJsonObjects {
        return this.blocks;
    }
}

// this functions gets LD+JSON script array(got from html document) parses it and attaches mentions to the text
export default LdJsonManager;
