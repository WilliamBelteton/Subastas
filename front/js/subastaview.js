// Función global de apoyo para limpiar y formatear las rutas de las fotos
function obtenerUrlFoto(fotosStr) {
    const URL_BACKEND = 'https://subastas-qja9.onrender.com';
    
    if (!fotosStr || typeof fotosStr !== 'string' || fotosStr.trim() === "") {
        return 'https://via.placeholder.com/600x400?text=Sin+Imagen';
    }

    let primeraFoto = fotosStr.split(',')[0].trim().replace(/['"]+/g, '');

    if (!primeraFoto) {
        return 'https://via.placeholder.com/600x400?text=Sin+Imagen';
    }

    if (primeraFoto.startsWith('http://') || primeraFoto.startsWith('https://')) {
        return primeraFoto;
    }

    const rutaLimpia = primeraFoto.startsWith('/') ? primeraFoto : `/${primeraFoto}`;
    return `${URL_BACKEND}${rutaLimpia}`;
}

// 1. ESTA FUNCIÓN AHORA SOLO DIBUJA EL HTML (Sin lógica adentro)
async function renderizarVistaSubasta(container, vehiculoId) {
    if (!container) return;
    container.innerHTML = `<p style="padding: 20px; font-size: 1.1rem; color: #555;">Cargando sala de subasta en tiempo real...</p>`;

    try {
        // 1. Obtener los vehículos del backend
        const res = await fetch(`${API_URL}/vehiculos?nocache=${new Date().getTime()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error("No se pudo conectar con el servidor");
        
        const vehiculos = await res.json();
        const vehiculo = vehiculos.find(v => v.id == vehiculoId);

        if (!vehiculo) {
            container.innerHTML = '<p style="padding: 20px; color: red;">Vehículo no encontrado.</p>';
            return;
        }

        // 2. Procesamiento seguro de las fotos para la vista de subasta
        const fotosString = vehiculo.fotos || "";
        let fotos = [];

        if (fotosString.trim() !== "") {
            // Dividimos el texto por comas y aplicamos la función global a cada elemento
            fotos = fotosString.split(',').map(f => obtenerUrlFoto(f.trim()));
        }

        if (fotos.length === 0) {
            fotos = ['https://via.placeholder.com/600x400?text=Sin+Imagen'];
        }

        // 3. Manejo de montos (Precio base o Puja actual / columna 'monto')
        const montoActual = vehiculo.monto ? vehiculo.monto : vehiculo.precio_base;
        const precioFormateado = Number(montoActual).toLocaleString();
        const precioBaseLote = Number(vehiculo.precio_base).toLocaleString();

        // 4. Verificar quién va ganando
        const user = obtenerUsuarioActual();
        let badgeStyle = 'background: #e2e3e5; color: #383d41;';
        let badgeText = 'Esperando ofertas... ¡Sé el primero!';

        if (vehiculo.usuario_id) {
            if (user && vehiculo.usuario_id == user.id) {
                badgeStyle = 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;';
                badgeText = '¡Vas ganando esta subasta!';
            } else {
                badgeStyle = 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;';
                badgeText = 'Alguien más va ganando. ¡Haz tu oferta ahora!';
            }
        }

        // 5. Inyectar HTML seguro a la pantalla
        container.innerHTML = `
            <div style="background: white; padding: 25px; border-radius: 8px; border: 1px solid #ccc; display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <!-- Columna Izquierda: Galería -->
                <div>
                    <img id="imagen-principal-carrusel" src="${fotos[0]}" style="width: 100%; height: 320px; object-fit: cover; border-radius: 6px;">
                    <div style="display: flex; gap: 10px; margin-top: 10px; overflow-x: auto;">
                        ${fotos.map(f => `<img src="${f}" onclick="cambiarFotoPrincipal('${f}')" style="width: 70px; height: 50px; object-fit: cover; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">`).join('')}
                    </div>
                    <div style="margin-top: 20px;">
                        <h3>Ficha Técnica</h3>
                        <p><strong>Año / Marca / Modelo:</strong> ${vehiculo.anio || ''} ${vehiculo.marca || ''} ${vehiculo.modelo || ''}</p>
                        <p><strong>Motor / Transmisión:</strong> ${vehiculo.motor || 'N/A'} | ${vehiculo.transmision || 'N/A'}</p>
                        <p><strong>Combustible / Tracción:</strong> ${vehiculo.combustible || 'N/A'} | ${vehiculo.tren_manejo || 'N/A'}</p>
                        <p><strong>Estado de Daño:</strong> <span class="badge-dano dano-${vehiculo.estado_dano || 'Verde'}">${vehiculo.estado_dano || 'No especificado'}</span></p>
                    </div>
                </div>

                <!-- Columna Derecha: Motor de Subasta -->
                <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; border: 1px solid #ccc;">
                    <h2>Sala de Pujas en Tiempo Real</h2>
                    
                    <div id="badge-estado-puja" style="padding: 10px; margin-bottom: 15px; border-radius: 4px; font-weight: bold; ${badgeStyle}">
                        ${badgeText}
                    </div>
                    
                    <p style="font-size: 0.9rem; color: #666;">Precio Base Original: Q. ${precioBaseLote}</p>
                    <h1 style="color: #0056b3; margin: 10px 0;">Puja Actual: <span id="monto-actual">Q. ${precioFormateado}</span></h1>
                    
                    <div style="margin: 20px 0;">
                        <p><strong>Tiempo Restante:</strong> <span id="temporizador-reloj" style="font-size: 1.2rem; color: #dc3545; font-weight: bold;">Calculando...</span></p>
                    </div>

                    <div id="contenedor-oferta-acciones">
                        <input type="number" id="input-nueva-oferta" placeholder="Monto de oferta (Q)" style="padding: 10px; width: 60%; margin-right: 5px; border: 1px solid #ccc; border-radius: 4px;">
                        <button style="padding: 10px 15px; background: #0056b3; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;" onclick="realizarPuja(${vehiculo.id}, ${vehiculo.precio_base})">Ofertar</button>
                    </div>
                </div>
            </div>
        `;

        // 6. Conectar socket y activar temporizador
        if (window.socket) {
            window.socket.emit('unirse_vehiculo', vehiculo.id);
        }
        
        if (typeof iniciarCuentaRegresiva === 'function') {
            iniciarCuentaRegresiva(vehiculo.fecha_cierre, 'temporizador-reloj');
        }

    } catch (err) {
        console.error("Error al cargar la subasta:", err);
        container.innerHTML = '<p style="padding: 20px; color: red;">Ocurrió un error al cargar la vista de subasta. Revisa la consola.</p>';
    }
}

// 2. LA LÓGICA VA AQUÍ AFUERA (Delegación de eventos global)
// Esto escucha en toda la página y reacciona SOLAMENTE si el formulario enviado es el de registro.
document.addEventListener('submit', async (e) => {
    // Verificamos que el envío provenga exactamente de nuestro formulario de registro
    if (e.target && e.target.id === 'form-registro') {
        e.preventDefault(); // Evitamos que la página se recargue
        console.log("✅ 1. Botón presionado. Leyendo datos...");
        
        const nombreValor = document.getElementById('reg-nombre').value.trim();
        const apellidoValor = document.getElementById('reg-apellido').value.trim();
        const emailValor = document.getElementById('reg-email').value.trim();
        const telefonoValor = document.getElementById('reg-telefono').value.trim();
        const passValor = document.getElementById('reg-pass').value;

        if (passValor.length < 4) {
            alert("La contraseña debe tener un mínimo de 4 caracteres.");
            return;
        }

        const data = {
            nombre: nombreValor,
            apellido: apellidoValor,
            correo: emailValor,
            telefono: telefonoValor,
            password: passValor
        };
        
        console.log("✅ 2. Datos recopilados:", data);

        try {
            console.log("✅ 3. Enviando datos a Render...");
            const res = await fetch(`https://subastas-qja9.onrender.com/api/auth/registro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const resultado = await res.json();
            console.log("✅ 4. Respuesta de Render:", resultado); 
            
            if (res.ok) {
                alert("¡Cuenta creada exitosamente! Ya puedes iniciar sesión.");
                if (typeof cambiarVista === 'function') cambiarVista('login'); 
            } else {
                alert("Error: " + (resultado.error || resultado.mensaje || "Revisa tus datos."));
            }
        } catch (err) {
            console.error("❌ 5. Fallo al conectar con el servidor:", err);
            alert("No se pudo conectar con el servidor. Revisa tu internet.");
        }
    }
});

function cambiarFotoPrincipal(url) {
    document.getElementById('imagen-principal-carrusel').src = url;
}

// Escucha en tiempo real de actualizaciones de pujas globales
// =========================================================
// CONEXIÓN A SOCKET.IO (Segura y Libre de Errores)
// =========================================================
// 1. Declaramos 'socket' para que exista en todo el archivo y no dé error
var socket; 

// 2. Verificamos que la librería se haya cargado desde el HTML
if (typeof io !== 'undefined') {
    const socket = io('https://subastas-qja9.onrender.com');
    window.socket = socket; // Respaldo global

    // Escuchar cuando la puja sube en tiempo real
    socket.on('actualizacion_puja', (data) => {
        const elMonto = document.getElementById('monto-actual');
        const badge = document.getElementById('badge-estado-puja');
        
        if (elMonto) elMonto.innerText = `Q. ${Number(data.nuevaPuja).toLocaleString()}`;
        
        const user = obtenerUsuarioActual();
        if (badge) {
            if (user && data.usuarioGanadorId == user.id) {
                badge.style.background = '#d4edda';
                badge.style.color = '#155724';
                badge.innerText = "¡Vas ganando esta subasta!";
            } else {
                badge.style.background = '#f8d7da';
                badge.style.color = '#721c24';
                badge.innerText = "Tu oferta ha sido superada. ¡Haz tu oferta ahora!";
            }
        }
    });

    // Escuchar errores de pujas devueltos por el servidor
    socket.on('error_puja', (mensaje) => {
        mostrarAlerta(mensaje, 'error');
    });
}

function realizarPuja(vehiculoId, precioBase) {
    const user = obtenerUsuarioActual();
    if (!user) {
        alert("Debe iniciar sesión para ofertar.");
        cambiarVista('login');
        return;
    }

    const montoOfrecido = parseFloat(document.getElementById('input-nueva-oferta').value);
    const montoActualTexto = document.getElementById('monto-actual').innerText.replace('Q. ', '').replace(/,/g, '');
    const montoActual = parseFloat(montoActualTexto);

    if (isNaN(montoOfrecido) || montoOfrecido <= montoActual) {
        mostrarAlerta(`La oferta debe ser mayor a la puja actual (Q. ${montoActual.toLocaleString()}).`, 'error');
        return;
    }

    // Alerta de éxito al ofertar
    mostrarAlerta("¡Su oferta ha sido registrada y enviada con éxito!", 'exito');

    
    // Emitir por Socket.io (Tiempo real instantáneo)
    socket.emit('nueva_puja', {
        vehiculoId: vehiculoId,
        usuarioId: user.id,
        monto: montoOfrecido
    });
}

function iniciarTemporizador(fechaCierreStr) {
    // Si ya existe un intervalo corriendo, lo limpiamos
    if (window.intervaloRelojGlobal) clearInterval(window.intervaloRelojGlobal);
    // ...

    const fechaCierre = new Date(fechaCierreStr).getTime();

    intervaloReloj = setInterval(() => {
        const ahora = new Date().getTime();
        const diferencia = fechaCierre - ahora;
        const relojEl = document.getElementById('temporizador-reloj');

        if (!relojEl) return;

        if (diferencia <= 0) {
            clearInterval(intervaloReloj);
            relojEl.innerText = "¡OFERTA CERRADA / SUBASTA FINALIZADA!";
            const inputAcciones = document.getElementById('contenedor-oferta-acciones');
            if (inputAcciones) inputAcciones.innerHTML = "<p style='color:red; font-weight:bold;'>El tiempo ha expirado. Ya no es posible ofertar.</p>";
            return;
        }

        const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

        relojEl.innerText = `${horas}h ${minutos}m ${segundos}s`;
    }, 1000);
}