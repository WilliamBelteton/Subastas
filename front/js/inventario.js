// =========================================================
// VISTA: INVENTARIO GLOBAL DE VEHÍCULOS (Con Filtros Activos)
// =========================================================
async function renderizarInventario(container) {
    // 1. Estructura base que incluye la barra de filtros superior
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <h2 style="color: var(--primary); margin: 0;">Inventario Global de Vehículos</h2>
                
                <!-- Barra de Filtros Interactivos -->
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <input type="text" id="input-buscar" placeholder="Buscar marca, modelo..." style="padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; width: 220px;">
                    
                    <select id="filtro-tipo" style="padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="">Todos los tipos</option>
                        <option value="Automóvil">Automóvil</option>
                        <option value="Motocicleta">Motocicleta</option>
                        <option value="Pesado">Vehículo Pesado / Industrial</option>
                    </select>

                    <select id="filtro-dano" style="padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="">Cualquier Daño</option>
                        <option value="Verde">Verde (Menor)</option>
                        <option value="Amarillo">Amarillo (Moderado)</option>
                        <option value="Rojo">Rojo (Severo)</option>
                    </select>
                </div>
            </div>
        </div>

        <div id="grid-inventario" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
            <p style="grid-column: 1 / -1; font-size: 1.1rem; color: #555;">Cargando inventario de vehículos...</p>
        </div>
    `;

    try {
        // 2. Obtener los datos del Backend
        const res = await fetch(`${API_URL}/vehiculos?nocache=${new Date().getTime()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error("No se pudo conectar con la base de datos");

        const vehiculosOriginales = await res.json();
        const grid = document.getElementById('grid-inventario');

        if (vehiculosOriginales.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1 / -1; color: #666;">No hay vehículos disponibles en subasta en este momento.</p>';
            return;
        }

        // Función interna para pintar las tarjetas en pantalla
        function pintarTarjetas(lista) {
            if (lista.length === 0) {
                grid.innerHTML = '<p style="grid-column: 1 / -1; color: #666; text-align: center; padding: 20px;">No se encontraron vehículos con los filtros seleccionados.</p>';
                return;
            }

            const URL_BACKEND = 'https://subastas-qja9.onrender.com';

            grid.innerHTML = lista.map(v => {
                const fotoRuta = v.fotos ? v.fotos.split(',')[0] : '';
                const fotoPortada = fotoRuta.startsWith('http') ? fotoRuta : `${URL_BACKEND}${fotoRuta}`;

                const precioActual = v.puja_maxima ? v.puja_maxima : v.precio_base;
                const precioFormateado = Number(precioActual).toLocaleString();

                return `
                    <div style="background: white; border: 1px solid #ddd; border-radius: 6px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); transition: transform 0.2s;">
                        <img src="${fotoPortada}" alt="${v.marca} ${v.modelo}" style="width: 100%; height: 200px; object-fit: cover;">
                        <div style="padding: 15px;">
                            <span style="font-size: 0.8rem; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-bottom: 10px; background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9;">Daño: ${v.estado_dano || 'Verde'}</span>
                            
                            <h3 style="margin: 0 0 10px 0; font-size: 1.2rem; color: #333;">${v.anio || ''} ${v.marca || ''} ${v.modelo || ''}</h3>
                            
                            <p style="font-size: 0.9rem; color: #666; margin-bottom: 15px;">
                                Motor: ${v.motor || 'N/A'} | Transmisión: ${v.transmision || 'N/A'}
                            </p>
                            
                            <p style="font-weight: bold; color: var(--primary); font-size: 1.1rem; margin-bottom: 15px;">
                                ${v.puja_maxima ? 'Puja Actual:' : 'Precio Base:'} Q. ${precioFormateado}
                            </p>
                            
                            <button style="width: 100%; padding: 10px; font-size: 1rem; background: #0056b3; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;" onclick="cambiarVista('detalle-subasta', ${v.id})">
                                Ver Subasta en Vivo
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        const filtros = {
            texto: '',
            tipo: '',
            dano: ''
        };

        const inputBuscar = document.getElementById('input-buscar');
        const filtroTipo = document.getElementById('filtro-tipo');
        const filtroDano = document.getElementById('filtro-dano');

        const actualizarFiltros = () => {
            filtros.texto = inputBuscar.value.trim().toLowerCase();
            filtros.tipo = filtroTipo.value;
            filtros.dano = filtroDano.value;

            const listaFiltrada = vehiculosOriginales.filter(v => {
                const textoVehiculo = `${v.marca || ''} ${v.modelo || ''}`.toLowerCase();
                const coincideTexto = !filtros.texto || textoVehiculo.includes(filtros.texto);
                const coincideTipo = !filtros.tipo || (v.tipo_vehiculo || v.tipo) === filtros.tipo;
                const coincideDano = !filtros.dano || (v.estado_dano || 'Verde') === filtros.dano;
                return coincideTexto && coincideTipo && coincideDano;
            });

            pintarTarjetas(listaFiltrada);
        };

        inputBuscar.addEventListener('input', actualizarFiltros);
        filtroTipo.addEventListener('change', actualizarFiltros);
        filtroDano.addEventListener('change', actualizarFiltros);

        pintarTarjetas(vehiculosOriginales);

    } catch (error) {
        const grid = document.getElementById('grid-inventario');
        if (grid) {
            grid.innerHTML = '<p style="grid-column: 1 / -1; color: #c62828;">No se pudo cargar el inventario. Intente nuevamente.</p>';
        }
        console.error('Error cargando inventario:', error);
    }
}

async function cargarVehiculosDesdeAPI() {
    try {
        const res = await fetch(`${API_URL}/vehiculos`);
        const todosLosVehiculos = await res.json();
        mostrarVehiculosEnGrid(todosLosVehiculos);
    } catch (err) {
        console.error(err);
        const grid = document.getElementById('lista-vehiculos-grid');
        if (grid) grid.innerHTML = '<p>Error al conectar con la base de datos MySQL.</p>';
    }
}

function mostrarVehiculosEnGrid(vehiculos) {
    const grid = document.getElementById('lista-vehiculos-grid');
    if (!grid) return;

    if (!Array.isArray(vehiculos)) {
        grid.innerHTML = '<p>Error de formato al leer los vehículos.</p>';
        return;
    }

    if (vehiculos.length === 0) {
        grid.innerHTML = '<p>No se encontraron vehículos registrados en la base de datos.</p>';
        return;
    }

    const URL_BACKEND = 'https://subastas-qja9.onrender.com';

    grid.innerHTML = vehiculos.map(v => {
        const fotoRuta = v.fotos ? v.fotos.split(',')[0] : '';
        const fotoPortada = fotoRuta.startsWith('http') ? fotoRuta : `${URL_BACKEND}${fotoRuta}`;
        const precioBase = v.precio_base ? Number(v.precio_base).toLocaleString() : '0.00';

        return `
            <div class="card-vehiculo">
                <img src="${fotoPortada}" class="card-img" alt="Vehículo">
                <div class="card-body">
                    <span class="badge-dano dano-${v.estado_dano || 'Verde'}">Daño: ${v.estado_dano || 'No especificado'}</span>
                    <div class="card-title">${v.anio || ''} ${v.marca || 'Marca desconocida'} ${v.modelo || ''}</div>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 10px;">
                        Motor: ${v.motor || 'N/A'} | Transmisión: ${v.transmision || 'N/A'}
                    </p>
                    <p style="font-weight: bold; color: var(--primary);">Precio Base: Q. ${precioBase}</p>
                    <button class="btn-primary" style="width: 100%; margin-top: 10px;" onclick="cambiarVista('detalle-subasta', ${v.id})">
                        Ver Subasta en Vivo
                    </button>
                </div>
            </div>
        `;
    }).join('');
}