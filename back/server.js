const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(cors({
    origin: '*', // O la URL de tu frontend si la tienes restringida
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión a Base de Datos (mysql2/promise)

// Si estás probando en tu computadora, necesitas esta línea para leer el .env
require('dotenv').config(); 

require('dotenv').config();




// Forma correcta para TiDB Cloud usando una URL de conexión
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { 
        rejectUnauthorized: true // O false según prefieras para el certificado de TiDB
    }
});

db.connect((err) => {
    if (err) {
        console.error("Error al conectar a TiDB:", err);
    } else {
        console.log("¡Conectado exitosamente a TiDB Cloud!");
    }
});

module.exports = db;
// Importar Rutas (Ejemplo resumido de Endpoints clave)
// Ruta para Registrar Usuario
app.post('/api/auth/registro', async (req, res) => {
    console.log("-> Petición de registro recibida:", req.body);
    
    try {
        const { nombre, apellido, correo, telefono, password } = req.body;

        if (!nombre || !apellido || !correo || !telefono || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }

        const query = 'INSERT INTO usuarios (nombre, apellido, correo, telefono, password_hash) VALUES (?, ?, ?, ?, ?)';
        
        // Ejecutar inserción en MySQL Workbench
        const [resultado] = await db.execute(query, [nombre, apellido, correo, telefono, password]);
        
        console.log("-> Usuario insertado correctamente con ID:", resultado.insertId);
        return res.status(201).json({ mensaje: 'Usuario registrado exitosamente.' });
        
    } catch (error) {
        console.error("-> ERROR EN SQL DE REGISTRO:", error.message);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
        }
        return res.status(500).json({ error: error.message });
    }
});
// Ruta para Iniciar Sesión
app.post('/api/auth/login', async (req, res) => {
    console.log("-> Petición de login recibida:", req.body);
    
    try {
        const { correo, password } = req.body;

        if (!correo || !password) {
            return res.status(400).json({ error: 'Correo y contraseña requeridos.' });
        }

        // Consulta a MySQL Workbench
        const [rows] = await db.execute(
            'SELECT * FROM usuarios WHERE correo = ? AND password_hash = ?', 
            [correo, password]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
        }

        const usuario = rows[0];
        console.log("-> Login exitoso para:", usuario.correo);

        return res.json({
            mensaje: 'Login exitoso',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                correo: usuario.correo
            }
        });

    } catch (error) {
        console.error("-> ERROR EN SQL DE LOGIN:", error.message);
        return res.status(500).json({ error: error.message });
    }
});

// =========================================================
// RUTA PARA OBTENER EL INVENTARIO CON LA PUJA MÁS ALTA
// =========================================================
app.get('/api/vehiculos', async (req, res) => {
    try {
        // Subconsulta SQL que trae el vehículo + la puja máxima + el usuario que va ganando
        const query = `
            SELECT v.*, 
                   (SELECT MAX(monto) FROM pujas WHERE vehiculo_id = v.id) AS puja_maxima,
                   (SELECT usuario_id FROM pujas WHERE vehiculo_id = v.id ORDER BY monto DESC LIMIT 1) AS ganador_id
            FROM vehiculos v 
            ORDER BY v.id DESC
        `;
        const [vehiculos] = await db.execute(query);
        
        return res.status(200).json(vehiculos);
        
    } catch (error) {
        console.error("-> ERROR AL OBTENER VEHÍCULOS:", error.message);
        return res.status(500).json({ error: 'Error al obtener el inventario' });
    }
});

