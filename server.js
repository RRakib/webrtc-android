const express = require('express')
const http = require("http")
const cors = require("cors")
const app = express()
const server = http.createServer(app)
const socket = require('socket.io')
const io = socket(server)


// keep a reference of all socket connections
let connectedPeers = new Map()

app.use(cors())

io.on('connection', socket => {
    socket.emit('connection-success', { success: socket.id })

    connectedPeers.set(socket.id, socket)

    socket.on('disconnect', () => {
        console.log('disconnected')
        connectedPeers.delete(socket.id)
    })

    socket.on('offerOrAnswer', (data) => {
        for (const [socketID, socket] of connectedPeers.entries()) {
            if (socketID !== data.socketID) {
                console.log(socketID, data.payload.type)
                socket.emit('offerOrAnswer', data.payload)
            }
        }
    })

    socket.on('candidate', (data) => {
        for (const [socketID, socket] of connectedPeers.entries()) {
            // don't send to self
            if (socketID !== data.socketID) {
                console.log(socketID, data.payload, 38)
                socket.emit('candidate', data.payload)
            }
        }
    })

})

app.get('/', (req, res) => {
    res.json({message: "Works"})
})


const port = 5000

server.listen(port, () => console.log(`Example app listening on port ${port}!`))
