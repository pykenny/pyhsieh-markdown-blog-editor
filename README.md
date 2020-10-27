# Markdown-based Blog Post Editor and Bundler
(Simple) implementation of local post editor that provides preview of parsed Markdown document and bundle the document with images.

## Goal
 - A local web page Markdown editor that parses and provides preview of an input Markdown document.
    - Allows user to add images from local disk (served by the server, so you'll need to assign where to search the files for static file service when initiating the server.
    - User is required to provide alias for the file in this format: `![ALT_TEXT](IMG_DIR|IMG_ALIAS)`. The parser should be able to make inference so that the alias only need to be declared once. Which means original syntax like `![ALT_TEXT](IMG_DIR)` can be used when we need the same image to appear in other places in the article.
 - A local server service that receives the finished document, and bundle it with local image resources.
    - For safety the local server will parse the document again, and find out the image resources required.
    - The files will be packed, archived, and zipped in output directory.
    - Replace all occurences of image paths with alias only (I'll handle that when implemneting the blog service.)
    - All the image files will be renamed with the alias provided in the document.
