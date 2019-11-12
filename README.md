# Makefile.js Done Right

Purposes and Principles:

* Minimal Concepts. It's important to keep Makefile simple and stupid.
* Less Limits. We do not use recipes return values, don't even requrie a recipe, and don't check the actual output.

## Get Started

Write a makefile.js containing the following contents:


```javascript
const { writeFileSync } = require('fs')

rule('a.min.js', ['a.js'], function () {
    writeFileSync(this.target)
})
```
