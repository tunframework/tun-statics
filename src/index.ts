// refers: https://blog.csdn.net/daydream13580130043/article/details/83445437
import fs from 'fs'
import { join, extname } from 'path'
// import { URL } from "url";
import {
  TunContext,
  RAW_REQUEST,
  RAW_RESPONSE,
  mimeExtMap
} from '@tunframework/tun'
import type { TunComposable } from '@tunframework/tun'
import crypto from 'crypto'

/**
 * @internal
 */
export function _getMimeByExt(ext: string) {
  for (const key in mimeExtMap) {
    if (Object.prototype.hasOwnProperty.call(mimeExtMap, key)) {
      if (mimeExtMap[key].split(' ').indexOf(ext) > -1) {
        return key
      }
    }
  }
  return null
}

export interface StaticsOptions {
  getMIME?: (pathname: string) => string
  dir?: string
  /**
   * @example '/static/'
   */
  prefix?: string
  /**
   * etag, if-none-match, if-modified-since, last-modified
   */
  cache?: boolean

  allowUnknownMimeWithExts?: boolean
}

export function statics(
  _options: StaticsOptions = {}
): TunComposable<TunContext> {
  const {
    getMIME = (pathname: string) => '',
    dir = '',
    prefix = '',
    cache = false,
    allowUnknownMimeWithExts = false
  } = _options || {}
  return async (ctx, next) => {
    const _res = ctx.res[RAW_RESPONSE]
    if (_res.headersSent || _res.writableEnded) return Promise.resolve()

    let pathname = ctx.req.path
    if (prefix) {
      if (!(pathname || '').startsWith(prefix)) {
        return next()
      } else {
        pathname = (pathname || '').substring(prefix.length)
      }
    }

    const mime =
      (typeof getMIME === 'function' && getMIME(pathname)) ||
      _getMimeByExt(extname(pathname).substring(1)) ||
      (allowUnknownMimeWithExts ? 'application/octet-stream' : '')

    if (!cache && mime) {
      let staticPath = join(dir, pathname)
      if (fs.existsSync(staticPath)) {
        // const buf = fs.readFileSync(staticPath);

        ctx.res.status = 200
        ctx.res.type = {
          rawType: mime
        }
        _res.writeHead(ctx.res.status, ctx.res.message)

        fs.createReadStream(staticPath).pipe(_res)
        // _res.write(buf);
        // _res.end();
        return next()
      } else {
        // console.log('statics not found', staticPath)
        // _res.writeHead(404);
        return next()
      }
    }

    if (cache && mime) {
      let staticPath = join(dir, pathname)
      if (fs.existsSync(staticPath)) {
        const ifNoneMatch = ctx.req.headers['if-none-match']
        const hash = crypto.createHash('md5')
        const buf = fs.readFileSync(staticPath)
        hash.update(buf)
        const etag = `"${hash.digest('hex')}"`
        if (ifNoneMatch === etag) {
          ctx.res.status = 304
          ctx.res.type = {
            rawType: mime
          }
          _res.writeHead(ctx.res.status, ctx.res.message)

          _res.end()

          return next()
        } else {
          _res.setHeader('etag', etag)
        }

        const ifModifiedSince = ctx.req.headers['if-modified-since'] || ''
        const stat = fs.statSync(staticPath)
        if (new Date(ifModifiedSince).getTime() === stat.mtime.getTime()) {
          ctx.res.status = 304
          ctx.res.type = {
            rawType: mime
          }
          _res.writeHead(ctx.res.status, ctx.res.message)

          _res.end()

          return next()
        } else {
          _res.setHeader('last-modified', stat.mtime.toUTCString())
        }

        ctx.res.status = 200
        ctx.res.type = {
          rawType: mime
        }
        _res.writeHead(ctx.res.status, ctx.res.message)

        // fs.createReadStream(staticPath).pipe(ctx.res);
        _res.write(buf)
        _res.end()
        return next()
      } else {
        // console.log('statics not found', staticPath)
        // _res.writeHead(404);
        return next()
      }
      return next()
    } else {
      // exception not-found should trigger by router
      // _res.writeHead(404);
      // return Promise.resolve();

      return next()
    }
    // console.log(`static ${pathname} mime=${mime}`);
    return next()
  }
}
