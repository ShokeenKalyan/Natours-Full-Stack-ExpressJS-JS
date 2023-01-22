
import axios from 'axios'
import { showAlert } from './alerts'

//const baseUrl = 'http://localhost:3001';
//const api = '/api/v1';

export const login = async (email, password) => {
    console.log(email, password)
    try {
        const res = await axios({
            method: 'POST',
            url: 'http://127.0.0.1:3000/api/v1/users/login',
            //url: `${baseUrl}${api}/users/login`,
            data: {
                email,
                password
            }
        })
        console.log(res.data)
        if (res.data.status === 'success') {
            showAlert('sucess', 'Logged in successfully!')

            // Load Front/Home Page after 1.5 seconds after logging in successfully
            window.setTimeout(() => {
                location.assign('/')
            }, 1500)
        }

    }
    catch(err) {
        showAlert('error', err.response.data.message)
    }
}


export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: 'http://127.0.0.1:3000/api/v1/users/logout'
        })
        // Reload the Page programmatically which would send the invalid cookie to the server(One w/o the token)

        if (res.data.status = 'success') {
            location.reload(true) // force a reload from the server and not from browser cache(which would still have the jwt cookie)
        }
    }
    catch(err) {
        showAlert('error', 'Error Logging out! Try again')
    }
}


