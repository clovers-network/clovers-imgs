import http from 'http'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import compression from 'compression'
import Reversi from 'clovers-reversi'

let app = express()

const port = process.env.PORT || 4444
const host = process.env.HOST || 'localhost'

app.server = http.createServer(app)

app.use(cors({
  exposedHeaders: ['Link']
}))

app.use(bodyParser.json({
  limit: '100kb'
}))

app.use(compression())

app.get('/svg/:id/:size?', async (req, res) => {
  try {
    let { id, size } = req.params

    if (typeof id !== 'string') {
      id = '0'
    }
    id = id.replace(/\s+/g, '')

    const svg = await toSVG(id, size || 400)

    res.setHeader('Content-Type', 'image/svg+xml')
    res.send(svg)
  } catch (err) {
    debug('No ID, or invalid', err)
    res.sendStatus(400)
  }
})

app.server.listen(port, () => {
  console.log('good to go', app.server.address().port)
})

function toSVG (id, size = 400) {
  size = parseInt(size)

  return new Promise((resolve, reject) => {
    let green = '#01B463'
    let black = '#000000'
    let white = '#FFFFFF'
    let grey = '#808080'

    let r = new Reversi()

    r.byteBoardPopulateBoard(id)
    r.calcWinners()
    r.isSymmetrical()

    let fill, stroke, sequence
    let strokeWidth = 1
    let radius = size / 2

    let svg =
      '<?xml version="1.0" encoding="UTF-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="' +
      size +
      'px" height="' +
      size +
      'px" viewBox="-1 -1 ' +
      (size + 2) +
      ' ' +
      (size + 2) +
      '" enable-background="new 0 0 ' +
      size +
      ' ' +
      size +
      '" xml:space="preserve">'

    if (r.whiteScore < r.blackScore) {
      fill = black
      stroke = black
    } else if (r.whiteScore > r.blackScore) {
      fill = white
      stroke = black
    } else {
      fill = grey
      stroke = grey
    }
    // if (r.symmetrical) {
    //   strokeWidth = 2
    //   stroke = green
    // }

    svg +=
      '<circle shape-rendering="optimizeQuality" fill="' +
      fill +
      '" stroke="' +
      stroke +
      '" stroke-width="' +
      strokeWidth +
      '" stroke-miterlimit="10" cx="' +
      size / 2 +
      '" cy="' +
      size / 2 +
      '" r="' +
      radius +
      '"/>'

    for (let i = 0; i < 64; i++) {
      let row = Math.floor(i / 8)
      let col = i % 8
      switch (r.board[row][col]) {
        case r.BLACK:
          if (r.whiteScore < r.blackScore) continue
          fill = black
          stroke = 'none'
          break
        case r.WHITE:
          if (r.whiteScore > r.blackScore) continue
          fill = white
          stroke = 'none'
          break
        case r.EMPTY:
          fill = green
          stroke = 'none'
          break
        default:
          continue
      }
      let x = (row + 1) * (size / 12) + size / 8
      let y = (col + 1) * (size / 12) + size / 8
      svg +=
        '<circle shape-rendering="optimizeQuality" fill="' +
        fill +
        '" stroke="' +
        stroke +
        '" stroke-miterlimit="1" cx="' +
        x +
        '" cy="' +
        y +
        '" r="' +
        size / 24 +
        '"/>'
    }
    svg += '</svg>'
    resolve(svg)
  })
}
