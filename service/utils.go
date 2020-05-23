package service

import (
	"math/rand"

	"bitbucket.org/marcoboschetti/bleff/data"
	"bitbucket.org/marcoboschetti/bleff/entities"
	"github.com/gofrs/uuid"
)

func getRandomPersistedDefinition() entities.PersistedDefinition {
	definitions, _ := data.GetAllDefinitions()
	return definitions[rand.Intn(len(definitions))]
}

func getUuidv4() string {
	id, _ := uuid.NewV4()
	return id.String()
}

func containsString(values []string, key string) bool {
	for _, s := range values {
		if s == key {
			return true
		}
	}
	return false
}

func findPlayerWithDefinitionID(defID string, game *entities.Game) int {
	for _, def := range game.AllDefinitions {
		// Find definition
		if def.ID == defID {
			return findPlayerWithName(def.Player, game.Players)
		}
	}

	return 0
}

func findDefinitionByID(defID string, game *entities.Game) int {
	for idx, def := range game.AllDefinitions {
		// Find definition
		if def.ID == defID {
			return idx
		}
	}

	return 0
}

func findPlayerWithName(playerName string, players []entities.Player) int {
	for idx, player := range players {
		if player.Name == playerName {
			return idx
		}
	}
	return 0
}
