var baseURL = "http://bleff.herokuapp.com";

$(document).ready(function () {
    $('select').formSelect();
    $(".dropdown-content>li>a").css("color", "#112341");

    var randomName = getRandomName();
    $("#firstNameInput").val(randomName);
    $("#avatarImg").attr("src", "https://robohash.org/" + randomName + ".png");

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

    $("#ee1").click(ee1);
    $("#ee2").click(ee2);
    $("#ee3").click(ee3);
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

    var payload = {
        target_points: parseInt($("#newGameTargetPoints").val()),
        secs_per_state: parseInt($("#newGameSecsPerState").val())
    }

    $.post(baseURL+"/api/game?player_name=" + name, JSON.stringify(payload), function (data) {
        var val = data.id + "@|@" + name;
        var result = btoa(val);
        window.location.replace("/site/page/lobby.html?m=" + result);
    });
}

function joinMatch() {
    var name = $("#firstNameInput").val();

    var word1 = $("#joinMatchWord1").val().toUpperCase();
    var word2 = $("#joinMatchWord2").val().toUpperCase();
    var word3 = $("#joinMatchWord3").val().toUpperCase();

    $.post(baseURL+"/api/game/" + word1 + "." + word2 + "." + word3 + "/join?player_name=" + name)
        .done(function (data) {
            var val = data.id + "@|@" + name;
            var result = btoa(val);
            window.location.replace("/site/page/lobby.html?m=" + result);
        })
        .fail(function (err) {
            console.log(err);
            M.toast({ html: 'No encontramos la partida ' + word1 + "." + word2 + "." + word3 + " 😕" })

        });
}


var names = ["Lucía", "María", "Martina", "Paula", "Cami", "Joaco", "Tito", "Lucho", "Monti", "Fede", "Sofía", "Daniela", "Alba", "Julia", "Carla", "Sara", "Valeria", "Noa", "Emma", "Claudia", "Carmen", "Valentina", "Ana", "Marta", "Irene", "Adriana", "Laura", "Elena", "Alejandra", "Vega", "Alma", "Laia", "Lola", "Vera", "Olivia", "Inés", "Aitana", "Jimena", "Candela", "Ariadna", "Carlota", "Ainhoa", "Nora", "Triana", "Marina", "Chloe", "Elsa", "Alicia", "Clara", "Blanca", "Leire", "Mía", "Lara", "Rocío", "Ainara", "Nerea", "Hugo", "Daniel", "Pablo", "Martín", "Alejandro", "Adrián", "Álvaro", "David", "Lucas", "Mateo", "Mario", "Manuel", "Antonio", "Diego", "Leo", "Javier", "Marcos", "Izan", "Alex", "Sergio", "Enzo", "Carlos", "Marc", "Jorge", "Miguel", "Gonzalo", "Juan", "Ángel", "Oliver", "Iker", "Dylan", "Bruno", "Eric", "Marco", "Iván", "Nicolás", "José", "Héctor", "Darío", "Samuel", "Víctor", "Rubén", "Gabriel", "Adam", "Aaron", "Thiago", "Jesús", "Aitor", "Alberto", "Guillermo"];
function getRandomName() {
    return names[Math.floor(Math.random() * names.length)];
}

var v = 0;
function ee1() { ee(1); }
function ee2() { ee(2); }
function ee3() { ee(3); }

function ee(x) {
    if (x != v + 1) {
        v = 0; return;
    }
    v = x;
    if (v == 3) {
        var name = $("#firstNameInput").val();
        $.post("/api/game/required/join_public?player_name=" + name)
            .done(function (data) {
                var val = data.id + "@|@" + name;
                var result = btoa(val);
                window.location.replace("/site/page/lobby.html?m=" + result);
            })
            .fail(function (err) {
                console.log(err);
                M.toast({ html: "Ups, no pudimos encontrar una partida publica 😕" })

            });
    }
}