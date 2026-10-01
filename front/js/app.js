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
    
    // Estilos base por si no tienes el CSS configurado
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
// VISTA: INICIAR SESIÓN
// =========================================================
function renderizarVistaLogin(container) {
    container.innerHTML = `
        <div style="max-width: 400px; margin: 40px auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid #ccc; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="text-align: center; color: #0056b3; margin-bottom: 20px;">Iniciar Sesión</h2>
            <form id="form-login">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">Correo Electrónico:</label>
                    <input type="email" id="login-email" required placeholder="tu@correo.com" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">Contraseña:</label>
                    <input type="password" id="login-pass" required placeholder="••••••••" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <button type="submit" style="width: 100%; padding: 12px; font-size: 1rem; background: #0056b3; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Ingresar</button>
            </form>
            <div style="text-align: center; margin-top: 20px;">
                <a href="#" onclick="event.preventDefault(); cambiarVista('registro');" style="color: #0056b3; text-decoration: none; font-weight: bold;">¿No tienes cuenta? Regístrate aquí</a>
            </div>
        </div>
    `;

    setTimeout(() => {
        const formElement = container.querySelector('#form-login');
        if (!formElement) return;

        formElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailValor = container.querySelector('#login-email').value.trim();
            const passValor = container.querySelector('#login-pass').value;
            
            const data = { correo: emailValor, password: passValor };
            
            mostrarAlerta("Iniciando sesión...", "exito"); // Feedback visual

            try {
                const rutaLogin = API_URL.endsWith('/api') ? `${API_URL}/auth/login` : `${API_URL}/api/auth/login`;
                
                const res = await fetch(rutaLogin, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                let resultado;
                try { resultado = await res.json(); } catch(err) { resultado = { error: "Respuesta inesperada del servidor" }; }
                
                if (res.ok) {
                    localStorage.setItem('usuario', JSON.stringify(resultado.usuario));
                    if (resultado.token) localStorage.setItem('token', resultado.token);
                    
                    mostrarAlerta(`¡Bienvenido de nuevo, ${resultado.usuario.nombre}!`, "exito");
                    cambiarVista('home'); 
                } else {
                    mostrarAlerta(resultado, "error");
                }
            } catch (err) {
                console.error("Error en login:", err);
                mostrarAlerta("No se pudo conectar con el servidor. Revisa tu internet.", "error");
            }
        });
    }, 100);
}

// =========================================================
// VISTA: REGISTRO DE USUARIO
// =========================================================
function renderizarVistaRegistro(container) {
    container.innerHTML = `
        <div style="max-width: 450px; margin: 30px auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid #ccc; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="text-align: center; color: #0056b3; margin-bottom: 20px;">Registro de Usuario</h2>
            <form id="form-registro">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Nombre:</label>
                        <input type="text" id="reg-nombre" required placeholder="Ej. William" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Apellido:</label>
                        <input type="text" id="reg-apellido" required placeholder="Ej. Beltetón" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                    </div>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">Correo Electrónico:</label>
                    <input type="email" id="reg-email" required placeholder="tu@correo.com" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">Teléfono:</label>
                    <input type="tel" id="reg-telefono" required placeholder="Ej. 5555-5555" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">Contraseña:</label>
                    <input type="password" id="reg-pass" required placeholder="Mínimo 4 caracteres" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <button type="submit" style="width: 100%; padding: 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Registrarse</button>
            </form>
            <div style="text-align: center; margin-top: 20px;">
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
                mostrarAlerta("La contraseña debe tener un mínimo de 4 caracteres.", "error");
                return;
            }

            mostrarAlerta("Procesando registro... (Si el servidor estaba inactivo, tomará unos segundos).", "exito");

            try {
                // Corrección de la doble ruta /api/api/
                const rutaRegistro = API_URL.endsWith('/api') ? `${API_URL}/auth/registro` : `${API_URL}/api/auth/registro`;

                const res = await fetch(rutaRegistro, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                let resultado;
                try { resultado = await res.json(); } catch(err) { resultado = { error: "Respuesta inesperada del servidor" }; }
                
                if (res.ok) {
                    mostrarAlerta("¡Cuenta creada exitosamente! Ya puedes iniciar sesión.", "exito");
                    setTimeout(() => cambiarVista('login'), 1500);
                } else {
                    mostrarAlerta(resultado, "error");
                }
            } catch (err) {
                console.error("Fallo de red:", err);
                mostrarAlerta("No se pudo conectar con el servidor. Revisa tu internet o espera a que el servidor despierte.", "error");
            }
        });
    }, 100);
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
                    container.innerHTML = '<div style="padding: 20px; color: red;">Error: No se encontró la función de publicación. Asegúrate de incluir el script correspondiente.</div>';
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
                renderizarVistaLogin(container);
                break;

            case 'registro':
                renderizarVistaRegistro(container);
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
