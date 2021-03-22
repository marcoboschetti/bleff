package service

import (
	"errors"
	"fmt"
	"math/rand"
	"time"

	"bitbucket.org/marcoboschetti/bleff/entities"
	"bitbucket.org/marcoboschetti/bleff/sheets"
)

var gamesMap = NewGameMap()

func CreateNewGame(playerName string, targetPoints, secsPerState, botsCount uint64) entities.Game {
	player := createNewPlayer(playerName)

	newGame := entities.Game{
		ID:              entities.GetRandomWordJoin(3),
		Status:          "pending",
		Bots:            botsCount,
		IsPrivate:       true,
		Players:         []entities.Player{player},
		TargetPoints:    targetPoints,
		SecsPerState:    secsPerState,
		LastRequestTime: time.Now(),
	}

	for i := 0; i < int(botsCount); i++ {
		newGame.Players = append(newGame.Players, createNewPlayerBot())
	}

	fmt.Println(botsCount)
	fmt.Println(newGame.Players)

	gamesMap.Lock()
	gamesMap.internal[newGame.ID] = &newGame
	defer gamesMap.Unlock()

	return newGame
}

func JoinPublicGame(playerName string) (*entities.Game, error) {
	gamesMap.Lock()
	defer gamesMap.Unlock()

	// Find a public game
	var game *entities.Game
	for _, g := range gamesMap.internal {
		if !g.IsPrivate && g.Status == "pending" {
			game = g
			break
		}
	}

	if game == nil {
		// If not existing game, create one
		game = &entities.Game{
			ID:              entities.GetRandomWordJoin(3),
			Status:          "pending",
			IsPrivate:       false,
			Players:         []entities.Player{createNewPlayer(playerName)},
			TargetPoints:    entities.DefaultPoints,
			SecsPerState:    entities.DefaultTimeSecs,
			LastRequestTime: time.Now(),
		}
		gamesMap.internal[game.ID] = game
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

func JoinGame(playerName, gameID string) (*entities.Game, error) {
	gamesMap.Lock()
	game, ok := gamesMap.internal[gameID]
	defer gamesMap.Unlock()

	if !ok || game == nil {
		return nil, errors.New("game not found: " + gameID)
	}

	if !game.IsPrivate && game.Status != "pending" {
		return nil, errors.New("cannot join public game already started: " + gameID)
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

	if !ok || game == nil || !game.IsPrivate {
		return nil, errors.New("game not found: " + gameID)
	}

	game.Status = "started"
	game.CurrentGameState = entities.DealerChooseCardGameState

	sheets.PersistGameStarted(*game)

	changeGameForCurrentState(game, "", nil)
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
	changeGameForCurrentState(game, word, nil)
	return game, nil
}

func SetPlayerDefinition(gameID, playerName, definition string) (*entities.Game, error) {
	gamesMap.Lock()
	game, ok := gamesMap.internal[gameID]
	defer gamesMap.Unlock()

	if !ok {
		return nil, errors.New("game not found: " + gameID)
	}

	// Check if player already submitted a definition
	for _, def := range game.FakeDefinitions {
		if def.Player == playerName {
			// No op
			return game, nil
		}
	}

	definition = sanitizeDefintion(definition)

	// Add new definition
	newPlayerDefinition := entities.Definition{
		ID:         getUuidv4(),
		Player:     playerName,
		Definition: definition,
	}
	game.FakeDefinitions = append(game.FakeDefinitions, newPlayerDefinition)

	// Check if fake definition is ready
	if len(game.FakeDefinitions) == len(game.Players)-1 {
		// All definitions are completed
		game.CurrentGameState = entities.GetNextState(game.CurrentGameState)
		changeGameForCurrentState(game, "", nil)
	}

	return game, nil
}

func PostCorrectDefinitions(gameID, playerName string, correctDefinitionIDs []string) (*entities.Game, error) {
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
	changeGameForCurrentState(game, "", correctDefinitionIDs)

	// Check if should bypass the "select definitions" state, if all definitions are ok
	if len(correctDefinitionIDs) == len(game.Players)-1 {
		game.CurrentGameState = entities.GetNextState(game.CurrentGameState)
		game.ChosenDefinitions = []entities.ChosenDefinition{}
		changeGameForCurrentState(game, "", nil)
	}

	return game, nil
}

func PostChosenDefinition(gameID, playerName, chosenDefinitionID string) (*entities.Game, error) {
	gamesMap.Lock()
	game, ok := gamesMap.internal[gameID]
	defer gamesMap.Unlock()

	if !ok {
		return nil, errors.New("game not found: " + gameID)
	}

	// Check if player already chosen a definition
	for _, def := range game.ChosenDefinitions {
		if def.Player == playerName {
			// No op
			return game, nil
		}
	}

	// Check if player already had a correct definition
	for _, correctDef := range game.CorrectDefinitions {
		if correctDef.Player == playerName {
			// No op
			return game, nil
		}
	}

	// Add new definition
	newChosenDefinition := entities.ChosenDefinition{
		Player:       playerName,
		DefinitionID: chosenDefinitionID,
	}
	game.ChosenDefinitions = append(game.ChosenDefinitions, newChosenDefinition)

	// Check if fake definition is ready
	if len(game.ChosenDefinitions)+int(game.Bots) == len(game.Players)-1-len(game.CorrectDefinitions) {
		// All definitions are completed
		game.CurrentGameState = entities.GetNextState(game.CurrentGameState)
		changeGameForCurrentState(game, "", nil)
	}

	return game, nil
}

func PostEndRound(gameID, playerName string) (*entities.Game, error) {
	gamesMap.Lock()
	game, ok := gamesMap.internal[gameID]
	defer gamesMap.Unlock()

	if !ok {
		return nil, errors.New("game not found: " + gameID)
	}

	// Check if player already submitted a definition
	if game.Players[game.CurrentDealerIdx].Name != playerName {
		return nil, errors.New("not current dealer of game: " + gameID)
	}

	game.AllDefinitions = nil
	game.CorrectDefinitions = nil
	game.ChosenDefinitions = nil
	game.CurrentCard = entities.PersistedDefinition{}
	game.FakeDefinitions = nil
	game.DefinitionOptions = nil

	// Check winners
	gameEnded := false
	for _, player := range game.Players {
		if player.Points >= game.TargetPoints {
			game.Status = "finished"
			gameEnded = true
		}
	}

	if !gameEnded {
		game.CurrentGameState = entities.GetNextState(game.CurrentGameState)

		nextDealer := int(game.CurrentDealerIdx+1) % len(game.Players)
		game.CurrentDealerIdx = uint64(nextDealer)

		for game.Players[game.CurrentDealerIdx].IsBot {
			nextDealer = int(game.CurrentDealerIdx+1) % len(game.Players)
			game.CurrentDealerIdx = uint64(nextDealer)
		}

		changeGameForCurrentState(game, "", nil)
	}

	return game, nil
}

func RemovePlayer(gameID, playerName, playerIdToRemove string) (*entities.Game, error) {
	gamesMap.Lock()
	game, ok := gamesMap.internal[gameID]
	defer gamesMap.Unlock()

	if !ok {
		return nil, errors.New("game not found: " + gameID)
	}

	// Check if player already submitted a definition
	if game.Players[0].Name != playerName {
		return nil, errors.New("not current owner of game: " + gameID)
	}

	// Find player idx from the id
	playerToRemoveIdx := -1
	for idx, player := range game.Players {
		if player.ID == playerIdToRemove {
			playerToRemoveIdx = idx
		}
	}
	if playerToRemoveIdx < 1 {
		return game, nil
	}

	// Remove the player from the game
	game.Players = append(game.Players[:playerToRemoveIdx], game.Players[playerToRemoveIdx+1:]...)

	return game, nil
}

func GetGame(gameID string) (*entities.Game, error) {
	gamesMap.Lock()
	game, ok := gamesMap.internal[gameID]
	defer gamesMap.Unlock()

	if !ok || game == nil {
		return nil, errors.New("game not found: " + gameID)
	}

	game.LastRequestTime = time.Now()

	// Check if public game should be started
	if !game.IsPrivate && game.Status == "pending" && len(game.Players) >= entities.MinPlayersToStartPublic {
		game.Status = "started"
		game.CurrentGameState = entities.DealerChooseCardGameState
		sheets.PersistGameStarted(*game)
		changeGameForCurrentState(game, "", nil)
	}

	// Check if the current round already timed out
	if game.Status == "started" && game.SecsPerState > 0 && uint64(time.Now().Sub(*game.CurrentStateStartTime).Seconds()) >= game.SecsPerState {
		executeOverTimeActions(game)
	}

	return game, nil
}

func executeOverTimeActions(game *entities.Game) {
	if game.CurrentGameState == entities.WriteDefinitionsGameState {
		// Fill definitions and go to next
		for idx, player := range game.Players {
			playerHasDefinition := false
			for _, def := range game.FakeDefinitions {
				if def.Player == player.Name {
					playerHasDefinition = true
				}
			}
			// If player has not fake definition, invent one
			if !playerHasDefinition && uint64(idx) != game.CurrentDealerIdx {
				newPlayerDefinition := entities.Definition{
					ID:         getUuidv4(),
					Player:     player.Name,
					Definition: "* El jugador no llegó a completar una definición a tiempo *",
				}
				game.FakeDefinitions = append(game.FakeDefinitions, newPlayerDefinition)
			}
		}
		game.CurrentGameState = entities.GetNextState(game.CurrentGameState)
		changeGameForCurrentState(game, "", nil)

	} else if game.CurrentGameState == entities.ChooseDefinitions {
		// Missing definitions to upload. Bad luck...
		game.CurrentGameState = entities.GetNextState(game.CurrentGameState)
		changeGameForCurrentState(game, "", nil)
	}
}

func createNewPlayer(playerName string) entities.Player {
	return entities.Player{
		ID:     getUuidv4(),
		Name:   playerName,
		Points: 0,
		IsBot:  false,
	}
}

var botsNames = []string{"Zeus", "Hera", "Poseidón", "Ares", "Hermes", "Hefesto", "Afrodita", "Atenea", "Apolo", "Artemisa", "Hestia", "Deméter", "Dioniso", "Hades", "Perséfone", "Hebe", "Asclepio", "Eros", "Pan", "Heracles"}

func createNewPlayerBot() entities.Player {
	return entities.Player{
		ID:     getUuidv4(),
		Name:   botsNames[rand.Intn(len(botsNames))] + " (bot)",
		Points: 0,
		IsBot:  true,
	}
}
