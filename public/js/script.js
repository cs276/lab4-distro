const main = document.querySelector('main')

const loginContainer = document.querySelector('#login-container')
const loginForm = loginContainer.querySelector('form')

const logoutContainer = document.querySelector('#logout-container')
const logoutLink = logoutContainer.querySelector('a')

// Clear session when user logs out
logoutLink.addEventListener('click', () => {
    user = {}
    localStorage.removeItem('user')
    requireLogin()
})

const registerContainer = document.querySelector('#register-container')
const registerForm = registerContainer.querySelector('form')

const loginRegisterLinks = document.querySelector('#login-register-links')

const home = document.querySelector('#home')
const hometBody = home.querySelector('tbody')
const searchForm = home.querySelector('form')

const commentsModal = document.querySelector('#commentsModalLongTitle')
const commentsContainer = document.querySelector('#comments-container')
const commentTextArea = document.querySelector('textarea')
const postCommentButton = document.querySelector('#post-comment')

const noCommentsDiv = document.querySelector('#no-comments')

const errorAlert = document.querySelector('#error-alert')

let user = JSON.parse(localStorage.getItem('user')) || {}

const totalStars = 5

// Ensure user is logged in initially
requireLogin()

// Render view associated with hash link when page is first loaded
onHashChange()

// Render view associated with hash link when hash link changes
window.addEventListener('hashchange', onHashChange)


/**
 * Simple router
 */
function onHashChange() {
    const hash = (location.hash && location.hash.slice(1)) || ""
    hideAll()
    switch (hash) {
        case "":
        case "/home":
            requireLogin(renderHome)
            break
        case "/login":
            renderLogin()
            break
        case "/register":
            renderRegister()
            break
        default:
            render404()
            break
    }
}


function userLoggedIn() {
    return Object.keys(user).length && user.token
}


function requireLogin(callback=()=>{}) {
    if (!userLoggedIn() && location.hash != '#/login' && location.hash != '#/register') {
        location.hash = '#/login'
    }
    else {
        callback()
    }
}

function renderLogin() {
    if (userLoggedIn()) {
        redirectToHome()
        return
    }

    show(loginContainer)
    show(loginRegisterLinks)
}


function renderRegister() {
    if (userLoggedIn()) {
        redirectToHome()
        return
    }

    show(registerContainer)
    show(loginRegisterLinks)
}


function appendReview(review) {
    const div = document.createElement('div')
    const authorInfo = document.createElement('small')
    authorInfo.classList.add('text-muted')
    authorInfo.append(`${review.username} posted at ${review.posted_at}`)
    const commentDiv = document.createElement('div')
    commentDiv.classList.add('mb-2')
    commentDiv.append(review.comment)
    div.append(authorInfo, commentDiv)
    commentsContainer.append(div)
}


/*
 * Display a table of books based on the results of the database query (which
 * may be either all books, if no form submitted, or only matching books)
 */
function renderBooks(data) {
    hometBody.innerHTML = ''
    if (data.error) {
        showError(data.error)
        return
    }

    // Create a row for each book
    data.books.forEach((book) => {
        const keys = Object.keys(book)
        const tr = document.createElement('tr')
        keys.slice(0, keys.length).forEach((key) => {
            const td = document.createElement('td')
            td.append(book[key])
            tr.append(td)
        })

        const td = document.createElement('td')
        const commentsButton = document.createElement('span')
        commentsButton.classList.add('oi', 'oi-comment-square')

        // When the comment icon is clicked, open a pop-up (modal) box
        commentsButton.addEventListener('click', () => {
            commentsModal.innerHTML = `${book.title}'s Reviews`

            // Make a GET request to the reviews route
            fetch(
                `/reviews?isbn=${book.isbn}`,
                {
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                }
            )
            .then((response) => response.json())
            .then((data) => {

                // If there are any reviews already, display them inside the
                // now popped-open box.
                const {reviews} = data
                commentsContainer.innerHTML = ''
                commentTextArea.disabled = false
                if (reviews.length < 1) {
                    noCommentsDiv.classList.remove('d-none')
                    return
                }

                noCommentsDiv.classList.add('d-none')
                let commented = false
                reviews.forEach((review) => {
                    appendReview(review)
                    if (review.username === user.username) {
                        commented = true
                    }
                })

                if (commented) {
                    commentTextArea.disabled = true
                }
            })

            // Behavior to execute when the user goes to post a new review
            postCommentButton.onclick = () => {
                const comment = commentTextArea.value
                const isbn = book.isbn

                // Submit a POST request to the reviews route with the data
                // from the form
                fetch(
                    `/reviews`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${user.token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({isbn, comment})
                    }
                )
                .then((response) => response.json())
                .then((data) => {
                    commentTextArea.value = ''
                    const { review } = data
                    if (review) {
                        noCommentsDiv.classList.add('d-none')
                        appendReview(review)
                        commentTextArea.disabled = true
                    }
                })
            }

            $('#commentsModalLong').modal()
        })

        td.append(commentsButton)

        tr.append(td)
        hometBody.append(tr)
    })

    show(home)
}

