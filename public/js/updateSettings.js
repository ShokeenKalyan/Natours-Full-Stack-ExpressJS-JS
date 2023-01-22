import axios from 'axios'
import { showAlert } from './alerts'

// Update User Name and Email(Form 1) and User Password(Form 2)
// data is an object of fields which is being updated. type is either 'data'(Form 1) or 'password'(Form 2)
export const updateSettings = async (data, type) => {
    
    try {
        const url = type === 'password' ? '/api/v1/users/updateMyPassword' : '/api/v1/users/updateMe'
        
        const res = await axios({
            method: 'PATCH',
            url,
            data
        })

        if ( res.data.status === 'success' ) {
            showAlert('success', `${type.toUpperCase()} updated successfully!`)
        }
    }
    catch (err) {
        showAlert('error', err.response.data.message)
    }
}
