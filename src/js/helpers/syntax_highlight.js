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

import rangeParser from 'parse-numeric-range';
import digitCount from 'digit-count';
import { parse as rJsonParse } from 'relaxed-json';
import {
  isInteger, isString, first, reduceRight, memoize, isEmpty,
} from 'lodash';
import wu, {
  count,
  zip as iterZip,
  map as iterMap,
  chain,
} from 'wu';

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

// $1: Closing tag, $2: Tag name, $3: Class attr, $4: Class group, $5: Other attributes

const fixClass = 'hljs-ln-fix';
const lineNumberLabelClass = 'ln-num';
const lineLabelClass = 'labled-ln';
const lineLabelColorfillClass = 'labled-ln-color-fill';
const lineContainerClass = 'hljs-ln-label-container';

/*  Idea Source:
  *  https://programmer.help/blogs/write-your-own-highlight.js-line-number-plugin.html
  *
  *  Notes:
  *  - hljs's 3rd party plugin only deal with DOM and also not available for ES6 import
  *  - The article's approach tackles copy-paste (disater on editors that support table
  *    structure) pretty well but cannot work on old IEs. It also avoids the problem of
  *    multi-line element, but still need to face it when it comes to line labeling.
  *  - To mitigate this problem, we can complete all the incomplete tags in the line
  *    at the end of the line. A stack is created to trace tags that are not closed.
  *  - We assume that hljs's official language parser packs its HTML tags property and
  *    never get crazy, which means:
  *    (1) newline/return/carriage/etc. never appear within the tag description;
  *    (2) it's a well-formed XML group;
  *    (3) attributes are separated through white space (x20)
  *    (3) 'class' attribute always exists, is always the first attribute, and enclosed
  *        in double quotation marks.
  */

const PREPEND_LINE_NUMBER_KEY = 'prependLineNumber';
const LABLE_LINES_KEY = 'labelLines';
const LIMIT_HEIGHT_KEY = 'limitHeight';
const LINE_NUMBER_ENABLED_SETTINGS_KEY = 'enabled';
const LINE_NUMBER_START_SETTINGS_KEY = 'start';
const LINENUM_BORDER_WIDTH_EM = 0.1;
const HLJS_DEFAULT_PADDING_EM = 1;
const LINENUM_PRESERVED_SPACE_EM = 0.5;
const HLJS_LINE_HEIGHT_EM = 1.25;
const CODE_TOP_PADDING_EM = 0.5;
// Warning: (1) Magic Number (2) Does not work when mixed with full-width font
const MONOSPACE_HEIGHT_WIDTH_RATIO = 0.65;
const CODE_WINDOW_EXTRA_SPACE = 0.75; // TODO: Magic Number / Rename it

class HljsDataProcessor {
  constructor(rawStrInput, rawHtmlInput, language, fileName) {
    this.rawHtmlInput = rawHtmlInput;
    this.language = isString(language) ? language : '';
    this.fileName = fileName;
    [this.lineCount, this.maxLineLength] = HljsDataProcessor.getDocumetMeta(rawStrInput);
    // TODO: Should be managed as state when start number changed.
    this.lineDigits = digitCount(this.lineCount);
    this.state = {
      [PREPEND_LINE_NUMBER_KEY]: {
        [LINE_NUMBER_ENABLED_SETTINGS_KEY]: false,
        [LINE_NUMBER_START_SETTINGS_KEY]: 1,
      },
      [LABLE_LINES_KEY]: [],
      [LIMIT_HEIGHT_KEY]: -1,
    };

    this.appendLineNumber = this.appendLineNumber.bind(this);
    this.disableLineNumber = this.disableLineNumber.bind(this);
    this.labelLines = this.labelLines.bind(this);
    this.disableLabel = this.disableLineNumber.bind(this);
    this.limitHeight = this.limitHeight.bind(this);
    this.disableHeightLimit = this.disableHeightLimit.bind(this);
    this.dump = memoize(this.dump.bind(this));
  }

