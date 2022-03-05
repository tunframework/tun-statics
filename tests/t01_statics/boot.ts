import { Server } from 'http'
import { AddressInfo, ListenOptions } from 'net'
import { TunApplication } from '@tunframework/tun'

export function prepareApp(
  option: ListenOptions = { host: 'localhost', port: 0 }
) {
  const app = new TunApplication()

  return {
    app,
    boot: (
      // cb: (server: Server, url: string) => Promise<void>,
      option: ListenOptions = { host: '127.0.0.1', port: 0 }
    ): Promise<{ server: Server; url: string }> => {
      return new Promise((resolve, reject) => {
        const server = app.listen(option)
        server.on('listening', async () => {
          let addr = (server.address() || {}) as AddressInfo
          const url =
            'http://' + [addr.address, addr.port].filter(Boolean).join(':')

          resolve({ server, url })
        })
      })
    },
    closeServer
  }
}

function closeServer(server: Server) {
  server.close()
}
