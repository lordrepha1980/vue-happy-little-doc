# Vue-Happy-Little-Docs

Vue3 documentation generator only Vue `script setup tag`.

## Installation
First, install [Yeoman](http://yeoman.io) and vue-happy-little-docs using [npm](https://www.npmjs.com/) (we assume you have pre-installed [node.js](https://nodejs.org/)).

```bash
npm install -g yo
npm install -g vue-happy-little-docs
```

## Config

Create a file named `hld-config.json` in the directory where you want to generate the documentation. If you don't specify 'hld-config.json`, all files in the directory will be added to the documentation.

    {
        "title": "Projekt name",
        "path": {
            "pages": "Relative path to pages dir",
            "stores": "Relative path to stores dir",
            "components": "Relative path to components dir"
        }
    }

## Create a documentation
```bash
yo vue-happy-little-docs build
```
