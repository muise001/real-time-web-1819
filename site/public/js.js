const socket = io();

const startButton = document.getElementById("startButton")
const counter = document.getElementById("counter")
const obstacle = document.getElementById("obstacle")
const joinPopup = document.querySelector(".joinPopup")
const joinButton = document.getElementById("join")
const playerContainer = document.getElementById("players")
const colorPopup = document.getElementById("colorPopup")

let id = ""
let inGame = false

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
  document.querySelectorAll(".grid div").forEach(color => {
    color.style.background = color.id
    color.addEventListener("click", (e) => {
      colorPopup.classList.add("none")
      socket.emit("join", e.target.id)
    })
  })
})

socket.on("newPlayer", (newPlayerId, color) => {
  playerContainer.innerHTML += `<div id="${newPlayerId}" style="background-color:${color}"></div>`
  console.log(playerContainer)
  if (newPlayerId === id ) {
    inGame = true
    playGame(id)
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
  }, 1000);
})

// GAME

let alive = false

function playGame(myID){
  if (inGame) {
    alive = true
    const field = document.getElementById("field")
    const safeSpace = document.querySelector(".safe")
    const obsTop = document.querySelector(".top")
    const obsBottom = document.querySelector(".bottom")
    let yPos = 0

    const interval = setInterval(() => {
      yPos -= 3
      yPosCheck()
    }, 200);

    field.addEventListener("click", manipulatePos)

    function manipulatePos() {
      if(alive) {
        yPos += 10
        yPosCheck()
      }
    }

    function yPosCheck() {
      if(yPos >= 75){
        yPos = 75
      } else if(yPos <= 0){
        yPos = 0
      }
      document.querySelector(`#players > #${id}`).style.transform = `translateY(-${yPos}vh)`
      socket.emit("playerUpdate", yPos)
    }

    function checkCollish(){
      let player = document.querySelector(`#players > #${id}`)
      playerPos = [player.getBoundingClientRect().top, player.getBoundingClientRect().bottom]
      rngPos = [safeSpace.getBoundingClientRect().top, safeSpace.getBoundingClientRect().bottom]
      if (playerPos[0] < rngPos[0] || playerPos[1] > rngPos[1]) {
        alive = false
        clearInterval(interval)
        socket.emit("playerDied")
        document.querySelector(`#players > #${id}`).style.opacity = `0`
      }
    }

    socket.on("obstaclePosish", rng => {
      console.log(rng);
      obsTop.style.height = `${65 - rng}vh`
      obsBottom.style.height = `${rng}vh`
      console.log(obsBottom);
      safeSpace.setAttribute("style", `transform: translateY(-${rng}vh)`)
      setTimeout(() => {
        let i = 0
        let microTimer = setInterval(() => {
          i += 100
          if(i < 800){
            if (alive) {
              checkCollish()
            }
          } if ( i === 1000 ) {
            clearInterval(microTimer)
          }
        }, 100)
      }, 4000)
    })

    socket.on("winner", winnerID => {
      setTimeout(() => {
        console.log(winnerID + " won the game")
        safeSpace.setAttribute("style", `transform: translateY(-${0}vh)`)
        field.removeEventListener("click", manipulatePos, true)
        playerContainer.innerHTML = ""
        startButton.classList.add("none")
        obstacle.classList.remove("start")
        startButton.classList.remove("none")
        inGame = false
        clearInterval(interval);
        playGame()
      }, 1000)
    })
  } else {
    return
  }
}
