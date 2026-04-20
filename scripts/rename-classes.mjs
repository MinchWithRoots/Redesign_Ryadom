import fs from 'node:fs'
import path from 'node:path'

const srcRoot = path.join(process.cwd(), 'src')

const replacements = [
  ['class="min-h-screen bg-gradient-to-b from-white to-light-bg pt-[140px] pb-16"', 'class="layout-page"'],
  [
    'class="min-h-screen bg-gradient-to-b from-white via-white to-light-bg overflow-hidden"',
    'class="layout-landing"',
  ],
  ['class="container mx-auto px-4 lg:px-8 max-w-7xl"', 'class="layout-container"'],
  ['class="container mx-auto max-w-7xl"', 'class="container-wide"'],
  ['class="container mx-auto max-w-7xl relative z-10"', 'class="hero-container"'],
  ['class="pt-[140px] pb-24 lg:pb-32 px-4 lg:px-8 relative"', 'class="section-hero"'],
  ['class="bg-white border border-border/50 rounded-3xl p-8 shadow-card"', 'class="card"'],
  [
    'class="bg-white border border-border/50 rounded-2xl p-6 shadow-card hover:shadow-hover transition-all"',
    'class="card-surface"',
  ],
  ['class="bg-white border border-border/50 rounded-2xl shadow-card overflow-hidden"', 'class="card-table"'],
  ['class="text-sm font-semibold text-secondary block mb-2"', 'class="form-label"'],
  ['class="w-full px-4 py-3 border border-border rounded-xl bg-light-bg text-secondary"', 'class="input"'],
  [
    'class="px-8 py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-full shadow-soft hover:shadow-hover transition-all"',
    'class="btn-primary"',
  ],
  [
    'class="px-8 py-3 text-secondary font-semibold border-2 border-border rounded-full hover:border-primary hover:text-primary transition-all"',
    'class="btn-secondary"',
  ],
  ['class="p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm"', 'class="alert-success"'],
  [
    'class="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-3"',
    'class="alert-success-row"',
  ],
  [
    'class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-3"',
    'class="alert-error-row"',
  ],
  [
    'class="flex items-center gap-3 cursor-pointer hover:bg-light-bg p-3 rounded-lg transition-colors"',
    'class="settings-row"',
  ],
  ['class="text-left px-4 py-4 font-semibold text-secondary"', 'class="table-th"'],
  ['class="border-b border-border/50 hover:bg-light-bg/50 transition-colors"', 'class="table-tr"'],
]

function walk(currentDir) {
  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    const fullPath = path.join(currentDir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath)
      continue
    }
    if (!entry.isFile() || !fullPath.endsWith('.vue')) continue

    const before = fs.readFileSync(fullPath, 'utf8')
    let after = before

    for (const [from, to] of replacements) {
      after = after.split(from).join(to)
    }

    if (after !== before) {
      fs.writeFileSync(fullPath, after, 'utf8')
    }
  }
}

walk(srcRoot)
