package main

import (
	"bitbucket.org/marcoboschetti/bleff/service"
	"github.com/gin-gonic/gin"
)

func SetupGameHandlers(r *gin.Engine) {
	apiGroup := r.Group("/api")

	gameGroup := apiGroup.Group("/game")
	gameGroup.POST("/", createNewGame)
	gameGroup.POST("/:game_id/join", joinGame)
	gameGroup.GET("/:game_id", getGame)
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

func getGame(c *gin.Context) {
	gameID := c.Params.ByName("game_id")

	game, err := service.GetGame(gameID)
	if err != nil {
		c.JSON(400, err.Error())
		return
	}
	c.JSON(200, game)
}
