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

* Minimal Concepts. It's intended to be a general purpose build automation tool just like GNU Make. Do not introduce unnecessary concept to keep it simple and stupid.
* Less Restrictions. It should be as open as GNU Make, makit doesn't expect recipes return anything, doesn't even requrie a recipe for its rule definition, and doesn't care about the actual output of recipes.
* JavaScript Style. Recipes can be written as callback style, Promise style or just synchronous style. Automatic variables are replaced by camelCased equivalents. Wildcard in static patterns are replaced by JavaScript RegExp and globs.

API Spec: <https://searchfe.github.io/makit/modules/_index_.html>

## Get Started

Basically, the syntax is as simple as Makefiles but with a `.js` extension. A Makefile.js contains a set of rules, each of which consists of 3 parts:

* **target**: either a filepath string, a glob string, or a RegExp object.
* **prerequisites**: list of filepath strings, functions that return a list of strings, or list of strings and functions. functions here can be either sync or async.
* **recipe**: an optional function, can be either sync or async.

Suppose we have a makefile.js containing the following contents:

```javascript
const { rule } = require('makit')

rule('all', ['a1.min.js'])  // default rule

rule('a1.min.js', ['a.js'], function () {
    const src = readFileSync(this.dependencies[0], 'utf8')
    const dst = UglifyJS.minify(src).code
    writeFileSync(this.target, dst)
})
```

When we run `makit`(which is equivelant to `make all` cause `all` is the first rule), makit tries to make the target `all` which requires `a1.min.js` so the second rule will be applied firstly and its recipe is called to generate the target `a1.min.js`. The prerequisites for `all` has been fully resolved now and makit then tries to call its recipe, which is not defined for the above case so makit will just skip call the recipe and assume the target `all` is made successfully.

See [/demo](https://github.com/searchfe/makit/tree/master/demo) directory for a working demo.
For more details see the typedoc for [.rule()](https://searchfe.github.io/makit/modules/_index_.html#rule.)

## Async (Promise & Callbacks)

When the recipe returns a Promise, that promise will be awaited.

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

Callback style functions also work:

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

Similarly, async prerequisites functions, i.e. functions of return type `Promise<string>` or `Promise<string[]>`, are also supported.


## Matching Groups and Backward Reference

Makit uses [extglob](https://www.npmjs.com/package/extglob) to match target names.
Furthermore it's extended to support match groups which can be referenced in prerequisites.

```javascript
// `makit output/app/app.js` will make app.js.md5 from a.ts
rule('(output/**)/(*).js', '$1/$2.ts', async function () {
    return this.writeTarget(tsc(await this.readDependency()))
})
make('output/app/app.js')
```

## Dynamic Prerequisites

It's sometimes handy to call `make()` within the recipe, but global `make()` is not valid in recipes.
For example the following rule is **NOT** valid:

```javascript
const { rule, make } = require('makit')

rule('bundle.js', 'a.js', async (ctx) => {
    await make('b.js')
    const js = (await ctx.readFile('a.js')) + (await ctx.readFile('b.js'))
    ctx.writeTarget(js)
})
```

We introduce `rude()` to facilitate this situation, a `ctx.make` API is available inside the recipe of `rude`:

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

A pseudo rule with `bundle.js.rude.dep` as target, the contents of which is the actual dependencies,
will be generated for each `rude()`.
