function renderizarVistaPublicar(container) { 
    container.innerHTML = `
        <div style="max-width: 700px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid var(--border-color);">
            <h2>Publicar Vehículo para Subasta</h2>
            <form id="form-publicar" onsubmit="enviarPublicacion(event)">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div><label>Año:</label><br><input type="number" id="pub-anio" required style="width:100%; padding:6px;"></div>
                    <div><label>Tipo de Artículo:</label><br><input type="text" id="pub-tipo" value="Automóvil" required style="width:100%; padding:6px;"></div>
                    <div><label>Marca:</label><br><input type="text" id="pub-marca" required style="width:100%; padding:6px;"></div>
                    <div><label>Modelo:</label><br><input type="text" id="pub-modelo" required style="width:100%; padding:6px;"></div>
                    <div><label>Motor:</label><br><input type="text" id="pub-motor" placeholder="Ej. 2.0L Turbo" required style="width:100%; padding:6px;"></div>
                    <div><label>Transmisión:</label><br><select id="pub-trans" style="width:100%; padding:6px;"><option>Automática</option><option>Manual</option></select></div>
                    <div><label>Combustible:</label><br><select id="pub-comb" style="width:100%; padding:6px;"><option>Gasolina</option><option>Diésel</option><option>Híbrido</option><option>Eléctrico</option></select></div>
                    <div><label>Tren de Manejo:</label><br><select id="pub-tren" style="width:100%; padding:6px;"><option>FWD</option><option>RWD</option><option>AWD</option><option>4WD</option></select></div>
                    <div><label>Cilindros:</label><br><input type="number" id="pub-cil" value="4" required style="width:100%; padding:6px;"></div>
                    <div><label>Clasificación por Daño:</label><br>
                        <select id="pub-dano" style="width:100%; padding:6px;">
                            <option value="Verde">🟢 Verde (Menor/Limpio)</option>
                            <option value="Amarillo">🟡 Amarillo (Medio/Reparable)</option>
                            <option value="Rojo">🔴 Rojo (Severo/Salvamento)</option>
                        </select>
                    </div>
                </div>
                
                <div style="margin-top: 15px;">
                    <label>Seleccionar Fotografías desde su Computadora (Seleccione MÍNIMO 5 imágenes):</label><br>
                    <input type="file" id="pub-fotos-input" accept="image/*" multiple required style="width:100%; padding:8px; margin-top: 5px;">
                    <small style="color: var(--text-muted);">Mantenga presionado Ctrl o Shift para seleccionar varias fotos a la vez en su carpeta.</small>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 15px;">
                    <div><label>Precio Base (Q.):</label><br><input type="number" id="pub-precio" required style="width:100%; padding:6px;"></div>
                    <div><label>Fecha/Hora Inicio:</label><br><input type="datetime-local" id="pub-inicio" required style="width:100%; padding:6px;"></div>
                    <div><label>Fecha/Hora Cierre:</label><br><input type="datetime-local" id="pub-cierre" required style="width:100%; padding:6px;"></div>
                </div>
                <button type="submit" class="btn-primary" style="margin-top: 20px; width: 100%;">Publicar Vehículo en Subasta</button>
            </form>
        </div>
    `;
}

