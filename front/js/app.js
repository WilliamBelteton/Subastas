// =========================================================================
// CONFIGURACIÓN GLOBAL DE URLS
// =========================================================================
const URL_BACKEND = 'https://subastas-7d8i.onrender.com';
const API_URL = `${URL_BACKEND}/api`;

// =========================================================================
// FUNCIÓN PARA LIMPIAR MENSAJES Y EVITAR JSON EN ALERTAS
// =========================================================================
function extraerMensajeLimpiado(data) {
    if (!data) return "Ocurrió un error inesperado.";
    if (typeof data === 'string') {
        try {
            const parseado = JSON.parse(data);
            return parseado.error || parseado.mensaje || parseado.message || "Error en la operación";
        } catch (e) { return data; }
    }
    if (typeof data === 'object') return data.error || data.mensaje || data.message || "Ocurrió un problema.";
    return String(data);
}

// =========================================================
// SISTEMA DE ALERTAS AMIGABLES
// =========================================================
function mostrarAlerta(mensaje, tipo = 'exito') {
    let textoFinal = extraerMensajeLimpiado(mensaje);

    const alertaAnterior = document.getElementById('notificacion-flotante');
    if (alertaAnterior) alertaAnterior.remove();

    const alerta = document.createElement('div');
    alerta.id = 'notificacion-flotante';
    alerta.className = `alerta-amigable ${tipo}`;
    
    // Estilos base por si no tienes CSS configurado para la alerta
    alerta.style.position = 'fixed';
    alerta.style.top = '20px';
    alerta.style.right = '20px';
    alerta.style.padding = '15px 20px';
    alerta.style.borderRadius = '5px';
    alerta.style.color = '#fff';
    alerta.style.fontWeight = 'bold';
    alerta.style.zIndex = '9999';
    alerta.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    alerta.style.backgroundColor = tipo === 'exito' ? '#28a745' : '#dc3545';
    
    alerta.innerText = textoFinal;
    document.body.appendChild(alerta);

    setTimeout(() => {
        if (alerta) alerta.remove();
    }, 4500);
}

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
    localStorage.removeItem('token');
    mostrarAlerta("Sesión cerrada correctamente", "exito");
    cambiarVista('home');
}

// =========================================================
// ACTUALIZAR VISUALMENTE LA BARRA DE NAVEGACIÓN
// =========================================================
function actualizarMenu() {
    const user = obtenerUsuarioActual();
    const nav = document.getElementById('nav-auth');

    if (!nav) return;

    try {
        if (user) {
            nav.innerHTML = `
                <a href="#" onclick="cambiarVista('inventario'); return false;" style="text-decoration: none; color: #333; font-weight: bold; margin-right: 15px;">Inventario</a>
                <a href="#" onclick="cambiarVista('publicar'); return false;" style="text-decoration: none; color: #333; font-weight: bold; margin-right: 15px;">Publicar Vehículo</a>
                <a href="#" onclick="cambiarVista('mis-publicaciones'); return false;" style="text-decoration: none; color: #333; font-weight: bold; margin-right: 15px;">Mis Publicaciones</a>
                <span style="color: #555; border-left: 1px solid #ccc; padding-left: 15px; margin-right: 15px;">Hola, <strong>${user.nombre || 'Usuario'}</strong></span>
                <a href="#" onclick="cerrarSesion(); return false;" style="color: #dc3545; font-weight: bold; text-decoration: none;">Salir</a>
            `;
        } else {
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
// 1. FUNCIÓN GLOBAL DE FOTOS
// =========================================================
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

// =========================================================
// SISTEMA DE ENRUTAMIENTO PRINCIPAL
// =========================================================
function cambiarVista(vista, param = null, registrarHistorial = true) {
    const container = document.getElementById('main-container');
    if (!container) return;

    container.innerHTML = ''; 
    actualizarMenu(); 

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
                container.innerHTML = '<h2>Página no encontrada</h2><button onclick="cambiarVista(\'home\')" style="padding: 10px; background: #0056b3; color: white; border: none; border-radius: 4px; cursor:pointer;">Ir al Inicio</button>';
                break;
        }
    } catch (error) {
        console.error("Error crítico al cambiar de vista:", error);
    }
}

window.addEventListener('popstate', (event) => {
    if (event.state && event.state.vista) {
        cambiarVista(event.state.vista, event.state.param, false);
    } else {
        cambiarVista('home', null, false);
    }
});

// =========================================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    actualizarMenu();

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