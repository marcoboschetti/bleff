package service

import (
	"fmt"

	"bitbucket.org/marcoboschetti/bleff/entities"
)

func changeGameForCurrentState(game *entities.Game, selectedWord string) {
	switch game.CurrentGameState {
	case entities.DealerChooseCardGameState:
		setCardsForDealerToChoose(game)
	case entities.WriteDefinitionsGameState:
		setupWordOption(game, selectedWord)
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
