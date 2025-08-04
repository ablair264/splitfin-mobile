// Alternative Dark Theme that matches your app's color scheme
const mapOptionsAlternative = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [
    {
      elementType: "geometry",
      stylers: [{ color: "#1a1f2a" }]
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#0f1419" }]
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: "#8b98a5" }]
    },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#79d5e9" }]
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#4daeac" }]
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#2c3e50" }]
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#4daeac" }]
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#2c3e50" }]
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1a1f2a" }]
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#79d5e9" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#34495e" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1a1f2a" }]
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#79d5e9" }]
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2c3e50" }]
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#4daeac" }]
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#0f1419" }]
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#4daeac" }]
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#0f1419" }]
    }
  ]
};