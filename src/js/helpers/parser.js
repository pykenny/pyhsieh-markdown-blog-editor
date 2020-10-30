/* eslint-disable no-param-reassign, no-plusplus, no-multi-assign, yoda */

/* ^ Disable some eslint rules to reduce the efforts on modifying.
 *   Still, we keep the variable declaration checking enabled to better track
 *   the variables (constance and inner-scope variables)
 */

import MarkdownIt from 'markdown-it';
import { normalizeReference, isSpace } from 'markdown-it/lib/common/utils';
import {
  isArray, includes, isEmpty, forEach,
} from 'lodash';

function isValidAliasChar(code, isStartChar) {
  /* Currently alias only allows string that fits the regex below:
   * /[A-Za-z][A-Za-z0-9\-]+/
   * 1. The first character should be English alphabet
   * 2. The rest of them should be either English alphabet, decimal digit,
   *    or hyphen ('-').
   */
  return isStartChar
    ? (0x41 <= code && code <= 0x5A) || ((0x61 <= code) && (code <= 0x7A))
    : ((0x30 <= code) && (code <= 0x39))
      || ((0x41 <= code) && (code <= 0x5A))
      || ((0x61 <= code) && (code <= 0x7A))
      || (code === 0x2D);
}

function isValidAlias(str) {
  let pos = 0;
  const max = str.length;
  while (pos < max) {
    if (!isValidAliasChar(str.charCodeAt(pos), pos === max)) {
      return false;
    }
    pos++;
  }
  // Alias can't be an empty string
  return !(pos === 0);
}

function parseAlias(str, pos, max, exitCharCodeList) {
  let code;
  const start = pos;
  const result = {
    ok: false,
    pos: 0,
    str: '',
  };

  if (!isArray(exitCharCodeList)) {
    exitCharCodeList = [];
  }

  while (pos < max) {
    code = str.charCodeAt(pos);
    // When hitting space or of one of the exit char code, wrap up and return
    if (isSpace(code) || includes(exitCharCodeList, code)) {
      result.pos = pos;
      result.str = str.slice(start, pos);
      result.ok = true;
      return result;
    }
    // If it's valid character, keep consuming the string
    if (isValidAliasChar(code, start === pos)) {
      pos++;
    } else {
      return result;
    }
  }
  // When used up the string before hitting exit boundary, return failure
  return result;
}

