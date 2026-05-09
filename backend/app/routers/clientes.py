from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.transacciones import Cliente
from app.schemas.producto import ClienteCreate, ClienteOut
from app.core.security import get_current_user

router = APIRouter()


@router.get("/", response_model=List[ClienteOut])
def listar_clientes(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Cliente).filter(Cliente.activo == True)
    if search:
        q = q.filter(Cliente.nombre.ilike(f"%{search}%"))
    return q.order_by(Cliente.nombre).all()


@router.post("/", response_model=ClienteOut, status_code=201)
def crear_cliente(data: ClienteCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = Cliente(**data.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.put("/{cliente_id}", response_model=ClienteOut)
def actualizar_cliente(cliente_id: int, data: ClienteCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not c:
        raise HTTPException(404, "Cliente no encontrado")
    for k, v in data.model_dump().items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{cliente_id}")
def desactivar_cliente(cliente_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not c:
        raise HTTPException(404, "Cliente no encontrado")
    c.activo = False
    db.commit()
    return {"detail": "Cliente desactivado"}
