import assert from 'assert'
import { prepareApp } from './boot.js'

import { readFileSync } from 'fs'
import { extname, resolve } from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'

import statics from '../../lib/index.js'

describe(`t01_statics`, () => {
  it(`#statics`, (done) => {
    const __dirname = resolve(process.cwd(), 'tests/t01_statics')
    const filename = 'foo.json'
    const fooStr = readFileSync(resolve(__dirname, filename), {
      encoding: 'utf-8'
    })
    assert.ok(fooStr, `${filename} should not be empty`)

    const { app, boot } = prepareApp()

    const prefix = '/test-statics'

    app.use(
      statics({
        // dir: process.cwd(),
        // dir: resolve(fileURLToPath(import.meta.url), '../')
        dir: __dirname,
        prefix: prefix
        // getMIME: (pathname) => {
        //   if (extname(pathname) === '.json') {
        //     return `application/json`;
        //   }
        //   return null;
        // },
      })
    )

    boot(async (server, url) => {
      // console.log(`${url}${prefix}/${filename}`);
      const res = await fetch(`${url}${prefix}/${filename}`, { method: 'GET' })
      const result: any = await res.text()

      try {
        assert.notEqual(404, res.status, `${filename} should be found`)
        assert.ok(result, `should return result`)
        done()
      } catch (error) {
        done(error)
      }
    })
  })
})
