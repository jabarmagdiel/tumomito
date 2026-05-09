from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.producto import Proveedor
from app.schemas.producto import ProveedorCreate, ProveedorOut
from app.core.security import get_current_user, require_admin

router = APIRouter()


@router.get("/", response_model=List[ProveedorOut])
def listar_proveedores(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Proveedor)
    if search:
        q = q.filter(Proveedor.nombre.ilike(f"%{search}%"))
    return q.order_by(Proveedor.nombre).all()


@router.post("/", response_model=ProveedorOut, status_code=201)
def crear_proveedor(data: ProveedorCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    p = Proveedor(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.put("/{proveedor_id}", response_model=ProveedorOut)
def actualizar_proveedor(proveedor_id: int, data: ProveedorCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    p = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not p:
        raise HTTPException(404, "Proveedor no encontrado")
    for k, v in data.model_dump().items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{proveedor_id}")
def desactivar_proveedor(proveedor_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    p = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not p:
        raise HTTPException(404, "Proveedor no encontrado")
    p.activo = False
    db.commit()
    return {"detail": "Proveedor desactivado"}
