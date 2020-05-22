package entities

type (
	Game struct {
		ID               string    `json:"id,omitempty"`
		Status           string    `json:"status,omitempty"`
		Players          []Player  `json:"players,omitempty"`
		CurrentDealerIdx uint64    `json:"dealer_index"`
		CurrentGameState GameState `json:"game_state,omitempty"`
		PlayedWords      []string  `json:"-,omitempty"`

		// State 0, dealer choose card
		DefinitionOptions []PersistedDefinition `json:"definition_options,omitempty"`
		// State 1, card selected
		CurrentCard PersistedDefinition `json:"current_card,omitempty"`
		// State 2, players upload definitions
		FakeDefinitions []Definition `json:"fake_definitions"`
		// State 3, players and real. To choose from
		AllDefinitions []Definition `json:"all_definitions"`
	}

	Player struct {
		ID     string `json:"id,omitempty"`
		Name   string `json:"name,omitempty"`
		Points uint64 `json:"points,omitempty"`
	}

	Definition struct {
		ID         string `json:"id,omitempty"`
		Player     string `json:"player,omitempty"`
		Definition string `json:"definition,omitempty"`
		IsReal     bool   `json:"is_real,omitempty"`
	}

	PersistedDefinition struct {
		ID         string `json:"id,omitempty"`
		Word       string `json:"word,omitempty"`
		Definition string `json:"definition,omitempty"`
	}
)
