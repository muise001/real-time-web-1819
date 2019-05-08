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
![Flappy Bird gif](https://github.com/muise001/real-time-web-1819/blob/master/img/flappy.gif)

[Klik hier om zelf Flappy Bird te spelen](https://bt-abavlgcoci.now.sh/)

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

## Socket.broadcast.emit
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

### Aantal server-side socket functies

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

### Aantal server-side socket functies op basis van Twitter

- `stream.on('tweet', tweet)`
    - Kijkt of er een tweet binnen is gekomen (die binnen mijn kriteria valt). Triggert:
    - `io.emit("tweet", tweet.user.name, tweet.user.profile_image_url_https, tweet.text, "upside down")` of
    - `io.emit("tweet", tweet.user.name, tweet.user.profile_image_url_https, tweet.text, "speed up")`

## Data-model
![Datamodel](https://github.com/muise001/real-time-web-1819/blob/master/img/datamodel.png)

## How to install

1. Clone of download deze Repo.
2. Open terminal and schrijf `cd ../[MYDIR]/flappyBird` (ipv [MYDUR] exact het path schrijven naar de geclonede of gedownloade map)
3. Klik op enter.
4. schrijf in terminal `npm install`
5. Klaar met installeren? `npm start`
6. Veel plezier

TIP :

Installeer [NGROK](https://ngrok.com/) en maak je eigen server.
1. Open nog een terminal vensteren schrijf `npm install ngrok -g`
2. Daarna `ngrok http 3400`.
3. Deel de link met je vrienden

<!-- Maybe a checklist of done stuff and stuff still on your wishlist? ✅ -->
## Wishlist 

- [x] A working flappy bird
- [x] Multiplayer functionalities
- [x] Game gets manipulated by Twitter
- [ ] Game rooms and closed game rooms
