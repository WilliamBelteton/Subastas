// URL base del Backend Node.js
const API_URL = 'https://subastas-7d8i.onrender.com';

// =========================================================
// GESTIÓN DE SESIÓN DE USUARIO GLOBAL
// =========================================================
function obtenerUsuarioActual() {
    try {
        const userStr = localStorage.getItem('usuario');
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        return null;
    }
}

function cerrarSesion() {
    localStorage.removeItem('usuario');
    mostrarAlerta("Sesión cerrada correctamente", "exito");
    cambiarVista('home');
}

// =========================================================
// ACTUALIZAR VISUALMENTE LA BARRA DE NAVEGACIÓN
// =========================================================
function actualizarMenu() {
    const user = obtenerUsuarioActual();
    const nav = document.getElementById('nav-auth');

    if (!nav) return; // Si no encuentra el menú, se detiene para evitar errores

    try {
        if (user) {
            // MENÚ PARA USUARIO CON SESIÓN INICIADA
            nav.innerHTML = `
                <a href="#" onclick="cambiarVista('inventario'); return false;" style="text-decoration: none; color: #333; font-weight: bold; margin-right: 15px;">Inventario</a>
                <a href="#" onclick="cambiarVista('publicar'); return false;" style="text-decoration: none; color: #333; font-weight: bold; margin-right: 15px;">Publicar Vehículo</a>
                <a href="#" onclick="cambiarVista('mis-publicaciones'); return false;" style="text-decoration: none; color: #333; font-weight: bold; margin-right: 15px;">Mis Publicaciones</a>
                <span style="color: #555; border-left: 1px solid #ccc; padding-left: 15px; margin-right: 15px;">Hola, <strong>${user.nombre || 'Usuario'}</strong></span>
                <a href="#" onclick="cerrarSesion(); return false;" style="color: #dc3545; font-weight: bold; text-decoration: none;">Salir</a>
            `;
        } else {
            // MENÚ PARA VISITANTE (SIN SESIÓN)
            nav.innerHTML = `
                <a href="#" onclick="cambiarVista('inventario'); return false;" style="text-decoration: none; color: #333; font-weight: bold; margin-right: 15px;">Inventario</a>
                <button onclick="cambiarVista('login')" style="background: #0056b3; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Iniciar Sesión</button>
            `;
        }
    } catch (error) {
        console.warn("Aviso visual ignorado al cambiar el menú:", error.message);
    }
}
// Pegar esto en app.js, justo arriba de function cambiarVista(...)
function renderizarVistaRegistro(container) {
    container.innerHTML = `
        <div style="max-width: 450px; margin: 30px auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid #ccc; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="text-align: center; color: #0056b3; margin-bottom: 20px;">Registro de Usuario</h2>
            <form id="form-registro">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Nombre:</label>
                        <input type="text" id="reg-nombre" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Apellido:</label>
                        <input type="text" id="reg-apellido" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                    </div>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">Correo Electrónico:</label>
                    <input type="email" id="reg-email" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">Teléfono:</label>
                    <input type="tel" id="reg-telefono" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">Contraseña:</label>
                    <input type="password" id="reg-pass" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <button type="submit" style="width: 100%; padding: 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Registrarse</button>
            </form>
            <div style="text-align: center; margin-top: 20px;">
                <!-- event.preventDefault() aquí evita que la página parpadee al volver al login -->
                <a href="#" onclick="event.preventDefault(); cambiarVista('login');" style="color: #0056b3; font-weight: bold; text-decoration: none;">¿Ya tienes cuenta? Inicia sesión aquí</a>
            </div>
        </div>
    `;

    setTimeout(() => {
        const formElement = container.querySelector('#form-registro');
        if (!formElement) return;

        formElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                nombre: container.querySelector('#reg-nombre').value.trim(),
                apellido: container.querySelector('#reg-apellido').value.trim(),
                correo: container.querySelector('#reg-email').value.trim(),
                telefono: container.querySelector('#reg-telefono').value.trim(),
                password: container.querySelector('#reg-pass').value
            };

            if (data.password.length < 4) {
                alert("La contraseña debe tener un mínimo de 4 caracteres.");
                return;
            }

            try {
                const res = await fetch('https://subastas-7d8i.onrender.com/api/auth/registro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const resultado = await res.json();
                
                if (res.ok) {
                    alert("¡Cuenta creada exitosamente! Ya puedes iniciar sesión.");
                    cambiarVista('login'); 
                } else {
                    alert("Error: " + (resultado.error || resultado.mensaje || "Revisa tus datos."));
                }
            } catch (err) {
                alert("No se pudo conectar con el servidor. Revisa tu internet.");
            }
        });
    }, 100);
}
// =========================================================
// SISTEMA DE ENRUTAMIENTO PRINCIPAL (Con Historial del Navegador)
// =========================================================
function cambiarVista(vista, param = null, registrarHistorial = true) {
    const container = document.getElementById('main-container');
    if (!container) return;

    container.innerHTML = ''; 
    actualizarMenu(); 

    // Guardamos la navegación en el historial de Chrome si viene de un clic del usuario
    if (registrarHistorial) {
        const estado = { vista, param };
        history.pushState(estado, "", `#${vista}${param ? '-' + param : ''}`);
    }

    try {
        switch (vista) {
            case 'home':
            case 'inventario':
                if (typeof renderizarInventario === 'function') {
                    renderizarInventario(container);
                } else {
                    container.innerHTML = '<h2>Inventario Global</h2><p>Cargando inventario...</p>';
                }
                break;

            case 'publicar':
                if (typeof renderizarVistaPublicar === 'function') {
                    renderizarVistaPublicar(container);
                } else {
                    container.innerHTML = '<div style="padding: 20px; color: red;">Error: No se encontró la función de publicación.</div>';
                }
                break;

            case 'mis-publicaciones':
                if (typeof renderizarMisPublicaciones === 'function') {
                    renderizarMisPublicaciones(container);
                }
                break;

            case 'detalle-subasta':
                if (typeof renderizarVistaSubastaview === 'function') {
                    renderizarVistaSubastaview(container, param);
                } else if (typeof renderizarVistaSubasta === 'function') {
                    renderizarVistaSubasta(container, param);
                }
                break;

            case 'login':
                if (typeof renderizarVistaLogin === 'function') renderizarVistaLogin(container);
                break;

            case 'registro':
                if (typeof renderizarVistaRegistro === 'function') {
                    renderizarVistaRegistro(container);
                } else {
                    container.innerHTML = `
                        <div style="text-align:center; padding: 40px; color: red;">
                            <h2>❌ Error de conexión de archivos</h2>
                            <p>El navegador no encuentra la función <b>renderizarVistaRegistro</b>.</p>
                            <p>Asegúrate de tener la etiqueta <code>&lt;script src="..."&gt;</code> en tu <b>index.html</b>.</p>
                        </div>`;
                }
                break;
            default:
                container.innerHTML = '<h2>Página no encontrada</h2>';
                break;
        }
    } catch (error) {
        console.error("Error crítico al cambiar de vista:", error);
    }
}

