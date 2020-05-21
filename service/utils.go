package service

import (
	"math/rand"

	"bitbucket.org/marcoboschetti/bleff/data"
	"bitbucket.org/marcoboschetti/bleff/entities"
)

func getRandomPersistedDefinition() entities.PersistedDefinition {
	definitions, _ := data.GetAllDefinitions()
	return definitions[rand.Intn(len(definitions))]
}
