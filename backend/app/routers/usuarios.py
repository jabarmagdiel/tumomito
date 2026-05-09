from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.usuario import Usuario, Rol
from app.models.transacciones import CuentaCobrar, CuentaPagar
from app.schemas.auth import UsuarioCreate, UsuarioUpdate, UsuarioOut
from app.schemas.transacciones import PagoIn, CuentaCobrarOut, CuentaPagarOut
from app.core.security import get_current_user, require_admin, hash_password

router = APIRouter()


@router.get("/", response_model=List[dict])
def listar_usuarios(db: Session = Depends(get_db), _=Depends(require_admin)):
    users = db.query(Usuario).all()
    return [
        {"id": u.id, "nombre": u.nombre, "email": u.email,
         "rol": u.rol.nombre, "activo": u.activo, "created_at": str(u.created_at)}
        for u in users
    ]


@router.post("/", status_code=201)
def crear_usuario(data: UsuarioCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(Usuario).filter(Usuario.email == data.email).first():
        raise HTTPException(400, "Email ya registrado")
    u = Usuario(
        nombre=data.nombre, email=data.email,
        password_hash=hash_password(data.password), rol_id=data.rol_id,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return {"id": u.id, "nombre": u.nombre, "email": u.email}


@router.put("/{usuario_id}")
def actualizar_usuario(usuario_id: int, data: UsuarioUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    u = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(u, k, v)
    db.commit()
    return {"detail": "Actualizado"}


@router.get("/roles")
def listar_roles(db: Session = Depends(get_db), _=Depends(require_admin)):
    return [{"id": r.id, "nombre": r.nombre} for r in db.query(Rol).all()]
