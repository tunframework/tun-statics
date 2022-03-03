// refers: https://blog.csdn.net/daydream13580130043/article/details/83445437
import fs from "fs";
import { join, extname } from "path";
// import { URL } from "url";
import { RAW_RESPONSE, getMimeByExt } from "tun";
import crypto from "crypto";
/*
const MIME: Record<string, string> = {
  '.css': 'text/css',
  '.gif': 'image/gif',
  '.html': 'text/html',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript',
  //
  '.ico': 'image/x-icon',

  // json
};
*/
export default function statics({ getMIME = (pathname) => undefined, dir = '', 
// prefix = '/static/',
prefix = '', }) {
    return async (ctx, next) => {
        const _res = ctx.res[RAW_RESPONSE];
        if (_res.headersSent || _res.writableEnded)
            return Promise.resolve();
        // let pathname = new URL(ctx.req.url).pathname;
        let pathname = ctx.req.path;
        if (prefix) {
            if (!(pathname || '').startsWith(prefix)) {
                return next();
            }
            else {
                pathname = (pathname || '').substring(prefix.length);
            }
        }
        // should inherits default MIME?
        // const mime = (typeof getMIME === 'function' && getMIME(pathname)) || MIME[extname(pathname)];
        const mime = (typeof getMIME === 'function' && getMIME(pathname)) || getMimeByExt(extname(pathname).substring(1));
        if (mime) {
            let staticPath = join(dir, pathname);
            if (fs.existsSync(staticPath)) {
                // [使用 etag 配置协商缓存](https://blog.csdn.net/qq_39523606/article/details/104155090)
                const ifNoneMatch = ctx.req.headers['if-none-match'];
                const hash = crypto.createHash('md5');
                const buf = fs.readFileSync(staticPath);
                hash.update(buf);
                const etag = `"${hash.digest('hex')}"`;
                if (ifNoneMatch === etag) {
                    // _res.writeHead(304, {
                    //   'Content-Type': mime
                    // });
                    ctx.res.status = 304;
                    ctx.res.type = {
                        rawType: mime
                    };
                    _res.writeHead(ctx.res.status, ctx.res.message);
                    _res.end();
                    return next();
                }
                else {
                    _res.setHeader('etag', etag);
                }
                const ifModifiedSince = ctx.req.headers['if-modified-since'] || '';
                const stat = fs.statSync(staticPath);
                if (new Date(ifModifiedSince).getTime() === stat.mtime.getTime()) {
                    // _res.writeHead(304, {
                    //   'Content-Type': mime
                    // });
                    ctx.res.status = 304;
                    ctx.res.type = {
                        rawType: mime
                    };
                    _res.writeHead(ctx.res.status, ctx.res.message);
                    _res.end();
                    return next();
                }
                else {
                    _res.setHeader('last-modified', stat.mtime.toUTCString());
                }
                // _res.writeHead(200, {
                //   'Content-Type': mime
                // });
                ctx.res.status = 200;
                ctx.res.type = {
                    rawType: mime
                };
                _res.writeHead(ctx.res.status, ctx.res.message);
                // fs.createReadStream(staticPath).pipe(ctx.res);
                _res.write(buf);
                _res.end();
                return next();
            }
            else {
                // console.log('statics not found', staticPath)
                // _res.writeHead(404);
                return next();
            }
            return next();
        }
        else {
            // exception not-found should trigger by router
            // _res.writeHead(404);
            // return Promise.resolve();
            return next();
        }
        // console.log(`static ${pathname} mime=${mime}`);
        return next();
    };
}
