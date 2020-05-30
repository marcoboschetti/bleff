
$(document).ready(function () {
    $("#firstNameInput").val(getRandomName());

    // Change avatar when name changes
    $("#firstNameInput").on("input", function (e) {
        var input = $(this);
        var val = input.val();

        if (input.data("lastval") != val) {
            input.data("lastval", val);

            $("#avatarImg").attr("src", "https://robohash.org/" + val + ".png");
        }

        if (val.length <= 3) {
            $("#newGameBtn").addClass('disabled');
        } else {
            $("#newGameBtn").removeClass('disabled');
        }

        checkIfCodeIsCompleted();
    });


    $("#newGameBtn").click(createNewMatch);
    $("#joinGameBtn").click(joinMatch);
    

    $("#joinMatchWord1").on("input", checkIfCodeIsCompleted)
    $("#joinMatchWord2").on("input", checkIfCodeIsCompleted)
    $("#joinMatchWord3").on("input", checkIfCodeIsCompleted)

});


function checkIfCodeIsCompleted(e) {
    var word1 = $("#joinMatchWord1").val();
    var word2 = $("#joinMatchWord2").val();
    var word3 = $("#joinMatchWord3").val();
    var name = $("#firstNameInput").val();

    if (word1.length > 0 && word2.length > 0 && word3.length > 0 && name.length > 3) {
        $("#joinGameBtn").removeClass('disabled');
    } else {
        $("#joinGameBtn").addClass('disabled');
    }
}

function createNewMatch() {
    var name = $("#firstNameInput").val();

    $.post("/api/game?player_name="+name, function (data) {
        var val = data.id+"@|@"+name;
        var result = btoa(val);
        window.location.replace("/site/page/lobby.html?m="+result);
    });
}

function joinMatch() {
    var name = $("#firstNameInput").val();

    var word1 = $("#joinMatchWord1").val().toUpperCase();
    var word2 = $("#joinMatchWord2").val().toUpperCase();
    var word3 = $("#joinMatchWord3").val().toUpperCase();

    $.post("/api/game/"+word1+"."+word2+"."+word3+"/join?player_name="+name, function (data) {
        var val = data.id+"@|@"+name;
        var result = btoa(val);
        window.location.replace("/site/page/lobby.html?m="+result);
    });
}


var names = ["Lucía","María","Martina","Paula","Cami","Joaco","Tito","Lucho","Monti","Fede","Sofía","Daniela","Alba","Julia","Carla","Sara","Valeria","Noa","Emma","Claudia","Carmen","Valentina","Ana","Marta","Irene","Adriana","Laura","Elena","Alejandra","Vega","Alma","Laia","Lola","Vera","Olivia","Inés","Aitana","Jimena","Candela","Ariadna","Carlota","Ainhoa","Nora","Triana","Marina","Chloe","Elsa","Alicia","Clara","Blanca","Leire","Mía","Lara","Rocío","Ainara","Nerea","Hugo","Daniel","Pablo","Martín","Alejandro","Adrián","Álvaro","David","Lucas","Mateo","Mario","Manuel","Antonio","Diego","Leo","Javier","Marcos","Izan","Alex","Sergio","Enzo","Carlos","Marc","Jorge","Miguel","Gonzalo","Juan","Ángel","Oliver","Iker","Dylan","Bruno","Eric","Marco","Iván","Nicolás","José","Héctor","Darío","Samuel","Víctor","Rubén","Gabriel","Adam","Aaron","Thiago","Jesús","Aitor","Alberto","Guillermo"];
function getRandomName(){
    return names[Math.floor(Math.random() * names.length)];
}