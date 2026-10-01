// =========================================================================
// CONFIGURACIÓN GLOBAL DE URLS (Apunta a tu backend en Render)
// =========================================================================
const URL_BACKEND = 'https://subastas-7d8i.onrender.com';
const API_URL = `${URL_BACKEND}/api`;

// =========================================================================
// 1. FUNCIÓN GLOBAL DE FOTOS
// =========================================================================
function obtenerUrlFoto(fotosStr) {
    if (!fotosStr) return 'https://via.placeholder.com/600x400?text=Sin+Imagen';

    let primeraFoto = "";

    if (typeof fotosStr === 'string' && fotosStr.trim().startsWith('[')) {
        try {
            const parsed = JSON.parse(fotosStr);
            if (Array.isArray(parsed) && parsed.length > 0) primeraFoto = parsed[0];
        } catch (e) {
            primeraFoto = fotosStr;
        }
    } else if (typeof fotosStr === 'string') {
        primeraFoto = fotosStr.split(',')[0].trim().replace(/['"]+/g, '');
    } else {
        primeraFoto = String(fotosStr);
    }

    if (!primeraFoto || primeraFoto.trim() === "") return 'https://via.placeholder.com/600x400?text=Sin+Imagen';
    if (primeraFoto.startsWith('http://') || primeraFoto.startsWith('https://')) return primeraFoto;

    const rutaLimpia = primeraFoto.startsWith('/') ? primeraFoto : `/${primeraFoto}`;
    return `${URL_BACKEND}${rutaLimpia}`;
}

// =========================================================================
// 2. RENDERIZADO DE LA VISTA DE SUBASTA
// =========================================================================
async function renderizarVistaSubasta(container, vehiculoId) {
    if (!container) return;
    container.innerHTML = `<p style="padding: 20px; font-size: 1.1rem; color: #555;">Cargando sala de subasta en tiempo real...</p>`;

    try {
        const res = await fetch(`${API_URL}/vehiculos?nocache=${new Date().getTime()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error("No se pudo conectar con el servidor");

        const vehiculos = await res.json();
        // Comparación estricta numérica para evitar fallos de tipo (string vs number)
        const vehiculo = vehiculos.find(v => Number(v.id) === Number(vehiculoId));

        if (!vehiculo) {
            container.innerHTML = '<p style="padding: 20px; color: red;">Vehículo no encontrado.</p>';
            return;
        }

        // Procesamiento seguro de fotos para la galería
        const fotosString = vehiculo.fotos;
        let fotos = [];

        if (fotosString) {
            let parsedFotos = fotosString;
            if (typeof parsedFotos === 'string' && parsedFotos.trim().startsWith('[')) {
                try { parsedFotos = JSON.parse(parsedFotos); }
                catch (e) { parsedFotos = parsedFotos.split(','); }
            } else if (typeof parsedFotos === 'string') {
                parsedFotos = parsedFotos.split(',');
            }

            if (Array.isArray(parsedFotos)) {
                fotos = parsedFotos.map(f => obtenerUrlFoto(f));
            } else {
                fotos = [obtenerUrlFoto(fotosString)];
            }
        }

        if (!fotos || fotos.length === 0) fotos = ['https://via.placeholder.com/600x400?text=Sin+Imagen'];

        // Se usa vehiculo.monto devuelto por el servidor (con COALESCE)
        // Asegúrate de que lea explícitamente el 'monto' calculado por el servidor con COALESCE
        const montoActual = (vehiculo.monto !== undefined && vehiculo.monto !== null && vehiculo.monto !== "")
            ? vehiculo.monto
            : vehiculo.precio_base;

        const precioFormateado = Number(montoActual).toLocaleString();
        const precioBaseLote = Number(vehiculo.precio_base).toLocaleString();
        const user = obtenerUsuarioActual();
        let badgeStyle = 'background: #e2e3e5; color: #383d41;';
        let badgeText = 'Esperando ofertas... ¡Sé el primero!';

        if (vehiculo.ganador_id) {
            if (user && Number(vehiculo.ganador_id) === Number(user.id)) {
                badgeStyle = 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;';
                badgeText = '¡Vas ganando esta subasta!';
            } else {
                badgeStyle = 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;';
                badgeText = 'Alguien más va ganando. ¡Haz tu oferta ahora!';
            }
        }

        container.innerHTML = `
            <div style="background: white; padding: 25px; border-radius: 8px; border: 1px solid #ccc; display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <div>
                    <img id="imagen-principal-carrusel" src="${fotos[0]}" onerror="this.src='https://via.placeholder.com/600x400?text=Sin+Imagen'" style="width: 100%; height: 320px; object-fit: cover; border-radius: 6px;">
                    <div style="display: flex; gap: 10px; margin-top: 10px; overflow-x: auto;">
                        ${fotos.map(f => `<img src="${f}" onerror="this.style.display='none'" onclick="cambiarFotoPrincipal('${f}')" style="width: 70px; height: 50px; object-fit: cover; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">`).join('')}
                    </div>
                    <div style="margin-top: 20px;">
                        <h3>Ficha Técnica</h3>
                        <p><strong>Año / Marca / Modelo:</strong> ${vehiculo.anio || ''} ${vehiculo.marca || ''} ${vehiculo.modelo || ''}</p>
                        <p><strong>Motor / Transmisión:</strong> ${vehiculo.motor || 'N/A'} | ${vehiculo.transmision || 'N/A'}</p>
                        <p><strong>Combustible / Tracción:</strong> ${vehiculo.combustible || 'N/A'} | ${vehiculo.tren_manejo || 'N/A'}</p>
                        <p><strong>Estado de Daño:</strong> <span class="badge-dano dano-${vehiculo.estado_dano || 'Verde'}">${vehiculo.estado_dano || 'No especificado'}</span></p>
                    </div>
                </div>

                <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; border: 1px solid #ccc;">
                    <h2>Sala de Pujas en Tiempo Real</h2>
                    <div id="badge-estado-puja" style="padding: 10px; margin-bottom: 15px; border-radius: 4px; font-weight: bold; ${badgeStyle}">${badgeText}</div>
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

        if (window.socket) window.socket.emit('unirse_vehiculo', vehiculo.id);

        // Quita el .replace(' ', 'T') de aquí, lo manejaremos de forma más segura adentro
        if (typeof iniciarTemporizador === 'function' && vehiculo.fecha_cierre) {
            iniciarTemporizador(vehiculo.fecha_cierre);
        } else {
            document.getElementById('temporizador-reloj').innerText = "Fecha de cierre no definida";
        }

    } catch (err) {
        console.error("Error al cargar la subasta:", err);
        container.innerHTML = '<p style="padding: 20px; color: red;">Ocurrió un error al cargar la vista de subasta. Revisa la consola.</p>';
    }
}

// =========================================================================
// 3. REGISTRO Y FUNCIONES GLOBALES
// =========================================================================
document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'form-registro') {
        e.preventDefault();

        const nombreValor = document.getElementById('reg-nombre').value.trim();
        const apellidoValor = document.getElementById('reg-apellido').value.trim();
        const emailValor = document.getElementById('reg-email').value.trim();
        const telefonoValor = document.getElementById('reg-telefono').value.trim();
        const passValor = document.getElementById('reg-pass').value;

        if (passValor.length < 4) {
            alert("La contraseña debe tener un mínimo de 4 caracteres.");
            return;
        }

        const data = { nombre: nombreValor, apellido: apellidoValor, correo: emailValor, telefono: telefonoValor, password: passValor };

        try {
            const res = await fetch(`${API_URL}/auth/registro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const resultado = await res.json();

            if (res.ok) {
                alert("¡Cuenta creada exitosamente! Ya puedes iniciar sesión.");
                if (typeof cambiarVista === 'function') cambiarVista('login');
            } else {
                alert("Error: " + (resultado.error || resultado.mensaje || "Revisa tus datos."));
            }
        } catch (err) {
            alert("No se pudo conectar con el servidor. Revisa tu internet.");
        }
    }
});

function cambiarFotoPrincipal(url) {
    document.getElementById('imagen-principal-carrusel').src = url;
}

// =========================================================================
// 4. CONEXIÓN A SOCKET.IO (Unificada con URL_BACKEND)
// =========================================================================
var socket;
if (typeof io !== 'undefined') {
    socket = io(URL_BACKEND);
    window.socket = socket;

    socket.on('actualizacion_puja', (data) => {
        const elMonto = document.getElementById('monto-actual');
        const badge = document.getElementById('badge-estado-puja');

        if (elMonto) elMonto.innerText = `Q. ${Number(data.nuevaPuja).toLocaleString()}`;

        const user = obtenerUsuarioActual();
        if (badge) {
            if (user && Number(data.usuarioGanadorId) === Number(user.id)) {
                badge.style.background = '#d4edda';
                badge.style.color = '#155724';
                badge.innerText = "¡Vas ganando esta subasta!";
                if (typeof mostrarAlerta === 'function') mostrarAlerta("¡Oferta guardada exitosamente en la base de datos!", 'exito');
            } else {
                badge.style.background = '#f8d7da';
                badge.style.color = '#721c24';
                badge.innerText = "Tu oferta ha sido superada. ¡Haz tu oferta ahora!";
            }
        }
    });

    socket.on('error_puja', (mensaje) => {
        if (typeof mostrarAlerta === 'function') mostrarAlerta(mensaje, 'error');
        else alert(mensaje);
    });
}

function realizarPuja(vehiculoId, precioBase) {
    const user = obtenerUsuarioActual();
    if (!user) {
        alert("Debe iniciar sesión para ofertar.");
        cambiarVista('login');
        return;
    }

    const inputOferta = document.getElementById('input-nueva-oferta');
    if (!inputOferta) return;

    const montoOfrecido = parseFloat(inputOferta.value);
    const montoActualTexto = document.getElementById('monto-actual').innerText.replace('Q. ', '').replace(/,/g, '');
    const montoActual = parseFloat(montoActualTexto);

    // REGLA DEL 10%: Calculamos el mínimo requerido
    const minimoRequerido = montoActual * 1.10;

    if (isNaN(montoOfrecido) || montoOfrecido < minimoRequerido) {
        if (typeof mostrarAlerta === 'function') {
            mostrarAlerta(`La oferta debe superar en un 10% a la actual. Mínimo: Q. ${minimoRequerido.toLocaleString()}`, 'error');
        } else {
            alert(`La oferta debe superar en un 10% a la actual. Mínimo: Q. ${minimoRequerido.toLocaleString()}`);
        }
        return;
    }

    if (window.socket) {
        window.socket.emit('nueva_puja', {
            vehiculoId: vehiculoId,
            usuarioId: user.id,
            monto: montoOfrecido
        });
    }

    inputOferta.value = '';
}

function iniciarTemporizador(fechaCierreStr) {
    // 1. Limpiar cualquier intervalo anterior para evitar parpadeos/cruces
    if (window.intervaloRelojGlobal) {
        clearInterval(window.intervaloRelojGlobal);
    }

    // 2. Parseo seguro de la fecha (por si viene de SQL con espacio o como ISO string de Node)
    const fechaSegura = typeof fechaCierreStr === 'string' ? fechaCierreStr.replace(' ', 'T') : fechaCierreStr;
    const fechaCierre = new Date(fechaSegura).getTime();

    const relojEl = document.getElementById('temporizador-reloj');
    if (!relojEl) return;

    // Si la fecha es inválida, mostrar el error en pantalla en lugar de quedarse "Calculando..."
    if (isNaN(fechaCierre)) {
        relojEl.innerText = "Error en fecha";
        return;
    }

    // 3. Extraemos la lógica a una función para poder llamarla INMEDIATAMENTE
    const actualizarReloj = () => {
        const ahora = new Date().getTime();
        const diferencia = fechaCierre - ahora;

        // Si el tiempo ya expiró
        if (diferencia <= 0) {
            clearInterval(window.intervaloRelojGlobal);
            relojEl.innerText = "¡SUBASTA FINALIZADA!";
            const inputAcciones = document.getElementById('contenedor-oferta-acciones');
            if (inputAcciones) {
                inputAcciones.innerHTML = "<p style='color:red; font-weight:bold;'>El tiempo ha expirado. Ya no es posible ofertar.</p>";
            }
            return;
        }

        // Cálculos matemáticos correctos (incluyendo días)
        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

        // Formatear el texto (solo mostrar días si es mayor a 0)
        let textoReloj = "";
        if (dias > 0) textoReloj += `${dias}d `;
        textoReloj += `${horas}h ${minutos}m ${segundos}s`;

        relojEl.innerText = textoReloj;
    };

    // 4. Ejecutar de inmediato (esto quita el "Calculando..." sin esperar 1 segundo)
    actualizarReloj();

    // 5. Iniciar el intervalo para que se repita cada segundo
    window.intervaloRelojGlobal = setInterval(actualizarReloj, 1000);
}