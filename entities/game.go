package entities

type (
	Game struct {
		ID                string                `json:"id,omitempty"`
		Status            string                `json:"status,omitempty"`
		Players           []Player              `json:"players,omitempty"`
		PlayedCards       []WordCard            `json:"-,omitempty"`
		CurrentCard       PersistedDefinition   `json:"current_card,omitempty"`
		CurrentDealerIdx  uint64                `json:"dealer_index"`
		CurrentGameState  GameState             `json:"game_state,omitempty"`
		DefinitionOptions []PersistedDefinition `json:"definition_options,omitempty"`
	}

	Player struct {
		ID     string `json:"id,omitempty"`
		Name   string `json:"name,omitempty"`
		Points uint64 `json:"points,omitempty"`
	}

	WordCard struct {
		Word            string              `json:"word,omitempty"`
		RealDefinition  PersistedDefinition `json:"real_definition,omitempty"`
		FakeDefinitions []FakeDefinition    `json:"fake_definitions,omitempty"`
	}

	FakeDefinition struct {
		ID         string `json:"id,omitempty"`
		Player     string `json:"player,omitempty"`
		Definition string `json:"definition,omitempty"`
	}

	// Persisted entities
	PersistedFakeDefinition struct {
		ID         string `json:"id,omitempty"`
		Word       string `json:"word,omitempty"`
		Definition string `json:"definition,omitempty"`
		Player     string `json:"player,omitempty"`
	}

	PersistedDefinition struct {
		ID         string `json:"id,omitempty"`
		Word       string `json:"word,omitempty"`
		Definition string `json:"definition,omitempty"`
	}

	PersistedGame struct {
		ID         string `json:"id,omitempty"`
		Status     string `json:"status,omitempty"`
		Players    string `json:"players,omitempty"`
		TotalCards string `json:"played_cards,omitempty"`
	}
)
