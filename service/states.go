package service

import (
	"fmt"
	"math/rand"

	"bitbucket.org/marcoboschetti/bleff/entities"
)

func changeGameForCurrentState(game *entities.Game, selectedWord string) {
	switch game.CurrentGameState {
	case entities.DealerChooseCardGameState:
		setCardsForDealerToChoose(game)
	case entities.WriteDefinitionsGameState:
		setupWordOption(game, selectedWord)
	case entities.ShowDefinitions:
		moveDefinitionsToDisplay(game)
	default:
		fmt.Println("Not supported state:" + game.CurrentGameState)
	}
}

func setCardsForDealerToChoose(game *entities.Game) {
	options := make([]entities.PersistedDefinition, entities.CardsToChooseFrom)
	for idx := 0; idx < entities.CardsToChooseFrom; idx++ {
		options[idx] = getRandomPersistedDefinition()
	}
	game.DefinitionOptions = options
}

func setupWordOption(game *entities.Game, word string) {
	var selectedWord entities.PersistedDefinition
	for _, definition := range game.DefinitionOptions {
		if definition.Word == word {
			selectedWord = definition
			break
		}
	}
	// Clear options
	game.DefinitionOptions = nil

	// Set selected card
	game.CurrentCard = selectedWord
}

func moveDefinitionsToDisplay(game *entities.Game) {
	realDefinition := entities.Definition{
		ID:         getUuidv4(),
		Player:     "Real",
		Definition: game.CurrentCard.Definition,
		IsReal:     true,
	}

	allDefinitions := append(game.FakeDefinitions, realDefinition)

	// Clear fake definitions
	game.FakeDefinitions = nil

	// Good Old Shuffle
	rand.Shuffle(len(allDefinitions), func(i, j int) { allDefinitions[i], allDefinitions[j] = allDefinitions[j], allDefinitions[i] })
	game.AllDefinitions = allDefinitions
}
