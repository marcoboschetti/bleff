package service

import (
	"fmt"
	"math/rand"
	"time"

	"bitbucket.org/marcoboschetti/bleff/entities"
	"bitbucket.org/marcoboschetti/bleff/sheets"
)

func changeGameForCurrentState(game *entities.Game, selectedWord string, correctDefinitionIDs []string) {
	now := time.Now()
	game.CurrentStateStartTime = &now

	switch game.CurrentGameState {
	case entities.DealerChooseCardGameState:
		setCardsForDealerToChoose(game)
	case entities.WriteDefinitionsGameState:
		setupWordOption(game, selectedWord)
	case entities.ShowDefinitions:
		moveDefinitionsToDisplay(game)
	case entities.ChooseDefinitions:
		filterCorrectDefinitions(game, correctDefinitionIDs)
	case entities.ShowDefinitionsAndScores:
		givePointsForDefinitions(game)
	default:
		fmt.Println("Not supported state:" + game.CurrentGameState)
	}
}

func setCardsForDealerToChoose(game *entities.Game) {
	options := make([]entities.PersistedDefinition, entities.CardsToChooseFrom)
	for idx := 0; idx < entities.CardsToChooseFrom; idx++ {
		options[idx] = getRandomPersistedDefinition(game.Bots)
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

	// Bots select definitions
	if game.Bots > 0 {
		var possibleDefinitions []string
		botsDefinitions, _ := sheets.GetUsableBotsDefinitions()
		for _, defsMap := range botsDefinitions {
			if defs, ok := defsMap[game.CurrentCard.Word]; ok {
				possibleDefinitions = defs
			}
		}

		rand.Shuffle(len(possibleDefinitions), func(i, j int) {
			possibleDefinitions[i], possibleDefinitions[j] = possibleDefinitions[j], possibleDefinitions[i]
		})

		for idx, player := range game.Players {
			if player.IsBot {
				newPlayerDefinition := entities.Definition{
					ID:         getUuidv4(),
					Player:     player.Name,
					Definition: possibleDefinitions[idx%len(possibleDefinitions)],
				}

				game.FakeDefinitions = append(game.FakeDefinitions, newPlayerDefinition)
			}
		}
	}
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

func filterCorrectDefinitions(game *entities.Game, correctDefinitionIDs []string) {
	for _, defID := range correctDefinitionIDs {
		playerIdx := findPlayerWithDefinitionID(defID, game)
		game.Players[playerIdx].Points += entities.PointsForPlayerCorrectDefinitions
	}

	// Check if player already submitted a definition
	filteredDefinitions := []entities.Definition{}

	for _, def := range game.AllDefinitions {
		if !containsString(correctDefinitionIDs, def.ID) {
			filteredDefinitions = append(filteredDefinitions, def)
		} else {
			game.CorrectDefinitions = append(game.CorrectDefinitions, def)
		}
	}

	// Add new definition
	game.AllDefinitions = filteredDefinitions
}

func givePointsForDefinitions(game *entities.Game) {

	selectedCorrectDefinition := false

	for _, def := range game.ChosenDefinitions {
		selectedDefIdx := findDefinitionByID(def.DefinitionID, game)

		if game.AllDefinitions[selectedDefIdx].IsReal {
			// Points for voter player, by correct definition
			playerIdx := findPlayerWithName(def.Player, game.Players)
			game.Players[playerIdx].Points += entities.PointsForPlayerChoosingCorrectDefinition
			selectedCorrectDefinition = true
		} else {
			// Points for player who wrote definition
			playerIdx := findPlayerWithName(game.AllDefinitions[selectedDefIdx].Player, game.Players)
			if game.Players[playerIdx].Name != def.Player {
				game.Players[playerIdx].Points += entities.PointsForHavingDefinitionChosen
			}
		}
	}

	// Assign points based on correct definitions
	if !selectedCorrectDefinition {
		// No real definitions, points for dealer
		game.Players[game.CurrentDealerIdx].Points += entities.PointsForDealerNoCorrectDefinitions
	}

	// Post for sheets
	for _, fakeDef := range game.AllDefinitions {
		if fakeDef.IsReal {
			continue
		}

		totalVotes := countVotesForDefinition(fakeDef.ID, game)
		err := sheets.PersistNewFakeDefinition(game.CurrentCard.Word, fakeDef.Definition, fakeDef.Player, game.ID, totalVotes)
		if err != nil {
			fmt.Println(err.Error())
		}
	}
}

func countVotesForDefinition(definitionID string, game *entities.Game) uint {
	var total uint
	for _, vote := range game.ChosenDefinitions {
		if vote.DefinitionID == definitionID {
			total++
		}
	}

	return total
}
