
$(document).ready(function () {
    m = getUrlParameter("m")
    var result = atob(m).split("@|@");
    gameID = result[0];
    playerName = result[1];

    $("#gameID").text(gameID);
    $.get("/api/game/" + gameID + "?player_name=" + playerName, function (game) {
        game.players.sort(sortByName);

        var html = "";

        game.players.forEach((player, idx) => {

            var classes = "bleff-dominant-text bleff-subdominant";
            switch (idx) {
                case 0:
                    classes = "bleff-tonic-alt-text bleff-red";
                    break;
                case 1:
                    classes = "bleff-tonic-alt-text bleff-dominant";
                    break;
                case 2:
                    classes = "bleff-tonic-alt-text bleff-subdominant-alt";
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
                  <h5> Posición: ` + (idx + 1) + `º</h5>
                  <h5> Puntaje final: ` + (player.points) + `</h5>
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

