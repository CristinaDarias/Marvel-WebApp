/** @author Cristina Darias
 * @description Proyecto de Aplicación Web, que mediante conexiones asíncronas a la API de Marvel presenta:
 * - Una zona de inicio en la cual pueden visualizarse vídeos embebidos de Youtube.
 * - Una zona de Cómics, en la cual se pide a la API los 100 primero personajes y se muestran
 * organizados en cards (se utiliza la librería de Bootstrap para la mayoría de los elementos html).
 * Se ha añadido un botón que ejecuta un modal con la información de cada uno de los cómics y enlaces a
 * la página oficial de marvel.
 * Además, están paginados de 12 en 12.
 * - Una zona de Personajes, que al igual que los cómics presentan la misma vista, paginado, etc.
 * - Una zona de buscador, donde mediante filtros tanto de categoría como de nombre / título, realiza una
 * consulta a la API para mostrar los resultados. Están corregidos todos los posibles errores.
 * - Una zona de contacto donde se muestra mi foto junto a enlaces a mis redes sociales.
 * == Queda pendiente ajustar la visualización para dispositivos móviles ==
 */

import { MD5 } from './utilidades.js';
var claves;

/** Inicializa los eventos para poder realizar las llamadas a la API.
 * @description Incializa los eventos para que cuando vayan a utilizarse estén cargados en el html
 * y no den problemas de undefined.
 */
function inicializarEventos() {
    var uriPersonajes = 'https://gateway.marvel.com:443/v1/public/characters?&orderBy=name&limit=100'; //? La API tiene límite de 100 para avanzar hay que utilizar el offset.
    var uriComics = 'https://gateway.marvel.com:443/v1/public/comics?&orderBy=title&limit=100';
    claves = encritpaClave();

    $('#comics-tab').click(() => {
        $('#contenedor-comic').empty();
        pideConexion(uriComics, claves, 'com');

    });

    $('#personajes-tab').click(() => {
        $('#contenedor-personaje').empty();
        pideConexion(uriPersonajes, claves, 'per');
    });

    $('#botonForm').click(() => {
        $('#contenedor-busqueda').empty();
        recogeFormulario();
    });

    $('#buttonEventSearch').click(() => {
        $('#contenedor-evento').empty();
        recogeFormularioEvento();
    });

    $('.nav-item').click(() => $('#pagination').empty());

    añadeContenido();
}
inicializarEventos();

/** Realiza una petición a la API proporcionada en la url.
 * @param {String} url Contiene la url con los datos necesarios para realizar la petición a la API.
 * @param {String} claves Contiene las claves de usuario necesarias para las peticiones a la API.
 * @param {String} tipo Indica el tipo de petición si es para un cómic, personaje o viene del buscador.
 */
function pideConexion(url, claves, tipo) {
    let conexionApi = new XMLHttpRequest();
    conexionApi.onreadystatechange = () => { recogerDatos(conexionApi, tipo); };
    conexionApi.open('GET', url + '&ts=' + claves['TS'] + '&apikey=' + claves['PuKey']);
    conexionApi.timeout = 6000;
    conexionApi.ontimeout = () => {
        $('#spinner').empty();
        $('#spinner').append('<div id="alerta" class="alert alert-danger alert-dismissible fade show" role="alert">The connection has been lost or it is too slow. Please try again.<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>')
    }
    conexionApi.send();
}

/** Comprueba la conexión con la API y su estado.
 * @description Comprueba la conexión con la API y su estado, mientras no se encuentre lista, muestra
 * un spinner grow para dar la sensación al usuario de que la página está cargando. Una vez lista, envía
 * los datos a sus correspondientes funciones de vista.
 * @param {Object} con Contiene el objeto de la conexión con la API.
 * @param {String} tipo Indica el tipo de petición, heredado de "pideConexion()";
 */