// =========================================================
// ESCUCHADOR DE LAS FLECHAS ATRÁS / ADELANTE DEL NAVEGADOR
// =========================================================
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.vista) {
        // Cargamos la vista anterior sin volver a empujar el historial
        cambiarVista(event.state.vista, event.state.param, false);
    } else {
        cambiarVista('home', null, false);
    }
});

// =========================================================
// SISTEMA DE ALERTAS AMIGABLES
// =========================================================
// =========================================================
// SISTEMA DE ALERTAS AMIGABLES (Corregido)
// =========================================================
function mostrarAlerta(mensaje, tipo = 'exito') {
    let textoFinal = mensaje;
    if (typeof mensaje === 'object' && mensaje !== null) {
        textoFinal = mensaje.error || mensaje.mensaje || "Ocurrió un error inesperado en el sistema.";
    } else if (typeof mensaje === 'string' && (mensaje.includes('{') || mensaje.includes('SQL') || mensaje.includes('ER_'))) {
        textoFinal = "Se produjo un inconveniente al procesar la solicitud. Verifique los datos.";
    }

    const alertaAnterior = document.getElementById('notificacion-flotante');
    if (alertaAnterior) alertaAnterior.remove();

    const alerta = document.createElement('div');
    alerta.id = 'notificacion-flotante';
    alerta.className = `alerta-amigable ${tipo}`;
    alerta.innerText = textoFinal;

    document.body.appendChild(alerta);

    setTimeout(() => {
        if (alerta) alerta.remove(); // <-- Corregido: 'alerta' en lugar de 'alarta'
    }, 4500);
}
// =========================================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    actualizarMenu();

    // Verificamos si la página cargó con un hash (por ejemplo, si recargaste en /#mis-publicaciones)
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        if (hash.startsWith('detalle-subasta')) {
            const partes = hash.split('-');
            const id = partes[partes.length - 1];
            cambiarVista('detalle-subasta', id, false);
        } else {
            cambiarVista(hash, null, false);
        }
    } else {
        cambiarVista('home', null, false);
    }
});
function obtenerUrlFoto(fotosStr) {
    const URL_BACKEND = 'https://subastas-7d8i.onrender.com';
    
    if (!fotosStr) {
        return 'https://via.placeholder.com/600x400?text=Sin+Imagen';
    }

    let primeraFoto = "";

    // Si la base de datos guarda las fotos como un arreglo JSON (ej: ["/uploads/img.jpg"])
    if (typeof fotosStr === 'string' && fotosStr.trim().startsWith('[')) {
        try {
            const parsed = JSON.parse(fotosStr);
            if (Array.isArray(parsed) && parsed.length > 0) {
                primeraFoto = parsed[0];
            }
        } catch (e) {
            primeraFoto = fotosStr;
        }
    } else if (typeof fotosStr === 'string') {
        // Si viene separada por comas
        primeraFoto = fotosStr.split(',')[0].trim().replace(/['"]+/g, '');
    } else {
        primeraFoto = String(fotosStr);
    }

    if (!primeraFoto || primeraFoto.trim() === "") {
        return 'https://via.placeholder.com/600x400?text=Sin+Imagen';
    }

    // Si ya es una URL web completa
    if (primeraFoto.startsWith('http://') || primeraFoto.startsWith('https://')) {
        return primeraFoto;
    }

    // Unir limpiamente con el backend de Render
    const rutaLimpia = primeraFoto.startsWith('/') ? primeraFoto : `/${primeraFoto}`;
    return `${URL_BACKEND}${rutaLimpia}`;
}