async function enviarPublicacion(e) {
    e.preventDefault();
    const user = obtenerUsuarioActual();
    const inputArchivos = document.getElementById('pub-fotos-input');

    // Validar regla estricta de mínimo 5 fotos seleccionadas desde la carpeta
   if (inputArchivos.files.length < 5) {
        mostrarAlerta("Por favor, seleccione un MÍNIMO de 5 fotografías desde su carpeta para poder publicar el vehículo.", 'error');
        return;
    }
    const formData = new FormData();
    formData.append('usuario_id', user.id);
    formData.append('anio', document.getElementById('pub-anio').value);
    formData.append('tipo_articulo', document.getElementById('pub-tipo').value);
    formData.append('marca', document.getElementById('pub-marca').value);
    formData.append('modelo', document.getElementById('pub-modelo').value);
    formData.append('motor', document.getElementById('pub-motor').value);
    formData.append('transmision', document.getElementById('pub-trans').value);
    formData.append('combustible', document.getElementById('pub-comb').value);
    formData.append('tren_manejo', document.getElementById('pub-tren').value);
    formData.append('cilindros', document.getElementById('pub-cil').value);
    formData.append('estado_dano', document.getElementById('pub-dano').value);
    formData.append('precio_base', document.getElementById('pub-precio').value);
    formData.append('fecha_inicio', document.getElementById('pub-inicio').value);
    formData.append('fecha_cierre', document.getElementById('pub-cierre').value);

    // Adjuntar cada archivo seleccionado al FormData
    for (let i = 0; i < inputArchivos.files.length; i++) {
        formData.append('fotos', inputArchivos.files[i]);
    }

    try {
        const res = await fetch(`${API_URL}/vehiculos`, {
            method: 'POST',
            body: formData // Al usar FormData NO se debe incluir el Content-Type header manualmente
        });

        const data = await res.json();
        if (res.ok) {
                mostrarAlerta("¡Vehículo publicado con éxito!", "exito");
                cambiarVista('home'); // <-- Te redirige automáticamente al home
            } else {
                mostrarAlerta("Error al publicar el vehículo", "error");
            }
    } catch (err) {
        console.error("Error de red:", err);
        alert("Error al conectar con el servidor.");
    }
}