function imageWithAlias(state, silent) {
  const labelEnd = state.md.helpers.parseLinkLabel(state, state.pos + 1, false);
  const labelStart = state.pos + 2;
  const oldPos = state.pos;
  const max = state.posMax;

  let attrs;
  let code;
  let content;
  let label;

  let ref;
  let res;
  let title;
  let token;
  let tokens;
  let start;
  let alias;
  let href = '';

  if (state.src.charCodeAt(state.pos) !== 0x21/* ! */) { return false; }
  if (state.src.charCodeAt(state.pos + 1) !== 0x5B/* [ */) { return false; }

  // parser failed to find ']', so it's not a valid link
  if (labelEnd < 0) { return false; }

  let pos = labelEnd + 1;
  if (pos < max && state.src.charCodeAt(pos) === 0x28/* ( */) {
    //
    // Inline link
    //

    // [link](  <href>  "title"  )
    //        ^^ skipping these spaces
    pos++;
    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);
      if (!isSpace(code) && code !== 0x0A) { break; }
    }
    if (pos >= max) { return false; }

    // [link](  <href>  "title"  )
    //          ^^^^^^ parsing link destination
    start = pos;
    res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
    if (res.ok) {
      href = state.md.normalizeLink(res.str);
      if (state.md.validateLink(href)) {
        pos = res.pos;
      } else {
        href = '';
      }
    }

    // [link](  <href>  "title"  )
    //                ^^ skipping these spaces
    start = pos;
    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);
      if (!isSpace(code) && code !== 0x0A) { break; }
    }

    // [link](  <href>  "title"  )
    //                  ^^^^^^^ parsing link title
    res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
    if (pos < max && start !== pos && res.ok) {
      title = res.str;
      pos = res.pos;

      // [link](  <href>  "title"  )
      //                         ^^ skipping these spaces
      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);
        if (!isSpace(code) && code !== 0x0A) { break; }
      }
    } else {
      title = '';
    }

    /* Note: A pitfall here is that we're unable to process inline link written
     *       in format where title is skipped and pipe symbol comes immediately
     *       after href, such as ![alt](/some/link|some-alias). It's because
     *       helpers.parseLinkDestination() will consume pipe symbol and try
     *       escape it to make a valid URI. We can try rewrite the method but
     *       it may conflict with other rulers that depends on this function.
     *
     *       Right now to skip title, always place at least one blank between
     *       the link and pipe symbol, for instance,
     *       ![alt](/some/link |some-alias) or ![alt](/some/link | some-alias)
     */

    // [link](  <href>  "title"  |  alias  )
    //                           ^ detect boundary of alias
    if (pos < max && state.src.charCodeAt(pos) === 0x7C/* | */) {
      pos++;
      // [link](  <href>  "title"  |  alias  )
      //                            ^^ skip spaces before the alias
      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);
        if (!isSpace(code) && code !== 0x0A) { break; }
      }
      // [link](  <href>  "title"  |  alias  )
      //                              ^^^^^ parse alias
      start = pos;
      res = parseAlias(state.src, pos, state.posMax, [0x29]);
      if (pos < max && res.pos !== start && res.ok) {
        alias = res.str;
        pos = res.pos;
      } else {
        /* Taking a strict stance here: Either not initiating alias declaration
         * within inline link, or providing one valid alais.
         * By doing so, syntax issues will be handled before alias resolution.
         */
        state.pos = oldPos;
        return false;
      }
      // [link](  <href>  "title"  |  alias  )
      //                                   ^^ skip spaces in between
      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);
        if (!isSpace(code) && code !== 0x0A) { break; }
      }
    }

    if (pos >= max || state.src.charCodeAt(pos) !== 0x29/* ) */) {
      state.pos = oldPos;
      return false;
    }
    pos++;
  } else {
    //
    // Link reference
    //
    if (typeof state.env.references === 'undefined') { return false; }

    if (pos < max && state.src.charCodeAt(pos) === 0x5B/* [ */) {
      start = pos + 1;
      pos = state.md.helpers.parseLinkLabel(state, pos);
      if (pos >= 0) {
        label = state.src.slice(start, pos++);
      } else {
        pos = labelEnd + 1;
      }
    } else {
      pos = labelEnd + 1;
    }
    // covers label === '' and label === undefined
    // (collapsed reference link and shortcut reference link respectively)
    if (!label) { label = state.src.slice(labelStart, labelEnd); }

    // Note: We're restricting the reference lebel to be in line with alias
    // format requirements, so that we can use the label for alias directly
    // when written in this form.
    label = label.trim();
    ref = isValidAlias(label) && state.env.references[normalizeReference(label)];
    if (!ref) {
      state.pos = oldPos;
      return false;
    }
    alias = label;
    href = ref.href;
    title = ref.title;
  }

  //
  // We found the end of the link, and know for a fact it's a valid link;
  // so all that's left to do is to call tokenizer.
  //
  if (!silent) {
    content = state.src.slice(labelStart, labelEnd);

    state.md.inline.parse(
      content,
      state.md,
      state.env,
      tokens = [],
    );

    token = state.push('image', 'img', 0);
    token.attrs = attrs = [['src', href], ['alt', ''], ['alias', alias]];
    token.children = tokens;
    token.content = content;

    if (title) {
      attrs.push(['title', title]);
    }
  }

  state.pos = pos;
  state.posMax = max;

  return true;
}

