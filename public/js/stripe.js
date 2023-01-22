
import axios from 'axios'
import { showAlert } from './alerts'

const stripe = Stripe('pk_test_Buhb7ggvd78uydb783s67') // Using public stripe key for front-end

export const bookTour = async tourId => {
    
    try {
        // 1) Get checkout session from API
        const session = await axios(`http:\\127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`)
        //console.log(session)

        // 2) Create checkout form + charge creadit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })
    }
    catch(err) {
        showAlert('error', err)
    }
}