/*
 * Default behavior for the 'index'
 */
function renderHome() {
    show(logoutContainer)

    // Make a GET request to the books route, no keyword
    fetch(
        '/books',
        {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        }
    )
    .then((response) => response.json())
    .then(renderBooks)
}

/*
 * Redirect back to 'index' on the single page application
 */
function redirectToHome() {
    location.hash = ''
}


/*
 * Hide all elements on the page
 */
function hideAll() {
    show(loginRegisterLinks, false)
    show(logoutContainer, false)

    errorAlert.classList.replace('d-block', 'd-none')

    show([...main.children], false)
}

/*
 * Show specific elements on the page
 */
function show(elements, showing=true) {
    const f = showing ? 'remove' : 'add'
    if (Array.isArray(elements)) {
        elements.forEach((e) => e.classList[f]('d-none'))
    }
    else {
        elements.classList[f]('d-none')
    }
}

/*
 * Show errors
 */
function showError(err) {
    errorAlert.innerHTML = err
    errorAlert.classList.replace('d-none', 'd-block')
}

/*
 * Behavior to execute when the login form is submitted
 */
loginForm.addEventListener('submit', (e) => {
    // Disable browser's default behavior when form is submitted
    e.preventDefault()
    const usernameField = loginForm.querySelector('input[name=username]')
    const passwordField = loginForm.querySelector('input[name=password]')
    const username = usernameField.value
    const password = passwordField.value

    // Submit a POST request to the login route with the form data
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({username, password})
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.error) {
            showError(data.error)
            return
        }

        usernameField.value = passwordField.value = ''

        user.username = username
        user.token = data.token
        localStorage.setItem('user', JSON.stringify(user))

        redirectToHome()
    })
})

/*
 * Behavior to execute when the register form is submitted
 */
registerForm.addEventListener('submit', (e) => {
    // Disable browser's default behavior when form is submitted
    e.preventDefault()

    const usernameField = registerForm.querySelector('input[name=username]')
    const passwordField = registerForm.querySelector('input[name=password]')
    const confirmationField = registerForm.querySelector('input[name=confirmation]')

    const username = usernameField.value
    const password = passwordField.value
    const confirmation = confirmationField.value

    // Submit a POST request to the register route with the form data
    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({username, password, confirmation})
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.error) {
            showError(data.error)
            return
        }

         usernameField.value = passwordField.value = confirmationField.value = ''

         user.username = username
         user.token = data.token
         localStorage.setItem('user', JSON.stringify(user))

         redirectToHome()
    })
})

/*
 * Behavior to execute when the search form is submitted
 */
searchForm.addEventListener('submit', (e) => {
    // Disable browser's default behavior when form is submitted
    e.preventDefault()

    const keyword = searchForm.querySelector('input[name=keyword]').value

    // Make a GET request to the books route, searching for keyword
    fetch(
        `/books?keyword=${keyword}`,
        {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        }
    )
    .then((response) => response.json())
    .then(renderBooks)

})
