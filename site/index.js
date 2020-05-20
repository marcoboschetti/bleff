
$( document ).ready(function() {

    // Change avatar when name changes
    $("#firstNameInput").on("input", function(e) {
        var input = $(this);
        var val = input.val();
      
        if (input.data("lastval") != val) {
          input.data("lastval", val);

          $("#avatarImg").attr("src","https://robohash.org/"+val+".png");
        }

        if(val.length <= 3){
            $("#newGameBtn").addClass('disabled'); 
        }else{
            $("#newGameBtn").removeClass('disabled'); 
        }
    });

    $("#joinMatchWord1").on("input",checkIfCodeIsCompleted)
    $("#joinMatchWord2").on("input",checkIfCodeIsCompleted)
    $("#joinMatchWord3").on("input",checkIfCodeIsCompleted)
}); 


function checkIfCodeIsCompleted(e){
    var word1 = $("#joinMatchWord1").val();
    var word2 = $("#joinMatchWord2").val();
    var word3 = $("#joinMatchWord3").val();
    var name = $("#firstNameInput").val();

    if(word1.length > 0 && word2.length > 0 && word3.length > 0 && name.length > 3){
        $("#joinGameBtn").removeClass('disabled'); 
    }else{
        $("#joinGameBtn").addClass('disabled');  
    }
}