var conexionBaseDeDatos = require('./conexionbd');

function listaCompetencias(req, res) {
    var consulta = 'select * from competencias'

    conexionBaseDeDatos.query(consulta, function (err, results, fields) {
        if (err) {
            console.log("Error en la consulta", error.message);
            return res.status(500).send("Hubo un error al cargar las peliculas. Verificar los parametros ingresados");
        }
        else {
            res.send(results);
        }
    })
}

function verificarCompetencias(req, res) {

    var id = req.params.id;
    //Obtener dos peliculas aleatorias para la competencia creada

    function enviarOpciones(consulta, nombreCompetencia) {

        conexionBaseDeDatos.query(consulta, function (err, resul, fields) {
            if (err) {
                console.log("Error en la consulta", err.message);
                return res.status(500).send("Hubo un error al cargar las peliculas. Verificar los parametros ingresados +");
            }
            else {
                var opciones = {
                    competencia: nombreCompetencia,
                    peliculas: resul,
                }

                //condicional para asegurar que no devuelva en las opciones dos veces a la misma pelicula.
                if (opciones.peliculas[0].id != opciones.peliculas[1].id) {
                    res.send(opciones);
                } else {
                    enviarOpciones(consulta, nombreCompetencia)
                };
            }
        })
    }


    function obtener2Pelis(nombreCompetencia) {

        //Aplicamos los respectivos filtros a cada competencia. 
        function aplicarFiltros(results) {
            //Si trae un numero tiene que ir =n ,, si no !=0
            //Pongo todos los filtros en =!0 -- Nos va a traer todos los resultados. 
            var genero, actor, director; genero = actor = director = '!=0';
            //Ahora, si la competencia hay que filtrar , se modifican los valores. 
            if (results[0].id_genero != 0) { genero = `=${results[0].id_genero}` };
            if (results[0].id_director != 0) { director = `=${results[0].id_director}` };
            if (results[0].id_actor != 0) { actor = `=${results[0].id_actor}` };
            var consulta = ` select pelicula.id, pelicula.titulo, pelicula.poster from pelicula
            inner join director_pelicula on director_pelicula.pelicula_id = pelicula.id
             inner join actor_pelicula on actor_pelicula.pelicula_id = pelicula.id
             where director_pelicula.director_id ${director} and pelicula.genero_id ${genero} and actor_pelicula.actor_id ${actor}
             order by rand() limit 2 ;`;
            //LLama a la funcion que envia las opciones de peliculas al front end. 
            enviarOpciones(consulta, nombreCompetencia);
        };
        //Consulta a la base de datos, que tipo de filtros se aplican en la competencia determinada.
        conexionBaseDeDatos.query(`SELECT * FROM competencias.competencias where id = ${id}`, function (error, results, fields) {
            if (error) {
                console.log("Error en la consulta", error.message);
                return res.status(500).send("Hubo un error al cargar los datos. Verificar los parametros ingresados");
            }
            else {
                //llama a la funcion que aplica los filtros correspondientes. 
                aplicarFiltros(results);
            }
        });
    }

    //Verifica si existe la competencia. Si es asi, obtiene el nombre. 
    var consultaNombre = `select nombre from competencias where id = ${id} `;
    conexionBaseDeDatos.query(consultaNombre, function (error, results, fields) {

        if (error || results == '') {
            console.log("Error en la consulta");
            res.status(404).send("La competencia buscada no existe.");
        } else {
            obtener2Pelis(results[0].nombre)
        }
    });
}

function registrarVoto(req, res) {

    var idCompetencia = req.params.id;
    var idPelicula = req.body.idPelicula;


    //verifico si ya tiene algun voto
    var consulta = `SELECT votos.id, cantidad FROM competencias.votos where competencias_id = ${idCompetencia} and pelicula_id = ${idPelicula} `;

    conexionBaseDeDatos.query(consulta, function (error, results, fields) {
        if (error) {
            console.log("Error en la consulta", error.message);
            return res.status(500).send("Hubo un error al cargar los datos. Verificar los parametros ingresados");
        }
        else {
            if (results.length == 1) {
                var idVotos = results[0].id;
                var cantidad = results[0].cantidad;
                votarPelicula(idVotos, cantidad)
            }
            if (results.length == 0) {
                crearRelacionVoto()
            }
        }
    });


    //Si ya fue votada- sumo 1 a la cantidad de votos
    var votarPelicula = function (idVot, cantidad) {

        cantidad++;
        var sumarVoto = `UPDATE competencias.votos SET cantidad = ${cantidad} WHERE (id = ${idVot} );`
        conexionBaseDeDatos.query(sumarVoto, function (error, results, fields) {
            if (error) {
                console.log("Error en la consulta", error.message);
                return res.status(500).send("Hubo un error al cargar los datos. Verificar los parametros ingresados");
            }
        });
    }

    //Si nunca fue votada -- Crear relacion y votar.
    var crearRelacionVoto = function () {
        var insertar = `INSERT INTO competencias.votos (competencias_id, pelicula_id, cantidad) VALUES (${idCompetencia} , ${idPelicula} , 1);`
        conexionBaseDeDatos.query(insertar, function (error, results, fields) {
            if (error) {
                console.log("Error en la consulta", error.message);
                return res.status(500).send("Hubo un error al cargar los datos. Verificar los parametros ingresados");
            }
        });
    }
}

