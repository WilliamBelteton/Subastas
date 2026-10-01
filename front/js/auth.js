// =========================================================
// VISTA: INICIAR SESIÓN
// =========================================================
function renderizarVistaLogin(container) {
    container.innerHTML = `
        <div style="max-width: 400px; margin: 40px auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid #ccc; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="text-align: center; color: #0056b3; margin-bottom: 20px;">Iniciar Sesión</h2>
            <form id="form-login" onsubmit="procesarLogin(event)">
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
}

// =========================================================
// VISTA: REGISTRO DE USUARIO NUEVO
// =========================================================
function renderizarVistaRegistro(container) {
    container.innerHTML = `
        <div style="max-width: 450px; margin: 30px auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid #ccc; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="text-align: center; color: #0056b3; margin-bottom: 20px;">Registro de Usuario</h2>
            <form id="form-registro" onsubmit="procesarRegistro(event)">
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
                    <small style="color: #666; font-size: 0.8rem; display: block; margin-top: 4px;">Debe tener al menos 4 caracteres.</small>
                </div>
                <button type="submit" style="width: 100%; padding: 12px; font-size: 1rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Registrarse</button>
            </form>
            <div style="text-align: center; margin-top: 20px;">
                <a href="#" onclick="event.preventDefault(); cambiarVista('login');" style="color: #0056b3; text-decoration: none; font-weight: bold;">¿Ya tienes cuenta? Inicia sesión aquí</a>
            </div>
        </div>
    `;
}

// =========================================================
// LÓGICA: PROCESAR LOGIN
// =========================================================
async function procesarLogin(e) {
    e.preventDefault();
    const correo = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-pass').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, password })
        });
        
        let data;
        try { data = await res.json(); } catch(err) { data = "Error de conexión con el servidor."; }
        
        const mensajeFinal = typeof extraerMensajeLimpiado === 'function' ? extraerMensajeLimpiado(data) : (data.error || "Error al iniciar sesión");

        if (res.ok) {
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            if (data.token) localStorage.setItem('token', data.token);
            
            if (typeof mostrarAlerta === 'function') mostrarAlerta(`¡Bienvenido de nuevo, ${data.usuario.nombre}!`, 'exito');
            else alert(`¡Bienvenido!`);
            
            cambiarVista('home');
        } else {
            if (typeof mostrarAlerta === 'function') mostrarAlerta(mensajeFinal, 'error');
            else alert(mensajeFinal);
        }
    } catch (err) {
        console.error("Error en login:", err);
        if (typeof mostrarAlerta === 'function') mostrarAlerta("No se pudo conectar con el servidor.", "error");
        else alert("Error de conexión con el servidor.");
    }
}

// =========================================================
// LÓGICA: PROCESAR REGISTRO
// =========================================================
async function procesarRegistro(e) {
    e.preventDefault();

    const passValor = document.getElementById('reg-pass').value;
    if (passValor.length < 4) {
        if (typeof mostrarAlerta === 'function') mostrarAlerta("La contraseña debe tener al menos 4 caracteres.", "error");
        else alert("La contraseña debe tener al menos 4 caracteres.");
        return;
    }

    const bodyData = {
        nombre: document.getElementById('reg-nombre').value.trim(),
        apellido: document.getElementById('reg-apellido').value.trim(),
        correo: document.getElementById('reg-email').value.trim(),
        telefono: document.getElementById('reg-telefono').value.trim(),
        password: passValor
    };

    // OPCIONAL: Mostrar un indicador visual de que el servidor está despertando
    if (typeof mostrarAlerta === 'function') {
        mostrarAlerta("Conectando con el servidor (esto puede tomar unos segundos si estuvo inactivo)...", "exito");
    }

    try {
        const res = await fetch(`${API_URL}/auth/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        let data;
        try { data = await res.json(); } catch(err) { data = { error: "Respuesta inesperada del servidor." }; }

        if (res.ok) {
            if (typeof mostrarAlerta === 'function') mostrarAlerta("¡Cuenta creada con éxito! Ya puedes iniciar sesión.", 'exito');
            else alert("¡Cuenta creada con éxito!");
            
            setTimeout(() => cambiarVista('login'), 1500);
        } else {
            const mensajeFinal = data.error || "Error en el registro";
            if (typeof mostrarAlerta === 'function') mostrarAlerta(mensajeFinal, 'error');
            else alert(mensajeFinal);
        }
    } catch (err) {
        console.error("Error de conexión:", err);
        if (typeof mostrarAlerta === 'function') {
            mostrarAlerta("El servidor en Render está despertando. Vuelve a intentar en unos segundos.", "error");
        } else {
            alert("El servidor en Render está despertando. Vuelve a intentar en unos segundos.");
        }
    }
}