function stringOneToOneCheck(a, b, mapA2B, mapB2A, errA, errB) {
  // Using two mappings to find out violation of one-to-one relationship.
  // Errors A having multiple relationships with B will be recorded as a
  // [NAME_A]-[List of NAME_Bs] pair in errA, and vice versa.
  //
  // Here we assume only non-empty strings take participate in the relations.
  // For orphaned singleton, it will create record in one of the mappings,
  // after validated by methods like orphanedInstanceCheck(), we can later
  // inference the bound value from the created mappings (mapA2B, mapB2A).

  if (a) {
    if ((!(a in mapA2B)) || (!mapA2B[a])) {
      mapA2B[a] = b;
    } else if (b && (b !== mapA2B[a])) {
      if (!(a in errA)) {
        errA[a] = [b];
      } else {
        errA[a].push(b);
      }
    }
  }

  if (b) {
    if ((!(b in mapB2A)) || (!mapB2A[b])) {
      mapB2A[b] = a;
    } else if (a && (a !== mapB2A[b])) {
      if (!(b in errB)) {
        errB[b] = [a];
      } else {
        errB[b].push(a);
      }
    }
  }
}

function orphanedStringInstanceCheck(mapA2B, errA) {
  // The same as stringOneToOneCheck(), it doesn't consider empty string
  // as valid value.
  forEach(mapA2B, (b, a) => {
    if (!b) {
      errA[a] = true;
    }
  });
}

// Constants for accessing parsed tokens.
const [ATTR_VALUE_IDX] = [1];
const [IMG_SRC_IDX, IMG_ALIAS_IDX] = [0, 2];
const IMAGE_TYPE = 'image';
const INLINE_TYPE = 'inline';

function validateImageInformation(tokens) {
  const linkAliasMapping = {};
  const aliasLinkMapping = {};
  const errLink = {};
  const errAlias = {};
  let traversalStack = [...tokens];
  let item;
  let src;
  let alias;
  let result = {
    pass: true,
    errLink: undefined,
    errAlias: undefined,
    aliasLinkMapping: undefined,
  };

  while (!isEmpty(traversalStack)) {
    item = traversalStack.pop();
    // We only care about inline, and top layer info of image
    if (item.type === INLINE_TYPE) {
      traversalStack = traversalStack.concat(item.children);
    } else if (item.type === IMAGE_TYPE) {
      src = item.attrs[IMG_SRC_IDX][ATTR_VALUE_IDX];
      alias = item.attrs[IMG_ALIAS_IDX][ATTR_VALUE_IDX];
      stringOneToOneCheck(
        src, alias, linkAliasMapping, aliasLinkMapping, errLink, errAlias,
      );
    }
  }

  // Check 2: 'Orphaned' link with no alias
  orphanedStringInstanceCheck(linkAliasMapping, errLink);

  if (!isEmpty(errLink) || !isEmpty(errAlias)) {
    result = {
      ...result,
      pass: false,
      errLink,
      errAlias,
    };
    return result;
  }

  result = { ...result, aliasLinkMapping };
  return result;
}

function createDocumentParser() {
  // Default parser settings with img parser overwritten
  const parser = MarkdownIt();
  parser.inline.ruler.at('image', imageWithAlias);
  return parser;
}

function parseDocument(str, psr) {
  const parser = psr || createDocumentParser();
  const env = {};
  const parsedStructure = parser.parse(str, env);
  const validationResult = validateImageInformation(parsedStructure);
  let result = {
    pass: true,
    parsedHTML: undefined,
    errors: undefined,
  };

  if (!validationResult.pass) {
    result = {
      ...result,
      pass: false,
      errors: {
        imageLink: validationResult.errLink,
        imageAlias: validationResult.errAlias,
      },
    };
  } else {
    result = {
      ...result,
      pass: true,
      parsedHTML: parser.renderer.render(parsedStructure, {}, env),
    };
  }

  return result;
}

export {
  parseDocument as default,
  createDocumentParser,
};
