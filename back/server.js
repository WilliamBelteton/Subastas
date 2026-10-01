const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================================================
// CONEXIÓN A BASE DE DATOS (Usando Pool con mysql2/promise)
// =========================================================
const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { 
        rejectUnauthorized: false // Vital para aceptar el certificado SSL de TiDB Cloud
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Probar la conexión al iniciar el servidor
db.getConnection()
    .then(connection => {
        console.log("¡Conectado exitosamente a TiDB Cloud!");
        connection.release();
    })
    .catch(err => {
        console.error("Error al conectar a TiDB:", err);
    });

// =========================================================
// RUTAS DE AUTENTICACIÓN
// =========================================================

app.post('/api/auth/registro', async (req, res) => {
    console.log("-> Petición de registro recibida:", req.body);
    try {
        const { nombre, apellido, correo, telefono, password } = req.body;

        if (!nombre || !apellido || !correo || !telefono || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }

        const query = 'INSERT INTO usuarios (nombre, apellido, correo, telefono, password_hash) VALUES (?, ?, ?, ?, ?)';
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

app.post('/api/auth/login', async (req, res) => {
    console.log("-> Petición de login recibida:", req.body);
    try {
        const { correo, password } = req.body;

        if (!correo || !password) {
            return res.status(400).json({ error: 'Correo y contraseña requeridos.' });
        }

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
// RUTAS DE VEHÍCULOS
// =========================================================

app.get('/api/vehiculos', async (req, res) => {
    try {
        const [vehiculos] = await db.query('SELECT * FROM vehiculos');
        return res.status(200).json(vehiculos);
    } catch (error) {
        console.error("-> ERROR AL OBTENER VEHÍCULOS:", error.message);
        return res.status(500).json({ error: 'Error al obtener el inventario' });
    }
});

// Configuración de Multer para imágenes
// =========================================================
// CONFIGURACIÓN DE CLOUDINARY Y MULTER
// =========================================================
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// 1. Configurar credenciales leyendo tu archivo .env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Crear el almacenamiento en la nube en lugar de tu disco local
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'subastas_express', // Carpeta automática en tu Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    }
});

const upload = multer({ storage: storage });

// Mantenemos esto por si hay fotos viejas que aún intentan cargar localmente
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. Ruta de publicación actualizada
app.post('/api/vehiculos', upload.array('fotos', 10), async (req, res) => {
    console.log("-> Petición de publicación recibida");
    try {
        const { usuario_id, anio, tipo_articulo, marca, modelo, motor, transmision, combustible, tren_manejo, cilindros, estado_dano, precio_base, fecha_inicio, fecha_cierre } = req.body;
        const archivos = req.files;

        if (!archivos || archivos.length < 5) {
            return res.status(400).json({ error: 'La regla de negocio exige un mínimo de 5 fotografías.' });
        }

        // EL CAMBIO CLAVE: Cloudinary devuelve la URL pública permanente en 'file.path'
        const rutasFotos = archivos.map(file => file.path).join(',');

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

// Ruta corregida a async/await para vehículos por usuario
app.get('/api/vehiculos', async (req, res) => {
    try {
        const query = `
            SELECT v.id, v.usuario_id, v.anio, v.tipo_articulo, v.marca, v.modelo, v.motor, 
                   v.transmision, v.combustible, v.tren_manejo, v.cilindros, v.estado_dano, 
                   v.fotos, v.precio_base, v.fecha_inicio, v.fecha_cierre,
                   COALESCE((SELECT MAX(monto) FROM pujas WHERE vehiculo_id = v.id), v.precio_base) AS monto,
                   (SELECT usuario_id FROM pujas WHERE vehiculo_id = v.id ORDER BY monto DESC LIMIT 1) AS ganador_id
            FROM vehiculos v
        `;
        const [vehiculos] = await db.query(query);
        
        // 👉 AGREGA ESTA LÍNEA PARA VER QUÉ DEVUELVE SQL EN LOS LOGS DE RENDER:
        console.log("-> Vehículos obtenidos con su monto máximo:", vehiculos.map(v => ({ id: v.id, monto: v.monto })));

        return res.status(200).json(vehiculos);
    } catch (error) {
        console.error("-> ERROR AL OBTENER VEHÍCULOS:", error.message);
        return res.status(500).json({ error: 'Error al obtener el inventario' });
    }
});

// =========================================================
// GESTIÓN DE TIEMPO REAL CON SOCKET.IO
// =========================================================
io.on('connection', (socket) => {
    console.log('Usuario conectado a WebSockets:', socket.id);

    socket.on('unirse_vehiculo', (vehiculoId) => {
        socket.join(`vehiculo_${vehiculoId}`);
    });

   socket.on('nueva_puja', async (data) => {
        const { vehiculoId, usuarioId, monto } = data;

        try {
            const [vehiculoRows] = await db.execute('SELECT precio_base FROM vehiculos WHERE id = ?', [vehiculoId]);
            if (vehiculoRows.length === 0) return socket.emit('error_puja', 'Vehículo no encontrado');
            
            const precioBase = vehiculoRows[0].precio_base;

            const [pujasRows] = await db.execute('SELECT MAX(monto) as max_monto FROM pujas WHERE vehiculo_id = ?', [vehiculoId]);
            const pujaActual = pujasRows[0].max_monto ? pujasRows[0].max_monto : precioBase;

            if (monto <= pujaActual) {
                return socket.emit('error_puja', `La oferta debe ser mayor a Q. ${Number(pujaActual).toLocaleString()}`);
            }

            const insertQuery = 'INSERT INTO pujas (vehiculo_id, usuario_id, monto) VALUES (?, ?, ?)';
            await db.execute(insertQuery, [vehiculoId, usuarioId, monto]);
            
            io.to(`vehiculo_${vehiculoId}`).emit('actualizacion_puja', {
                nuevaPuja: monto,
                usuarioGanadorId: usuarioId 
            });

        } catch (error) {
            // ESTO ES LO QUE NECESITAMOS VER:
            console.error("-> ❌ ERROR CRÍTICO AL INSERTAR PUJA:", error.message);
            socket.emit('error_puja', 'Error interno al procesar la puja.');
        }
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Servidor backend corriendo en puerto ${PORT}`);
});