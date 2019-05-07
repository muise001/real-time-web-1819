# Real-Time Web @cmda-minor-web · 2018-2019

Ken je Flappy Bird nog? De app die in september 2013 viral ging en honderden miljoenen keren is gedownload. In mijn ogen was het spel de helft van de lol. Het grootste gedeelte was het opscheppen over je hoge score.

Wat ik in 2013 miste was een multiplayer. Die heb ik - weliswaar 6 jaar later - gemaakt. 

### Het Proces
1. Als eerste heb ik de mechanic gemaakt van het balletje / vogeltje en de animatie van de muur.
    - Dit heb ik gemaakt in [Codepen](https://codepen.io/muise001/pen/BEpyvL)
2. Daarna heb ik collition-detection toegevoegd om te kijken of je "bird" botst tegen de muur.
3. Daarna heb ik ervoor gezorgd dat er meerdere mensen het spel konden spelen
4. Hierna heb ik Twitter gekoppeld en ervoor gezorgd dat tweets zichtbaar worden
5. Daarna heb ik ervoor gezorgd dat de tweets die real-time binnenkomen invloed hebben op het spel

## De App
![Flappy Bird gif](https://github.com/muise001/real-time-web-1819/blob/master/flappy.gif)

Wat kan mijn Flappy Bird wat jou Flappy Bird niet kan?
Mijn flappy bird is ge-connect met [Twit](https://www.npmjs.com/package/twit). Twit is een Real-time socket-based stream API. Aan deze API kan je kriteria meegeven en dan houdt hij bij of er op dat moment die woorden of vanuit een bepaalde plaats etc. wordt getweet. Deze tweets kan je dat ophalen.

Ik zoek zelf op de woorden 
    - "Upside Down"
        - Zorgt ervoor dat de zwaartekracht van beneden naar boven verandert, of van boven naar beneden
    - "Speed Up"
        - Zorgt ervoor dat het spel sneller gaat.

##### Not so fun fact
Aangezien mijn app van een "hard-coded" spel-snelheid was voorzien (5000ms), was het heel lastig om ervoor te zorgen dat bij "speed up" ook daadwerkelijk de snelheid verandert. Uiteraard was het heel makkelijk om een variabele aan te maken in de Server-side JS, Client Side JS en CSS..... Maar ik werkte ook veel met andere waardes zoals 100ms, 6000ms, 2000ms, etc. Dit maakte het een tikkeltje lastiger. Uiteindelijk heb ik in de Server en Client alles kunnen omschrijven naar één variabele. Die vaak gedeeld (`/`) werd om zo de andere waardes te bereiken.

De grootste moeilijkheid zat hem in de CSS Animatie. CSS vind het namelijk niet zo leuk als jij mid-animatie opeens zegt dat hij langer of korter moet duren. Hierdoor ontstond een ontzettende hapering en liep m'n spel in de soep. Toen leek het mij een slim idee om, als er een tweet binnen kwam met "speed up" erin, dan te wachten tot de animatie klaar was met afspelen, zodat hij z'n huidige animatie kon afmaken en z'n nieuwe animatie met een hoger tempo te starten. 

Zo gezegd, zo gedaan :
```javascript
else if (tweet.text.toLowerCase().includes("speed up")) {
  game.requestSpeedChange = true
})    
```

*Dit werkte niet..... Maar eehm.. Op papier werkte het vet goed.. Maarja... ehm internet?....* <br/>
Uiteindelijk is [css-tricks](https://css-tricks.com/restart-css-animation/) zo lief geweest om het antwoord te geven op mijn verschikkelijke bug.

```javascript
  obstacle.classList.remove("start")
  void obstacle.offsetWidth; // From: https://css-tricks.com/restart-css-animation/
  obstacle.classList.add("start")
```

Het weghalen en weer toevoegen van de Class leek mij in de eerste instantie genoeg om ervoor te zorgen dat hij herstart zou woren. Helaas was dit niet waar. Gelukkig heeft `void obstacle.offsetWidth;` mij geholpen om de hapering uit de animatie te halen. Dit was mijn aller ergste bug.

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
    - Ontvangt jou huidige positie en stuurt die door naar alle andere gebruikers door :
    - `socket.broadcast.emit("enemyUpdate", socket.id, yPos)`
- `io.emit("obstaclePosish", game.rng())` 
    - Geeft de coordinaten van de muur door aan elke client, zodat elke client in hetzelfde level speelt
- `socket.on("playerDied")`
    - Deze functie wordt actief als er een speler "game-over" raakt. Deze functie kijkt naar twee dingen. 
    1. Zijn er nog meer dan 1 andere spelers over?
        - `socket.broadcast.emit("enemyUpdate", socket.id, yPos="dead", game.playersAlive, game.playerAmount)`
    2. Is er nog maar één vliegende bird?
        - `io.emit("winner", player[1].userName)`
- `socket.on('disconnect')`
    - Verbreekt connectie met die client. Deze functie houdt ook bij hoeveel spelers er "online" zijn

#### Aantal server-side socket functies op basis van Twitter

- `stream.on('tweet', tweet)`
    - Kijkt of er een tweet binnen is gekomen (die binnen mijn kriteria valt). Triggert:
    - `io.emit("tweet", tweet.user.name, tweet.user.profile_image_url_https, tweet.text, "upside down")` of
    - `io.emit("tweet", tweet.user.name, tweet.user.profile_image_url_https, tweet.text, "speed up")`


> If you're seeing this message on a forked repo, it means one of our students hasn't changed the description yet 😈

<!-- Add a link to your live demo in Github Pages 🌐-->

 ✅ <!-- ☝️ replace this description with a description of your own work -->

 ✅ <!-- Add a nice image here at the end of the week, showing off your shiny frontend 📸 -->

<!-- Maybe a table of contents here? 📚 -->

<!-- How about a section that describes how to install this project? 🤓 -->

 ✅ <!-- ...but how does one use this project? What are its features 🤔 -->

 ✅ <!-- What external data source is featured in your project and what are its properties 🌠 -->

<!-- This would be a good place for your data life cycle ♻️-->

<!-- Maybe a checklist of done stuff and stuff still on your wishlist? ✅ -->

<!-- How about a license here? 📜 (or is it a licence?) 🤷 -->

[rubric]: https://docs.google.com/spreadsheets/d/e/2PACX-1vSd1I4ma8R5mtVMyrbp6PA2qEInWiOialK9Fr2orD3afUBqOyvTg_JaQZ6-P4YGURI-eA7PoHT8TRge/pubhtml
