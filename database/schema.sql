-- ============================================================
-- ERP TUMOMITO - Schema SQL para Supabase (PostgreSQL)
-- Generado automáticamente
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ROLES Y USUARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATÁLOGO
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marcas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    pais_origen VARCHAR(80),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROVEEDORES
-- ============================================================
CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(30),
    email VARCHAR(150),
    direccion TEXT,
    pais VARCHAR(80),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CLIENTES
-- ============================================================
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    nit_ci VARCHAR(30),
    telefono VARCHAR(30),
    email VARCHAR(150),
    direccion TEXT,
    descuento_pct NUMERIC(5,2) DEFAULT 0,
    limite_credito NUMERIC(12,2) DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ALMACENES
-- ============================================================
CREATE TABLE IF NOT EXISTS almacenes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    codigo_interno VARCHAR(30) NOT NULL UNIQUE,
    codigo_barras VARCHAR(50),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    marca_id INTEGER REFERENCES marcas(id) ON DELETE SET NULL,
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,
    precio_costo NUMERIC(12,2) DEFAULT 0,
    precio_mayorista NUMERIC(12,2) DEFAULT 0,
    precio_minorista NUMERIC(12,2) DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    en_catalogo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INVENTARIO (STOCK POR ALMACÉN)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_inventario (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    almacen_id INTEGER NOT NULL REFERENCES almacenes(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(producto_id, almacen_id)
);

-- ============================================================
-- KARDEX DE INVENTARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS kardex_inventario (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    almacen_id INTEGER NOT NULL REFERENCES almacenes(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA')),
    cantidad INTEGER NOT NULL,
    stock_anterior INTEGER NOT NULL DEFAULT 0,
    stock_resultante INTEGER NOT NULL DEFAULT 0,
    referencia_tipo VARCHAR(30),  -- 'COMPRA', 'VENTA', 'AJUSTE'
    referencia_id INTEGER,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMPRAS
-- ============================================================
CREATE TABLE IF NOT EXISTS compra_cabecera (
    id SERIAL PRIMARY KEY,
    numero_orden VARCHAR(30) NOT NULL UNIQUE,
    proveedor_id INTEGER NOT NULL REFERENCES proveedores(id) ON DELETE RESTRICT,
    fecha_orden DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_recepcion DATE,
    estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PARCIAL', 'RECIBIDA', 'CANCELADA')),
    total NUMERIC(14,2) DEFAULT 0,
    notas TEXT,
    usuario_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compra_detalle (
    id SERIAL PRIMARY KEY,
    compra_id INTEGER NOT NULL REFERENCES compra_cabecera(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad_pedida INTEGER NOT NULL DEFAULT 0,
    cantidad_recibida INTEGER DEFAULT 0,
    precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(14,2) GENERATED ALWAYS AS (cantidad_recibida * precio_unitario) STORED
);

-- ============================================================
-- VENTAS
-- ============================================================
CREATE TABLE IF NOT EXISTS venta_cabecera (
    id SERIAL PRIMARY KEY,
    numero_venta VARCHAR(30) NOT NULL UNIQUE,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    almacen_id INTEGER NOT NULL REFERENCES almacenes(id) ON DELETE RESTRICT,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    subtotal NUMERIC(14,2) DEFAULT 0,
    descuento_pct NUMERIC(5,2) DEFAULT 0,
    descuento_monto NUMERIC(14,2) DEFAULT 0,
    total NUMERIC(14,2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'COMPLETADA' CHECK (estado IN ('PENDIENTE', 'COMPLETADA', 'ANULADA')),
    tipo_venta VARCHAR(20) DEFAULT 'MAYORISTA' CHECK (tipo_venta IN ('MAYORISTA', 'MINORISTA')),
    notas TEXT,
    usuario_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS venta_detalle (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER NOT NULL REFERENCES venta_cabecera(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL DEFAULT 0,
    precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
    descuento_pct NUMERIC(5,2) DEFAULT 0,
    subtotal NUMERIC(14,2) GENERATED ALWAYS AS (cantidad * precio_unitario * (1 - descuento_pct / 100)) STORED
);

-- ============================================================
-- CUENTAS POR COBRAR
-- ============================================================
CREATE TABLE IF NOT EXISTS cuentas_cobrar (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER NOT NULL REFERENCES venta_cabecera(id) ON DELETE CASCADE,
    cliente_id INTEGER REFERENCES clientes(id),
    monto_total NUMERIC(14,2) NOT NULL,
    monto_pagado NUMERIC(14,2) DEFAULT 0,
    fecha_vencimiento DATE,
    estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CUENTAS POR PAGAR
-- ============================================================
CREATE TABLE IF NOT EXISTS cuentas_pagar (
    id SERIAL PRIMARY KEY,
    compra_id INTEGER NOT NULL REFERENCES compra_cabecera(id) ON DELETE CASCADE,
    proveedor_id INTEGER REFERENCES proveedores(id),
    monto_total NUMERIC(14,2) NOT NULL,
    monto_pagado NUMERIC(14,2) DEFAULT 0,
    fecha_vencimiento DATE,
    estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROMOCIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS promociones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    descuento_pct NUMERIC(5,2) DEFAULT 0,
    fecha_inicio DATE,
    fecha_fin DATE,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promocion_productos (
    id SERIAL PRIMARY KEY,
    promocion_id INTEGER NOT NULL REFERENCES promociones(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    UNIQUE(promocion_id, producto_id)
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo_interno);
CREATE INDEX IF NOT EXISTS idx_productos_barras ON productos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_stock_producto ON stock_inventario(producto_id);
CREATE INDEX IF NOT EXISTS idx_kardex_producto ON kardex_inventario(producto_id);
CREATE INDEX IF NOT EXISTS idx_venta_fecha ON venta_cabecera(fecha);
CREATE INDEX IF NOT EXISTS idx_venta_cliente ON venta_cabecera(cliente_id);
CREATE INDEX IF NOT EXISTS idx_compra_proveedor ON compra_cabecera(proveedor_id);

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_updated BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_productos_updated BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_proveedores_updated BEFORE UPDATE ON proveedores FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_compra_updated BEFORE UPDATE ON compra_cabecera FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_ccobrar_updated BEFORE UPDATE ON cuentas_cobrar FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_cpagar_updated BEFORE UPDATE ON cuentas_pagar FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- DATOS INICIALES (SEED)
-- ============================================================

-- Roles
INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Acceso total al sistema'),
('Vendedor', 'Gestión de ventas y clientes'),
('Almacen', 'Control de inventario y compras')
ON CONFLICT (nombre) DO NOTHING;

-- Usuario administrador por defecto (password: Admin1234!)
-- Hash bcrypt generado externamente
INSERT INTO usuarios (nombre, email, password_hash, rol_id) VALUES
('Administrador TUMOMITO', 'admin@tumomito.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhcanFueClAglSSi9V3pce', 1)
ON CONFLICT (email) DO NOTHING;

-- Almacenes (2: almacén principal + showroom, según el Excel)
INSERT INTO almacenes (nombre, ubicacion) VALUES
('Almacén Principal', 'Depósito central TUMOMITO'),
('Showroom', 'Sala de exhibición y ventas')
ON CONFLICT DO NOTHING;

-- Categorías detectadas del Excel
INSERT INTO categorias (nombre) VALUES
('Hogar y Cocina'),
('Juguetes'),
('Electrónica'),
('Ropa y Accesorios'),
('Alimentos y Bebidas'),
('Deportes'),
('Papelería'),
('Belleza y Cuidado Personal'),
('General')
ON CONFLICT (nombre) DO NOTHING;

-- Proveedores extraídos del Excel
INSERT INTO proveedores (nombre) VALUES
('CASA IDEAS'),
('AGENDAS'),
('CHIKIPOOM'),
('IMBIMEX'),
('MAKRO'),
('MOXOS'),
('KHOLBERG'),
('DIEGO EID'),
('EUROCASCOS'),
('KIMPRO'),
('ROXI'),
('LISOFORT'),
('GUABIRA'),
('COICOM'),
('AIDISA'),
('UZ MUNDIAL'),
('CONFIA')
ON CONFLICT DO NOTHING;
