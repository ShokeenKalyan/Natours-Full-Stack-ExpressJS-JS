

// Mapbox Code below - Not usable like that in course since mapbox is asking for card details. Find alternative later
/*

export const displayMap = (locations) => {
    mapboxgl.accessToken = 'pk.abcvg8aa6xasct46kbagcaxbckhq1hbdkwuhsftejihkhxa1ye871td172t57'

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/shokeenkalyan/avckb-myCustomStyle-vsac',
    scrollZoom: false
    // center: [Long, Lat],
    // zoom: 10,
    // interactive: false 
})

const bounds = new mapboxgl.LngLatBounds()

locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div')
    el.className = 'marker'

    // Add marker
    new mapboxgl.Marker({
        element: el,
        anchor: 'bottom' // Bottom of marker points to the location
    }).setLngLat(loc.coordinates).addTo(map)

    // Add Pop Up
    new mapboxgl.Popup({
        offset: 30
    }).setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`).addTo(map)
    
    // Extends map bounds to include the current location
    bounds.extend(loc.coordinates)
})

map.fitBounds(bounds, {
    padding: {
        top: 200,
        bottom: 150,
        left: 100,
        right: 100
    }    
})

}


*/
