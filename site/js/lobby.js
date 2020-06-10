var gameID;
var playerName;
var m;

$(document).ready(function () {
    m = getUrlParameter("m");
    var result = atob(m).split("@|@");
    gameID = result[0];
    playerName = result[1];

    $("#gameID").text(gameID);

    refreshGame();
    setInterval(refreshGame, 3000);

    $("#startGame").click(function(e){
        $("#startGame").addClass("disabled");
        $("#startGame").html("Iniciando partida...");
        $.post("/api/game/"+gameID+"/start", function (data) {
            window.location.replace("/site/page/game.html?m="+m);
        });
    });
});


var lastDrawnGame;
function refreshGame() {
    $.get("/api/game/" + gameID, function (game) {
        if (lastDrawnGame != null && lastDrawnGame.players.length == game.players.length && lastDrawnGame.status == game.status) {
            return;
        }

        lastDrawnGame = game;

        if(game.status == "started"){
            window.location.replace("/site/page/game.html?m="+m);
            return 
        }

        $("#gamePlayers").html(drawPlayers(game));

        var owner = game.players[0];
        if(owner.name == playerName){
            $("#waitingOwnerMsg").remove()
            if(game.players.length > 2){
                $("#startGame").removeClass('disabled');
            }
        }else{
            $("#startGame").remove();
            $("#ownerName").html(owner.name);
        }
    });
}

function drawPlayers(game) {
    var html = "";
    html = `<div class="row">`

    game.players.forEach(function (player, index) {
        html += `
        <div class="col m3">
          <div class="card bleff-dominant-text bleff-tonic-alt">
            <div class="card-image">
              <img class="avatarImg" src="https://robohash.org/` + player.name + `.png">
            </div>
            <div class="card-content">
              <h3>` + player.name + `</h3>
            </div>
          </div>
        </div>
`
    });

    // Loader
    html += `
    <div class="col m3">
        <div class="preloader-wrapper big active">
        <div class="spinner-layer bleff-spinner-layer">
        <div class="circle-clipper left">
            <div class="circle"></div>
        </div><div class="gap-patch bleff-dominant-alt">
            <div class="circle"></div>
        </div><div class="circle-clipper right">
            <div class="circle bleff-subdominant-alt"></div>
        </div>
        </div>
        </div>
    </div>
    `;

    html += `</div>`
    return html;
}

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

