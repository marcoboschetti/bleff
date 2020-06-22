package data

import (
	"crypto/tls"
	"math/rand"
	"os"
	"strings"
	"time"

	"github.com/go-pg/pg"
	"github.com/go-pg/pg/orm"

	"bitbucket.org/marcoboschetti/bleff/entities"
)

var pgConnection *pg.DB

var allDefinitions []entities.PersistedDefinition

// SetDbConnection inits a single DB connection
func SetDbConnection() {
	databaseURL := os.Getenv("DATABASE_URL")
	password := strings.Split(strings.Split(databaseURL, ":")[2], "@")[0]

	db := pg.Connect(&pg.Options{
		Addr:      "ec2-35-173-94-156.compute-1.amazonaws.com:5432",
		Database:  "d47o4civ8ddcec",
		User:      "wmfqvhipkrfgig",
		Password:  password,
		TLSConfig: &tls.Config{InsecureSkipVerify: true},
	})

	createSchema(db)

	pgConnection = db
}

// psql -h ec2-35-173-94-156.compute-1.amazonaws.com -p 5432 -U wmfqvhipkrfgig d47o4civ8ddcec

func createSchema(db *pg.DB) error {
	for _, model := range []interface{}{
		(*entities.PersistedDefinition)(nil),
	} {
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
