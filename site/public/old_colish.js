function checkCollish(){
  playerPos = [yPos, yPos + 5]
  console.log(playerPos, rngPos);
  if (playerPos[0] >= rngPos[0] && playerPos[1] <= rngPos[1]) {
    console.log("no hit");
  } else {
    console.log("you deaded");
  }
}

socket.on("obstaclePosish", (rng) => {
  safeSpace.setAttribute("style", `transform: translateY(-${rng}vh)`)
  rngPos = [rng, rng+15]
  setTimeout(() => {
    let i = 0
    let microTimer = setInterval(() => {
      i += 100
      if(i < 800){
        checkCollish()
      } if ( i === 1000 ) {
        clearInterval(microTimer)
      }

    }, 100)
  }, 4000)
})
