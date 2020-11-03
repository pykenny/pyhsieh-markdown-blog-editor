/* eslint-disable no-unused-vars */

/* Language support should be defined in this file to minimize bundle size.
 * Ref: https://github.com/highlightjs/highlight.js/blob/master/SUPPORTED_LANGUAGES.md
 */
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import bash from 'highlight.js/lib/languages/bash';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import scss from 'highlight.js/lib/languages/scss';
import xml from 'highlight.js/lib/languages/xml';
import makefile from 'highlight.js/lib/languages/makefile';
import sql from 'highlight.js/lib/languages/sql';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import plaintext from 'highlight.js/lib/languages/plaintext';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('python', python);
hljs.registerLanguage('css', css);
hljs.registerLanguage('scss', scss);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('makefile', makefile);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('json', json);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('plaintext', plaintext);

function createHljsContent(parsedStr) {
  return `<pre class="hljs">${parsedStr}</pre>`;
}

// Customized highlight support
function highlight(rawStr, lang) {
  const langTag = (lang && hljs.getLanguage(lang)) ? lang : 'plaintext';
  try {
    return createHljsContent(hljs.highlight(langTag, rawStr, true).value);
  } catch (__) {
    // Fallback to process input as plaintext
    return createHljsContent(hljs.highlight('plaintext', rawStr).value);
  }
}

export default highlight;
