let map;
let drawingManager;
let selectedShape;
let autocomplete;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 19.4326, lng: -99.1332 }, // Mexico City
        zoom: 12,
        gestureHandling: 'cooperative' // For mobile two-finger panning
    });

    drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: ['polygon']
        },
        polygonOptions: {
            editable: true,
            draggable: true
        }
    });

    drawingManager.setMap(map);

    google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event) {
        if (selectedShape) {
            selectedShape.setMap(null);
        }
        selectedShape = event.overlay;
        drawingManager.setDrawingMode(null); // Exit drawing mode
        // Add listeners to the new polygon
        google.maps.event.addListener(selectedShape.getPath(), 'insert_at', calculateArea);
        google.maps.event.addListener(selectedShape.getPath(), 'remove_at', calculateArea);
        google.maps.event.addListener(selectedShape.getPath(), 'set_at', calculateArea);
        calculateArea();
    });

    // Autocomplete for address search
    const input = document.getElementById('address');
    autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.bindTo('bounds', map);

    autocomplete.addListener('place_changed', function() {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
            map.setCenter(place.geometry.location);
            map.setZoom(18);
        } else {
            console.log("Autocomplete's returned place contains no geometry");
        }
    });

    // Button Listeners
    document.getElementById('undo-button').addEventListener('click', undoLastPoint);
    document.getElementById('clear-button').addEventListener('click', clearDrawing);
}

function calculateArea() {
    if (!selectedShape) return;
    const area = google.maps.geometry.spherical.computeArea(selectedShape.getPath());
    document.getElementById('total-m2').textContent = area.toFixed(2);
    // Trigger price calculation as well
    calculatePrice();
}

function undoLastPoint() {
    if (selectedShape) {
        const path = selectedShape.getPath();
        if (path.getLength() > 1) {
            path.removeAt(path.getLength() - 1);
        }
    }
}

function clearDrawing() {
    if (selectedShape) {
        selectedShape.setMap(null);
        selectedShape = null;
        document.getElementById('total-m2').textContent = '0';
        // document.getElementById('total-price').textContent = '$0.00';
    }
    drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
}

// Google Sheets Integration
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1loAhaiLAHh4eTW1wN7dwvXvqbKxNTe2a19oXSFqH490/export?format=csv&gid=0';
let products = [];

async function loadProducts() {
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const csvText = await response.text();
        const rows = csvText.split('\n').slice(1); // Skip header row
        const coberturaSelect = document.getElementById('cobertura');

        products = rows.map(row => {
            const [name, listPrice, cashPrice] = row.split(',');
            // Assuming the prices are in a format like "$91.64"
            const parsedListPrice = parseFloat(listPrice.replace('$', ''));
            const parsedCashPrice = parseFloat(cashPrice.replace('$', ''));
            return { name, listPrice: parsedListPrice, cashPrice: parsedCashPrice };
        });

        products.forEach(product => {
            if (product.name) {
                const option = document.createElement('option');
                option.value = product.name;
                option.textContent = `${product.name} - Lista: $${product.listPrice.toFixed(2)} / Contado: $${product.cashPrice.toFixed(2)}`;
                coberturaSelect.appendChild(option);
            }
        });

    } catch (error) {
        console.error('Error loading products from Google Sheet:', error);
    }
}

// Load products when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    // Add event listener for the select element
    document.getElementById('cobertura').addEventListener('change', calculatePrice);
    // Add event listener for the quote button
    document.getElementById('quote-button').addEventListener('click', submitQuote);
});

function calculatePrice() {
    const selectedProductName = document.getElementById('cobertura').value;
    const area = parseFloat(document.getElementById('total-m2').textContent);

    if (!selectedProductName || !products.length || isNaN(area)) {
        document.getElementById('total-price').textContent = '$0.00';
        return;
    }

    const selectedProduct = products.find(p => p.name === selectedProductName);

    if (selectedProduct) {
        // Here you can choose which price to use, e.g., listPrice
        const totalPrice = selectedProduct.listPrice * area;
        document.getElementById('total-price').textContent = `$${totalPrice.toFixed(2)}`;
    }
}

async function submitQuote() {
    const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'; // <-- IMPORTANT: Replace with your script URL

    const data = {
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        cobertura: document.getElementById('cobertura').value,
        totalM2: document.getElementById('total-m2').textContent,
        totalPrice: document.getElementById('total-price').textContent
    };

    // Basic validation for required fields
    if (!data.firstName || !data.phone) {
        alert('Por favor, completa los campos obligatorios: Nombre y Teléfono.');
        return;
    }

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(data)
        });
        if (response.ok) {
            alert('¡Cotización enviada con éxito!');
            // Clear the form if needed
            document.getElementById('first-name').value = '';
            document.getElementById('last-name').value = '';
            document.getElementById('phone').value = '';
            document.getElementById('email').value = '';
        } else {
            throw new Error('Failed to submit quote.');
        }
    } catch (error) {
        console.error('Error submitting quote:', error);
        alert('Hubo un error al enviar la cotización. Por favor, inténtalo de nuevo.');
    }
}
