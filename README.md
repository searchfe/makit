# makit
[![npm version](https://img.shields.io/npm/v/makit.svg)](https://www.npmjs.org/package/makit)
[![downloads](https://img.shields.io/npm/dm/makit.svg)](https://www.npmjs.org/package/makit)
[![Build Status](https://travis-ci.com/searchfe/makit.svg?branch=master)](https://travis-ci.com/searchfe/makit)
[![Coveralls](https://img.shields.io/coveralls/searchfe/makit.svg)](https://coveralls.io/github/searchfe/makit?branch=master)
[![dependencies](https://img.shields.io/david/searchfe/makit.svg)](https://david-dm.org/searchfe/makit)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/searchfe/makit)
[![GitHub issues](https://img.shields.io/github/issues-closed/searchfe/makit.svg)](https://github.com/searchfe/makit/issues)
[![David](https://img.shields.io/david/searchfe/makit.svg)](https://david-dm.org/searchfe/makit)
[![David Dev](https://img.shields.io/david/dev/searchfe/makit.svg)](https://david-dm.org/searchfe/makit?type=dev)
[![DUB license](https://img.shields.io/dub/l/vibe-d.svg)](https://github.com/searchfe/makit/blob/master/LICENSE)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#commits)

Purposes and Principles:

* Minimal Concepts. It's important to keep Makefile simple and stupid.
* Less Limits. We do not use recipes return values, don't even requrie a recipe, and don't check the actual output.
* JavaScript Style. Async callbacks & Promises are supported, automatic variables are replaced by JavaScript names, wildcards are replaced by JavaScript RegExp and globs.

## Get Started

Basically, the syntax is as simple as Makefile, a rule consists of 3 parts:

* **target**: either a filepath string, a glob string, or a RegExp object
* **prerequisites**: list of filepath strings, a function that returns a list of strings, or list of strings and functions, async functions are also supported
* **recipe**: an optional function, can be async

Write a makefile.js containing the following contents:

```javascript
rule('all', ['a1.min.js'])  // default rule

rule('a1.min.js', ['a.js'], function () {
    const src = readFileSync(this.dependencies[0], 'utf8')
    const dst = UglifyJS.minify(src).code
    writeFileSync(this.target, dst)
})
```

See [/demo](https://github.com/searchfe/makit/tree/master/demo) directory for details.
More details see the typedoc for [.rule()](https://searchfe.github.io/makit/modules/_index_.html#rule.)

## Async (Promise & Callbacks)

When the recipe returns a Promise, it'll be awaited.

```javascript
rule('a1.min.js', ['a.js'], async function () {
    const src = await readFile(this.dependencies[0], 'utf8')
    const dst = UglifyJS.minify(src).code
    await writeFile(this.target, dst)
})
// equivelent to
rule('a1.min.js', ['a.js'], async ctx => {
    const src = await readFile(ctx.dependencies[0], 'utf8')
    const dst = UglifyJS.minify(src).code
    await writeFile(ctx.target, dst)
})
```

Callback functions are also supported:

```javascript
rule('clean', [], (ctx, done) => rimraf('{*.md5,*.min.js}', done))
```

## Dynamic Dependencies

```javascript
// `makit a.js.md5` will make a.js.md5 from a.js
rule('*.js.md5', ctx => ctx.target.replace('.md5', ''), async function () {
    const src = await this.readDependency(0)
    await this.writeTarget(md5(src))
})
```

The prerequisites function can also return a `Promise<string>` or `Promise<string[]>`.


## Match Groups and Backward Reference

Makit uses [extglob](https://www.npmjs.com/package/extglob) to match target names.
And it's extended to support match groups for reference in prerequisites.

```javascript
// `makit output/app/app.js` will make app.js.md5 from a.ts
rule('(output/**)/(*).js', '$1/$2.ts', async function () {
    return this.writeTarget(tsc(await this.readDependency()))
})
make('output/app/app.js')
```

## Writing makefile.js

All exported methods `.rule()`, `.make()`, `.setRoot()` are available in makefile.js:

```javascript
// file: makefile.js
const { rule, make } = require('makit')

rule('a.min.js', 'a.js', minify)

rule(/\.md5\.out$/, ctx => ctx.targetPath().replace(ctx.match[0], '.js'), md5)

rule('bundle.js', ['a.min.js'], async () => {
    await make('bundle.js.md5')
})
```

For more acurrate documentation, here's the TypeDoc: <https://searchfe.github.io/makit/modules/_index_.html>