function recogerDatos(con, tipo) {

    if (con.readyState == 1) {
        $('body').append($('<div id="spinner" class="d-flex justify-content-center"><div class="spinner-grow text-danger" role="status"><span class="sr-only">Loading...</span></div></div>'));
    } else if (con.readyState == 2) {

    } else if (con.readyState == 3) {

    } else if (con.readyState == 4) {
        if (con.status == 200) {
            $('#spinner').remove();

            //* Obtenemos el resultado y lo convetimos a JSON para trabajar con objetos.
            var datos = JSON.parse(con.response).data.results;

            if (datos.length != 0) {
                if (tipo == 'com') {
                    datos.forEach(dato => {
                        muestraComic(dato, $('#contenedor-comic'));
                    });
                    paginado('comic');

                } else if (tipo == 'per') {
                    datos.forEach(dato => {
                        muestraPersonaje(dato, $('#contenedor-personaje'));
                    });
                    paginado('personaje');
                } else if (tipo == 'bus') {
                    muestraBusqueda(datos);
                } else if (tipo = 'eve') {
                    console.log(datos);
                    datos.forEach(dato => {
                        muestraEvento(dato, $('#contenedor-evento'));
                    });

                    if (datos.length > 12) {
                        paginado('evento');
                    }
                }
            } else {
                $('#alerta').remove();
                $('#contenedor-busqueda').append($('<div id="alerta" class="alert alert-danger alert-dismissible fade show" role="alert">El personaje o cómic que desea buscar no existe.<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>'));
            }
        }
    }
}

// ===================== COMICS Y PERSONAJES ==================

/** Construye la vista de los personajes.
 * @description Función encargada de construir la vista de cada uno de los personajes a mostrar.
 * @param {Object} personaje Dato a mostrar, recibido de la petición a la API.
 * @param {Element} contenedor Contenedor donde va a colocarse el dato.
 */
function muestraPersonaje(personaje, contenedor) {

    var contenedorCarta = $('<div class="col mb-4"></div>');
    var carta = $('<div class="card my-2" style="width: 15rem; float: left;"></div>');
    var img = $('<img src="' + personaje.thumbnail.path + '.' + personaje.thumbnail.extension + '" class="card-img-top"/>');
    var cuerpoCarta = $('<div class="card-body d-flex justify-content-center" id="' + personaje.id + '-cuerpo"></div>');

    var botonModalPersonajes = $('<button type="button" class="btn btn-danger btn-sm">Show more</button>');

    if ((personaje.description != null) && (personaje.description != '')) {
        cuerpoCarta.append($('<p>' + personaje.description.substring(0, 19) + '...</p>'));
    } else {
        cuerpoCarta.append($('<p>No description available.</p>'));
    }

    botonModalPersonajes.click(() => muestraModalPersonaje(personaje));
    cuerpoCarta.append(botonModalPersonajes);

    var pieCarta = $('<div class="card-footer text-center"><small>' + personaje.name + '</small></div>');

    carta.append(img);
    carta.append(cuerpoCarta);
    carta.append(pieCarta);
    contenedorCarta.append(carta);
    contenedor.append(contenedorCarta);
}

/** Construye la vista de los comics.
 * @description Función encargada de construir la vista de cada uno de los comics a mostrar.
 * @param {Object} comic Dato a mostrar, recibido de la petición a la API.
 * @param {Element} contenedor Contenedor donde va a colocarse el dato.
 */
