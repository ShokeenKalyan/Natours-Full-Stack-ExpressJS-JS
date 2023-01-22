
// Create a simple alert based on type and message

export const hideAlert = () => {
    const el = document.querySelector('.alert')
    if (el) el.parentElement.removeChild(el)
}

// Type is 'success' or 'error'
export const showAlert = (type, msg) => {
    // First, Hide all alerts that already exist 
    hideAlert()
    
    const markup = `<div class="alert alert--${type}">${msg}</div>`
    document.querySelector('body').insertAdjacentHTML('afterbegin', markup)
    // Hide all alerts after 5 seconds
    window.setTimeout(hideAlert, 5000)
}