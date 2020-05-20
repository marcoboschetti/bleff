package main

import (
	"bitbucket.org/marcoboschetti/bleff/service"
	"github.com/gin-gonic/gin"
)

func SetupGameHandlers(r *gin.Engine) {
	apiGroup := r.Group("/api")

	gameGroup := apiGroup.Group("/game")
	gameGroup.POST("/", createNewGame)
}

func createNewGame(c *gin.Context) {
	playerName := c.Params.ByName("player_name")

	newGame := service.CreateNewGame(playerName)

	c.JSON(200, newGame)
}

// func postNewImageJob(c *gin.Context) {
// 	inputImage := struct {
// 		File      string `form:"file" binding:"required"`
// 		FileName  string `form:"qqfilename" binding:"required"`
// 		TotalSize uint64 `form:"qqtotalfilesize" binding:"required"`
// 	}{}

// 	// Load
// 	err := c.ShouldBindWith(&inputImage, binding.Form)
// 	if err != nil {
// 		c.JSON(500, gin.H{"error": err.Error()})
// 		return
// 	}
// 	fmt.Println("Accepted", inputImage.FileName)

// 	file, _, err := c.Request.FormFile("qqfile")
// 	if err != nil {
// 		c.JSON(500, gin.H{"error": err.Error()})
// 		return
// 	}

// 	imgPayload := make([]byte, inputImage.TotalSize)
// 	_, err = file.Read(imgPayload)
// 	if err != nil {
// 		c.JSON(500, gin.H{"error": err.Error()})
// 		return
// 	}

// 	job, outputImgs, err := service.ResizeImage(imgPayload)
// 	if err != nil {
// 		c.JSON(500, gin.H{"error": err.Error()})
// 		return
// 	}

// 	c.JSON(200, gin.H{
// 		"success": true,
// 		"output":  outputImgs,
// 		"job":     *job,
// 	})
// }