function muestraComic(comic, contenedor) {

    var contenedorCarta = $('<div class="col mb-"></div>');
    var carta = $('<div class="card my-2" style="width: 15rem; float: left;"></div>');
    var img = $('<img src="' + comic.thumbnail.path + '.' + comic.thumbnail.extension + '" class="card-img-top"/>');
    var cuerpoCarta = $('<div class="card-body d-flex justify-content-center" id="' + comic.id + '-cuerpo"></div>');

    var botonModalComics = $('<button type="button" class="btn btn-danger btn-sm">Show more</button>');

    if (comic.description != null) {
        cuerpoCarta.append($('<p class="d-block">' + comic.description.substring(0, 19) + '...</p>'));
    } else {
        cuerpoCarta.append($('<p class="d-block">No description available.</p>'));
    }

    botonModalComics.click(() => muestraModalComic(comic));
    cuerpoCarta.append(botonModalComics);

    var pieCarta = $('<div class="card-footer text-center"><small>' + comic.title + '</small></div>');

    carta.append(img);
    carta.append(cuerpoCarta);
    carta.append(pieCarta);
    contenedorCarta.append(carta);
    contenedor.append(contenedorCarta);
}

/** Contruye un modal para la descripción de cada uno de los comics.
 * @description Función que crea un modal, con la descripción del cómic, cuando salta el evento click
 * del botón añadido en el cuerpo de la carta.
 * @param {Object} comic Objeto con la información necesaria. 
 */
function muestraModalComic(comic) {

    var txt;
    if (comic.description != null) {
        txt = comic.description;
    } else {
        txt = 'No description available.';
    }

    var caja = $('<div title="' + comic.title + '"><p>' + txt + '</p></br><a href="' + comic.urls[0].url + '" style="color: blue; font-weight: bold;">Official Page</a>');
    caja.dialog({
        modal: true,
        width: 550,
        show: {
            effect: "blind",
            duration: 1000
        },
        hide: {
            effect: "explode",
            duration: 1000
        },
        buttons: {
            "Show less": () => {
                caja.dialog("destroy");
            }
        }
    });
}

/** Contruye un modal para la descripción de cada uno de los personajes.
 * @description Función que crea un modal, con la descripción del personaje, cuando salta el evento click
 * del botón añadido en el cuerpo de la carta.
 * @param {Object} personaje Objeto con la información necesaria. 
 */
function muestraModalPersonaje(personaje) {

    var txt;
    if ((personaje.description != null) && (personaje.description != '')) {
        txt = personaje.description;
    } else {
        txt = 'No hay descripción disponible.';
    }

    var caja = $('<div title="' + personaje.name + '"><p>' + txt + '</p></br><a href="' + personaje.urls[1].url + '" style="color: blue; font-weight: bold;">Official Biography</a></br><a href="' + personaje.urls[0].url + '" style="color: blue; font-weight: bold;">Online Comic</a></div>');
    caja.dialog({
        modal: true,
        width: 550,
        show: {
            effect: "blind",
            duration: 1000
        },
        hide: {
            effect: "explode",
            duration: 1000
        },
        buttons: {
            "Show less": () => {
                caja.dialog("destroy");
            }
        }
    });
}

// ========================== BUSCADOR ==========================

/** Recoge la información del formulario.
 * @description Recoge la información introducida por el usuario en el formulario, para realizar los
 * filtros deseados. Comprueba las validaciones y devuelve mensajes de error en caso de que encuentre
 * alguno.
 */
function recogeFormulario() {
    $('#nombreInHelp').remove();
    var input = $('#nombreIn').val();
    var select = $('#selectTipo option:selected').val();
    var url;

    if (select == 'comics') {
        url = 'https://gateway.marvel.com:443/v1/public/comics?titleStartsWith=' + input + '&limit=100';
    } else {
        url = 'https://gateway.marvel.com:443/v1/public/characters?nameStartsWith=' + input + '&limit=100';
    }

    if ((input != '') && (input != null)) {
        pideConexion(url, claves, 'bus');
    } else {
        $('#nombreInHelp').remove();
        $('#control-input').append('<small id="nombreInHelp" class="form-text text-danger mx-1">Debe introducir un nombre o un título.</small>');
    }
}

/** Construye la vista de la búsqueda.
 * @description función encargada de construir la vista de la búsqueda, comprobando si es un cómic o un personaje
 * y enviándolo a su respectiva función. Antes de ello, vacía el contenedor para que no se repitan ni se acoplen datos.
 * @param {Object} datos Contiene los datos a mostrar.
 */
