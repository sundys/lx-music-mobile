// 把 package.json 的版本号与 publish/changeLog.md 同步到 publish/version.json。
// 更新检查（src/utils/version.js）读取的是 publish/version.json，而不是 release / tag，
// 所以每次发版都必须更新它，否则已安装的客户端收不到更新提示。

const fs = require('node:fs')
const path = require('node:path')
const pkg = require('../package.json')

const versionFile = path.join(__dirname, '../publish/version.json')
const changeLogFile = path.join(__dirname, '../publish/changeLog.md')

// 与 src/utils/index.ts 的 compareVer 语义一致：非数字字符按字符码视为更小的版本
const compareVer = (a, b) => {
  const fix = s => `.${s.toLowerCase().charCodeAt(0) - 2147483647}.`
  const left = ('' + a).replace(/[^0-9.]/g, fix).split('.').map(v => ~~v)
  const right = ('' + b).replace(/[^0-9.]/g, fix).split('.').map(v => ~~v)
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    if ((left[i] ?? 0) > (right[i] ?? 0)) return 1
    if ((left[i] ?? 0) < (right[i] ?? 0)) return -1
  }
  return 0
}

const info = JSON.parse(fs.readFileSync(versionFile, 'utf8'))
const target = pkg.version

if (info.version === target) {
  console.log(`publish/version.json 已是 ${target}，无需更新`)
  process.exit(0)
}
if (compareVer(info.version, target) === 1) {
  console.log(`publish/version.json 的 ${info.version} 高于 package.json 的 ${target}，保持不动`)
  process.exit(0)
}

const desc = fs.readFileSync(changeLogFile, 'utf8')
  .replace(/\r\n?/g, '\n')
  .replace(/(?:^|(\n))#{1,6} (.+)\n/g, '$1$2')
  .trim()

info.history.unshift({ version: info.version, desc: info.desc })
info.version = target
info.desc = desc

fs.writeFileSync(versionFile, JSON.stringify(info) + '\n', 'utf8')
console.log(`publish/version.json 已从 ${info.history[0].version} 更新至 ${target}`)