  static getClosingTagsFix(tagTrace, oldClosedCount, newOpenedTags) {
  /*
    tagTrace: [oldKeptOuter...oldKeptInner, oldEndOuter...oldEndInner]
    newOpenedTags: [newOuter...newInner]

    Expected fix result:
    opening: "<oldKeptOuter>...<oldKeptInner>" @ "<oldEndOuter>...<oldEndInner>"
    closing: "<newInner>...<newOuter>" @ "<oldKeptInner><oldKeptOuter>"
  */
    const skipFrom = tagTrace.length - oldClosedCount;
    const oldProcessed = reduceRight(
      tagTrace,
      ({ opening, closing }, [tagName, tagClass, otherAttrs], idx) => ({
        opening: `<${tagName} class="${fixClass}${tagClass ? ` ${tagClass}` : ''}"${otherAttrs || ''}>${opening}`,
        closing: `${closing}${(idx >= skipFrom) ? '' : `</${tagName}>`}`,
      }),
      { opening: '', closing: '' },
    );

    const res = reduceRight(
      newOpenedTags,
      ({ opening, closing }, [tagName]) => ({
        opening,
        closing: `${closing}</${tagName}>`,
      }),
      oldProcessed,
    );
    return res;
  }

  static updateTagTrace(tagTrace, oldClosedCount, newOpenedTags) {
    // Pop off closed tags and append newly opened tags.
    let remainder = oldClosedCount;
    while (remainder !== 0) {
      tagTrace.pop();
      remainder -= 1;
    }
    remainder = newOpenedTags.length;
    while (remainder !== 0) {
      tagTrace.push(newOpenedTags.shift());
      remainder -= 1;
    }
  }

  static processTagFix(line, tagTrace) { // private method
    const htmlTagRegex = /<(\/)?([A-Za-z][A-Za-z0-9]*)(\x20+class="([^>"]*)")?([^>]*)?>/g;

    // Note for updates:
    // [tag1, tag2, tag3] <-- Initial
    //   (Some tags may be closed in current line)
    // [tag1, tag2^, tag3^] <-- After Closing Happens
    //   (Some new tags may be unclosed here)
    // [tag1, tag2^, tag3^], [tag4, tag5] <-- After the whole reading process
    let oldClosedCount = 0;
    const newOpenedTags = []; // stack: [outer...inner]

    let tagMatchResult = htmlTagRegex.exec(line);
    while (tagMatchResult !== null) {
      const [, closed, tagName, , tagClass, otherAttrs] = tagMatchResult;
      if (closed !== undefined) {
        // Skip tag checking because we expect a well-formed XML
        if (isEmpty(newOpenedTags)) {
          oldClosedCount += 1;
        } else {
          newOpenedTags.pop();
        }
      } else {
        newOpenedTags.push([tagName, tagClass, otherAttrs]);
      }
      tagMatchResult = htmlTagRegex.exec(line);
    }
    const { opening, closing } = HljsDataProcessor.getClosingTagsFix(
      tagTrace, oldClosedCount, newOpenedTags,
    );
    HljsDataProcessor.updateTagTrace(tagTrace, oldClosedCount, newOpenedTags);

