package sheets

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strings"
	"time"

	"bitbucket.org/marcoboschetti/bleff/entities"
	"golang.org/x/net/context"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/sheets/v4"
)

var service *sheets.Service

// Retrieve a token, saves the token, then returns the generated client.
func getClient(config *oauth2.Config) (*http.Client, error) {
	// The file token.json stores the user's access and refresh tokens, and is
	// created automatically when the authorization flow completes for the first
	// time.
	tokFile := "token.json"
	tok, err := tokenFromFile(tokFile)
	if err != nil {
		return nil, err
	}
	return config.Client(context.Background(), tok), nil
}

// Retrieves a token from a local file.
func tokenFromFile(file string) (*oauth2.Token, error) {
	f, err := os.Open(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	tok := &oauth2.Token{}
	err = json.NewDecoder(f).Decode(tok)
	return tok, err
}

func getService() (*sheets.Service, error) {
	b, err := ioutil.ReadFile("credentials.json")
	if err != nil {
		return nil, err
	}

	// If modifying these scopes, delete your previously saved token.json.
	config, err := google.ConfigFromJSON(b, "https://www.googleapis.com/auth/spreadsheets")
	if err != nil {
		return nil, err
	}
	client, err := getClient(config)
	if err != nil {
		return nil, err
	}

	srv, err := sheets.New(client)
	if err != nil {
		return nil, err
	}
	return srv, nil
}

func PersistNewFakeDefinition(word, definition, playerName, game string, votes uint) error {
	var err error
	if service == nil {
		service, err = getService()
		if err != nil {
			return err
		}
	}

	spreadsheetID := "1fhaW5cApXYAnwJLuk2jnhwl82V5MILAjZf6-wnZkfkc"
	writeRange := "Fake Definitions!A:F"
	var vr sheets.ValueRange

	vals := []interface{}{word, definition, playerName, game, votes, time.Now()}
	vr.Values = append(vr.Values, vals)

	_, err = service.Spreadsheets.Values.Append(spreadsheetID, writeRange, &vr).ValueInputOption("RAW").Do()
	return err
}

func PersistGameStarted(game entities.Game) error {
	var err error
	if service == nil {
		service, err = getService()
		if err != nil {
			return err
		}
	}

	var playersNames []string
	for _, p := range game.Players {
		playersNames = append(playersNames, p.Name)
	}

	spreadsheetID := "1fhaW5cApXYAnwJLuk2jnhwl82V5MILAjZf6-wnZkfkc"
	writeRange := "Games!A:G"
	var vr sheets.ValueRange

	vals := []interface{}{game.ID, len(playersNames), strings.Join(playersNames, ", "), time.Now(), game.TargetPoints, game.SecsPerState, game.Bots}
	vr.Values = append(vr.Values, vals)

	_, err = service.Spreadsheets.Values.Append(spreadsheetID, writeRange, &vr).ValueInputOption("RAW").Do()
	return err
}

var botsDefinitions map[int]map[string][]string

func GetUsableBotsDefinitions() (map[int]map[string][]string, error) {
	if botsDefinitions != nil {
		return botsDefinitions, nil
	}

	var err error
	if service == nil {
		service, err = getService()
		if err != nil {
			return nil, err
		}
	}

	spreadsheetID := "1fhaW5cApXYAnwJLuk2jnhwl82V5MILAjZf6-wnZkfkc"
	readRange := "'Fake Definitions Configuration'!A:B"

	resp, err := service.Spreadsheets.Values.Get(spreadsheetID, readRange).Do()

	if err != nil {
		fmt.Println(err)
		return nil, err
	}

	botsDefinitions := map[int]map[string][]string{}
	tmpBotsDefinitions := map[string][]string{}

	for _, v := range resp.Values {
		word := v[0].(string)
		definition := v[1].(string)

		if tmpBotsDefinitions[word] == nil {
			tmpBotsDefinitions[word] = []string{}
		}
		tmpBotsDefinitions[word] = append(tmpBotsDefinitions[word], definition)
	}

	// Move to histogram
	for word, defs := range tmpBotsDefinitions {
		if botsDefinitions[len(defs)] == nil {
			botsDefinitions[len(defs)] = map[string][]string{}
		}
		botsDefinitions[len(defs)][word] = tmpBotsDefinitions[word]
	}

	return botsDefinitions, nil
}
