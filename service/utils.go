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
