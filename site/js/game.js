var gameID;
var playerName;

$(document).ready(function () {
    var result = atob(getUrlParameter("m")).split("@|@");
    gameID = result[0];
    playerName = result[1];

    $("#gameID").text(gameID);

    refreshGame();
    setInterval(refreshGame, 3000);
});

var lastDrawnGame = null;
function refreshGame() {
    $.get("/api/game/" + gameID + "?player_name=" + playerName, function (game) {
        if (lastDrawnGame != null && isSameGame(game, lastDrawnGame)) {
            return;
        }
        lastDrawnGame = game;
        drawGameState(game)
    });
}

function drawGameState(game) {
    var dealerName = game.players[game.dealer_index].name;
    var isDealer = dealerName == playerName;
    drawPlayers(game);

    switch (game.game_state) {
        case "dealer_choose_card":
            if (isDealer) {
                var definitionOptionsHTML = drawDefinitionOptions(game.definition_options);
                setupMainCard("Elegí una carta!", "De las opciones, elegí la que más desconocida te parezca, para hacer el juego más divertido.", definitionOptionsHTML);
            } else {
                setupMainCard("Eligiendo la carta...", "<strong>" + dealerName + "</strong> será dealer esta ronda. Está eligiendo la carta entre las opciones.", "");
            }
            break;
        case "write_definitions":
            console.log(game);
            if (isDealer) {
                setupMainCard("Los jugadores están escribiendo definiciones de  <strong>" + game.current_card.word + "</strong>", "Por ahora, tienen todo el tiempo que necesiten.");
            } else {
                var writeDefinition = drawDefinitionInput()
                setupMainCard("Escribí la definición de: <strong>" + game.current_card.word + "</strong>", "Tomate tu tiempo, hacelo verosimil y cuida la ortografía. Te recomendamos empezar con mayúsculas, terminar con puntos y completar las tildes.", writeDefinition);
            }
            break;
        default:
            console.log("Draw state not supported:", game)
    }

}

function setupMainCard(title, text, divHTML) {
    $("#mainCardTitle").html(title);
    $("#mainCardText").html(text);
    $("#mainCardDiv").html(divHTML);
}

function isSameGame(game, checkLastDrawnGame) {
    return game.players != null && checkLastDrawnGame.players != null &&
        game.players.length == checkLastDrawnGame.players.length &&
        game.game_state == checkLastDrawnGame.game_state;
}

// ***************************************************
// ************** DRAW GAME COMPONENTS ***************
// ***************************************************

function drawDefinitionOptions(definition_options) {
    var html = `<div class="row">`;
    definition_options.forEach(function (definition, index) {
        html += drawWordDefinitionCard(definition.word, definition.definition);
    });
    html += `</div>`;
    return html;
}

function drawWordDefinitionCard(word, definition) {
    return `
    <div class="col m4">
      <div class="card blue-grey darken-1">
        <div class="card-content white-text">
          <span class="card-title">`+ word + `</span>
          <p>`+ definition + `</p>
        </div>
        <div class="card-action">
        <a class="waves-effect waves-light orange btn" onclick="selectDefinitionOption(\``+ word + `\`)">Elegir</a>
        </div>
        </div>
    </div>
    `;
}

function drawDefinitionInput(){
    return `
    <div class="row">
        <div class="input-field col m12">
          <input id="wordDefinitionInput" type="text" class="validate">
          <label for="wordDefinitionInput">Definición</label>
        </div>
    </div>
    `
}

// ***************************************************
// ********** GAME COMPONENT BEHAVIORS ***************
// ***************************************************

function selectDefinitionOption(selectedWord) {
    $.post("/api/game/" + gameID + "/setup_option/" + selectedWord + "?player_name=" + playerName, function (game) {
        if (isSameGame(game, lastDrawnGame)) {
            return;
        }
        setupMainCard("", "", "");
    });
}

// *******************************************
// ************** DRAW PLAYERS ***************
// *******************************************
var lastDrawnPlayers = null;
function drawPlayers(game) {
    if (isSameGamePlayers(game, lastDrawnPlayers)) {
        return
    }
    lastDrawnPlayers = game;
    var html = "";
    html = `<div class="row">`

    game.players.forEach(function (player, index) {
        var imageClass = "avatar-image-normal";
        if (player.name == game.players[game.dealer_index].name) {
            imageClass = "avatar-image-dealer";
        }
        html += `
    <div class="row" style="margin-bottom:0em;">
        <div class="col s12 m7">
        <div class="card">
            <div class="card-image">
            <img class="avatarImg `+ imageClass + `" src="https://robohash.org/` + player.name + `.png">
            <span class="player-name-card card-title">` + player.name + `</span>
            </div>      
        </div>
        </div>
    </div>
`
    });

    $("#gamePlayers").html(html);
}

function isSameGamePlayers(game, lastDrawnPlayers) {
    return lastDrawnPlayers != null && game.players.length == lastDrawnPlayers.players.length
        && game.dealer_index == lastDrawnPlayers.dealer_index;
}



// *******************************************
// ***************** UTILS *******************
// *******************************************
var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};
