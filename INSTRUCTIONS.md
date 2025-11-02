# Instrucciones de Configuración Final

Para que la calculadora de techos sea completamente funcional y segura, por favor, sigue estos dos pasos:

## 1. Configurar el Envío de Cotizaciones (Google Apps Script)

La funcionalidad para guardar las cotizaciones de los clientes en tu Google Sheet requiere un intermediario. Aquí te explicamos cómo crearlo:

1.  **Abre tu Google Sheet.**
2.  Ve a **Extensiones > Apps Script**.
3.  Borra cualquier código que haya en el editor y pega el siguiente código:
    ```javascript
    function doPost(e) {
      // Asegúrate de que el ID de la hoja y el nombre de la pestaña sean correctos.
      var sheet = SpreadsheetApp.openById("1loAhaiLAHh4eTW1wN7dwvXvqbKxNTe2a19oXSFqH490").getSheetByName("clientes");

      var data = JSON.parse(e.postData.contents);

      // Añade una nueva fila con los datos recibidos.
      sheet.appendRow([
        new Date(), // Fecha y hora actuales
        data.firstName,
        data.lastName,
        data.phone,
        data.email,
        data.address,
        data.cobertura,
        data.totalM2,
        data.totalPrice
      ]);

      // Devuelve una respuesta de éxito.
      return ContentService.createTextOutput(JSON.stringify({ "status": "success" })).setMimeType(ContentService.MimeType.JSON);
    }
    ```
4.  Guarda el proyecto (puedes ponerle un nombre como "Cotizador").
5.  Haz clic en **Implementar > Nueva implementación**.
6.  En la ventana de configuración, haz lo siguiente:
    *   En **Seleccionar tipo**, elige **Aplicación web**.
    *   En **¿Quién tiene acceso?**, selecciona **Cualquier persona**.
7.  Haz clic en **Implementar**.
8.  **Importante:** Autoriza los permisos cuando Google te lo pida.
9.  Copia la **URL de la aplicación web** que te proporciona.

### Reemplazar la URL en el Código

Una vez que tengas la URL, abre el archivo `js/main.js` y reemplaza el marcador de posición `'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'` con la URL que acabas de copiar:

```javascript
// Antes
const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

// Después (ejemplo)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby.../exec';
```

## 2. Proteger tu Clave de API de Google Maps

Tu clave de API de Google Maps está visible en el código, lo que podría permitir que otros la usen sin tu permiso. Para protegerla, te recomendamos restringir su uso a tu dominio web:

1.  Ve a la [Consola de Google Cloud](https://console.cloud.google.com/).
2.  Navega a la sección **APIs y servicios > Credenciales**.
3.  Selecciona tu clave de API.
4.  En **Restricciones de aplicación**, elige **Sitios web**.
5.  Añade tu dominio (por ejemplo, `*.tudominio.com`).

Esto asegurará que tu clave de API solo funcione en tu sitio web.
