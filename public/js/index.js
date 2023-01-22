
import '@babel/polyfill' // To fill some of features of javascript into final bundle
//import { displayMap } from './mapbox'
import { login, logout } from './login'
import { updateSettings } from './updateSettings'
import { bookTour } from './stripe'


/*
// This piece works only on detail page(where map is displayed). So this will throw error on other pages
// DOM Elements
const mapBox = document.getElementById('map')

// Delegation - If mapbox exists(i.e details page then only execute below 2 lines of code)
if (mapBox) {
    const locations = JSON.parse(mapBox.dataset.locations)
    displayMap(locations)
}
*/

// DOM Elements
const mapBox = document.getElementById('map')
const loginForm = document.querySelector('.form--login')
const logoutBtn = document.querySelector('.nav__el--logout')
const userDataForm = document.querySelector('.form-user-data')
const userPasswordForm = document.querySelector('.form-user-password')
const bookBtn = document.getElementById('book-tour')

// If form exists on page(i.e login page only in this case), then only execute below 2 lines of code
if (loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault()
        // Values
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        login(email, password)
    })
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', logout)
}

if (userDataForm) {
    userDataForm.addEventListener('submit', e => {
        e.preventDefault()
        
        // Uploading images using form
        const form = new FormData()
        form.append('name', document.getElementById('name').value)
        form.append('email', document.getElementById('email').value)
        form.append('photo', document.getElementById('photo').files[0])
        //console.log(form)

        //const name = document.getElementById('name').value
        //const email = document.getElementById('email').value

        updateSettings( form, 'data' )
        //updateSettings( {name, email}, 'data' )
    })
}

if (userPasswordForm) {
    userDataForm.addEventListener('submit', async e => {
        e.preventDefault()
        
        // Changi button text to updating while password is being changed
        document.querySelector('.btn--save-password').textContent = 'Updating...'

        const passwordCurrent = document.getElementById('password-current').value
        const password = document.getElementById('password').value
        const passwordConfirm = document.getElementById('password-confirm').value

        await updateSettings( { passwordCurrent, password, passwordConfirm }, 'password' )

        
        document.querySelector('.btn--save-password').textContent = 'Save password'
        document.getElementById('password-current').value = ""
        document.getElementById('password').value = ""
        document.getElementById('password-confirm').value = ""
    })
}

if (bookBtn) {
    bookBtn.addEventListener('click', e=> {
        e.target.textContent = 'Processing...'
        const tourId = e.target.dataset.tourId // capturing data from the event of clicking button (In Js, tour-id would be converted to tourId)
        bookTour(tourId)
    })
}

