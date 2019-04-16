const PORT = process.env.port || 3400
const express = require('express')
const ejs = require('ejs')
const bodyParser = require('body-parser')
const app = express()
const io = require('socket.io')(app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`)
}))

let connectCounter = 0

let game = {
  inProgress: false,
  playerAmount: 0,
  playersAlive: 0,
  players: {},
  rng : function (){
    return Math.floor(Math.random() * Math.floor(65));
  },
  generateObstaclePos : function (num){
    gameTimer = setInterval(() => {
      let rng = this.rng()
      io.emit("obstaclePosish", rng)
    }, 5000)
  }
}

app.set('view engine', 'ejs');
app.use(express.static('public'))

app.get("/", (req, res) => {
  res.render("index")
})

app.get('/', (req, res) => {
  res.sendFile('/index.html');
});

io.on('connection', (socket) => {
  socket.emit("status", socket.id, game.inProgress, game.playerAmount)
  connectCounter++;
  console.log(connectCounter);

  socket.on("initiate game", () => {
    io.emit('countdown');
    setTimeout(() => {
      game.playersAlive = game.playerAmount
      game.generateObstaclePos()
      game.inProgress = true
    }, 6000)
  })

  socket.on("colorPick", (color) => {
    game.players[socket.id].color = color
    io.emit("colorChange", socket.id, color)
  })

  socket.on("join", (color) => {
    game.playerAmount++
    game.players[socket.id] = {
      alive: true
    }
    console.log(`${socket.id} Joined`)
    io.emit("newPlayer", socket.id, color)
  })

  socket.on("playerUpdate", (yPos) => {
    if (game.inProgress) {
      socket.broadcast.emit("enemyUpdate", socket.id, yPos)
    }
  })

  socket.on("playerDied", () => {
    if (game.players[socket.id].alive) {
      game.players[socket.id].alive = false
    }
    game.playersAlive--
    if (game.playersAlive === 1) {
      Object.entries(game.players).forEach(player => {
        if(player[1].alive) {
          game.inProgress = false;
          game.playerAmount = 0;
          game.playersAlive = 0;
          game.players = {};
          clearInterval(gameTimer)
          io.emit("winner", player[0])
        }
      })
    }
    socket.broadcast.emit("enemyUpdate", socket.id, yPos="dead")
  })

  socket.on('disconnect', () => {
    connectCounter--;
    console.log(connectCounter);
    if (connectCounter === 0 ) {
      game.inProgress = false
      game.players = {
        amount: 0
      }
    }
  });
});
