const PORT = process.env.port || 3400
const express = require('express')
const ejs = require('ejs')
const bodyParser = require('body-parser')
const Twit = require("twit")
const app = express()
const io = require('socket.io')(app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`)
}))

// TWITTER

const T = new Twit({
  consumer_key:         'SECRET',
  consumer_secret:      'SECRET',
  access_token:         'SECRET',
  access_token_secret:  'SECRET',
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})

let params = {
  track: ["upside down", "speed up"]
  // track: ["upside down", "firball", "speed up", "bullet"],
}

const stream = T.stream('statuses/filter', params)

stream.on('tweet', tweet => {
  tweet.text = tweet.extended_tweet ? tweet.extended_tweet.full_text : tweet.text
  if (tweet.text.toLowerCase().includes("upside down")) {
    io.emit("tweet", tweet.user.name, tweet.user.profile_image_url_https, tweet.text, "upside down")
    console.log("upside down");
  } else if (tweet.text.toLowerCase().includes("speed up")) {
    game.requestSpeedChange = true
    io.emit("tweet", tweet.user.name, tweet.user.profile_image_url_https, tweet.text, "speed up")
    console.log("speed up");
  }
})

stream.stop()


// GAME

let connectCounter = 0

let game = {
  speed: 5000,
  requestSpeedChange: false,
  inProgress: false,
  playerAmount: 0,
  playersAlive: 0,
  players: {},
  rng : function (){
    return Math.floor(Math.random() * Math.floor(65));
  },
  generateObstaclePos : function (){
    stream.start()
    gameTimer = setInterval(this.generateObstaclePosTwo, game.speed)
  },
  generateObstaclePosTwo : function (){
    console.log('run generateObstaclePosTwo')
    if (game.requestSpeedChange) {
      console.log(game.speed);
      game.requestSpeedChange = false
      game.speed = game.speed / 1.2
      clearInterval(gameTimer)
      io.emit("speedUp", game.speed)
      gameTimer = setInterval(game.generateObstaclePosTwo, game.speed)
      console.log(game.speed);
    }
    io.emit("obstaclePosish", game.rng())
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

function reset() {
  console.log("RESET");
  stream.stop()
  game.inProgress = false;
  game.speed = 5000
  game.playerAmount = 0;
  game.playersAlive = 0;
  game.players = {};
  if (gameTimer) {
    clearInterval(gameTimer)
  }
  io.emit("speedUp", game.speed)
}

io.on('connection', (socket) => {
  socket.emit("status", socket.id, game.inProgress, game.playerAmount)
  connectCounter++;
  console.log("user amount " + connectCounter);

  socket.on("initiate game", () => {
    io.emit('countdown');
    setTimeout(() => {
      console.log("initiate Game");
      game.generateObstaclePos()
      game.inProgress = true
    }, 6000)
  })

  socket.on("colorPick", (color) => {
    game.players[socket.id].color = color
    io.emit("colorChange", socket.id, color)
  })

  socket.on("join", (color, userName) => {
    game.playerAmount++
    game.playersAlive++
    console.log("playerAmount = " + game.playerAmount);
    game.players[socket.id] = {
      alive: true,
      userName: userName ? userName : socket.id
    }
    io.emit("newPlayer", socket.id, color)
  })

  socket.on("playerUpdate", (yPos) => {
    if (game.inProgress) {
      socket.broadcast.emit("enemyUpdate", socket.id, yPos)
    }
  })

  socket.on("playerDied", () => {
    console.log(socket.id + " DIED");
    if (game.players[socket.id]) {
      game.players[socket.id].alive = false
    }
    game.playersAlive--
    console.log("players Alive = " + game.playersAlive);
    if (game.playersAlive === 1) {
      console.log("EEN SPELER OVER");
      Object.entries(game.players).forEach(player => {
        console.log(player[1])
        if(player[1].alive) {
          reset()
          io.emit("winner", player[1].userName)
        }
      })
    }
    socket.broadcast.emit("enemyUpdate", socket.id, yPos="dead")
  })

  socket.on('disconnect', () => {
    connectCounter--;
    console.log(connectCounter);
    if (connectCounter === 0 ) {
      reset()
    }
  });
});
