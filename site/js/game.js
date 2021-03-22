var gameID;
var playerName;
var m;
var baseURL = "";//"https://bleff.herokuapp.com";

$(document).ready(function () {
    if(window.location.origin.indexOf("bleff.ml") >= 0){
        baseURL="";
    }
    
    m = getUrlParameter("m")
    var result = atob(m).split("@|@");
    gameID = result[0];
    playerName = result[1];
    
    $("#gameID").text(gameID);
    
    $('.tooltipped').tooltip();
    $('.modal').modal();

    refreshGame();
    setInterval(refreshGame, 3000);
});

var lastDrawnGame = null;
var lastDrawnPlayersGame = null;
function refreshGame() {
    $.get(baseURL+"/api/game/" + gameID + "?player_name=" + playerName, function (game) {
        if (game.status == "finished") {
            window.location.replace("endgame.html?m=" + m);
            return
        }
        
        // Always update inner timer, just in case
        if (game && game.secs_per_state) {
           loopTimer(game.current_state_remaining_secs / game.secs_per_state * 360);
            $(".tooltip-content").html(secondsTimeSpanToHMS(Math.max(0,game.current_state_remaining_secs))+"s")
            $("#timerContainer").attr("data-tooltip",secondsTimeSpanToHMS(Math.max(0,game.current_state_remaining_secs))+"s");
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

function displayLoadingBar(game) {
    console.log(shouldDisplayTimer);
    var shouldDisplayTimer = game != undefined && game.current_state_remaining_secs > 0 && game.secs_per_state > 0;
    if (shouldDisplayTimer) {
        $("#mainCardLoadingBar").hide();
        $("#timerContainer").show();
    } else {
        $("#mainCardLoadingBar").show();
        $("#timerContainer").hide();
    }
}

function hideLoadingBars(){
    $("#mainCardLoadingBar").hide();
    $("#timerContainer").hide();
}

function drawGameState(game) {
    var dealerName = game.players[game.dealer_index].name;
    var isDealer = dealerName == playerName;
    
    // Pop up card effect
    var isCardHidden = false;
    if (lastDrawnGame != null && lastDrawnGame.game_state != game.game_state) {
        hideMainCard();
        isCardHidden = true;
    }
    
    setTimeout(function () {
        lastDrawnGame = game;
        
        displayLoadingBar(game);
        
        switch (game.game_state) {
            case "dealer_choose_card":
            if (isDealer) {
                hideLoadingBars();
                var definitionOptionsHTML = drawDefinitionOptions(game.definition_options);
                setupMainCard("Elegí una carta!", "De las opciones, elegí la que más desconocida te parezca, para hacer el juego más divertido.", definitionOptionsHTML);
            } else {
                setupMainCard("Eligiendo la carta...", "<strong>" + dealerName + "</strong> será moderador esta ronda. Está eligiendo una palabra entre las opciones.", "");
            }
            break;
            case "write_definitions":
            if (isDealer) {
                setupMainCard("Jugadores escribiendo definición <strong> " + game.current_card.word + "</strong>", "","");
            } else {
                var writeDefinition = drawDefinitionInput(game.current_card.word)
                setupMainCard("Escribí la definición de <strong>" + game.current_card.word + "</strong>", "Te recomendamos empezar con mayúsculas, terminar con puntos y completar las tildes.", writeDefinition);
            }
            break;
            case "show_definitions":
            if (isDealer) {
                hideLoadingBars();
                selectCorrectDefinitionsHTML = drawAdminAllCards(game, true, isDealer);
                setupMainCard("Definiciones", "Seleccioná las tarjetas que consideres correctas, teniendo en cuenta la definición real de la palabra.", selectCorrectDefinitionsHTML);
            } else {
                setupMainCard("<strong>" + dealerName + "</strong> ", "está eligiendo las definiciones acertadas para asignar los puntos a los jugadores.","");
            }
            break;
            case "choose_definitions":
            if (isDealer) {
                selectCorrectDefinitionsHTML = drawAdminAllCards(game, false, isDealer);
                setupMainCard("Los jugadores están votando...", "", selectCorrectDefinitionsHTML);
            } else {
                // Check if player had correct definition 
                    // Check if player had correct definition 
                // Check if player had correct definition 
                if (game.correct_definitions && game.correct_definitions.some(function (e) { return e.player == playerName; })) {
                    setupMainCard("Tu definición es correcta!", "<strong>" + dealerName + "</strong> consideró tu definición acertada. El resto de los jugadores está votando las definiciones restantes.", "");
                } else {
                    selectCorrectDefinitionsHTML = drawAdminAllCards(game, true, isDealer);
                    setupMainCard("Elegí la definición que creas correcta", selectCorrectDefinitionsHTML);
                }
            }
            break;
            case "show_definitions_and_scores":
            if (isDealer) {
                hideLoadingBars();
                endGameHTML = drawEndGameHTML(game, true)
                setupMainCard("Fin de la ronda", "Cuando quieras, terminá la ronda...", endGameHTML);
            } else {
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
        if ((index + 1) % 4 == 0) {
            html += `</div><div class="row">`;
        }
    });
    html += `</div>`;
    return html;
}

function drawWordDefinitionCard(word, definition) {
    return `
    <div class="col m3">
    <div class="card bleff-subdominant-alt">
    <div class="card-content white-text">
    <span class="card-title">`+ word + `</span>
    <p>`+ definition + `</p>
    </div>
    <div class="card-action-1">
    <a class="waves-effect waves-light bleff-white bleff-tonic-alt-text btn" onclick="selectDefinitionOption(\``+ word + `\`)">Elegir</a>
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
    <a class="waves-effect waves-light bleff-red btn" onclick="uploadDefinition(\``+ word + `\`)">Subir definición</a>
    </div>
    `
}

function drawAdminAllCards(game, isSelectable, isDealer) {
    html = "";
    if (isDealer) {
        html = `
        <div class="row">
        <!-- Real definition -->
        <h6>Definición correcta</h6>
        <div class="row">
        <div class="col m7">
        <div class="card bleff-red">
        <div class="card-content white-text">
        <span class="card-title">`+ game.current_card.word + `</span>
        <div class="def-correcta">`+ game.current_card.definition + `</div>
        </div>
        </div>
        </div>
        </div>
        <h7>Definiciones de jugadores</h7>
        <div class="row">
        `
    } else {
        html = `
        <div class="row">
        <h6>Definiciones</h6>
        <div class="row">
        `
    }
    
    game.all_definitions.forEach(function (definition, index) {
        if (!definition.is_real) {
            html += `
            <div class="col m4">
            <div class="card bleff-tonic-alt">
            <div class="card-content black-text">
            <span class="card-title-black">`+ game.current_card.word + `</span>
            <p>`+ definition.definition + `</p>
            </div>
            `
            if (isSelectable && isDealer) {
                html += `
                <div class="card-action">
                    <div class="switch">
                    <label class="black-text">Incorrecta<input type="checkbox" value="`+ definition.id + `" class="isCorrectDefinition">
                    <span class="lever"></span>Correcta</label>
                    </div>
                </div>
                `
            }
            
            if (isSelectable && !isDealer) {
                html += `
                <div class="card-action">
                <button onclick="selectCorrectDefinition(\``+ definition.id + `\`)" class="btn waves-effect waves-light bleff-red" type="submit" name="action">Elegir
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
        <button onclick="postCorrectDefinitions()" class="btn waves-effect waves-light bleff-red" type="submit" name="action">Listo
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
    <h6>Definición correcta</h6>
    <div class="row">
    <div class="col m3">
    <div class="card bleff-red">

    <div class="card-content white-text">
    <div class="palabra" style="color: white;">`+ game.current_card.word +`</div>
    <div class="definicion">`+game.current_card.definition+`</div>
    </div>

    <div class="card-content white-text">
    <p>Votos: `+ correctTotalVotes + correctVotersList + `</p><br>
    </div>
    </div>
    </div>
    `;
    
    if (game.correct_definitions) {
        game.correct_definitions.forEach(function (definition, index) {
            if (!definition.is_real) {
                var totalVotes = getOccurrencesCount(game, definition.id);
                var votersList = "";
                if (totalVotes > 0) {
                    votersList = " (" + getVotersNames(game, definition.id) + ")";
                }
                html += `
                <div class="col m3">
                <div class="card bleff-subdominant-alt">

                <div class="card-content white-text">
                <div class="palabra" style="color: #f7ff00;">`+ game.current_card.word +`</div>
                <div class="definicion">`+definition.definition+`</div>
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
    }
    
    html += `
    </div>
    </div>
    <h7>Definiciones de jugadores</h7>
    <div class="row">
    `
    
    if (game.all_definitions) {
        game.all_definitions.forEach(function (definition, index) {
            if (!definition.is_real) {
                var totalVotes = getOccurrencesCount(game, definition.id);
                var votersList = "";
                if (totalVotes > 0) {
                    votersList = " (" + getVotersNames(game, definition.id) + ")";
                }
                html += `
                <div class="col m4">
                <div class="card bleff-subdominant-alt">

                <div class="card-content white-text">               
                <div class="palabra" style="color: lime;">`+ game.current_card.word +`</div>
                <div class="definicion">`+definition.definition+`</div>
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
    }
    html += `</div></div>`
    
    if (isDealer) {
        html += `
        <button onclick="endCurrentRound()" class="btn waves-effect waves-light bleff-red bleff-white-alt-text" type="submit" name="action">Próxima ronda
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
    $.post(baseURL+"/api/game/" + gameID + "/setup_option/" + selectedWord + "?player_name=" + playerName, function () {
        setupMainCard("", "", "");
    });
}

function uploadDefinition(word) {
    var url = baseURL+"/api/game/" + gameID + "/player_definition?player_name=" + playerName;
    var defVal = $("#wordDefinitionInput").val();
    var definition = { definition: defVal };
    $.post(url, JSON.stringify(definition)).done(function () {
   setupMainCard("Definicion cargada!", "Estamos esperando que el resto de los jugadores complete sus definiciones.", `<div class="definicion-juegadores"><div class="palabra">`+ word +`</div><div class="definicion">`+defVal+`</div></div>`);
    });

}

function postCorrectDefinitions() {
    var correctDefinitionIDs = [];
    $(".isCorrectDefinition").each(function () {
        if ($(this).is(":checked")) {
            correctDefinitionIDs.push($(this).val());
        }
    });

    var url = baseURL+"/api/game/" + gameID + "/correct_definitions?player_name=" + playerName;
    var definition = { correct_definitions: correctDefinitionIDs };
    $.post(url, JSON.stringify(definition)).done(function () {
        setupMainCard("", "", "");
    });
}

function selectCorrectDefinition(definitionID) {
    var url = baseURL+"/api/game/" + gameID + "/choose_definition/" + definitionID + "?player_name=" + playerName;
    $.post(url).done(function () {
        setupMainCard("Definicion cargada!", "Estamos esperando que el resto de los jugadores elija definiciones.", "");
    });
}

function endCurrentRound(definitionID) {
    var url = baseURL+"/api/game/" + gameID + "/end_round?player_name=" + playerName;
    $.post(url).done(function () {
        setupMainCard("Ronda terminada!", "Estamos iniciando la próxima...", "");
    });
}



// *******************************************
// ************** DRAW PLAYERS ***************
// *******************************************
function drawPlayers(game) {
    var html = "";
    
    var isInGame = false;
    game.players.forEach(function (player, index) {
        var imageClass = "avatar-image-normal";
        if (player.name == game.players[game.dealer_index].name) {
            imageClass = "avatar-image-dealer";
        } else if (game.game_state == "write_definitions" && playerIsInArray(player.name, game.fake_definitions)) {
            imageClass = "avatar-image-def-completed";
        } else if (game.game_state == "choose_definitions" && game.chosen_definitions && playerIsInArray(player.name, game.chosen_definitions)) {
            imageClass = "avatar-image-def-completed";
        }

        isInGame = isInGame || (player.name == playerName);

        var removePlayerBtn = "";
        if(index > 0 && playerName == game.players[0].name){
            removePlayerBtn = `
            <div class="cruz">
            <a class="btn-floating waves-effect waves-light black right-align" onclick="openRemovePlayerModal(`+index+`)">
            <i class="material-icons">
                close
            </i>
            </a>
            </div>`;
        }

        html += `
        <div class="col m3">
        <div class="card bleff-dominant-text bleff-tonic-alt"> `+ removePlayerBtn +`
        <div class="card-image">
        <img class="avatarImg `+ imageClass + `" src="https://robohash.org/` + player.name + `.png">
        </div>
        <div class="card-action">
        `+ player.name + `
        </div>  
		<div class="player-name-card card-title">` + player.points + "/" + game.target_points + ` pts</div>    
            </div>      
        </div>      
        </div>
        </div>
        `
    });
    
    if(!isInGame){
        window.location.replace("/juegos-online/bleff");
        return
    }
    
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

function secondsTimeSpanToHMS(s) {
    var m = Math.floor(s/60); //Get remaining minutes
    s -= m*60;
    return (m < 10 ? '0'+m : m)+":"+(s < 10 ? '0'+s : s); //zero padding on minutes and seconds
}


function loopTimer(i){    
    i = 360-i;
    if (i<=180){
        $("#activeBorder").css('background-image','linear-gradient(' + (90+i) + 'deg, transparent 50%, #FF0000 50%),linear-gradient(90deg, #FF0000 50%, transparent 50%)');
    }
    else{
        $("#activeBorder").css('background-image','linear-gradient(' + (i-90) + 'deg, transparent 50%, #FFFFFF 50%),linear-gradient(90deg, #FF0000 50%, transparent 50%)');
    }
}

var playerIdxToRemove = 0;
function openRemovePlayerModal(playerIdx){
    playerIdxToRemove = playerIdx;
    $("#removePlayerNameText").html(lastDrawnPlayersGame.players[playerIdx].name);
    $('#removePlayerModal').modal('open');
}

function confirmRemovePlayer(){
    $.post(baseURL+"/api/game/" + gameID + "/remove_player/" + lastDrawnPlayersGame.players[playerIdxToRemove].id + "?player_name=" + playerName, function () {
        refreshGame();
        $('#removePlayerModal').modal('close');
    });
}