function obtenerResultados(req, res) {
    var idCompetencia = req.params.id

    var consultaResultados = `select * from votos
    join pelicula on pelicula_id = pelicula.id
    where competencias_id = ${idCompetencia} 
    order by cantidad desc
    limit 3`;

    conexionBaseDeDatos.query(consultaResultados, function (error, results, fields) {
        if (error) {
            console.log("Error en la consulta", error.message);
            return res.status(500).send("Hubo un error al cargar los datos. Verificar los parametros ingresados");
        }
        else {
            averiguarNombreCompetencia(results);
        }
        function averiguarNombreCompetencia(resultados) {
            var consultaNombre = `select nombre from competencias where id = ${idCompetencia} `;
            conexionBaseDeDatos.query(consultaNombre, function (error, results, fields) {
                if (error) {
                    console.log("Error en la consulta", error.message);
                    return res.status(500).send("Hubo un error al cargar los datos. Verificar los parametros ingresados");
                }
                else {
                    var data = {
                        resultados: resultados,
                        competencia: results[0].nombre,
                    }
                   res.send(data);
                }
            })
        }
    })
}

function crearCompetencia(req, res) {
    // validacion de la nueva competencia - El titulo no puede repetirse, tiene que tener mas de 7 caracteres y la competencia tiene que ser entre por lo menos 2 peliculas. 

    //Validamos que el titulo tenga mas de 7 caracteres
    if (req.body.nombre.length > 7) {
        //validacion que por lo menos para la competencia que se intenta crear existan dos peliculas.
        var genero, actor, director; genero = actor = director = '!=0';
        if (req.body.genero != 0) { genero = `=${req.body.genero}` };
        if (req.body.director != 0) { director = `=${req.body.director}` };
        if (req.body.actor != 0) { actor = `=${req.body.actor}` };
        var consultaNuevaCompetencia = ` select distinctrow pelicula.id  from pelicula
                inner join director_pelicula on director_pelicula.pelicula_id = pelicula.id
                 inner join actor_pelicula on actor_pelicula.pelicula_id = pelicula.id
                 where director_pelicula.director_id ${director} and pelicula.genero_id ${genero} and actor_pelicula.actor_id ${actor}
                 order by rand() limit 2; `;

        conexionBaseDeDatos.query(consultaNuevaCompetencia, function (error, results, fields) {
            if (error) {
                console.log("Error en la consulta", error.message);
                return res.status(422).send(error.message);
            }
            else {                
                if (results.length == 2) {
                    crearCompetencia()
                } else {
                    res.status(422).send('La competencia debe contar con un minimo de dos peliculas. Por favor, modifique los filtros.')
                }
            }
        });
    } else {
        res.status(422).send("Verifique que: El nombre debe tener como minimo 8 caracteres.")
    }

    function crearCompetencia() {
        //Verificar, que la consulta no me haya devuelto la misma pelicula. Por que estaria diciendo que haya mas de dos pelis cuando es una sola , que la trae mas de una vez por una cuestion de multiples personajes / directores.

        var nuevaCompetencia = `INSERT INTO competencias.competencias (nombre, id_genero, id_director, id_actor) VALUES ('${req.body.nombre}', ${req.body.genero}, ${req.body.director}, ${req.body.actor}); `;

        conexionBaseDeDatos.query(nuevaCompetencia, function (error, results, fields) {
            if (error) {
                console.log("Error en la consulta", error.message);
                return res.status(422).send("El nombre no puede repetirse con el de otra competencia. Intente con uno distinto.");
            }
            else {
                res.send(results);
            }
        });


    }
}

function reiniciarCompetencia(req, res) {
    var reiniciarVotos = `delete from votos where competencias_id = ${req.params.id}`
    conexionBaseDeDatos.query(reiniciarVotos, function (error, results, fields) {
        if (error) {
            console.log("Error en la consulta", error.message);
            return res.status(500).send("Hubo un error al cargar los datos. Verificar los parametros ingresados");
        }
        else { res.send() }
    });
}

