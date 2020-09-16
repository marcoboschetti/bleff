package service

import (
	"time"

	"bitbucket.org/marcoboschetti/bleff/entities"
)

func StartGarbageCollector() {
	ticker := time.NewTicker(entities.GarbageCollectorLastUpdateSeconds * time.Second)

	go func() {
		for {
			<-ticker.C
			removedDueGames()
		}
	}()
}

func removedDueGames() {
	gamesMap.Lock()
	defer gamesMap.Unlock()

	for gameID, game := range gamesMap.internal {
		if time.Since(game.LastRequestTime).Seconds() > entities.GarbageCollectorLastUpdateSeconds {
			gamesMap.internal[gameID] = nil
		}
	}
}
