const socket = io();

const startButton = document.getElementById("startButton")
const counter = document.getElementById("counter")
const obstacle = document.getElementById("obstacle")
const joinPopup = document.querySelector(".joinPopup")
const joinButton = document.getElementById("join")
const playerContainer = document.getElementById("players")
const colorPopup = document.getElementById("colorPopup")
const userNameInput = document.getElementById("setUserName")

let id = ""
let inGame = false
let gameSpeed = 5000

socket.on("status", (SocketID, progress) => {
  id = SocketID
  if (progress) {
    counter.innerHTML = "there is already a game in progress. Please wait a few seconds/minutes"
    startButton.classList.add("none")
  }
})

startButton.addEventListener("click", () => {
  socket.emit("initiate game")
  startButton.classList.add("none")
})

joinButton.addEventListener("click", () => {
  joinPopup.classList.add("none")
  colorPopup.classList.remove("none")
})

document.querySelectorAll(".grid div").forEach(color => {
  color.style.background = color.id
  color.addEventListener("click", (e) => {
    colorPopup.classList.add("none")
    socket.emit("join", e.target.id, userNameInput.value)
  })
})

socket.on("newPlayer", (newPlayerId, color) => {
  if (!document.getElementById(newPlayerId)) {
    playerContainer.innerHTML += `<div id="${newPlayerId}" style="background-color:${color}"></div>`
    if (newPlayerId === id && document.getElementById(id)) {
      document.getElementById(id).style.zIndex = "6"
      inGame = true
      playGame()
    }
  }
})

socket.on("enemyUpdate", (enemyId, enemyPosish) => {
  let enemyPlayer = document.getElementById(enemyId)
  if (enemyPosish === "dead") {
    enemyPlayer.style.opacity = `0`
    notify(enemyId)
  } else {
    enemyPlayer.style.transform = `translateY(-${enemyPosish}vh)`
  }
})

socket.on("tweet", (user, image, tweet, effect, speed) => {
  console.log(effect);
  document.querySelector(".tweet b").innerHTML = user
  document.querySelector(".tweet img").src = image
  document.querySelector(".tweet p").innerHTML = tweet
  if (effect === "upside down") {
    upsideDown = !upsideDown
  }
})

socket.on("speedUp", speed => {
  gameSpeed = speed
  document.body.style.setProperty('--gameSpeed', `${gameSpeed}ms`)
})

function notify(enemyId){
  console.log(`${enemyId} Died`)
}

socket.on("countdown", () => {
  startButton.classList.add("none")
  joinPopup.classList.remove("none")
  let count = 11
  const countDown = setInterval(() => {
    count--
    counter.innerHTML = count
    if (count === 0) {
      counter.innerHTML = ""
      clearInterval(countDown);
      socket.emit("start")
      obstacle.classList.add("start")
      joinPopup.classList.add("none")
    }
  }, gameSpeed / 5);
})

// GAME

let alive = false
let upsideDown = false

function playGame(){
  if (inGame) {
    alive = true
    upsideDown = false
    gameSpeed = 5000
    const field = document.getElementById("field")
    const safeSpace = document.querySelector(".safe")
    const obsTop = document.querySelector(".top")
    const obsBottom = document.querySelector(".bottom")
    const winner = document.getElementById("winner")
    let yPos = 0

    const interval = setInterval(() => {
      yPos = upsideDown ? yPos + 3 : yPos - 3
      yPosCheck()
    }, gameSpeed / 25);

    field.addEventListener("click", manipulatePos)
    document.body.addEventListener("keydown", spaceBar)

    function spaceBar(e) {
      if(e.which === 32 || e.which === 38) {
        manipulatePos()
      }
    }

    function manipulatePos() {
      if(alive) {
        yPos = upsideDown ? yPos - 10 : yPos + 10
        yPosCheck()
      }
    }

    function yPosCheck() {
      if(yPos >= 75){
        yPos = 75
      } else if(yPos <= 0){
        yPos = 0
      }
      if (document.getElementById(id)) {
        document.getElementById(id).style.transform = `translateY(-${yPos}vh)`
        socket.emit("playerUpdate", yPos)
      }
    }

    function checkCollish(){
      let player = document.getElementById(id)
      playerPos = [player.getBoundingClientRect().top, player.getBoundingClientRect().bottom]
      rngPos = [safeSpace.getBoundingClientRect().top, safeSpace.getBoundingClientRect().bottom]
      if (playerPos[0] < rngPos[0] || playerPos[1] > rngPos[1]) {
        alive = false
        clearInterval(interval)
        socket.emit("playerDied")
        document.getElementById(id).style.opacity = `0`
      }
    }

    socket.on("obstaclePosish", rng => {
      obstacle.classList.remove("start")
      // From: https://css-tricks.com/restart-css-animation/
      void obstacle.offsetWidth;
      obstacle.classList.add("start")
      obsTop.style.height = `${65 - rng}vh`
      obsBottom.style.height = `${rng}vh`
      safeSpace.setAttribute("style", `transform: translateY(-${rng}vh)`)
      let checkingCollish = setTimeout(() => {
        let i = 0
        let microTimer = setInterval(() => {
          i += (gameSpeed / 50)
          if(i < (gameSpeed / 6.25)){
            if (alive) {
              console.log("checking Collish");
              checkCollish()
            }
          } if ( i === (gameSpeed / 5)) {
            clearInterval(microTimer)
            clearTimeout(checkingCollish)
          }
        }, gameSpeed / 50)
      }, gameSpeed / 1.25)
    })

    socket.on("winner", winnerID => {
      setTimeout(() => {
        console.log("winner");
        safeSpace.setAttribute("style", `transform: translateY(-${0}vh)`)
        field.removeEventListener("click", manipulatePos, true)
        field.removeEventListener("keydown", spaceBar, true)
        playerContainer.innerHTML = ""
        startButton.classList.add("none")
        obstacle.classList.remove("start")
        startButton.classList.remove("none")
        winner.innerHTML = `${winnerID} won the game`;
        winner.classList.remove("none")
        upsideDown = false
        inGame = false
        clearInterval(interval);
        playGame()
        setTimeout(() => {
          console.log("winner - fade out");
          winner.classList.add("none")
        }, gameSpeed / 2.5)
      }, gameSpeed / 5)
    })
  } else {
    return
  }
}
