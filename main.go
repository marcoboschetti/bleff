package main

import (
	"log"
	"net/http"
	"os"

	"bitbucket.org/marcoboschetti/bleff/data"
	"github.com/gin-gonic/gin"
)

func main() {
	data.SetDbConnection()

	runPlottingServer()
}

func runPlottingServer() {
	port := os.Getenv("PORT")
	if port == "" {
		log.Fatal("$PORT must be set")
	}

	// Static
	r := gin.Default()
	r.GET("/", func(c *gin.Context) {
		http.ServeFile(c.Writer, c.Request, "./site/index.html")
	})
	r.Static("/site", "./site/")

	// API Endpoints
	SetupGameHandlers(r)

	// Boot
	r.Run(":" + port)
}
