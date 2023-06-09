// Algunos constantes del juego
const GAME_ANCHO = 375;
const GAME_ALTURA = 500;

const ENEMIGO_ANCHO = 75;
const ENEMIGO_ALTURA = 156;
const MAX_ENEMIGOS = 3;

const JUGADOR_ANCHO = 75;
const JUGADOR_ALTURA = 54;

const CODIGO_FLECHA_IZQUIERDA = 'ArrowLeft';
const CODIGO_FLECHA_DERECHA = 'ArrowRight';

const MOVER_IZQUIERDA = 'left';
const MOVER_DERECHA = 'right';

// Precargar imagenes del juego
const imagenes = {};
['enemigo.png', 'fondo.png', 'jugador.png'].forEach((nombreImagen) => {
    const img = document.createElement('img');
    img.src = 'images/' + nombreImagen;
    imagenes[nombreImagen] = img;
});





class Enemigo {
    constructor(posicionX) {
        this.x = posicionX;
        this.y = -ENEMIGO_ALTURA;
        this.sprite = imagenes['enemigo.png'];

        // Cada enemigo tiene que tener una velocidad diferente
        this.velocidad = Math.random() / 2 + 0.25;
    }

    actualizacion(difTiempo) {
        this.y = this.y + difTiempo * this.velocidad;
    }

    render(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y);
    }
}

class Jugador {
    constructor() {
        this.x = 2 * JUGADOR_ANCHO;
        this.y = GAME_ALTURA - JUGADOR_ALTURA - 10;
        this.sprite = imagenes['jugador.png'];
    }

    // Este método es llamado por el motor del juego cuando se presionan las flechas izquierda/derecha
    mover(direccion) {
        if (direccion === MOVER_IZQUIERDA && this.x > 0) {
            this.x = this.x - JUGADOR_ANCHO;
        }
        else if (direccion === MOVER_DERECHA && this.x < GAME_ANCHO - JUGADOR_ANCHO) {
            this.x = this.x + JUGADOR_ANCHO;
        }
    }

    render(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y);
    }
}





/*
Esta sección es un motor de juego pequeño. Este motor usará tus clases
Enemigo y Jugador para crear el comportamiento del juego. El motor
intentará dibujar tu juego a 60 cuadros por segundo utilizando
la función de JavaScript requestAnimationFrame.
*/
class MotorDeJuego {
    constructor(contenedor) {
        // Inicializar jugador
        this.jugador = new Jugador();

        // Inicializar enemigos, asegurándose de que todavía haya 3
        this.inicializarEnemigos();

        // Inicializar el elemento <canvas> donde vamos a dibujar
        const canvas = document.createElement('canvas');
        canvas.width = GAME_ANCHO;
        canvas.height = GAME_ALTURA;
        contenedor.appendChild(canvas);

        this.ctx = canvas.getContext('2d');

        // Por qué es necesario hacer esto?
        this.bucleJuego = this.bucleJuego.bind(this);
    }

    /*
     El juego permite 5 espacios horizontales donde puede estar presente un
     enemigo. En cualquier momento, puede haber como máximo MAX_ENEMIGOS
     enemigos. De lo contrario, el juego sería casi imposible.
     */
    inicializarEnemigos() {
        if (!this.enemigos) {
            this.enemigos = [];
        }

        while (this.enemigos.filter((enemigo) => !!enemigo).length < MAX_ENEMIGOS) {
            this.agregarEnemigo();
        }
    }

    /*
     Este método encuentra un lugar al azar donde no hay enemigo y coloca
     uno allí.
    */
    agregarEnemigo() {
        const numLugaresEnemigos = GAME_ANCHO / ENEMIGO_ANCHO;

        let lugarEnemigo;
        // Qué hace este bucle?
        while (!lugarEnemigo || this.enemigos[lugarEnemigo]) {
            lugarEnemigo = Math.floor(Math.random() * numLugaresEnemigos);
        }

        this.enemigos[lugarEnemigo] = new Enemigo(lugarEnemigo * ENEMIGO_ANCHO);
    }

    // Este método arranca el juego
    start() {
        this.puntuacion = 0;
        this.ultimoCuadro = Date.now();

        /*
         Escuchar para eventos de teclas de flecha izquierda/derecha
         y actualiza al jugador.
        */
        document.addEventListener('keydown', (evento) => {
            if (evento.key === CODIGO_FLECHA_IZQUIERDA) {
                this.jugador.mover(MOVER_IZQUIERDA);
            }
            else if (evento.key === CODIGO_FLECHA_DERECHA) {
                this.jugador.mover(MOVER_DERECHA);
            }
        });

        this.bucleJuego();
    }

    /*
     Esto es el núcleo del motor de juego. La función `bucleJuego` se ejecuta
     aproximadamente 60 veces por segundo. Durante cada ejecución de la
     función, actualizaremos las posiciones de todas las entidades del juego.
     También es en este punto donde comprobaremos si hay alguna colisión
     entre las entidades del juego. Las colisiones indican la muerte de
     un jugador o la eliminación de un enemigo. Para permitir que los objetos
     del juego determinen por sí mismos sus comportamientos, `bucleJuego`
     llamará al método `actualizacion` de cada entidad. Para tener en cuenta
     que no siempre tenemos 60 cuadros por segundo, `bucleJuego` enviará un
     argumento de "delta de tiempo" a `actualizacion`. Se debe usar este
     parámetro para escalar la actualización de manera adecuada.
     */
    bucleJuego() {
        // Verificar cuanto tiempo ha pasado desde el ultimo cuadro
        const cuadroActual = Date.now();
        const diferenciaTiempo = cuadroActual - this.ultimoCuadro;

        // Incrementar la puntuación
        this.puntuacion += diferenciaTiempo;

        // Llamar el método `actualizacion` de los enemigos
        this.enemigos.forEach((enemigo) => enemigo.actualizacion(diferenciaTiempo));

        // Dibujar todo!

        // dibujar el fondo
        this.ctx.drawImage(imagenes['fondo.png'], 0, 0);
        // dibujar cada enemigo
        this.enemigos.forEach((enemigo) => enemigo.render(this.ctx));
        // dibujar el jugador
        this.jugador.render(this.ctx);

        // Verificar si algunos enemigos deben morir
        this.enemigos.forEach((enemigo, indiceEnemigo) => {
            if (enemigo.y > GAME_ALTURA) {
                delete this.enemigos[indiceEnemigo];
            }
        });
        this.inicializarEnemigos();

        // Verificar si el jugador está muerto
        if (this.jugadorEstaMuerto()) {
            // Si el jugador está muerto, entonces es el fin del juego
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.puntuacion + ' GAME OVER', 5, 30);
        }
        else {
            // Si el judador no está muerto, dibujamos la puntuación
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.puntuacion, 5, 30);

            /*
             Esto es el "bucle". El método `bucleJuego` se llama a sí
             mismo a traves de `requestAnimationFrame`. Esta función es
             similar a `setTimeout`, pero ejecuta al mismo tiempo que el
             navegador dibuja toda la pagina.
            */
            this.ultimoCuadro = Date.now();
            requestAnimationFrame(this.bucleJuego);
        }
    }

    jugadorEstaMuerto() {
        // TODO: arreglar este método...
        return false;
    }
}





// Esta sección empieza el juego
const motorJuego = new MotorDeJuego(document.getElementById('app'));
motorJuego.start();
