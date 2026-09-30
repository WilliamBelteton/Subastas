// URL base del Backend Node.js
const API_URL = 'https://subastas-qja9.onrender.com/api';

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
                if (typeof renderizarVistaRegistro === 'function') renderizarVistaRegistro(container);
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