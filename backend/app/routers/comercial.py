from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from app.database import get_db
from app.models.producto import Producto, Categoria, Proveedor
from app.models.inventario import StockInventario
from app.models.transacciones import Promocion

router = APIRouter()

WHATSAPP_NUMBER = "59176666750"


def _enrich_catalogo(p: Producto, db: Session) -> dict:
    stock = db.query(func.sum(StockInventario.cantidad)).filter(StockInventario.producto_id == p.id).scalar() or 0
    return {
        "id": p.id,
        "nombre": p.nombre,
        "descripcion": p.descripcion,
        "codigo_interno": p.codigo_interno,
        "precio_mayorista": float(p.precio_mayorista),
        "precio_minorista": float(p.precio_minorista),
        "imagen_url": p.imagen_url,
        "disponible": int(stock) > 0,
        "categoria": p.categoria.nombre if p.categoria else None,
        "marca": p.marca.nombre if p.marca else None,
        "whatsapp_link": f"https://wa.me/{WHATSAPP_NUMBER}?text=Hola%20TUMOMITO%2C%20me%20interesa%20el%20producto%3A%20{p.nombre.replace(' ', '%20')}%20(COD%3A%20{p.codigo_interno})",
    }


@router.get("/productos")
def catalogo_publico(
    search: Optional[str] = Query(None),
    categoria_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Catálogo público sin autenticación — para el módulo comercial."""
    q = db.query(Producto).filter(Producto.activo == True, Producto.en_catalogo == True)
    if categoria_id:
        q = q.filter(Producto.categoria_id == categoria_id)
    if search:
        q = q.filter(Producto.nombre.ilike(f"%{search}%"))
    productos = q.offset(skip).limit(limit).all()
    return [_enrich_catalogo(p, db) for p in productos]


@router.get("/categorias")
def categorias_publico(db: Session = Depends(get_db)):
    return [{"id": c.id, "nombre": c.nombre} for c in db.query(Categoria).all()]


@router.get("/promociones")
def promociones_vigentes(db: Session = Depends(get_db)):
    from datetime import date
    hoy = date.today()
    proms = db.query(Promocion).filter(
        Promocion.activa == True,
        Promocion.fecha_inicio <= hoy,
        Promocion.fecha_fin >= hoy,
    ).all()
    return [
        {
            "id": p.id, "nombre": p.nombre, "descripcion": p.descripcion,
            "descuento_pct": float(p.descuento_pct),
            "fecha_inicio": str(p.fecha_inicio), "fecha_fin": str(p.fecha_fin),
        }
        for p in proms
    ]


@router.get("/whatsapp")
def whatsapp_contacto():
    return {
        "numero": WHATSAPP_NUMBER,
        "link": f"https://wa.me/{WHATSAPP_NUMBER}?text=Hola%20TUMOMITO%2C%20quiero%20información%20sobre%20sus%20productos",
    }
