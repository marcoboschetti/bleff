package entities

import "time"

type (
	Game struct {
		ID               string    `json:"id,omitempty"`
		Status           string    `json:"status,omitempty"`
		IsPrivate        bool      `json:"is_private"`
		Players          []Player  `json:"players,omitempty"`
		TargetPoints     uint64    `json:"target_points,omitempty"`
		Bots             uint64    `json:"bots,omitempty"`
		CurrentDealerIdx uint64    `json:"dealer_index"`
		CurrentGameState GameState `json:"game_state,omitempty"`
		LastRequestTime  time.Time `json:"-"`

		// Time management
		SecsPerState              uint64     `json:"secs_per_state,omitempty"`
		CurrentStateStartTime     *time.Time `json:"-"`
		CurrentStateRemainingSecs int        `json:"current_state_remaining_secs"`

		// State 0, dealer choose card
		DefinitionOptions []PersistedDefinition `json:"definition_options,omitempty"`
		// State 1, card selected
		CurrentCard PersistedDefinition `json:"current_card,omitempty"`
		// State 2, players upload definitions
		FakeDefinitions []Definition `json:"fake_definitions,omitempty"`
		// State 3, players and real. To choose from
		AllDefinitions     []Definition `json:"all_definitions,omitempty"`
		CorrectDefinitions []Definition `json:"correct_definitions,omitempty"`
		// State 4, each player chooses one definition
		ChosenDefinitions []ChosenDefinition `json:"chosen_definitions,omitempty"`
	}

	Player struct {
		ID     string `json:"id,omitempty"`
		Name   string `json:"name,omitempty"`
		Points uint64 `json:"points"`
		IsBot  bool   `json:"is_bot"`
	}

	Definition struct {
		ID         string `json:"id,omitempty"`
		Player     string `json:"player,omitempty"`
		Definition string `json:"definition,omitempty"`
		IsReal     bool   `json:"is_real,omitempty"`
	}

	ChosenDefinition struct {
		DefinitionID string `json:"id,omitempty"`
		Player       string `json:"player,omitempty"`
	}

	PersistedDefinition struct {
		ID         string `json:"id,omitempty"`
		Word       string `json:"word,omitempty"`
		Definition string `json:"definition,omitempty"`
	}
)
