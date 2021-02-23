import React from 'react';
import ReactDOM from 'react-dom';
import 'regenerator-runtime';

import MarkdownEditor from './MarkdownEditor';

import '../scss/editor.scss';

ReactDOM.render(<MarkdownEditor />, document.getElementById('markdownEditorApp'));
