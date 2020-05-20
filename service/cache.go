package service

import (
	"sync"

	"bitbucket.org/marcoboschetti/bleff/entities"
)

type GameMap struct {
	sync.RWMutex
	internal map[string]*entities.Game
}

func NewGameMap() *GameMap {
	return &GameMap{
		internal: make(map[string]*entities.Game),
	}
}
