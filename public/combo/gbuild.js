var cp = require('child_process')
var fs = require('fs')
var path = require('path')

var outFile, buildFile

var beta = true
var version = '2.0.1'
var now = new Date
var date = now.getFullYear() + "." + (now.getMonth() + 1) + "." + now.getDate()
version = version + (beta ? '.b' + Date.now() : '')

console.log('building js');
var build = cp.execSync('node r.js -o build.js');
console.log(build.toString('utf-8'));

fs.readFileSync('build.js', 'utf-8').replace(/out:\s?"(.*?)"/, function(result, out) {
    outFile = path.resolve(out)
});

buildFile = fs.readFileSync(outFile, 'utf-8')
    .replace(/(^.*?avalon}\),)(!function)/, "$2")
    .replace(/(define\("(?:text|css|domReady)".*?,)(define)/g, "$2")

var copyright = [
'/*==================================================',
' * QxQy.js',
' * Version:',
' * Date:',
' ==================================================*/'
]
.join('\n')
.replace(/Version:.*?\n/, 'Version: ' + version + '\n')
.replace(/Date:.*?\n/, 'Date: ' + date + '\n')

fs.writeFileSync(outFile, [copyright, buildFile].join('\n\n'))

console.log('build done')
