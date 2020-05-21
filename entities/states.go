package entities

type GameState string

const (
	// + Dealer elije carta de entre 4 random
	DealerChooseCardGameState GameState = "dealer_choose_card"

	// + Cada miembro escribe en secreto
	WriteDefinitionsGameState GameState = "write_definitions"

	// + Dealer lee las definiciones + la posta
	ShowDefinitions GameState = "show_definitions"

	// + En ronda, cada jugador elije una definicion (dealer+1 en adelante)
	ChooseDefinitions GameState = "choose_definitions"

	// + Se muestran jugadores y puntos
	ShowDefinitionsAndScores GameState = "show_definitions_and_scores"

	// + Fin de la ronda
	EndRound GameState = "end_round"
)

var statesMap = map[GameState]GameState{
	DealerChooseCardGameState: WriteDefinitionsGameState,
	WriteDefinitionsGameState: ShowDefinitions,
	ShowDefinitions:           ChooseDefinitions,
	ChooseDefinitions:         ShowDefinitionsAndScores,
	ShowDefinitionsAndScores:  EndRound,
	EndRound:                  DealerChooseCardGameState,
}

func GetNextState(currentState GameState) GameState {
	return statesMap[currentState]
}
