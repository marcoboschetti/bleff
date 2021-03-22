$(document).ready(function () {

    // Random logo
    var rand  = Math.random();
    if(rand < 0.33){
        return;
    }
    if(rand < 0.66){
        $("#topLogo").attr("src", "img/top-logo-1.png");
        return;
    }
    $("#topLogo").attr("src", "img/top-logo-2.png");
});