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
var lastDrawnPlayersGame = null;
function refreshGame() {
    $.get("/api/game/" + gameID + "?player_name=" + playerName, function (game) {
        if (!isSameGame(game)) {
            lastDrawnGame = game;
            drawGameState(game)
        }

        if (!isSameGamePlayers(game)) {
            lastDrawnPlayersGame = game;
            drawPlayers(game)
        }
    });
}

function drawGameState(game) {
    var dealerName = game.players[game.dealer_index].name;
    var isDealer = dealerName == playerName;

    switch (game.game_state) {
        case "dealer_choose_card":
            if (isDealer) {
                var definitionOptionsHTML = drawDefinitionOptions(game.definition_options);
                setupMainCard("Elegí una carta!", "De las opciones, elegí la que más desconocida te parezca, para hacer el juego más divertido.", definitionOptionsHTML);
            } else {
                setupMainCard("Eligiendo la carta...", "<strong>" + dealerName + "</strong> será dealer esta ronda. Está eligiendo una palabra entre las opciones.", "");
            }
            break;
        case "write_definitions":
            if (isDealer) {
                setupMainCard("Los jugadores están escribiendo definiciones de  <strong>" + game.current_card.word + "</strong>", "Por ahora, tienen todo el tiempo que necesiten.");
            } else {
                var writeDefinition = drawDefinitionInput(game.current_card.word)
                setupMainCard("Escribí la definición de: <strong>" + game.current_card.word + "</strong>", "Tomate tu tiempo, hacelo verosimil y cuida la ortografía. Te recomendamos empezar con mayúsculas, terminar con puntos y completar las tildes.", writeDefinition);
            }
            break;
        case "show_definitions":
            if (isDealer) {
                selectCorrectDefinitionsHTML = drawSelectCorrectCards(game);
                setupMainCard("Selecciona las definiciones correctas:", "Selecciona las tarjetas que consideres correctas, considerando la definición real de la palabra:",selectCorrectDefinitionsHTML);
            } else {
                setupMainCard("<strong>" + dealerName + "</strong> está eligiendo las definiciones acertadas","Para evitar tarjetas repetidas y repartir los puntos correspondientes.");
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

function isSameGame(game) {
    return lastDrawnGame != null &&
        arraysEqual(game.players, lastDrawnGame.players) &&
        game.game_state == lastDrawnGame.game_state;
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

function drawDefinitionInput(word) {
    return `
    <div class="row">
        <div class="input-field col m12">
          <input id="wordDefinitionInput" type="text" class="validate">
          <label for="wordDefinitionInput">Definición</label>
        </div>
        <a class="waves-effect waves-light orange btn" onclick="uploadDefinition(\``+ word + `\`)">Subir definición</a>
    </div>
    `
}

function drawSelectCorrectCards(game) {
    console.log("X:",game)
    html = `
    <div class="row">
        <!-- Real definition -->
        <h5>Definición correcta:</h5>
        <div class="row">
        <div class="col m4">
            <div class="card green">
            <div class="card-content white-text">
                <span class="card-title">`+ game.current_card.word + `</span>
                <p>`+ game.current_card.definition + `</p>
            </div>
            </div>
        </div>
        </div>
        <h5>Definiciones de jugadores:</h5>
        <div class="row">
    `

    game.all_definitions.forEach(function (definition, index) {
        if(!definition.is_real){
            html +=`
            <div class="col m4">
                <div class="card blue lighten-1">
                <div class="card-content white-text">
                    <span class="card-title">`+ game.current_card.word + `</span>
                    <p>`+ definition.definition + `</p>
                </div>
                <div class="card-action">
                    <div class="switch">
                    <label class="white-text">Incorrecta<input type="checkbox" value="`+definition.id+`" class="isCorrectDefinition">
                    <span class="lever"></span>Correcta</label>
                    </div>
                </div>
                </div>
            </div>
        `
        }
    });
    html += `</div>
        <button onclick="postCorrectDefinitions()" class="btn waves-effect waves-light orange" type="submit" name="action">Listo
        <i class="material-icons right">send</i>
        </button>
    </div>`

    return html;
}

// ***************************************************
// ********** GAME COMPONENT BEHAVIORS ***************
// ***************************************************

function selectDefinitionOption(selectedWord) {
    $.post("/api/game/" + gameID + "/setup_option/" + selectedWord + "?player_name=" + playerName, function () {
        setupMainCard("", "", "");
    });
}

function uploadDefinition(word) {
    var url = "/api/game/" + gameID + "/player_definition?player_name=" + playerName;
    var defVal = $("#wordDefinitionInput").val();
    var definition = { definition: defVal };
    $.post(url, JSON.stringify(definition)).done(function () {
        setupMainCard("Definicion cargada!", "Estamos esperando que el resto de los jugadores complete sus definiciones...<br><br><strong>" + word + "</strong>: " + defVal, "");
    });
}

function postCorrectDefinitions(){
    var correctDefinitionIDs = [];
    $(".isCorrectDefinition").each(function() {
        if($(this).is(":checked")){
            correctDefinitionIDs.push($(this).val());
        }
    });

    var url = "/api/game/" + gameID + "/correct_definitions?player_name=" + playerName;
    var definition = { correct_definitions: correctDefinitionIDs };
    $.post(url, JSON.stringify(definition)).done(function () {
        console.log("OK, now show definitions to everybody else to choose one")
    });
}

// *******************************************
// ************** DRAW PLAYERS ***************
// *******************************************
function drawPlayers(game) {
    var html = "";
    html = `<div class="row">`

    game.players.forEach(function (player, index) {
        var imageClass = "avatar-image-normal";
        if (player.name == game.players[game.dealer_index].name) {
            imageClass = "avatar-image-dealer";
        } else if (game.game_state == "write_definitions" && playerIsInArray(player.name, game.fake_definitions)) {
            imageClass = "avatar-image-def-completed";
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

function playerIsInArray(nameKey, definitions) {
    var playerFound = false;
    definitions.forEach(function (definition) {
        if (definition.player == nameKey) {
            playerFound = true;
        }
    });
    return playerFound;
}

function isSameGamePlayers(game) {
    return lastDrawnPlayersGame != null &&
        game.dealer_index == lastDrawnPlayersGame.dealer_index &&
        arraysEqual(game.players, lastDrawnPlayersGame.players) &&
        arraysEqual(game.fake_definitions, lastDrawnPlayersGame.fake_definitions) &&
        arraysEqual(game.all_definitions, lastDrawnPlayersGame.all_definitions);
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


function arraysEqual(a, b) {
    return JSON.stringify(a)==JSON.stringify(b);
}