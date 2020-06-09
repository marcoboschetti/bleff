var gameID;
var playerName;
var m;

$(document).ready(function () {
    m = getUrlParameter("m")
    var result = atob(m).split("@|@");
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
        if (game.status == "finished") {
            window.location.replace("/site/page/endgame.html?m=" + m);
            return
        }

        if (!isSameGame(game)) {
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

    var isCardHidden = false;
    if (lastDrawnGame != null && lastDrawnGame.game_state != game.game_state) {
        hideMainCard();
        isCardHidden = true;
    }

    setTimeout(function () {

        lastDrawnGame = game;
        $("#mainCardLoadingBar").hide();

        switch (game.game_state) {
            case "dealer_choose_card":
                if (isDealer) {
                    var definitionOptionsHTML = drawDefinitionOptions(game.definition_options);
                    setupMainCard("Elegí una carta!", "De las opciones, elegí la que más desconocida te parezca, para hacer el juego más divertido.", definitionOptionsHTML);
                } else {
                    $("#mainCardLoadingBar").show();
                    setupMainCard("Eligiendo la carta...", "<strong>" + dealerName + "</strong> será dealer esta ronda. Está eligiendo una palabra entre las opciones.", "");
                }
                break;
            case "write_definitions":
                if (isDealer) {
                    $("#mainCardLoadingBar").show();
                    setupMainCard("Los jugadores están escribiendo definiciones de  <strong>" + game.current_card.word + "</strong>", "Tienen todo el tiempo que necesiten.");
                } else {
                    var writeDefinition = drawDefinitionInput(game.current_card.word)
                    setupMainCard("Escribí la definición de: <strong>" + game.current_card.word + "</strong>", "Tomate tu tiempo, hacelo verosimil y cuida la ortografía. Te recomendamos empezar con mayúsculas, terminar con puntos y completar las tildes.", writeDefinition);
                }
                break;
            case "show_definitions":
                if (isDealer) {
                    selectCorrectDefinitionsHTML = drawAdminAllCards(game, true, isDealer);
                    setupMainCard("Selecciona las definiciones correctas:", "Selecciona las tarjetas que consideres correctas, considerando la definición real de la palabra:", selectCorrectDefinitionsHTML);
                } else {
                    $("#mainCardLoadingBar").show();
                    setupMainCard("<strong>" + dealerName + "</strong> está eligiendo las definiciones acertadas", "Para evitar tarjetas repetidas y repartir los puntos correspondientes.");
                }
                break;
            case "choose_definitions":
                if (isDealer) {
                    $("#mainCardLoadingBar").show();
                    selectCorrectDefinitionsHTML = drawAdminAllCards(game, false, isDealer);
                    setupMainCard("Los jugadores están votando...", "", selectCorrectDefinitionsHTML);
                } else {
                    // Check if player had correct definition 
                    if (game.correct_definitions && game.correct_definitions.some(function (e) { return e.player == playerName; })) {
                        $("#mainCardLoadingBar").show();
                        setupMainCard("Tu definición es correcta!", "<strong>" + dealerName + "</strong> consideró tu definición como acertada. Ya se sumaron los puntos correspondientes.<br> El resto de los jugadores está votando las definiciones restantes...", "");
                    } else {
                        selectCorrectDefinitionsHTML = drawAdminAllCards(game, true, isDealer);
                        setupMainCard("Elegí la definición que creas correcta", "Selecciona la definición que creas más acertada!", selectCorrectDefinitionsHTML);
                    }
                }
                break;
            case "show_definitions_and_scores":
                if (isDealer) {
                    endGameHTML = drawEndGameHTML(game, true)
                    setupMainCard("Fin de la ronda", "Cuando quieras, terminá la ronda...", endGameHTML);
                } else {
                    $("#mainCardLoadingBar").show();
                    endGameHTML = drawEndGameHTML(game, false)
                    setupMainCard("Fin de la ronda", "Esperando que <strong>" + dealerName + "</strong> comience la siguiente ronda", endGameHTML);
                }
                break;
            default:
                console.log("Draw state not supported:", game)
        }

        if (isCardHidden) {
            showMainCard();
        }

    }, 500);

}

function hideMainCard() {
    $("#mainCard").addClass("scale-out");
    $("#mainCard").removeClass("scale-in");
}

function showMainCard() {
    $("#mainCard").removeClass("scale-out");
    $("#mainCard").addClass("scale-in");
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
    if (!definition_options) {
        return;
    }
    var html = `<div class="row">`;
    definition_options.forEach(function (definition, index) {
        html += drawWordDefinitionCard(definition.word, definition.definition);
        if ((index + 1) % 3 == 0) {
            html += `</div><div class="row">`;
        }
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
        <a class="waves-effect waves-light red btn" onclick="uploadDefinition(\``+ word + `\`)">Subir definición</a>
    </div>
    `
}

function drawAdminAllCards(game, isSelectable, isDealer) {
    html = "";
    if (isDealer) {
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
    } else {
        html = `
    <div class="row">
        <h5>Definiciones:</h5>
        <div class="row">
    `
    }

    game.all_definitions.forEach(function (definition, index) {
        if (!definition.is_real) {
            html += `
            <div class="col m4">
                <div class="card blue lighten-1">
                <div class="card-content white-text">
                    <span class="card-title">`+ game.current_card.word + `</span>
                    <p>`+ definition.definition + `</p>
                </div>
                `
            if (isSelectable && isDealer) {
                html += `
                <div class="card-action">
                    <div class="switch">
                    <label class="white-text">Incorrecta<input type="checkbox" value="`+ definition.id + `" class="isCorrectDefinition">
                    <span class="lever"></span>Correcta</label>
                    </div>
                </div>
                `
            }

            if (isSelectable && !isDealer) {
                html += `
                    <div class="card-action">
                        <button onclick="selectCorrectDefinition(\``+ definition.id + `\`)" class="btn waves-effect waves-light orange" type="submit" name="action">Elegir
                        <i class="material-icons right">send</i>
                        </button>
                    </div>
                    `
            }

            html += `
                </div>
            </div>
        `
        }
    });
    html += `</div>`

    if (isSelectable && isDealer) {
        html += `
        <button onclick="postCorrectDefinitions()" class="btn waves-effect waves-light orange" type="submit" name="action">Listo
        <i class="material-icons right">send</i>
        </button>
        `
    }


    html += `</div>`

    return html;
}


function drawEndGameHTML(game, isDealer) {

    var realDefinition;
    game.all_definitions.forEach(function (definition, index) {
        if (definition.is_real) {
            realDefinition = definition;
        }
    });

    var correctTotalVotes = getOccurrencesCount(game, realDefinition.id);
    var correctVotersList = "";
    if (correctTotalVotes > 0) {
        correctVotersList = " (" + getVotersNames(game, realDefinition.id) + ")";
    }

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
            <div class="card-content white-text">
                <p>Votos: `+ correctTotalVotes + correctVotersList + `</p><br>
            </div>
            </div>
        </div>
        `;

    game.correct_definitions.forEach(function (definition, index) {
        if (!definition.is_real) {
            var totalVotes = getOccurrencesCount(game, definition.id);
            var votersList = "";
            if (totalVotes > 0) {
                votersList = " (" + getVotersNames(game, definition.id) + ")";
            }
            html += `
                <div class="col m4">
                    <div class="card blue lighten-1">
                    <div class="card-content white-text">
                        <span class="card-title">`+ game.current_card.word + `</span>
                        <p>`+ definition.definition + `</p>
                    </div>
                    <div class="card-content white-text">
                    <p>Autor: `+ definition.player + `</p>
                    <p>
                    Votos: `+ totalVotes + votersList + `
                    </p>
                    </div>
                    </div>
                </div>
            `
        }
    });

    html += `
        </div>
        </div>
        <h5>Definiciones de jugadores:</h5>
        <div class="row">
    `

    game.all_definitions.forEach(function (definition, index) {
        if (!definition.is_real) {
            var totalVotes = getOccurrencesCount(game, definition.id);
            var votersList = "";
            if (totalVotes > 0) {
                votersList = " (" + getVotersNames(game, definition.id) + ")";
            }
            html += `
            <div class="col m4">
                <div class="card blue lighten-1">
                <div class="card-content white-text">
                    <span class="card-title">`+ game.current_card.word + `</span>
                    <p>`+ definition.definition + `</p>
                </div>
                <div class="card-content white-text">
                <p>Autor: `+ definition.player + `</p>
                <p>
                Votos: `+ totalVotes + votersList + `
                </p>
                </div>
                </div>
            </div>
        `
        }
    });
    html += `</div></div>`

    if (isDealer) {
        html += `
        <button onclick="endCurrentRound()" class="btn waves-effect waves-light orange" type="submit" name="action">Próxima ronda
        <i class="material-icons right">send</i>
        </button>
        `
    }

    return html;
}

function getOccurrencesCount(game, definitionID) {
    var total = 0;
    if (!game.chosen_definitions) {
        return total;
    }
    game.chosen_definitions.forEach(function (def) {
        if (def.id == definitionID) {
            total++;
        }
    })
    return total;
}

function getVotersNames(game, definitionID) {
    var list = "";
    game.chosen_definitions.forEach(function (def) {
        if (def.id == definitionID) {
            if (list.length > 0) {
                list += ", "
            }
            list += def.player;
        }
    })
    return list;
}
// ***************************************************
// ********** GAME COMPONENT BEHAVIORS ***************
// ***************************************************

function selectDefinitionOption(selectedWord) {
    $.post("/api/game/" + gameID + "/setup_option/" + selectedWord + "?player_name=" + playerName, function () {
        $("#mainCardLoadingBar").show();
        setupMainCard("", "", "");
    });
}

function uploadDefinition(word) {
    var url = "/api/game/" + gameID + "/player_definition?player_name=" + playerName;
    var defVal = $("#wordDefinitionInput").val();
    var definition = { definition: defVal };
    $.post(url, JSON.stringify(definition)).done(function () {
        $("#mainCardLoadingBar").show();
        setupMainCard("Definicion cargada!", "Estamos esperando que el resto de los jugadores complete sus definiciones...<br><br><strong>" + word + "</strong>: " + defVal, "");
    });
}

function postCorrectDefinitions() {
    var correctDefinitionIDs = [];
    $(".isCorrectDefinition").each(function () {
        if ($(this).is(":checked")) {
            correctDefinitionIDs.push($(this).val());
        }
    });

    var url = "/api/game/" + gameID + "/correct_definitions?player_name=" + playerName;
    var definition = { correct_definitions: correctDefinitionIDs };
    $.post(url, JSON.stringify(definition)).done(function () {
        $("#mainCardLoadingBar").show();
        setupMainCard("", "", "");
    });
}

function selectCorrectDefinition(definitionID) {
    var url = "/api/game/" + gameID + "/choose_definition/" + definitionID + "?player_name=" + playerName;
    $.post(url).done(function () {
        $("#mainCardLoadingBar").show();
        setupMainCard("Definicion cargada!", "Estamos esperando que el resto de los jugadores elija definiciones.", "");
    });
}

function endCurrentRound(definitionID) {
    var url = "/api/game/" + gameID + "/end_round?player_name=" + playerName;
    $.post(url).done(function () {
        $("#mainCardLoadingBar").show();
        setupMainCard("Ronda terminada!", "Estamos iniciando la próxima...", "");
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
        } else if (game.game_state == "choose_definitions" && game.chosen_definitions && playerIsInArray(player.name, game.chosen_definitions)) {
            imageClass = "avatar-image-def-completed";
        }
        html += `
    <div class="row" style="margin-bottom:0em;">
        <div class="col s12 m7">
        <div class="card">
            <div class="card-image">
            <img class="avatarImg `+ imageClass + `" src="https://robohash.org/` + player.name + `.png">
            <span class="player-name-card card-title">` + player.points + "/" + game.target_points + ` pts</span>
            </div>
            <div class="card-action">
            `+ player.name + `
            </div>      
        </div>
        </div>
    </div>
`
    });

    $("#gamePlayers").html(html);
}

function playerIsInArray(nameKey, definitions) {
    if (!definitions) {
        return false;
    }

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
        arraysEqual(game.all_definitions, lastDrawnPlayersGame.all_definitions) &&
        (!game.chosen_definitions || arraysEqual(game.chosen_definitions, lastDrawnGame.chosen_definitions));
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
    return JSON.stringify(a) == JSON.stringify(b);
}