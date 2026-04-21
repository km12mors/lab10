const express = require("express");
const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync("./Chinook_Sqlite.sqlite");
const app = express();
app.use(express.json());
// Test route: list all tables in the database
app.get('/tables', (req, res) => {
const stmt = db.prepare(
"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
);
res.json(stmt.all());
});
app.listen(3000, () => {
console.log("Server running on http://localhost:3000");
});