// =========================================================
// VISTA: MIS VEHÍCULOS PUBLICADOS (GESTIÓN Y EDICIÓN)
// =========================================================
async function renderizarMisPublicaciones(container) {
    const user = obtenerUsuarioActual();
    
    if (!user) {
        mostrarAlerta("Debe iniciar sesión para ver sus publicaciones.", "error");
        cambiarVista('login');
        return;
    }

    container.innerHTML = `
        <h2>Mis Vehículos Publicados</h2>
        <div id="grid-mis-pubs" class="grid-vehiculos" style="margin-top: 20px;">Cargando tus vehículos...</div>
    `;
    
    try {
        const res = await fetch(`${API_URL}/vehiculos?nocache=${new Date().getTime()}`, { cache: 'no-store' });
        const todos = await res.json();
        
        const misVehiculos = todos.filter(v => v.usuario_id == user.id);
        
        const grid = document.getElementById('grid-mis-pubs');
        if (misVehiculos.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-muted);">Aún no has registrado ningún vehículo en subasta.</p>';
            return;
        }

        grid.innerHTML = misVehiculos.map(v => {
            const fotosString = v.fotos || ""; 
            const fotosArray = fotosString ? fotosString.split(',') : [];
            let fotoPortada = fotosArray[0] || 'https://via.placeholder.com/300x180?text=Sin+Imagen';
            
            if (fotoPortada.startsWith('/uploads/')) {
                fotoPortada = `https://subastas-qja9.onrender.com${fotoPortada}`;
            }

            const precioBase = v.precio_base ? Number(v.precio_base).toLocaleString() : '0.00';

            // Convertimos el objeto a JSON seguro para pasarlo por parámetro al formulario de edición
            const vehiculoJson = encodeURIComponent(JSON.stringify(v));

            return `
                <div class="card-vehiculo" style="background: white; border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <img src="${fotoPortada}" class="card-img" alt="Vehículo" style="width: 100%; height: 180px; object-fit: cover;">
                    <div class="card-body" style="padding: 15px;">
                        <span class="badge-dano dano-${v.estado_dano || 'Verde'}" style="font-size: 0.8rem; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 8px;">Daño: ${v.estado_dano || 'No especificado'}</span>
                        <div class="card-title" style="font-weight: bold; font-size: 1.1rem; margin-bottom: 8px;">${v.anio || ''} ${v.marca || ''} ${v.modelo || ''}</div>
                        <p style="font-weight: bold; color: var(--primary); margin-bottom: 12px;">Precio Base: Q. ${precioBase}</p>
                        
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-primary" style="flex: 1; padding: 8px; font-size: 0.85rem;" onclick="cambiarVista('detalle-subasta', ${v.id})">Ver</button>
                            <button style="flex: 1; padding: 8px; font-size: 0.85rem; background: #ffc107; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;" onclick="abrirFormularioEdicion('${vehiculoJson}')">Editar</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error("Error al cargar mis publicaciones:", err);
        mostrarAlerta("Ocurrió un error al cargar tus vehículos.", "error");
    }
}

// =========================================================
// FORMULARIO DINÁMICO DE EDICIÓN
// =========================================================
// =========================================================
// FORMULARIO DINÁMICO DE EDICIÓN (Blindado)
// =========================================================
// =========================================================
// FORMULARIO DINÁMICO DE EDICIÓN (Con validación de cambios)
// =========================================================
function abrirFormularioEdicion(vehiculoEncoded) {
    const v = JSON.parse(decodeURIComponent(vehiculoEncoded));
    const container = document.getElementById('main-container') || document.querySelector('main') || document.body;

    container.innerHTML = `
        <div style="max-width: 800px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid var(--border-color); box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="margin-bottom: 20px; color: var(--primary);">Editar Publicación (Lote #${v.id})</h2>
            
            <form id="form-editar-vehiculo">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Año:</label>
                        <input type="number" name="anio" value="${v.anio || ''}" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Tipo de Artículo:</label>
                        <select name="tipo_articulo" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px;">
                            <option value="Automóvil" ${v.tipo_articulo === 'Automóvil' ? 'selected' : ''}>Automóvil</option>
                            <option value="Motocicleta" ${v.tipo_articulo === 'Motocicleta' ? 'selected' : ''}>Motocicleta</option>
                            <option value="Pesado" ${v.tipo_articulo === 'Pesado' ? 'selected' : ''}>Vehículo Pesado / Industrial</option>
                        </select>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Marca:</label>
                        <input type="text" name="marca" value="${v.marca || ''}" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Modelo:</label>
                        <input type="text" name="modelo" value="${v.modelo || ''}" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px;">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Motor:</label>
                        <input type="text" name="motor" value="${v.motor || ''}" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Transmisión:</label>
                        <select name="transmision" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px;">
                            <option value="Automática" ${v.transmision === 'Automática' ? 'selected' : ''}>Automática</option>
                            <option value="Manual" ${v.transmision === 'Manual' ? 'selected' : ''}>Manual</option>
                        </select>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Combustible:</label>
                        <select name="combustible" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px;">
                            <option value="Gasolina" ${v.combustible === 'Gasolina' ? 'selected' : ''}>Gasolina</option>
                            <option value="Diésel" ${v.combustible === 'Diésel' ? 'selected' : ''}>Diésel</option>
                            <option value="Híbrido/Eléctrico" ${v.combustible === 'Híbrido/Eléctrico' ? 'selected' : ''}>Híbrido / Eléctrico</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Tren de Manejo:</label>
                        <select name="tren_manejo" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px;">
                            <option value="4WD" ${v.tren_manejo === '4WD' ? 'selected' : ''}>4WD / 4x4</option>
                            <option value="FWD" ${v.tren_manejo === 'FWD' ? 'selected' : ''}>FWD (Delantera)</option>
                            <option value="RWD" ${v.tren_manejo === 'RWD' ? 'selected' : ''}>RWD (Trasera)</option>
                        </select>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Cilindros:</label>
                        <input type="number" name="cilindros" value="${v.cilindros || ''}" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Clasificación de Daño:</label>
                        <select name="estado_dano" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px;">
                            <option value="Verde" ${v.estado_dano === 'Verde' ? 'selected' : ''}>Verde (Menor)</option>
                            <option value="Amarillo" ${v.estado_dano === 'Amarillo' ? 'selected' : ''}>Amarillo (Moderado)</option>
                            <option value="Rojo" ${v.estado_dano === 'Rojo' ? 'selected' : ''}>Rojo (Severo)</option>
                        </select>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Precio Base (Q):</label>
                        <input type="number" step="0.01" name="precio_base" value="${v.precio_base || ''}" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Fecha/Hora Inicio:</label>
                        <input type="datetime-local" name="fecha_inicio" value="${v.fecha_inicio ? v.fecha_inicio.slice(0, 16) : ''}" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Fecha/Hora Cierre:</label>
                        <input type="datetime-local" name="fecha_cierre" value="${v.fecha_cierre ? v.fecha_cierre.slice(0, 16) : ''}" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px;">
                    </div>
                </div>

                <div style="display: flex; gap: 10px;">
                    <!-- Botón desactivado por defecto -->
                    <button type="submit" id="btn-guardar-edicion" class="btn-primary" style="flex: 2; padding: 12px; opacity: 0.5; cursor: not-allowed;" disabled>Guardar Cambios</button>
                    <!-- El botón cancelar regresa inmediatamente a la vista anterior -->
                    <button type="button" style="flex: 1; padding: 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;" onclick="cambiarVista('mis-publicaciones')">Cancelar</button>
                </div>
            </form>
        </div>
    `;

    const form = document.getElementById('form-editar-vehiculo');
    const btnGuardar = document.getElementById('btn-guardar-edicion');

    // Mapeo de los valores exactos originales para compararlos (todo como texto)
    const valoresOriginales = {
        anio: String(v.anio || ''),
        tipo_articulo: String(v.tipo_articulo || 'Automóvil'),
        marca: String(v.marca || ''),
        modelo: String(v.modelo || ''),
        motor: String(v.motor || ''),
        transmision: String(v.transmision || 'Automática'),
        combustible: String(v.combustible || 'Gasolina'),
        tren_manejo: String(v.tren_manejo || '4WD'),
        cilindros: String(v.cilindros || ''),
        estado_dano: String(v.estado_dano || 'Verde'),
        precio_base: String(v.precio_base || ''),
        fecha_inicio: v.fecha_inicio ? v.fecha_inicio.slice(0, 16) : '',
        fecha_cierre: v.fecha_cierre ? v.fecha_cierre.slice(0, 16) : ''
    };

    // Función que verifica si el usuario ha modificado algo
    function validarCambios() {
        const formData = new FormData(form);
        let modificado = false;

        for (const key in valoresOriginales) {
            const valorActual = formData.get(key) || '';
            if (valorActual !== valoresOriginales[key]) {
                modificado = true;
                break;
            }
        }

        // Bloquear o desbloquear el botón según el estado
        if (modificado) {
            btnGuardar.disabled = false;
            btnGuardar.style.opacity = '1';
            btnGuardar.style.cursor = 'pointer';
        } else {
            btnGuardar.disabled = true;
            btnGuardar.style.opacity = '0.5';
            btnGuardar.style.cursor = 'not-allowed';
        }
    }

    // Escuchar cada vez que el usuario escribe o selecciona algo nuevo
    form.addEventListener('input', validarCambios);
    form.addEventListener('change', validarCambios);

    // Enviar los cambios si el botón está activo
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const dataObj = Object.fromEntries(formData.entries());

        try {
            const res = await fetch(`${API_URL}/vehiculos/${v.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataObj)
            });

            if (res.ok) {
                mostrarAlerta("¡Publicación actualizada correctamente!", "exito");
                // Retornar a la vista anterior inmediatamente
                cambiarVista('mis-publicaciones');
            } else {
                mostrarAlerta("No se pudieron guardar los cambios en el servidor.", "error");
            }
        } catch (err) {
            console.error("Error al actualizar:", err);
            mostrarAlerta("Error de conexión al intentar actualizar el vehículo.", "error");
        }
    });
}