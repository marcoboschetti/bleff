package main

import (
	"net/http"
	"time"

	"bitbucket.org/marcoboschetti/bleff/entities"
	"bitbucket.org/marcoboschetti/bleff/service"
	"github.com/gin-gonic/gin"
)

func SetupGameHandlers(r *gin.Engine) {
	apiGroup := r.Group("/api")

	gameGroup := apiGroup.Group("/game")
	gameGroup.GET("/:game_id", getGame)

	gameGroup.POST("/", createNewGame)
	gameGroup.POST("/:game_id/join_public", joinPublicGame)
	gameGroup.POST("/:game_id/join", joinGame)
	gameGroup.POST("/:game_id/start", startGame)
	gameGroup.POST("/:game_id/setup_option/:selected_word", setupSelectedWord)
	gameGroup.POST("/:game_id/player_definition", postPlayerDefinition)
	gameGroup.POST("/:game_id/correct_definitions", postCorrectDefinitions)
	gameGroup.POST("/:game_id/choose_definition/:definition_id", postChooseDefinition)
	gameGroup.POST("/:game_id/end_round", postEndRound)
	gameGroup.POST("/:game_id/remove_player/:player_id", removePlayer)

	service.StartGarbageCollector()
}

func createNewGame(c *gin.Context) {
	playerName := c.Query("player_name")

	definition := struct {
		TargetPoints uint64 `json:"target_points"`
		SecsPerState uint64 `json:"secs_per_state"`
		BotsCount    uint64 `json:"bots_count"`
	}{}

	if err := c.ShouldBindJSON(&definition); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newGame := service.CreateNewGame(playerName, definition.TargetPoints, definition.SecsPerState, definition.BotsCount)
	c.JSON(200, newGame)
}

func joinPublicGame(c *gin.Context) {
	playerName := c.Query("player_name")

	newGame, err := service.JoinPublicGame(playerName)
	if err != nil {
		c.JSON(400, err.Error())
		return
	}
	c.JSON(200, newGame)
}

func joinGame(c *gin.Context) {
	playerName := c.Query("player_name")
	gameID := c.Params.ByName("game_id")

	newGame, err := service.JoinGame(playerName, gameID)
	if err != nil {
		c.JSON(400, err.Error())
		return
	}
	c.JSON(200, newGame)
}

func startGame(c *gin.Context) {
	gameID := c.Params.ByName("game_id")
	_, err := service.StartGame(gameID)
	if err != nil {
		c.JSON(400, err.Error())
		return
	}
	c.Status(200)
}

func setupSelectedWord(c *gin.Context) {
	gameID := c.Params.ByName("game_id")
	word := c.Params.ByName("selected_word")
	playerName := c.Query("player_name")

	_, err := service.SetupSelectedWord(word, gameID, playerName)
	if err != nil {
		c.JSON(400, err.Error())
		return
	}

	c.Status(200)
}

func postPlayerDefinition(c *gin.Context) {
	gameID := c.Params.ByName("game_id")
	playerName := c.Query("player_name")

	definition := struct {
		Definition string `json:"definition"`
	}{}

	if err := c.ShouldBindJSON(&definition); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := service.SetPlayerDefinition(gameID, playerName, definition.Definition)
	if err != nil {
		c.JSON(400, err.Error())
		return
	}

	c.Status(200)
}

func postCorrectDefinitions(c *gin.Context) {
	gameID := c.Params.ByName("game_id")
	playerName := c.Query("player_name")

	definitions := struct {
		CorrectDefinitions []string `json:"correct_definitions"`
	}{}

	if err := c.ShouldBindJSON(&definitions); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := service.PostCorrectDefinitions(gameID, playerName, definitions.CorrectDefinitions)
	if err != nil {
		c.JSON(400, err.Error())
		return
	}

	c.Status(200)
}

func postChooseDefinition(c *gin.Context) {
	gameID := c.Params.ByName("game_id")
	definitionID := c.Params.ByName("definition_id")
	playerName := c.Query("player_name")

	_, err := service.PostChosenDefinition(gameID, playerName, definitionID)
	if err != nil {
		c.JSON(400, err.Error())
		return
	}

	c.Status(200)
}

func postEndRound(c *gin.Context) {
	gameID := c.Params.ByName("game_id")
	playerName := c.Query("player_name")

	_, err := service.PostEndRound(gameID, playerName)
	if err != nil {
		c.JSON(400, err.Error())
		return
	}

	c.Status(200)
}

func removePlayer(c *gin.Context) {
	gameID := c.Params.ByName("game_id")
	playerName := c.Query("player_name")
	playerIDToRemove := c.Params.ByName("player_id")

	_, err := service.RemovePlayer(gameID, playerName, playerIDToRemove)
	if err != nil {
		c.JSON(400, err.Error())
		return
	}

	c.Status(200)
}

func getGame(c *gin.Context) {
	gameID := c.Params.ByName("game_id")
	playerName := c.Query("player_name")

	game, err := service.GetGame(gameID)
	if err != nil {
		c.JSON(400, err.Error())
		return
	}

	gameDTO := clearGameInfo(playerName, *game)

	c.JSON(200, gameDTO)
}

// if player is not current turn dealer, clear private info
func clearGameInfo(playerName string, game entities.Game) entities.Game {

	// Update current state remaining secs, for display only, if the state requires it

	if (game.CurrentGameState == entities.WriteDefinitionsGameState || game.CurrentGameState == entities.ChooseDefinitions) &&
		game.SecsPerState > 0 && game.CurrentStateStartTime != nil {
		game.CurrentStateRemainingSecs = int(game.SecsPerState) - int(time.Now().Sub(*game.CurrentStateStartTime).Seconds())
	}

	if playerName == game.Players[game.CurrentDealerIdx].Name {
		// Full info
		return game
	}

	game.DefinitionOptions = nil
	if game.CurrentGameState != entities.ShowDefinitionsAndScores {
		game.CurrentCard.Definition = "Crucigrama"
	}

	// Only leave player in fake definitions
	fakeDefinitions := make([]entities.Definition, len(game.FakeDefinitions))
	for idx, def := range game.FakeDefinitions {
		fakeDefinitions[idx] = entities.Definition{
			Definition: "Pictionary",
			ID:         "Scrabble",
			IsReal:     false,
			Player:     def.Player,
		}
	}
	game.FakeDefinitions = fakeDefinitions

	// Remove definitions from correct ones

	if game.CurrentGameState != entities.ShowDefinitionsAndScores {
		correctDefinitions := make([]entities.Definition, len(game.CorrectDefinitions))
		for idx, def := range game.CorrectDefinitions {
			correctDefinitions[idx] = entities.Definition{
				ID:         def.ID,
				Player:     def.Player,
				IsReal:     def.IsReal,
				Definition: "Rapigrama",
			}
		}
		game.CorrectDefinitions = correctDefinitions
	}

	// Remove names and is real. leave ID and definition
	allDefinitions := make([]entities.Definition, len(game.AllDefinitions))
	for idx, def := range game.AllDefinitions {
		definition, id := "Carrera de Mente", "Uno"

		if game.CurrentGameState == entities.ChooseDefinitions || game.CurrentGameState == entities.ShowDefinitionsAndScores {
			definition, id = def.Definition, def.ID
		}
		player := "Pictonary"
		isReal := false
		if game.CurrentGameState == entities.ShowDefinitionsAndScores {
			player = def.Player
			isReal = def.IsReal
		}

		allDefinitions[idx] = entities.Definition{
			Definition: definition,
			ID:         id,
			IsReal:     isReal,
			Player:     player,
		}
	}
	game.AllDefinitions = allDefinitions

	return game
}
