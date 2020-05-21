package service

import (
	"errors"

	"github.com/gofrs/uuid"

	"bitbucket.org/marcoboschetti/bleff/entities"
)

var gamesMap = NewGameMap()

func CreateNewGame(playerName string) entities.Game {
	player := createNewPlayer(playerName)

	newGame := entities.Game{
		ID:          entities.GetRandomWordJoin(3),
		Status:      "pending",
		Players:     []entities.Player{player},
		PlayedCards: nil,
	}

	gamesMap.Lock()
	gamesMap.internal[newGame.ID] = &newGame
	defer gamesMap.Unlock()

	return newGame
}

func JoinGame(playerName, gameID string) (*entities.Game, error) {
	gamesMap.Lock()
	game, ok := gamesMap.internal[gameID]
	defer gamesMap.Unlock()

	if !ok {
		return nil, errors.New("game not found: " + gameID)
	}

	// Check if player already exists. Idempotency
	for _, player := range game.Players {
		if player.Name == playerName {
			return game, nil
		}
	}

	newPlayer := createNewPlayer(playerName)
	game.Players = append(game.Players, newPlayer)
	return game, nil
}

func StartGame(gameID string) (*entities.Game, error) {
	gamesMap.Lock()
	game, ok := gamesMap.internal[gameID]
	defer gamesMap.Unlock()

	if !ok {
		return nil, errors.New("game not found: " + gameID)
	}

	game.Status = "started"
	game.CurrentGameState = entities.DealerChooseCardGameState

	changeGameForCurrentState(game, "")
	return game, nil
}

func SetupSelectedWord(word, gameID, playerName string) (*entities.Game, error) {
	gamesMap.Lock()
	game, ok := gamesMap.internal[gameID]
	defer gamesMap.Unlock()

	if !ok {
		return nil, errors.New("game not found: " + gameID)
	}
	if game.Players[game.CurrentDealerIdx].Name != playerName {
		return nil, errors.New("not current dealer of game: " + gameID)
	}

	game.CurrentGameState = entities.GetNextState(game.CurrentGameState)
	changeGameForCurrentState(game, word)
	return game, nil
}

func GetGame(gameID string) (*entities.Game, error) {
	gamesMap.Lock()
	game, ok := gamesMap.internal[gameID]
	defer gamesMap.Unlock()

	if !ok {
		return nil, errors.New("game not found: " + gameID)
	}
	return game, nil
}

func createNewPlayer(playerName string) entities.Player {
	playerID, _ := uuid.NewV4()
	return entities.Player{
		ID:     playerID.String(),
		Name:   playerName,
		Points: 0,
	}
}