const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento para las imágenes seleccionadas
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Carpeta donde se guardarán físicamente
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Asegúrate de servir la carpeta uploads como pública para que el navegador pueda mostrarlas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ruta para publicar vehículo con subida de archivos múltiple (Mínimo 5 fotos)
app.post('/api/vehiculos', upload.array('fotos', 10), async (req, res) => {
    console.log("-> Petición de publicación recibida");
    
    try {
        const { usuario_id, anio, tipo_articulo, marca, modelo, motor, transmision, combustible, tren_manejo, cilindros, estado_dano, precio_base, fecha_inicio, fecha_cierre } = req.body;
        const archivos = req.files;

        // Validar regla de negocio: Mínimo 5 fotografías obligatorias
        if (!archivos || archivos.length < 5) {
            return res.status(400).json({ error: 'La regla de negocio exige un mínimo de 5 fotografías.' });
        }

        // Crear una cadena separada por comas con las rutas relativas de las imágenes guardadas
        const rutasFotos = archivos.map(file => `/uploads/${file.filename}`).join(',');

        const query = `INSERT INTO vehiculos (usuario_id, anio, tipo_articulo, marca, modelo, motor, transmision, combustible, tren_manejo, cilindros, estado_dano, fotos, precio_base, fecha_inicio, fecha_cierre) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const [resultado] = await db.execute(query, [
            usuario_id, anio, tipo_articulo, marca, modelo, motor, transmision, combustible, tren_manejo, cilindros, estado_dano, rutasFotos, precio_base, fecha_inicio, fecha_cierre
        ]);

        console.log("-> Vehículo publicado con ID:", resultado.insertId);
        return res.status(201).json({ mensaje: 'Vehículo publicado exitosamente.' });

    } catch (error) {
        console.error("-> ERROR EN PUBLICACIÓN:", error.message);
        return res.status(500).json({ error: error.message });
    }
});
// GESTIÓN DE TIEMPO REAL CON SOCKET.IO
io.on('connection', (socket) => {
    console.log('Usuario conectado a WebSockets:', socket.id);

    // Unirse a una sala específica de subasta de un vehículo
    socket.join_subasta = (vehiculoId) => {
        socket.join(`vehiculo_${vehiculoId}`);
    };

    socket.on('unirse_vehiculo', (vehiculoId) => {
        socket.join(`vehiculo_${vehiculoId}`);
    });

   // Recibir nueva puja en tiempo real
    socket.on('nueva_puja', async (data) => {
        console.log("-> Intento de puja recibido por Sockets:", data);
        const { vehiculoId, usuarioId, monto } = data;

        try {
            // 1. Validar el vehículo
            const [vehiculoRows] = await db.execute('SELECT precio_base, fecha_cierre FROM vehiculos WHERE id = ?', [vehiculoId]);
            if (vehiculoRows.length === 0) return socket.emit('error_puja', 'Vehículo no encontrado');
            
            const vehiculo = vehiculoRows[0];
            
            // 2. Insertar la puja REAL en la tabla 'pujas'
            const insertQuery = 'INSERT INTO pujas (vehiculo_id, usuario_id, monto) VALUES (?, ?, ?)';
            await db.execute(insertQuery, [vehiculoId, usuarioId, monto]);
            
            console.log(`-> Puja guardada en BD: Vehiculo ${vehiculoId} | Usuario ${usuarioId} | Monto ${monto}`);

            // 3. Emitir a todos los usuarios conectados a esa subasta
            io.to(`vehiculo_${vehiculoId}`).emit('actualizacion_puja', {
                nuevaPuja: monto,
                usuarioGanadorId: usuarioId 
            });

        } catch (error) {
            console.error("-> ERROR FATAL GUARDANDO PUJA EN MYSQL:", error.message);
            socket.emit('error_puja', 'Error interno al procesar la puja. Revisa la terminal del servidor.');
        }
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Servidor backend corriendo en puerto ${PORT}`);
});
// =========================================================
// RUTA PARA EDITAR UN VEHÍCULO PUBLICADO
// =========================================================
app.put('/api/vehiculos/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`-> Petición PUT recibida para actualizar el vehículo ID: ${id}`);
    
    try {
        const { anio, tipo_articulo, marca, modelo, motor, transmision, combustible, tren_manejo, cilindros, estado_dano, precio_base, fecha_inicio, fecha_cierre } = req.body;

        const query = `UPDATE vehiculos SET anio = ?, tipo_articulo = ?, marca = ?, modelo = ?, motor = ?, transmision = ?, combustible = ?, tren_manejo = ?, cilindros = ?, estado_dano = ?, precio_base = ?, fecha_inicio = ?, fecha_cierre = ? WHERE id = ?`;
        
        await db.execute(query, [
            anio, tipo_articulo, marca, modelo, motor, transmision, combustible, tren_manejo, cilindros, estado_dano, precio_base, fecha_inicio, fecha_cierre, id
        ]);

        console.log(`-> Vehículo ID ${id} actualizado correctamente.`);
        return res.status(200).json({ mensaje: 'Vehículo actualizado exitosamente.' });

    } catch (error) {
        console.error("-> ERROR AL EDITAR VEHÍCULO:", error.message);
        return res.status(500).json({ error: 'No se pudo actualizar el vehículo en la base de datos.' });
    }
});
// Ruta para obtener los vehículos de un usuario específico
app.get('/api/vehiculos/usuario/:id', (req, res) => {
    const usuarioId = req.params.id;
    const query = 'SELECT * FROM vehiculos WHERE usuario_id = ?'; // O el nombre de la columna que uses para el dueño
    db.query(query, [usuarioId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener los vehículos del usuario' });
        }
        res.json(results);
    });
});