    return `${opening}${line}${closing}`;
  }

  static getDocumetMeta(input) {
    const newlineRegex = /\r\n|\r|\n/g;
    let lineCount = 0;
    let headIdx = 0;
    let endIdx = 0;
    let maxLineLength = 0;
    let lineMatchResult = newlineRegex.exec(input);
    while (lineMatchResult !== null) {
      const [lineFeed] = lineMatchResult;
      headIdx = endIdx;
      endIdx = newlineRegex.lastIndex - lineFeed.length;
      maxLineLength = Math.max(maxLineLength, endIdx - headIdx);
      lineCount += 1;
      lineMatchResult = newlineRegex.exec(input);
    }

    return [lineCount, maxLineLength];
  }

  static* hljsPrerocessedLineIter(input) {
    // Line split and take the best effort to preserve newline characters.
    const newlineRegex = /\r\n|\r|\n/g;
    let startIndex = 0;
    let newLineIndex = 0;
    let endIndex = 0;

    let lineMatchResult = newlineRegex.exec(input);
    let lineContent = '';
    let newlineStr = '';
    const tagTrace = [];

    if (input) {
      while (lineMatchResult !== null) {
        [newlineStr] = lineMatchResult;
        startIndex = endIndex;
        endIndex = newlineRegex.lastIndex;
        newLineIndex = endIndex - newlineStr.length;
        lineContent = input.slice(startIndex, newLineIndex);

        lineMatchResult = newlineRegex.exec(input);
        if (lineMatchResult) {
          yield [`${HljsDataProcessor.processTagFix(lineContent, tagTrace)}`, newlineStr];
        } else {
          // Currently, Markdown-it preserves the newline between code and closing fence
          // and we need to discard it. This will cause unwanted problem when we're wrapping
          // with additional tags
          yield [`${HljsDataProcessor.processTagFix(lineContent, tagTrace)}`, ''];
        }
      }
      // For the same reason, input should be fully consumed here.
    }
  }

  /* Functional components */
  static zipLineNumber(iter, start) {
    // iterable(any) => wIter([any, int])
    return iterZip(iter, count(start));
  }

  static discardLineNumber(wIter) {
    // wIter([[string, string], int]) => wIter([string, string])
    return wIter.map((v) => first(v));
  }

  static lineFeedMergeMapper([lineContent, lineFeed]) {
    return `${lineContent}${lineFeed}`;
  }

  static mergeLineFeed(wIter) {
    // wIter([string, string]) => wIter(string)
    return wIter.map(HljsDataProcessor.lineFeedMergeMapper);
  }

  static lineNumberMapper([[lineContent, lineFeed], lineNum]) {
    return [
      [
        `<span class="${lineNumberLabelClass}" data-num="${lineNum}"></span>${lineContent}`,
        lineFeed,
      ],
      lineNum,
    ];
  }

  static processLineNumber(wIter) {
    // wIter([[string, string], int]) => wIter([[string, string], int])
    return wIter.map(HljsDataProcessor.lineNumberMapper);
  }

  static labelLine(offset) {
    const computedStyle = `style="top: ${HLJS_LINE_HEIGHT_EM * offset + CODE_TOP_PADDING_EM}em"`;
    return `<span class="${lineLabelClass}" ${computedStyle}><span class="${lineLabelColorfillClass}">\n</span></span>`;
  }

  static processLineLabel(wIter, lineList, offset, maxLineCount, maxLineLength, lineDigits) {
    // (old) wIter([[string, string], int]) => wIter([[string, string], int])
    // (new) wIter(string) => wIter(string)
    if (isEmpty(lineList)) {
      return wIter;
    }
    const extraSpace = (lineDigits !== undefined)
      ? lineDigits + LINENUM_PRESERVED_SPACE_EM + LINENUM_BORDER_WIDTH_EM
      : 0;
    const calculatedStyle = ` style="width: ${maxLineLength * MONOSPACE_HEIGHT_WIDTH_RATIO + extraSpace}em;">`;

    return chain(
      wIter,
      [`<div class="${lineContainerClass}"${calculatedStyle}`],
      (
        iterMap((lineNum) => (lineNum - offset), lineList)
          .filter((lineOffset) => (lineOffset >= 0 && lineOffset < maxLineCount))
          .map(HljsDataProcessor.labelLine)
      ),
      ['</div>'],
    );
  }

  static processLineNumberHeader(iter, lineDigits) {
    // wIter(string) => wIter(string)
    const calculatedStyle = `style="width: ${lineDigits + LINENUM_PRESERVED_SPACE_EM + LINENUM_BORDER_WIDTH_EM}em"`;
    return chain([`<span class="ln-bg" ${calculatedStyle}></span>`], iter);
  }

  static processCodeBlock(iter, lineEnabled, lineDigits) {
    // Adding required surrounding tags for hljs element
    // wIter(string) => wIter(string)
    const lineClass = lineEnabled ? ' hljs-ln' : '';
    const calculatedStyle = (
      lineEnabled
        ? ` style="padding-left: ${HLJS_DEFAULT_PADDING_EM + lineDigits + LINENUM_PRESERVED_SPACE_EM + LINENUM_BORDER_WIDTH_EM}em"`
        : ''
    );
    return chain([`<code class="hljs${lineClass}"${calculatedStyle}>`], iter, ['</code>']);
  }

  static processPreBlock(iter, maxLines, lineCount, language, fileName) {
    const calculatedStyle = (maxLines !== undefined)
      ? ` style="max-height: ${maxLines * HLJS_LINE_HEIGHT_EM + CODE_WINDOW_EXTRA_SPACE}em;"`
      : '';
    const langAttr = ` language="${language}"`;
    const linesAttr = ` lines=${lineCount}`;
    const fileNameAttr = fileName ? ` file-name="${fileName}"` : '';
    return chain([`<pre${calculatedStyle}${langAttr}${linesAttr}${fileNameAttr}>`], iter, ['</pre>']);
  }
  /* End of Functional components */

  appendLineNumber(start) {
    this.state[PREPEND_LINE_NUMBER_KEY] = {
      [LINE_NUMBER_ENABLED_SETTINGS_KEY]: true,
      [LINE_NUMBER_START_SETTINGS_KEY]: start,
    };

    return this;
  }

  disableLineNumber() {
    this.state[PREPEND_LINE_NUMBER_KEY] = {
      [LINE_NUMBER_ENABLED_SETTINGS_KEY]: false,
      [LINE_NUMBER_START_SETTINGS_KEY]: 1,
    };

    return this;
  }

  labelLines(lines) {
    this.state[LABLE_LINES_KEY] = lines;

    return this;
  }

  disableLabel() {
    this.state[LABLE_LINES_KEY] = [];

    return this;
  }

  limitHeight(maxLines) {
    this.state[LIMIT_HEIGHT_KEY] = maxLines;

    return this;
  }

  disableHeightLimit() {
    this.state[LIMIT_HEIGHT_KEY] = -1;

    return this;
  }

  dump() { // Memoized. (Accept input in the future?)
    const { prependLineNumber, labelLines, limitHeight } = this.state;
    const { enabled: lineEnabled, start: lineStart } = prependLineNumber;

    let pipeline = wu(HljsDataProcessor.hljsPrerocessedLineIter(this.rawHtmlInput));
    pipeline = HljsDataProcessor.zipLineNumber(pipeline, lineStart);
    if (lineEnabled) {
      pipeline = HljsDataProcessor.processLineNumber(pipeline);
    }

    pipeline = HljsDataProcessor.discardLineNumber(pipeline);
    pipeline = HljsDataProcessor.mergeLineFeed(pipeline);
    if (lineEnabled) {
      pipeline = HljsDataProcessor.processLineNumberHeader(pipeline, this.lineDigits);
    }
    pipeline = HljsDataProcessor.processCodeBlock(pipeline, lineEnabled, this.lineDigits);
    pipeline = HljsDataProcessor.processLineLabel(
      pipeline, labelLines, lineStart, this.lineCount, this.maxLineLength,
      (lineEnabled ? this.lineDigits : undefined),
    );
    pipeline = HljsDataProcessor.processPreBlock(
      pipeline, ((limitHeight > 0) ? limitHeight : undefined),
      this.lineCount, this.language, this.fileName,
    );
    return pipeline.reduce((prev, curr) => `${prev}${curr}`, '');
  }
}

