const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Pool } = require('mysql2');
const mysql = require('mysql2');
const fs = require('fs');
const axios = require('axios');
const app = express();
//const { createPool } = require('mysql2'); // Importa la función createPool de mysql2
const { createPool } = require('mysql2/promise'); // Importa la función createPool de mysql2

const { query } = require('express');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
//const mysql2 = require('mysql2/promise'); // Importa el módulo que admite promesas

//const upload = multer({ storage: storage });
app.use(cors());
app.use(express.json());
//app.use('/uploads', express.static('uploads'));//faltaba agregar esta linea de codigo
app.listen(3002, () => console.log('Server started'));
app.use(express.json())

/*
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'marce1215',
    database: 'joyas',
    waitForConnections: true,
    connectionLimit: 10, // El número máximo de conexiones en el pool
    queueLimit: 0 // No hay límite en la cola de conexiones

})*/

const pool = createPool({
    host: 'localhost',
    user: 'root',
    password: 'marce1215',
    database: 'joyas',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
/*  
const pool = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'marce1215',
    database: 'joyas',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});*/
/*
pool.connect((err) => {
    if (err) throw err;
    console.log('connected to database');
});*/
/*
connection.connect((err) => {
    if (err) {
        console.error('Error de conexión a la base de datos:', err);
        return;
    }
    console.log('Conexión exitosa a la base de datos.');
});*/

/*
app.post('/posts', upload.single('img'), async (req, res) => {

    //   try {
    const { description } = req.body;

    if (!req.file || !req.file.path) {
        console.error('No se proporcionó un archivo válido.');
        res.status(400).json({ message: 'Invalid file provided' });
        return;
    }

    const img = req.file.path;

    // Obtener una conexión del pool
    //const connection = await pool.getConnection();

    const sql = "INSERT INTO posts (img, descripcion) VALUES (?, ?)";
    const values = [img, description];

    // Ejecutar la consulta SQL
    //const [results] = await connection.query(sql, values);
    connection.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error al insertar datos:', err);
        } else {
            console.log('Datos insertados correctamente.');
        }

        
    });


    console.log(req.file);
    console.log(req.file.path);


    res.json({ message: 'Post created' });
    // } 
    // catch (error) {
    //     console.error(error);
    //     res.status(500).json({ message: 'Something went wrong' });
    // }
});


*/

// Realiza las operaciones que necesitas con la conexión aquí
// Por ejemplo, puedes ejecutar consultas o realizar operaciones en la base de datos.
// Realizar una consulta SELECT



function queryAsync(sql) {
    return new Promise((resolve, reject) => {
        connection.query(sql, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

app.get('/joyas', async (req, res) => {
    try {
        const { limits, page, order_by } = req.query;
        console.log(limits, page, order_by);
        let orderByClause = '';
        if (order_by) {
            const [column, direction] = order_by.split('_');
            orderByClause = `ORDER BY ${column} ${direction.toUpperCase()}`;
        }
        const limit = parseInt(limits) || 3;
        const offSet = (parseInt(page) - 1) * limit || 0;
        console.log(limit, offSet);

        // Formateamos la consulta SQL con valores en su lugar
        const query = `
            SELECT * FROM inventario
            ${orderByClause}
            LIMIT ${pool.escape(limit)} OFFSET ${pool.escape(offSet)}
        `;

        // Ejecutamos la consulta SQL
        const [results] = await pool.execute(query);

        const [stockResult] = await pool.execute(`
            SELECT SUM(stock) as total FROM inventario
        `);
        console.log('status result', stockResult[0]);
        const stockTotal = stockResult[0].total;
        console.log(stockTotal);

        const respuesta = {
            totaljoyas: results.length,
            stockTotal: parseInt(stockTotal),
            results: results.map(joya => ({
                id: joya.id,
                nombre: joya.nombre,
                categoria: joya.categoria, // Agrega la categoría
                metal: joya.metal, // Agrega el metal
                precio: joya.precio,
            }))
        };
        console.log(respuesta);
        res.json(respuesta);
    } catch (error) {
        console.log(error);
    }
});

app.get('/joyas/filter', async (req, res) => {
    try {
        const { precio_max, precio_min, categoria, metal } = req.query;
        let query = 'SELECT * FROM inventario WHERE 1=1';
        const values = [];

        if (precio_max) {
            query += ' AND precio <= ?';
            values.push(precio_max);
        }
        if (precio_min) {
            query += ' AND precio >= ?';
            values.push(precio_min);
        }
        if (categoria) {
            query += ' AND categoria = ?';
            values.push(categoria);
        }
        if (metal) {
            query += ' AND metal = ?';
            values.push(metal);
        }

        const [results] = await pool.execute(query, values);

        res.json(results);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error en la consulta' });
    }
});