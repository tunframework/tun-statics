import assert from 'assert'
import { prepareApp } from './boot.js'

import { readFileSync } from 'fs'
import { resolve } from 'path'
import fetch from 'node-fetch'

import { statics } from '../../src/index.js'

describe(`t01_statics`, () => {
  it(`#statics`, async () => {
    const __dirname = resolve(process.cwd(), 'tests/t01_statics')
    const filenames = [
      // 'foo.json',
      'index.html'
    ]
    const fileContents = filenames.map((filename) =>
      readFileSync(resolve(__dirname, filename), {
        encoding: 'utf-8'
      })
    )

    const { app, boot, closeServer } = prepareApp()

    const prefix = '/test-statics'

    app.use(
      statics({
        // dir: process.cwd(),
        // dir: resolve(fileURLToPath(import.meta.url), '../')
        dir: __dirname,
        prefix
        // getMIME: (pathname) => {
        //   if (extname(pathname) === '.json') {
        //     return `application/json`;
        //   }
        //   return null;
        // },
      })
    )

    const { server, url } = await boot()
    try {
      for (let i = 0; i < filenames.length; i++) {
        const filename = filenames[i]
        const fileContent = fileContents[i]

        const pathname = `${prefix}/${
          filename === 'index.html' ? '' : filename
        }`

        const res = await fetch(`${url}${pathname}`, { method: 'GET' })
        assert.notEqual(404, res.status, `${filename} should be found`)
        if (filename.endsWith('.json')) {
          const result: any = await res.json()
          assert.deepEqual(JSON.parse(fileContent), result)
        } else {
          const result: any = await res.text()
          assert.equal(fileContent, result)
        }
      }
    } finally {
      closeServer(server)
    }
  })
})
