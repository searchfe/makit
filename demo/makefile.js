const UglifyJS = require('uglify-js')
const md5 = require('md5')
const { writeFileSync, writeFile, readFileSync, readFile } = require('fs-extra')
const { rule } = require('..')
const rimraf = require('rimraf')

// default rule, `makit`
rule('all', ['a1.min.js', 'a2.min.js', 'a.js.md5'])

// clean rule, `makit clean`
rule('clean', [], (ctx, done) => rimraf('{*.md5,*.min.js}', done))

// Plain JavaScript, `makit a1.min.js`
rule('a1.min.js', ['a.js'], function () {
    const src = readFileSync(this.dependencies[0], 'utf8')
    const dst = UglifyJS.minify(src).code
    writeFileSync(this.target, dst)
})

// Async
rule('a1.min.js', ['a.js'], async function () {
    const src = await readFile(this.dependencies[0], 'utf8')
    const dst = UglifyJS.minify(src).code
    await writeFile(this.target, dst)
})

// Using Utility API, `makit a2.min.js`
rule('a2.min.js', ['a.js'], async function () {
    const src = await this.readDependency(0)
    const dst = UglifyJS.minify(src).code
    await this.writeTarget(dst)
})

// glob
rule('*.js.md5', ctx => ctx.target.replace('.md5', ''), async function () {
    const src = await this.readDependency(0)
    await this.writeTarget(md5(src))
})
