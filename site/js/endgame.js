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
    $.get(baseURL+"/api/game/" + gameID + "?player_name=" + playerName, function (game) {
        game.players.sort(sortByName);

        var html = "";

        game.players.forEach((player, idx) => {

            var classes = "bleff-dominant-text bleff-subdominant";
            switch (idx) {
                case 0:
                    classes = "bleff-tonic-alt-text bleff-winner";
                    break;
                case 1:
                    classes = "bleff-dominant-text bleff-tonic-alt";
                    break;
                case 2:
                    classes = "bleff-dominant-text bleff-tonic-alt";
                    break;
            }

            html += `
            <div class="col m3">
              <div class="card `+ classes + `">
                <div class="card-image">
                  <img class="avatarImg" src="https://robohash.org/` + player.name + `.png">
                </div>
                <div class="card-content">
                  <h3>` + player.name + `</h3>
                  <div class="position">Posición<span> ` + (idx + 1) + `º</span></div>
                  <div class="puntaje">Puntaje final<span> ` + (player.points) + `</span></div>
                </div>
              </div>
            </div>
    `
        });

        $("#rankingContainer").html(html);
    });
});




//This will sort your array
function sortByName(a, b) {
    return ((a.points > b.points) ? -1 : ((a.points < b.points) ? 1 : 0));
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

