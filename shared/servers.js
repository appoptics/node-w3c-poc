// creates a "stack" of http servers that pass requests between each other based on data from path
// servers can be instrumented in various ways to examine how requests travel between them

const http = require('http')
const url = require('url')
const fs = require('fs')

const { count, ports } = require('./settings')
const base = 'http://127.0.0.1'

const setServers = async (id) => {
  // array of servers
  new Array(count).fill(null).map((_, index) => ports[id] + index).forEach(port => {
    http.createServer(function (req, res) {
      res.setHeader('Content-Type', 'text/plain')

      const chain = new url.URL(req.url, base).pathname.slice(1).replace(/[^AOL]/g, '')
      const player = chain[0] || ''

      if (!chain) {
        res.statusCode = 400
        res.end('No Chain.\n')
      } else if (player !== id) {
        res.statusCode = 400
        res.end(`Chain for port ${port} must start with ${player}.\n`)
      } else if (chain && (player === id)) {
        const rest = chain.slice(1)
        const next = rest[0]

        // best practice is to return request asap  => on this line before logging.
        const got = `${Date.now()} ${player} ${port} GOT - ${JSON.stringify(req.headers)}`
        fs.appendFileSync('req.log', `${got}\n`)

        // however, for span beauty return request later => on this line after logging.
        res.statusCode = 200
        res.end(`${chain} Chain.\n`)

        if (next) {
          const options = { headers: { from: player } }
          const shift = ports[next] - ports[id]
          const downstream = port + (next === id ? 0 : shift) + 1

          http.get(`${base}:${downstream}/${rest}`, options, (res) => {
            const gotback = `${Date.now()} ${player} ${port} RES - ${JSON.stringify(res.headers)}`
            fs.appendFileSync('req.log', `${gotback}\n`)
          })

          const sent = `${Date.now()} ${player} ${port} SENT - ${JSON.stringify(options.headers)}`
          fs.appendFileSync('req.log', `${sent}\n`)
        }
      }
    }).listen(port, () => {
      if (fs.existsSync('req.log')) fs.unlinkSync('req.log')
      console.log(`Server running on port ${port}`)
    })
  })
}

module.exports = setServers
