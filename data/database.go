package data

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math/rand"
	"os"
	"time"

	"bitbucket.org/marcoboschetti/bleff/entities"
)

var allDefinitions []entities.PersistedDefinition

func GetAllDefinitions() ([]entities.PersistedDefinition, error) {

	if allDefinitions != nil {
		return allDefinitions, nil
	}

	jsonFile, err := os.Open("defs.json")
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println("Successfully Opened users.json")
	defer jsonFile.Close()

	byteValue, _ := ioutil.ReadAll(jsonFile)
	json.Unmarshal(byteValue, &allDefinitions)

	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(allDefinitions), func(i, j int) { allDefinitions[i], allDefinitions[j] = allDefinitions[j], allDefinitions[i] })

	return allDefinitions, err
}
