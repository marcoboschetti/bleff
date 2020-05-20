package service

import (
	"github.com/gofrs/uuid"

	"bitbucket.org/marcoboschetti/bleff/entities"
)

func CreateNewGame(playerName string) entities.Game {
	player := createNewPlayer(playerName)

	return entities.Game{
		ID:          entities.GetRandomWordJoin(3),
		Status:      "pending",
		Players:     []entities.Player{player},
		PlayedCards: nil,
	}
}

func createNewPlayer(playerName string) entities.Player {
	playerID, _ := uuid.NewV4()
	return entities.Player{
		ID:     playerID.String(),
		Name:   "playerNames",
		Points: 0,
	}
}
