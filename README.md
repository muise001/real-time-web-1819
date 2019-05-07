# Real-Time Web @cmda-minor-web · 2018-2019

Ken je Flappy Bird nog? De app die in september 2013 viral ging en honderden miljoenen keren is gedownload. In mijn ogen was het spel de helft van de lol. Het grootste gedeelte was het opscheppen over je hoge score.

Wat ik in 2013 miste was een multiplayer. Die heb ik - weliswaar 6 jaar later - gemaakt.

## De App
![Flappy Bird gif](https://github.com/muise001/real-time-web-1819/blob/master/flappy.gif)

### Het Proces
1. Als eerste heb ik de mechanic gemaakt van het balletje / vogeltje en de animatie van de muur.
    - Dit heb ik gemaakt in [Codepen](https://codepen.io/muise001/pen/BEpyvL)
2. Daarna heb ik collition-detection toegevoegd om te kijken of ze botsen.
3. Daarna heb ik ervoor gezorgd dat er meerdere mensen het spel konden spelen
4. Hierna heb ik Twitter gekoppeld en ervoor gezorgd dat tweets zichtbaar worden
5. Daarna heb ik ervoor gezorgd dat de tweets die real-time binnenkomen invloed hebben op het spel

### Socket.broadcast.emit
Om de app real-time te maken heb ik [socket.io](socket.io) gebruikt. Deze library zorgt ervoor dat er een real-time connectie wordt gemaakt tussen de Server-side javascript en de Client-side javascript. Het krachtige van Socket.io is dat het heel makkelijk te begrijpen is. Ik geef een voorbeeld uit mijn app. 

1. Vanuit de Client wordt elke 200ms de locatie van jou "bird" verstuurd naar de server.
    - `socket.emit("playerUpdate", yPos)`
2. De Server pakt jou positie en stuurt die terug naar alle andere spelers
  ```javascript
  socket.on("playerUpdate", (yPos) => {
    socket.broadcast.emit("enemyUpdate", socket.id, yPos)
  })
  ```
3. De Client weet welke "bird" hij moet updaten en doet dat  
``` javascript
socket.on("enemyUpdate", (enemyId, enemyPosish, alive, amount) => {
  let enemyPlayer = document.getElementById(enemyId)
  enemyPlayer.style.transform = `translateY(-${enemyPosish}vh)`
})
```

#### Aantal server-side socket functies

- `io.on('connection')`
    - checkt of er een nieuwe verbinding is en triggert
    - `socket.emit("status", socket.id, game.inProgress, game.playerAmount))`
      - Geeft direct de status door aan mensen die de site bezoeken. Hierdoor kunnen zij wel of niet meteen meespelen
- `socket.on("initiate game")`
    - Wacht tot een game wordt ge-initieerd en stuurt reactie naar alle bezoekers
    - `io.emit('countdown');`
- `socket.on("join", color, username))`
    - Wacht toe je een kleur (en eventueel een username) hebt gekozen voor je "bird". en triggert
    - `io.emit("newPlayer", socket.id, color)` om iedereen up-to-date te kunnen houden
- `socket.on("playerUpdate", (yPos))`


- _Deal with real-time complexity_
- _Handle real-time client-server interaction_
- _Handle real-time data management_
- _Handle multi-user support_

[Rubric][rubric]

## Curriculum

### Week 1 - Hello Server

Goal: Build and deploy a unique barebone real-time app  

[Exercises](https://github.com/cmda-minor-web/real-time-web-1819/blob/master/week-1.md)    
[Slides](https://docs.google.com/presentation/d/1EVsEFgBnG699nce058ss_PkVJROQXDp5wJJ-IRXvzTA/edit?usp=sharing)  


### Week 2 - Sharing is caring  

Goal: Store, manipulate and share data between server-client   

[Exercises](https://github.com/cmda-minor-web/real-time-web-1819/blob/master/week-2.md)    
[Slides](https://docs.google.com/presentation/d/1woKoY59D8Zcttna0FzfNjEtGtT8oXWi9b5LYlukRISM/edit?usp=sharing)


### Week 3 - Let’s take this show on the road 

Goal: Handle data sharing and multi-user support 

[Exercises](https://github.com/cmda-minor-web/real-time-web-1819/blob/master/week-3.md)  
[Slides](https://docs.google.com/presentation/d/1SHofRYg87bhdqhv7DQb_HZMbW7Iq1PtqxpdtZHMbMmk/edit?usp=sharing)

> If you're seeing this message on a forked repo, it means one of our students hasn't changed the description yet 😈

<!-- Add a link to your live demo in Github Pages 🌐-->

<!-- ☝️ replace this description with a description of your own work -->

<!-- Add a nice image here at the end of the week, showing off your shiny frontend 📸 -->

<!-- Maybe a table of contents here? 📚 -->

<!-- How about a section that describes how to install this project? 🤓 -->

<!-- ...but how does one use this project? What are its features 🤔 -->

<!-- What external data source is featured in your project and what are its properties 🌠 -->

<!-- This would be a good place for your data life cycle ♻️-->

<!-- Maybe a checklist of done stuff and stuff still on your wishlist? ✅ -->

<!-- How about a license here? 📜 (or is it a licence?) 🤷 -->

[rubric]: https://docs.google.com/spreadsheets/d/e/2PACX-1vSd1I4ma8R5mtVMyrbp6PA2qEInWiOialK9Fr2orD3afUBqOyvTg_JaQZ6-P4YGURI-eA7PoHT8TRge/pubhtml
