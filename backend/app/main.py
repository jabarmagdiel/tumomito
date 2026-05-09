from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import auth, productos, inventario, compras, ventas, reportes, comercial, clientes, proveedores, usuarios, cuentas
from app.database import Base, engine
import os

# Crear tablas si no existen (en desarrollo; en producción usar Supabase SQL)
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ERP TUMOMITO API",
    description="Sistema ERP para empresa importadora TUMOMITO. Digitaliza inventario, ventas, compras y catálogo comercial.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,        prefix="/api/auth",        tags=["Autenticación"])
app.include_router(usuarios.router,    prefix="/api/usuarios",    tags=["Usuarios"])
app.include_router(productos.router,   prefix="/api/productos",   tags=["Productos"])
app.include_router(inventario.router,  prefix="/api/inventario",  tags=["Inventario"])
app.include_router(compras.router,     prefix="/api/compras",     tags=["Compras"])
app.include_router(ventas.router,      prefix="/api/ventas",      tags=["Ventas"])
app.include_router(clientes.router,    prefix="/api/clientes",    tags=["Clientes"])
app.include_router(proveedores.router, prefix="/api/proveedores", tags=["Proveedores"])
app.include_router(reportes.router,    prefix="/api/reportes",    tags=["Reportes"])
app.include_router(comercial.router,   prefix="/api/comercial",   tags=["Catálogo Comercial"])
app.include_router(cuentas.router,     prefix="/api/cuentas",     tags=["Cuentas C/P y C/C"])


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "sistema": "ERP TUMOMITO", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
