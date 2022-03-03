import { Server } from 'http'
import { AddressInfo, ListenOptions } from 'net'
import { TunApplication } from 'tun'

export function prepareApp(
  option: ListenOptions = { host: 'localhost', port: 0 }
) {
  const app = new TunApplication()

  return {
    app,
    boot: (
      cb: (server: Server, url: string) => Promise<void>,
      option: ListenOptions = { host: '127.0.0.1', port: 0 }
    ) => {
      const server = app.listen(option)
      server.on('listening', async () => {
        let addr = (server.address() || {}) as AddressInfo
        const url =
          'http://' + [addr.address, addr.port].filter(Boolean).join(':')
        // console.log(`temp test app url: ${url}`)
        // assert.ok(url, `server url should not be empty`);
        try {
          await cb(server, url)
        } finally {
          closeServer(server)
        }
      })
      return server
    }
  }
}

function closeServer(server: Server) {
  server.close()
}
