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
            
            if (typeof mostrarAlerta === 'function') mostrarAlerta("Iniciando sesión...", "exito"); 

            try {
                // Validación para no duplicar /api/api
                const rutaLogin = typeof API_URL !== 'undefined' 
                    ? (API_URL.endsWith('/api') ? `${API_URL}/auth/login` : `${API_URL}/api/auth/login`)
                    : 'https://subastas-7d8i.onrender.com/api/auth/login';
                
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
                    
                    if (typeof mostrarAlerta === 'function') mostrarAlerta(`¡Bienvenido de nuevo, ${resultado.usuario.nombre}!`, "exito");
                    else alert("¡Bienvenido!");
                    
                    cambiarVista('home'); 
                } else {
                    if (typeof mostrarAlerta === 'function') mostrarAlerta(resultado, "error");
                    else alert(resultado.error || "Error al iniciar sesión");
                }
            } catch (err) {
                console.error("Error en login:", err);
                if (typeof mostrarAlerta === 'function') mostrarAlerta("No se pudo conectar con el servidor. Revisa tu internet.", "error");
                else alert("Error de conexión");
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
                if (typeof mostrarAlerta === 'function') mostrarAlerta("La contraseña debe tener un mínimo de 4 caracteres.", "error");
                else alert("La contraseña debe tener un mínimo de 4 caracteres.");
                return;
            }

            if (typeof mostrarAlerta === 'function') mostrarAlerta("Procesando registro... (Si el servidor estaba inactivo, tomará unos segundos).", "exito");

            try {
                // Validación para no duplicar /api/api
                const rutaRegistro = typeof API_URL !== 'undefined' 
                    ? (API_URL.endsWith('/api') ? `${API_URL}/auth/registro` : `${API_URL}/api/auth/registro`)
                    : 'https://subastas-7d8i.onrender.com/api/auth/registro';

                const res = await fetch(rutaRegistro, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                let resultado;
                try { resultado = await res.json(); } catch(err) { resultado = { error: "Respuesta inesperada del servidor" }; }
                
                if (res.ok) {
                    if (typeof mostrarAlerta === 'function') mostrarAlerta("¡Cuenta creada exitosamente! Ya puedes iniciar sesión.", "exito");
                    else alert("¡Cuenta creada exitosamente!");
                    
                    setTimeout(() => cambiarVista('login'), 1500);
                } else {
                    if (typeof mostrarAlerta === 'function') mostrarAlerta(resultado, "error");
                    else alert(resultado.error || "Error en el registro");
                }
            } catch (err) {
                console.error("Fallo de red:", err);
                if (typeof mostrarAlerta === 'function') mostrarAlerta("No se pudo conectar con el servidor. Revisa tu internet o espera a que despierte.", "error");
                else alert("No se pudo conectar con el servidor.");
            }
        });
    }, 100);
}