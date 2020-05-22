package main

import (
	"fmt"
	"net/http"

	"bitbucket.org/marcoboschetti/bleff/entities"
	"bitbucket.org/marcoboschetti/bleff/service"
	"github.com/gin-gonic/gin"
)

func SetupGameHandlers(r *gin.Engine) {
	apiGroup := r.Group("/api")

	gameGroup := apiGroup.Group("/game")
	gameGroup.GET("/:game_id", getGame)

	gameGroup.POST("/", createNewGame)
	gameGroup.POST("/:game_id/join", joinGame)
	gameGroup.POST("/:game_id/start", startGame)
	gameGroup.POST("/:game_id/setup_option/:selected_word", setupSelectedWord)
	gameGroup.POST("/:game_id/player_definition", postPlayerDefinition)
	gameGroup.POST("/:game_id/correct_definitions", postCorrectDefinitions)
}

func createNewGame(c *gin.Context) {
	playerName := c.Query("player_name")
	newGame := service.CreateNewGame(playerName)
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

	fmt.Println(definitions.CorrectDefinitions, gameID, playerName)
	// _, err := service.SetPlayerDefinition(gameID, playerName, definition.Definition)
	// if err != nil {
	// 	c.JSON(400, err.Error())
	// 	return
	// }

	// c.Status(200)
}

func getGame(c *gin.Context) {
	gameID := c.Params.ByName("game_id")
	playerName := c.Query("player_name")

	game, err := service.GetGame(gameID)
	if err != nil {
		c.JSON(400, err.Error())
		return
	}

	// gameDTO := entities.Game{}
	// copier.Copy(&gameDTO, game)

	gameDTO := clearGameInfo(playerName, *game)

	c.JSON(200, gameDTO)
}

// if player is not current turn dealer, clear private info
func clearGameInfo(playerName string, game entities.Game) entities.Game {
	if playerName == game.Players[game.CurrentDealerIdx].Name {
		// Full info
		return game
	}

	game.DefinitionOptions = nil
	game.CurrentCard.Definition = "pika pika"

	// Only leave player in fake definitions
	fakeDefinitions := make([]entities.Definition, len(game.FakeDefinitions))
	for idx, def := range game.FakeDefinitions {
		fakeDefinitions[idx] = entities.Definition{
			Definition: "Lapras",
			ID:         "Blastois",
			IsReal:     false,
			Player:     def.Player,
		}
	}
	game.FakeDefinitions = fakeDefinitions

	// Remove names and is real. leave ID and definition
	allDefinitions := make([]entities.Definition, len(game.AllDefinitions))
	for idx, def := range game.AllDefinitions {
		allDefinitions[idx] = entities.Definition{
			Definition: def.Definition,
			ID:         def.ID,
			IsReal:     false,
			Player:     "Torchic",
		}
	}
	game.AllDefinitions = allDefinitions

	return game
}