function muestraBusqueda(datos) {

    $('#contenedor-busqueda').empty();

    if (datos[0].name != null) {
        datos.forEach(dato => {
            console.log(dato);
            muestraPersonaje(dato, $('#contenedor-busqueda'));
        });
    } else {
        datos.forEach(dato => {
            muestraComic(dato, $('#contenedor-busqueda'));
        });
    }

    if (datos.length > 12) {
        paginado('busqueda');
    }


}

// =========================== PAGINADO ===========================
function paginado(contenedor) {
    var items = $('#contenedor-' + contenedor + ' div.card');

    var numItems = items.length;
    var perPage = 12;
    /* He tenido que ampliar la cantidad de elementos que se ven en la paginación porque
    utilizo el grid de bootstrap para representarlos, y son 6 columnas. Si pongo 10 se ve horrible.*/

    items.slice(perPage).hide();

    $("#pagination").pagination({
        items: numItems,
        itemsOnPage: perPage,
        cssStyle: "light-theme",

        onPageClick: function (pageNumber) {
            var showFrom = perPage * (pageNumber - 1);
            var showTo = showFrom + perPage;

            items.hide().slice(showFrom, showTo).show();
        }
    });
}


// =================================== UTILIDADES ==============
/** Encripta las claves para su correcto funcionamiento al realizar la petición. */
function encritpaClave() {
    let publicKey = 'ed390afd600be846b4af57e268e17464';
    let privateKey = '304d119309e31647bf4112971fd8cccb1df36a63';
    let marcaTiempo = Date.now().toLocaleString();
    let hash = MD5(marcaTiempo + privateKey + publicKey);

    let claves = {
        'TS': marcaTiempo,
        'PuKey': publicKey,
        'shaMD5': hash
    };
    return claves;
}

// ============= EXTRAS =====================
/** Añade contenido de vídeo a la zona de inicio */
function añadeContenido() {

    var videosUrl = ['<iframe width="auto" height="315" src="https://www.youtube.com/embed/L7Y0ucw7bGk" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
        '<iframe width="auto" height="300" src="https://www.youtube.com/embed/y0M433RvwZo" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
        '<iframe width="auto" height="300" src="https://www.youtube.com/embed/NcLmyi46VYA" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
        '<iframe width="auto" height="300" src="https://www.youtube.com/embed/jVifYbhHIyw" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
        '<iframe width="auto" height="300" src="https://www.youtube.com/embed/rfGFAvvdJhI" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
        '<iframe width="auto" height="300" src="https://www.youtube.com/embed/Hkgvt43I_wE" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    ];
    var videosTitle = ['Female Avengers Fight',
        'Avengers: Infinity War - Fight scenes',
        'Thor: Ragnarok - Thor vs Hulk - Full Fight Scene HD',
        'Thor Best Scenes With Hammer Compilation 2018', 'FUNNIEST MOMENT IN EVERY MARVEL MOVIE',
        'Captain Marvel - Best Scenes'
    ];

    for (let i = 0; i < videosUrl.length; i++) {
        var contenedorCarta = $('<div class="col mb-4 d-flex justify-content-center"></div>');
        var carta = $('<div class="card" style="width: 30rem; float: left;"></div>');
        var img = $(videosUrl[i]);
        var pieCarta = $('<div class="card-footer text-center"><small>' + videosTitle[i] + '</small></div>');
        carta.append(img);
        carta.append(pieCarta);
        contenedorCarta.append(carta);
        $('#contenedor-inicio').append(contenedorCarta);
    }
}

/** Como extra, también he añadido al modal de comics el enlace a la tienda marvel para comprarlos
 * y en personajes he añadido el enlace a la biografía y a la tienda de comics de ese personaje.
 */