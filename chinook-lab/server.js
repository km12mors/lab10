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

//ARTISTS
app.get('/artists', (req, res) => {
  const stmt = db.prepare("SELECT * FROM Artist");
  res.json(stmt.all());
});

 //artists/:id/albums
app.get("/artists/:id/albums", (req, res) => {
  const stmt = db.prepare(
    "SELECT * FROM Album WHERE ArtistId = ?"
  );
res.json(stmt.all(req.params.id));
});

//tracks/long 
app.get("/tracks/long", (req, res) => {
  const stmt = db.prepare(
    "SELECT * FROM Track JOIN Album ON Track.AlbumId = Album.AlbumId WHERE Track.Milliseconds > 300000"
  );
res.json(stmt.all());
});

//genres/:id/stats
app.get('/genres/:id/stats', (req, res) => {
    const id = req.params.id;
    const stmt = db.prepare(
        "SELECT Genre.Name, COUNT(Track.TrackID), AVG(Track.Milliseconds) FROM Genre JOIN Track ON Genre.GenreID = Track.GenreID WHERE Genre.GenreID = ? GROUP BY Genre.GenreID, Genre.Name"
    );
    res.json(stmt.get(id));
})

// post /playlists
app.post('/playlists', (req, res) => {
    const { name } = req.body;

    const stmt = db.prepare(
        "INSERT INTO Playlist (Name) VALUES (?)"
    );

    const result = stmt.run(name);

    res.status(201).json({
        id: Number(result.lastInsertRowid),
        name: name
    });
});

// delete /playlists/:id 
app.delete('/playlists/:id', (req, res) => {
    const id = req.params.id;

    const stmt = db.prepare(
        "DELETE FROM Playlist WHERE PlaylistId = ?"
    );

    const result = stmt.run(id);

    if (result.changes == 0) {
        return res.status(404).json({
            message: `Playlist with ID ${id} was not found.`
        });
    }

    res.json({
        message: `Playlist with ID ${id} was deleted successfully.`
    });
});

// GET /invoices/top-customers
app.get('/invoices/top-customers', (req, res) => {

    const stmt = db.prepare(`
        SELECT 
            Customer.CustomerId,
            Customer.FirstName,
            Customer.LastName,
            SUM(Invoice.Total) AS TotalSpent
        FROM Customer
        JOIN Invoice 
            ON Customer.CustomerId = Invoice.CustomerId
        GROUP BY Customer.CustomerId
        ORDER BY TotalSpent DESC
        LIMIT 5
    `);

    res.json(stmt.all());
});

// GET /search?q=rock
app.get('/search', (req, res) => {
    const q = req.query.q;

    const stmt = db.prepare(`
        SELECT 
            Track.TrackId,
            Track.Name AS TrackName,
            Artist.Name AS ArtistName,
            Genre.Name AS GenreName
        FROM Track
        JOIN Album 
            ON Track.AlbumId = Album.AlbumId
        JOIN Artist 
            ON Album.ArtistId = Artist.ArtistId
        JOIN Genre 
            ON Track.GenreId = Genre.GenreId
        WHERE Track.Name LIKE ?
           OR Artist.Name LIKE ?
           OR Genre.Name LIKE ?
    `);

    const searchTerm = `%${q}%`;

    res.json(stmt.all(searchTerm, searchTerm, searchTerm));
});

// PUT /tracks/:id/price
app.put('/tracks/:id/price', (req, res) => {

    const id = req.params.id;
    const { price } = req.body;

    if (typeof price != 'number' || price <= 0) {
        return res.status(400).json({
            message: 'Price must be a positive number.'
        });
    }

    const stmt = db.prepare(`
        UPDATE Track
        SET UnitPrice = ?
        WHERE TrackId = ?
    `);

    const result = stmt.run(price, id);

    if (result.changes == 0) {
        return res.status(404).json({
            message: `Track with ID ${id} not found.`
        });
    }

    res.json({
        message: `Track ${id} updated successfully.`,
        newPrice: price
    });
});


app.listen(3000, () => {
console.log("Server running on http://localhost:3000");
});