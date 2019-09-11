/* Notas y consultas. 
-Al archivo competencia.js tuve que cambiarle la direccion ip de server -linea 2-
-Por cada competencia hay que crear un get.app ? ya que le pasa la direccion /competencias/2/pelicula
*/
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var conexionBaseDeDatos = require('./conexionbd');
var controlador = require('./controladorCompetencias');
var app = express();
app.use(cors());

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());

//Seteamos el puerto.
var puerto = '8080';


  //Funciones segun guia del proyecto.
  
  //guia1 - Devolver lista de competencias.
app.get('/competencias', controlador.listaCompetencias);
  //Guia 3 -Crear nueva competencia
app.post('/competencias',controlador.crearCompetencia);
app.get('/competencias/:id',controlador.datosCompetencia);  
//guia 2 - Verificar si existe la competencia y obtener dos peliculas aleatorias.
app.get('/competencias/:id/peliculas', controlador.verificarCompetencias);
  //guia 2.4 -
app.post('/competencias/:id/voto',controlador.registrarVoto);
  //guia 2.5 -obtener resultados
app.get('/competencias/:id/resultados',controlador.obtenerResultados);
  //guia 3 - Reiniciar competencia. Es decir eliminar todos los votos que esta posee. 
app.delete('/competencias/:id/votos',controlador.reiniciarCompetencia);
app.delete('/competencias/:id',controlador.eliminarCompetencia);
  //guia 3.3 
app.get('/generos', controlador.obtenerGeneros);
app.get('/directores', controlador.obtenerDirectores);
app.get('/actores', controlador.obtenerActores);
app.put('/competencias/:idCompetencia', controlador.editarCompetencia);




app.listen(puerto, function () {
  console.log("Escuchando pedidos en el puerto " + puerto);
  conexionBaseDeDatos.connect((err) => {
    if (err) {
      console.log(err)
    } else {
      console.log("La conexión a la base de datos fue exitosa!");
    }
  })
});
