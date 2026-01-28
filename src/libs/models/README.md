 Ideas
 * jubuntus holds all data and ingests new photos
 * jwind holds the models and has the gpu to process images
 * jubuntus sends a request to jwind for structured response data and stores that it its db

 * ideas:
 * 1. let the llm create tags that are searchable in the UI
 * 2. let the llm detect faces and store that data per image in the db
 * 3. give the llm a tool to talk to the db over http and make queries to find similar images

# References
* https://modelcontextprotocol.io/docs/develop/build-client#typescript
* https://platform.openai.com/docs/guides/migrate-to-responses
* https://platform.openai.com/docs/guides/function-calling?lang=python

# mcps
google calendar mcp
git@github.com:nspady/google-calendar-mcp.git