function eliminarCompetencia(req, res) {

    var eliminarForaneas = `DELETE FROM competencias.votos WHERE (competencias_id = '${req.params.id}');`;
    conexionBaseDeDatos.query(eliminarForaneas, function (error, results, fields) {
        if (error) {
            console.log("Error en la consulta", error.message);
            return res.status(500).send(`No se pudo eliminar la competencia id = ${req.params.id}.`);
        } else {
            var eliminarComp = ` DELETE FROM competencias.competencias WHERE id = ${req.params.id};`;
            conexionBaseDeDatos.query(eliminarComp, function (error, results, fields) {
                if (error) {
                    console.log("Error en la consulta", error.message);
                    return res.status(500).send(`No se pudo eliminar la competencia id = ${req.params.id}.`);
                } else {
                    //Validar si la competencia existia o no. X q si no existia ese ID va a dar OK cuando en realidad no elimino nada. 
                    res.send('La competencia a sido eliminada con exito.')
                }
            })
        }
    })
}

function obtenerGeneros(req, res) {
    var consultaGeneros = `SELECT * FROM competencias.genero;`;
    conexionBaseDeDatos.query(consultaGeneros, function (error, results, fields) {
        if (error) {
            console.log("Error en la consulta", error.message);
            return res.status(500).send("Hubo un error al cargar los generos. Intente nuevamente.");
        }
        else {
            res.send(results);
        }
    });
}

function obtenerDirectores(req, res) {
    var consultaDirectores = `SELECT * FROM competencias.director;`;
    conexionBaseDeDatos.query(consultaDirectores, function (error, results, fields) {
        if (error) {
            console.log("Error en la consulta", error.message);
            return res.status(500).send("Hubo un error al cargar los Directores. Intente nuevamente.");
        }
        else {
            res.send(results);
        }
    });
}

function obtenerActores(req, res) {
    var consultaActores = `SELECT * FROM competencias.actor;`;
    conexionBaseDeDatos.query(consultaActores, function (error, results, fields) {
        if (error) {
            console.log("Error en la consulta", error.message);
            return res.status(500).send("Hubo un error al cargar los Actores. Intente nuevamente.");
        }
        else {
            res.send(results);
        }
    });
}

function editarCompetencia(req, res) {
    if (req.body.nombre.length > 7) {

        var editarNombre = `UPDATE competencias.competencias SET nombre = '${req.body.nombre}' WHERE (id = ${req.params.idCompetencia});`;
        conexionBaseDeDatos.query(editarNombre, function (error, results, fields) {
            if (error) {
                console.log("Error en la consulta", error.message);
                return res.status(422).send("Verificar que el nombre de competencia no debe repetirse con ninguno existente.");
            }
            else {
                res.send(results);
            }
        });
    } else {
        res.status(422).send("Verifique que: El nombre debe tener como minimo 8 caracteres.")
    }
}

function datosCompetencia(req, res) {
    //------------------------
    var tareasCompletas = 0;
    var consulta = `  SELECT * FROM competencias.competencias where id = ${req.params.id};  `;
    var data = {
        nombre: '',
        genero_nombre: '',
        director_nombre: '',
        actor_nombre: '',
    }
    conexionBaseDeDatos.query(consulta, function (error, results, fields) {
        if (error) {
            console.log("Error en la consulta", error.message);
            return res.status(404).send("La competencia solicitada no existe.");
        }
        else {
            tipoFiltro(results);
        }
    });
    //------------------------------
    function tipoFiltro(results) {
        data.nombre = results[0].nombre;
        if (results[0].id_genero != 0) { averiguarNombre('genero') } else { tareasCompletas++ };
        if (results[0].id_actor != 0) { averiguarNombre('actor') } else { tareasCompletas++ };
        if (results[0].id_director != 0) { averiguarNombre('director') } else { tareasCompletas++ };
    };
    //-----------------------------
    function averiguarNombre(filtro) {
        var consultaNombre = `select ${filtro}.nombre from competencias
        join ${filtro} on id_${filtro} = ${filtro}.id
        where competencias.id = ${req.params.id} `;
        conexionBaseDeDatos.query(consultaNombre, function (error, results, fields) {
            if (error) {
                console.log("Error en la consulta", error.message);
                res.status(500).send("Hubo un error al cargar los datos. Verificar los parametros ingresados");
            }
            else {
                if (filtro == 'genero') { data.genero_nombre += results[0].nombre };
                if (filtro == 'actor') { data.actor_nombre += results[0].nombre };
                if (filtro == 'director') { data.director_nombre += results[0].nombre };
                tareasCompletas++;
                if (tareasCompletas == 3) { res.send(data) }
            }
        });
    }
}


module.exports = {
    listaCompetencias: listaCompetencias,
    verificarCompetencias: verificarCompetencias,
    registrarVoto: registrarVoto,
    obtenerResultados: obtenerResultados,
    crearCompetencia: crearCompetencia,
    reiniciarCompetencia: reiniciarCompetencia,
    eliminarCompetencia: eliminarCompetencia,
    obtenerGeneros: obtenerGeneros,
    obtenerDirectores: obtenerDirectores,
    obtenerActores: obtenerActores,
    editarCompetencia: editarCompetencia,
    datosCompetencia: datosCompetencia,
}