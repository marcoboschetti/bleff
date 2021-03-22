package service

import (
	"bytes"
	"fmt"
	"math/rand"
	"strings"

	"bitbucket.org/marcoboschetti/bleff/data"
	"bitbucket.org/marcoboschetti/bleff/entities"
	"bitbucket.org/marcoboschetti/bleff/sheets"
	"github.com/gofrs/uuid"
)

func sanitizeDefintion(definition string) string {
	definition = strings.TrimSpace(definition)
	if definition[len(definition)-1] != '.' {
		definition = fmt.Sprintf("%s.", definition)
	}
	return makeFirstLowerCase(definition)
}

func makeFirstLowerCase(s string) string {
	if len(s) < 2 {
		return s
	}
	bts := []byte(s)
	lc := bytes.ToUpper([]byte{bts[0]})
	rest := bts[1:]
	return string(bytes.Join([][]byte{lc, rest}, nil))
}

func getRandomPersistedDefinition(bots uint64) entities.PersistedDefinition {
	definitions, _ := data.GetAllDefinitions()
	chosenDefinition := definitions[rand.Intn(len(definitions))]

	if bots > 0 {
		botsDefMaps, _ := sheets.GetUsableBotsDefinitions()
		for i := 0; i < 300; i++ {

			for defsCount, defsMap := range botsDefMaps {
				if _, ok := defsMap[chosenDefinition.Word]; ok && uint64(defsCount) >= bots {
					fmt.Println("OK ", chosenDefinition)
					return chosenDefinition
				}
			}

			chosenDefinition = definitions[rand.Intn(len(definitions))]
		}
	}

	return chosenDefinition
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
