const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')
const express = require('express')
const jwt = require('jsonwebtoken')
const path = require('path')

const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('./books.db')

// Enable foreign key support
db.get('PRAGMA foreign_keys = ON')

const jwtSecret = process.env.JWT_SECRET
const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10

const app = express()
const port = process.env.PORT || 3000

app.use('/static', express.static('public'))
app.use(bodyParser.json())



/**
 * An express middleware that verifies a token in the authorization header or
 * responds with 403 if the token is missing or invalid
 */
function verifyToken(req, res, next) {
    const token = req.headers['authorization']
    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), jwtSecret)
        if (!decoded.user || !Object.keys(decoded.user).length) {
            throw 'invalid token'
        }

        req.user = decoded.user
        next()
    }
    catch (err) {
        res.status(403).json({error: 'missing or invalid authorization header'})
    }
}


/**
 * Given a user ID, returns a JWT token to the frontend to be used for
 * user authentication
 */
function getToken(id) {
    return {token: jwt.sign({user: {id}}, jwtSecret)}
}


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

/**
 * Given the data submitted via the login form, checks the validity of the submitted
 * data, generates and sends a JWT token to the frontend if all is valid,
 * and logs the user in, redirecting immediately to the search page.
 */
app.post('/login', (req, res) => {
    const { username, password } = req.body

    // Ensure that username and password are in the payload
    if (!username || !password) {
        res.status(400).json({error: 'must provide username and password'})
        return
    }

    // Ensure that the user exists
    db.get('SELECT * FROM users WHERE username = ?', username, (err, user) => {
        if (err) {
            console.error(err)
            res.status(500)
            return
        }

        if (!user) {
            res.status(403).json({error: 'invalid username and/or password'})
            return
        }

        // Validate user password
        bcrypt.compare(password, user.hash, (err, passwordMatched) => {
            if (err) {
                console.error(err)
                res.status(500)
            }
            else if (passwordMatched) {

                // Generate and send JWT token
                res.json(getToken(user.id))
            }
            else {
                res.status(403).json({error: 'invalid username and/or password'})
            }
        })
    })
})

/**
 * Adds a new user to the database after validating input
 * Should return the user token so user is automatically logged in
 */
app.post('/register', (req, res) => {
    // TODO
});


/**
 * Returns a list of books from the database
 * If keyword is passed, returns a list of books where keyword is somewhere in
 * author, isbn, or title (rather than all books)
 */
app.get('/books', verifyToken, (req, res) => {
    // TODO
})

/**
 * Submits a user's review of a book. (POST request to /reviews route)
 * Stores the review in the database
 */
app.post('/reviews', verifyToken, (req, res) => {
    // TODO
})

/**
 * Retrieves the already-submitted reviews of the book stored in the table;
 * so that they may be displayed (GET request to /reviews route)
 */
app.get('/reviews', verifyToken, (req, res) => {
    // TODO
})


app.listen(port, () => {
    console.log(`Listening on port ${port}!`)
})

db.on('trace', console.log)
