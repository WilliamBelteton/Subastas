function renderizarLogin(container) {
    container.innerHTML = `
        <div style="max-width: 400px; margin: 40px auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid var(--border-color);">
            <h2>Iniciar Sesión</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Obligatorio para ofertar o publicar vehículos.</p>
            <form id="form-login" onsubmit="procesarLogin(event)">
                <div style="margin-bottom: 15px;">
                    <label>Correo Electrónico:</label><br>
                    <input type="email" id="login-correo" required style="width: 100%; padding: 8px; margin-top: 5px;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label>Contraseña:</label><br>
                    <input type="password" id="login-pass" required style="width: 100%; padding: 8px; margin-top: 5px;">
                </div>
                <button type="submit" class="btn-primary" style="width: 100%;">Ingresar</button>
            </form>
            <p style="margin-top: 15px; text-align: center;">¿No tienes cuenta? <a href="#" onclick="cambiarVista('registro')">Regístrate aquí</a></p>
        </div>
    `;
}

// =========================================================
// VISTA: INICIAR SESIÓN
// =========================================================
function renderizarVistaLogin(container) {
    container.innerHTML = `
        <div style="max-width: 400px; margin: 40px auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid var(--border-color); box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="text-align: center; color: #0056b3; margin-bottom: 20px;">Iniciar Sesión</h2>
            <form id="form-login">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">Correo Electrónico:</label>
                    <input type="email" name="email" required placeholder="tu@correo.com" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">Contraseña:</label>
                    <input type="password" name="password" required placeholder="••••••••" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <button type="submit" style="width: 100%; padding: 12px; font-size: 1rem; background: #0056b3; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Ingresar</button>
            </form>
            <div style="text-align: center; margin-top: 20px;">
                <a href="#" onclick="cambiarVista('registro')" style="color: #0056b3; text-decoration: none; font-weight: bold;">¿No tienes cuenta? Regístrate aquí</a>
            </div>
        </div>
    `;

    document.getElementById('form-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const resultado = await res.json();
            
            if (res.ok) {
                // Guardar datos del usuario en el navegador
                localStorage.setItem('usuario', JSON.stringify(resultado.usuario));
                if (resultado.token) {
                    localStorage.setItem('token', resultado.token);
                }
                
                mostrarAlerta("¡Bienvenido de nuevo!", "exito");
                cambiarVista('home'); // Te regresa al inventario
            } else {
                mostrarAlerta(resultado.error || "Credenciales incorrectas. Intenta de nuevo.", "error");
            }
        } catch (err) {
            console.error("Error en login:", err);
            mostrarAlerta("No se pudo conectar con el servidor. Revisa tu conexión.", "error");
        }
    });
}

// =========================================================
// VISTA: REGISTRO DE USUARIO NUEVO
// =========================================================
// =========================================================
// VISTA: INICIAR SESIÓN
// =========================================================
function renderizarVistaLogin(container) {
    container.innerHTML = `
        <div style="max-width: 400px; margin: 40px auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid var(--border-color); box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
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
                <a href="#" onclick="cambiarVista('registro')" style="color: #0056b3; text-decoration: none; font-weight: bold;">¿No tienes cuenta? Regístrate aquí</a>
            </div>
        </div>
    `;

    document.getElementById('form-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Extraemos los valores directamente
        const emailValor = document.getElementById('login-email').value;
        const passValor = document.getElementById('login-pass').value;
        
        // Enviamos los datos en español e inglés para asegurar compatibilidad con tu Backend
        const data = {
            correo: emailValor,
            contrasena: passValor,
            email: emailValor,
            password: passValor
        };
        
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const resultado = await res.json();
            
            if (res.ok) {
                localStorage.setItem('usuario', JSON.stringify(resultado.usuario));
                if (resultado.token) {
                    localStorage.setItem('token', resultado.token);
                }
                
                mostrarAlerta("¡Bienvenido de nuevo!", "exito");
                cambiarVista('home'); 
            } else {
                mostrarAlerta(resultado.error || resultado.mensaje || "Credenciales incorrectas.", "error");
            }
        } catch (err) {
            console.error("Error en login:", err);
            mostrarAlerta("No se pudo conectar con el servidor.", "error");
        }
    });
}

// =========================================================
// VISTA: REGISTRO DE USUARIO NUEVO
// =========================================================

// 1. ESTA FUNCIÓN AHORA SOLO DIBUJA EL HTML (Sin lógica adentro)
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

                <button type="submit" style="width: 100%; padding: 12px; font-size: 1rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Registrarse</button>
            </form>
            
            <div style="text-align: center; margin-top: 20px;">
                <a href="#" onclick="cambiarVista('login')" style="color: #0056b3; text-decoration: none; font-weight: bold;">¿Ya tienes cuenta? Inicia sesión aquí</a>
            </div>
        </div>
    `;
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
async function procesarLogin(e) {
    e.preventDefault();
    const correo = document.getElementById('login-correo').value;
    const password = document.getElementById('login-pass').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, password })
        });
        const data = await res.json();
        if (res.ok) {
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    mostrarAlerta(`¡Bienvenido de nuevo, ${data.usuario.nombre}!`, 'exito');
    setTimeout(() => cambiarVista('home'), 1000); // Pequeña pausa para leer el mensaje
} else {
    // Mensaje amigable si fallan las credenciales
    mostrarAlerta("Correo electrónico o contraseña incorrectos. Por favor, verifique sus datos.", 'error');
}
    } catch (err) {
        console.error(err);
        alert("Error de conexión con el servidor.");
    }
}

async function procesarRegistro(e) {
    e.preventDefault(); // Evita que la página se recargue por defecto
    console.log("Botón registrar presionado..."); // Para ver en la consola si entra aquí

    const bodyData = {
        nombre: document.getElementById('reg-nombre').value,
        apellido: document.getElementById('reg-apellido').value,
        correo: document.getElementById('reg-correo').value,
        telefono: document.getElementById('reg-telefono').value,
        password: document.getElementById('reg-pass').value
    };

    console.log("Datos a enviar:", bodyData);

    try {
        const res = await fetch(`${API_URL}/auth/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        const data = await res.json();
        console.log("Respuesta del servidor:", data);

       if (res.ok) {
    mostrarAlerta("¡Cuenta creada con éxito! Ya puede iniciar sesión.", 'exito');
    setTimeout(() => cambiarVista('login'), 1500);
} else {
    // Si el correo ya está registrado
    if (data.error && data.error.includes('ER_DUP_ENTRY')) {
        mostrarAlerta("Este correo electrónico ya se encuentra registrado en el sistema.", 'error');
    } else {
        mostrarAlerta("No se pudo completar el registro. Verifique que todos los campos sean correctos.", 'error');
    }
}
    } catch (err) {
        console.error("Error de conexión:", err);
        alert("No se pudo conectar con el servidor backend. ¿Está encendido node server.js?");
    }
}