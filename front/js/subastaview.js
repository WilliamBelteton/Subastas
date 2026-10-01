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