// {lineNum: true}
function highlight(rawStr, lang, attrsRaw) {
  let langTag = (lang && hljs.getLanguage(lang)) ? lang : 'plaintext';
  let attrs;
  try {
    attrs = rJsonParse(attrsRaw);
  } catch (__) {
    attrs = {};
  }
  const {
    lineNum, labeled, maxLines, fileName,
  } = attrs;
  let { lineNumStart } = attrs;
  let parsedHtml = '';
  const labeledLines = [];

  try {
    parsedHtml = hljs.highlight(langTag, rawStr, false).value;
  } catch (__) {
    // Fallback to process as pure text
    langTag = 'plaintext';
    parsedHtml = hljs.highlight('plaintext', rawStr).value;
  }

  let pipeline = new HljsDataProcessor(rawStr, parsedHtml, langTag, fileName);

  if (lineNum === true) {
    lineNumStart = (isInteger(lineNumStart) && lineNumStart > 0) ? lineNumStart : 1;
    pipeline = pipeline.appendLineNumber(lineNumStart);
  }

  if (isString(labeled)) {
    labeledLines.push(...rangeParser(labeled));
    pipeline = pipeline.labelLines(labeledLines);
  }

  if (isInteger(maxLines) && maxLines > 0) {
    pipeline = pipeline.limitHeight(maxLines);
  }

  return pipeline.dump();
}

export default highlight;
