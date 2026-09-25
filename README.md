# Bebé Fácil

Actúa como un desarrollador experto en aplicaciones móviles y crea una aplicación web progresiva (PWA) optimizada para celulares. El objetivo es llevar el control diario de un bebé de forma muy sencilla, rápida y con botones grandes para usar con una sola mano. Características principales: 1. Pantalla principal (Dashboard): - Sección de TOMAS: Dos botones rápidos: "Toma de Biberón" (que permita ingresar las onzas o mililitros con un selector simple y una casilla para indicar si fue formula o leche materna) y "Toma de Pecho" (con un cronómetro simple para iniciar/pausar o un selector de minutos). - Sección de PAÑALES: Tres botones grandes con iconos claros: "Pipí", "Popó" y "Ambos". Al tocarlos, se debe registrar el evento inmediatamente con la hora actual. 2. Sección de Historial (Log diario): - Una lista ordenada por hora (de la más reciente a la más antigua) que muestre los registros del día actual. - Cada registro debe mostrar un icono descriptivo (un biberón, un pañal, etc.), la hora exacta y un botón pequeño para eliminar el registro en caso de error. - Un botón en la parte superior para mostrar una grafica de las tomas comparando formula y leche materna, y poder visualizarlas por semanas 3. Persistencia de datos: - Utiliza LocalStorage para que todos los datos guardados por los padres no se borren al cerrar el navegador o la aplicación. Diseño y Estilo: - Interfaz limpia, minimalista y con colores pasteles relajantes (por ejemplo, tonos de azul claro, verde menta o beige). - Tipografía clara y botones con esquinas redondeadas. - Asegúrate de que toda la aplicación quepa bien en la pantalla de un smartphone sin necesidad de hacer zoom. - Todo el texto de la interfaz debe estar en español.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c51e9306-4543-4d79-a4f6-af1009b86bcf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
