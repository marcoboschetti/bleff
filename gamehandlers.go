package main

import (
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

func getGame(c *gin.Context) {
	gameID := c.Params.ByName("game_id")
	playerName := c.Query("player_name")

	game, err := service.GetGame(gameID)
	if err != nil {
		c.JSON(400, err.Error())
		return
	}

	clearGame := clearGameInfo(playerName, *game)
	c.JSON(200, clearGame)
}

// if player is not current turn dealer, clear private info
func clearGameInfo(playerName string, game entities.Game) entities.Game {
	if playerName == game.Players[game.CurrentDealerIdx].Name {
		// Full info
		return game
	}

	game.DefinitionOptions = nil
	game.CurrentCard.Definition = "not for you"

	return game
}
