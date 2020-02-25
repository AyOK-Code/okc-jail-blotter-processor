# Oklahoma City Jail Blotter Processor

## Local development

### Install
Requirements:
- Node 12+
- Docker

On MacOS, it is recommended to install Node using Homebrew:
```sh
brew install node
```

Clone the repo, then run
```sh
npm install
```

This project uses [StandardJS](https://standardjs.com/). Please make sure your files are correctly linted before pushing.

### Running the tests
```sh
npm run download-fixtures
npm test

# Optional, to run more extensive tests:
# npm run download-fixtures all
# Then run `npm test` as usual
```

### Running the app
This will fetch, process and save all PDFs currently listed online. This is the command invoked by the Heroku Scheduler.
```sh
docker-compose up
npm start
```
To shut down the DB and wipe all temporary data, run `docker-compose down`.

### Manually parsing a single PDF
As usual make sure the DB is running (`docker-compose up`).
```sh
cd src
node index.js ../test/fixtures/some_specific_file.pdf
```
Then inspect `tokens.txt` and `parsed.json`

To update the test data for that file:
```sh
node index.js ../test/fixtures/some_specific_file.pdf update
```

### Inspecting the DB
As usual make sure the DB is running (`docker-compose up`).
```sh
PGPASSWORD=Password123 psql -h localhost -U postgres
```

### DB changes
1. Create a new migration file, the migration file's name must match the pattern and have the current date and time.
2. Make changes to the database structures in the migration file.
3. Update the model files.
4. Verify that it works: `docker-compose down && docker-compose up`, then `npm start`.
5. Finally but most importantly: have someone knowledgeable review your changes.
