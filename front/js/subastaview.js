async function renderizarVistaSubasta(container, vehiculoId) {
    container.innerHTML = `<p>Cargando sala de subasta en tiempo real...</p>`;

    try {
        // Agregamos un timestamp dinámico para que el navegador NUNCA use caché viejo
        const res = await fetch(`${API_URL}/vehiculos?nocache=${new Date().getTime()}`, { cache: 'no-store' });
        const vehiculos = await res.json();
        const vehiculo = vehiculos.find(v => v.id == vehiculoId);

        if (!vehiculo) {
            container.innerHTML = '<p>Vehículo no encontrado.</p>';
            return;
        }

// 1. Proteger y arreglar las rutas de las fotos...
        const fotosString = vehiculo.fotos || "";
        let fotos = fotosString ? fotosString.split(',') : [];
        if (fotos.length === 0) fotos.push('https://via.placeholder.com/600x400?text=Sin+Imagen');
        fotos = fotos.map(f => f.startsWith('/uploads/') ? `https://subastas-qja9.onrender.com${f}` : f);

        // =========================================================
        // AQUÍ ESTÁ LA MAGIA: LEER LA PUJA MÁXIMA DE LA BD
        // =========================================================
        // Si hay una puja máxima guardada la usamos, si no, usamos el precio base
        const montoInicial = vehiculo.puja_maxima ? vehiculo.puja_maxima : vehiculo.precio_base;
        const precioFormateado = Number(montoInicial).toLocaleString();
        const precioBaseLote = Number(vehiculo.precio_base).toLocaleString();

        // 2. Verificar quién va ganando al cargar la página
        const user = obtenerUsuarioActual();
        let badgeStyle = 'background: #e2e3e5; color: #383d41;';
        let badgeText = 'Esperando ofertas... ¡Sé el primero!';

        if (vehiculo.ganador_id) {
            if (user && vehiculo.ganador_id == user.id) {
                badgeStyle = 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;';
                badgeText = '¡Vas ganando esta subasta!';
            } else {
                badgeStyle = 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;';
                badgeText = 'Alguien más va ganando. ¡Haz tu oferta ahora!';
            }
        }
        container.innerHTML = `
            <div style="background: white; padding: 25px; border-radius: 8px; border: 1px solid var(--border-color); display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <!-- Columna Izquierda: Galería -->
                <div>
                    <img id="imagen-principal-carrusel" src="${fotos[0]}" style="width: 100%; height: 320px; object-fit: cover; border-radius: 6px;">
                    <div style="display: flex; gap: 10px; margin-top: 10px; overflow-x: auto;">
                        ${fotos.map(f => `<img src="${f}" onclick="cambiarFotoPrincipal('${f}')" style="width: 70px; height: 50px; object-fit: cover; cursor: pointer; border-radius: 4px; border: 1px solid var(--border-color);">`).join('')}
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
                <div style="background: var(--bg-main); padding: 20px; border-radius: 6px; border: 1px solid var(--border-color);">
                    <h2>Sala de Pujas en Tiempo Real</h2>
                    
                    <!-- Estado de la Puja al Cargar -->
                    <div id="badge-estado-puja" style="padding: 10px; margin-bottom: 15px; border-radius: 4px; font-weight: bold; ${badgeStyle}">
                        ${badgeText}
                    </div>
                    
                    <p style="font-size: 0.9rem; color: var(--text-muted);">Precio Base Original: Q. ${precioBaseLote}</p>
                    <h1 style="color: var(--primary); margin: 10px 0;">Puja Actual: <span id="monto-actual">Q. ${precioFormateado}</span></h1>
                    
                    <div style="margin: 20px 0;">
                        <p><strong>Tiempo Restante:</strong> <span id="temporizador-reloj" style="font-size: 1.2rem; color: #dc3545; font-weight: bold;">Calculando...</span></p>
                    </div>

                    <div id="contenedor-oferta-acciones">
                        <input type="number" id="input-nueva-oferta" placeholder="Monto de oferta (Q)" style="padding: 10px; width: 60%; margin-right: 5px;">
                        <button class="btn-primary" onclick="realizarPuja(${vehiculo.id}, ${vehiculo.precio_base})">Ofertar</button>
                    </div>
                </div>
            </div>
        `;

        if (window.socket) window.socket.emit('unirse_vehiculo', vehiculo.id);
        
        // Llamada correcta pasando la fecha y el ID del elemento HTML
        iniciarCuentaRegresiva(vehiculo.fecha_cierre, 'temporizador-reloj');

    } catch (err) {
        console.error("Error al cargar la subasta:", err);
        container.innerHTML = '<p>Ocurrió un error al cargar la vista de subasta.</p>';
    }
}

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

function realizarPuja(vehiculoId, precioBaseLote) {
    const user = obtenerUsuarioActual();
    if (!user) {
        alert("Debe iniciar sesión para ofertar.");
        cambiarVista('login');
        return;
    }

    const inputOferta = document.getElementById('input-nueva-oferta');
    const montoOfrecido = parseFloat(inputOferta.value);
    
    // Leemos el texto actual de la pantalla y limpiamos cualquier carácter que no sea número
    const textoActual = document.getElementById('monto-actual').innerText;
    const montoActual = parseFloat(textoActual.replace('Q.', '').replace(/,/g, '').trim()) || precioBaseLote;

    // Validación estricta: Debe ser mayor al monto actual
    if (isNaN(montoOfrecido) || montoOfrecido <= montoActual) {
        mostrarAlerta(`La oferta debe ser estrictamente mayor a la puja actual (Q. ${montoActual.toLocaleString()}).`, 'error');
        return;
    }

    // Emitir por Socket.io
    socket.emit('nueva_puja', {
        vehiculoId: vehiculoId,
        usuarioId: user.id,
        monto: montoOfrecido
    });

    // Limpiamos el input después de enviar
    inputOferta.value = '';
}

function iniciarCuentaRegresiva(fechaCierreStr, elementoId = 'temporizador-reloj') {
    const elemento = document.getElementById(elementoId);
    if (!elemento) return;

    if (!fechaCierreStr) {
        elemento.innerHTML = "Fecha no disponible";
        return;
    }

    // Limpiamos y formateamos la fecha de la base de datos de forma segura
    let fechaLimpia = fechaCierreStr.replace(' ', 'T');
    
    // Si la fecha no incluye una zona horaria, le agregamos 'Z' o aseguramos su lectura local
    const fechaCierre = new Date(fechaLimpia).getTime();

    const intervalo = setInterval(() => {
        const ahora = new Date().getTime();
        const distancia = fechaCierre - ahora;

        if (distancia < 0) {
            clearInterval(intervalo);
            elemento.innerHTML = "¡Subasta Finalizada!";
            elemento.style.color = "red";
            
            const contenedorAcciones = document.getElementById('contenedor-oferta-acciones');
            if (contenedorAcciones) {
                contenedorAcciones.innerHTML = '<p style="color: red; font-weight: bold;">El tiempo ha expirado. Ya no es posible ofertar.</p>';
            }
            return;
        }

        const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((distancia % (1000 * 60)) / 1000);

        elemento.innerHTML = `${horas}h ${minutos}m ${segundos}s`;
    }, 1000);
}