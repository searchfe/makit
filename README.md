# makit

Purposes and Principles:

* Minimal Concepts. It's important to keep Makefile simple and stupid.
* Less Limits. We do not use recipes return values, don't even requrie a recipe, and don't check the actual output.

## Get Started

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

## Async (Promise & Callbacks)

## Dynamic Dependencies

## Advanced Utils
