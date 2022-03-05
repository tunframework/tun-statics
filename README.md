# tun-rest-router

handle static files for tun

## install

```sh
npm install @tunframework/tun{,-bodyparser,-rest-router,-statics}
```

## example

```js
import { TunApplication } from '@tunframework/tun'
import { statics } from '@tunframework/tun-statics'
import { resolve } from 'path'

const __dirname = resolve(process.cwd(), 'statics')

const app = new TunApplication()
app.use(statics({ dir: __dirname, prefix: '/statics' }))

const server = app.listen({ host: '127.0.0.1', port: 0 })

server.on('listening', async () => {
  // @type {AddressInfo}
  let addr = server.address() || {}
  console.log(`listening: http://${addr.address}:${addr.port}`)
})
```
