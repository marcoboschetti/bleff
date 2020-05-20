package data

import (
	"crypto/tls"
	"math/rand"
	"time"

	"github.com/go-pg/pg"
	"github.com/go-pg/pg/orm"

	"bitbucket.org/marcoboschetti/bleff/entities"
)

var pgConnection *pg.DB

var allDefinitions []entities.PersistedDefinition

// SetDbConnection inits a single DB connection
func SetDbConnection() {
	db := pg.Connect(&pg.Options{
		Addr:      "ec2-52-207-25-133.compute-1.amazonaws.com:5432",
		Database:  "d575jf50hfmlt6",
		User:      "hjcmpdfzrixuhp",
		Password:  "c04ea32da04964925f80932d6686d440762c790bfd0c0a8d62a93a43cc0c50bc",
		TLSConfig: &tls.Config{InsecureSkipVerify: true},
	})

	createSchema(db)

	pgConnection = db
}

// psql -h ec2-52-207-25-133.compute-1.amazonaws.com -p 5432 -U hjcmpdfzrixuhp d575jf50hfmlt6

func createSchema(db *pg.DB) error {
	for _, model := range []interface{}{
		(*entities.PersistedFakeDefinition)(nil),
		(*entities.PersistedDefinition)(nil),
		(*entities.PersistedGame)(nil)} {
		err := db.CreateTable(model, &orm.CreateTableOptions{
			Temp:          false,
			IfNotExists:   true,
			FKConstraints: true,
		})
		if err != nil {
			return err
		}
	}
	return nil
}

func GetAllDefinitions() ([]entities.PersistedDefinition, error) {

	if allDefinitions != nil {
		return allDefinitions, nil
	}

	err := pgConnection.Model(&allDefinitions).Select()

	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(allDefinitions), func(i, j int) { allDefinitions[i], allDefinitions[j] = allDefinitions[j], allDefinitions[i] })

	return allDefinitions, err
}
