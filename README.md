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

API Spec: <https://searchfe.github.io/makit/modules/_index_.html>

## Get Started

Basically, the syntax is as simple as Makefile, a rule consists of 3 parts:

* **target**: either a filepath string, a glob string, or a RegExp object
* **prerequisites**: list of filepath strings, a function that returns a list of strings, or list of strings and functions, async functions are also supported
* **recipe**: an optional function, can be async

Write a makefile.js containing the following contents:

```javascript
const { rule } = require('makit')

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

## Dynamic Prerequisites

It's sometimes handy to call `make()` within the recipe,
these dynamically prerequisites will not be recorded into the dependency tree.
Thus makit will NOT remake the target when any of these prerequisites changed.
For example: 

```javascript
const { rule, make } = require('makit')

rule('bundle.js', 'a.js', async (ctx) => {
    await make('b.js')
    const js = (await ctx.readFile('a.js')) + (await ctx.readFile('b.js'))
    ctx.writeTarget(js)
})
```

Suppose we have the above `makefile.js` and run `makit bundle.js` to get the file `bundle.js`.
Make changes to `b.js` and then remake bundle via `makit bundle.js`.
The recipe for `bundle.js` will not be called cause `b.js` is not in the dependency tree.
To fix this, just Take `b.js` into the prerequisites and makit will do the rest:

```javascript
const { rule, make } = require('makit')

rule('bundle.js', ['a.js', 'b.js'] async (ctx) => {
    const js = (await ctx.readFile('a.js')) + (await ctx.readFile('b.js'))
    return ctx.writeTarget(js)
})
```

When it comes to dynamic prerequisites (like bundling AMD requires) it's recommended to
provide another rule to make the dependency list.

```javascript
const { series, rule } = require('makit')

rule(
    'bundle.js',
    series('bundle.js.dep', ctx => ctx.readFileSync('bundle.js.dep').split('\n'),
    ctx => {/* do the bundle */}
)

rule('bundle.js.dep', 'bundle.js', ctx => { /* analyze the dependencies of bundle.js */ })
```

We introduced `rude()` and `ctx.make` to facilitate this situation:

```javascript
const { rude } = require('makit')

rude(
    'bundle.js', [], async ctx => {
        await ctx.make('a.js')
        await ctx.make('b.js')
        const js = (await ctx.readFile('a.js')) + (await ctx.readFile('b.js'))
        return ctx.writeTarget(js)
    }
)
```

A pseudo rule targeting `bundle.js.rude.dep`, which contains the dependencies during the last run,
will be generated for each `rude()`.
