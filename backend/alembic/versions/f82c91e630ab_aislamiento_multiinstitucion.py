"""Add institution ownership and tenant-scoped uniqueness to business data."""

from alembic import op
import sqlalchemy as sa


revision = "f82c91e630ab"
down_revision = "ed4f7a2c9b10"
branch_labels = None
depends_on = None


TABLAS = (
    "aulas",
    "asignaturas",
    "eventos_auditoria",
    "calificaciones",
    "carreras",
    "docentes",
    "estudiantes",
    "matriculas",
    "notificaciones_leidas",
    "periodos",
    "secciones",
    "solicitudes_cuenta",
    "solicitudes_recuperacion",
    "usuarios",
    "verificaciones_correo_solicitud",
)

UNIQUE_POR_INSTITUCION = {
    "aulas": ("codigo",),
    "asignaturas": ("codigo", "nombre"),
    "carreras": ("codigo", "nombre"),
    "calificaciones": ("matricula_id",),
    "docentes": ("numero_empleado", "correo"),
    "estudiantes": ("cuenta", "correo", "telefono"),
    "secciones": ("codigo",),
    "usuarios": ("usuario", "correo"),
}

TABLAS_REFERENCIADAS = (
    "aulas",
    "asignaturas",
    "calificaciones",
    "carreras",
    "docentes",
    "estudiantes",
    "eventos_auditoria",
    "matriculas",
    "periodos",
    "secciones",
    "usuarios",
)

RELACIONES_TENANT = (
    ("asignaturas", "carrera_id", "carreras", "carrera"),
    ("asignaturas", "requisito_id", "asignaturas", "requisito"),
    ("calificaciones", "matricula_id", "matriculas", "matricula"),
    ("estudiantes", "carrera_id", "carreras", "carrera"),
    ("matriculas", "estudiante_id", "estudiantes", "estudiante"),
    ("matriculas", "seccion_id", "secciones", "seccion"),
    ("notificaciones_leidas", "usuario_id", "usuarios", "usuario"),
    ("notificaciones_leidas", "evento_id", "eventos_auditoria", "evento"),
    ("secciones", "asignatura_id", "asignaturas", "asignatura"),
    ("secciones", "docente_id", "docentes", "docente"),
    ("secciones", "periodo_id", "periodos", "periodo"),
    ("secciones", "aula_id", "aulas", "aula"),
    ("solicitudes_cuenta", "revisado_por", "usuarios", "revisor"),
    ("solicitudes_recuperacion", "usuario_id", "usuarios", "usuario"),
    ("usuarios", "docente_id", "docentes", "docente"),
)


def upgrade():
    op.create_table(
        "instituciones",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column("nombre", sa.String(length=200), nullable=False),
        sa.Column("activa", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "creada_en",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("slug", name="uq_instituciones_slug"),
    )
    op.execute(
        sa.text(
            "INSERT INTO instituciones (id, slug, nombre, activa) "
            "VALUES (1, 'uphn', 'Universidad Politécnica de Honduras', TRUE)"
        )
    )
    op.execute(
        sa.text(
            "SELECT setval(pg_get_serial_sequence('instituciones', 'id'), "
            "(SELECT MAX(id) FROM instituciones))"
        )
    )

    for tabla in TABLAS:
        op.add_column(
            tabla,
            sa.Column("institucion_id", sa.Integer(), nullable=True),
        )
        op.execute(sa.text(f"UPDATE {tabla} SET institucion_id = 1"))
        op.alter_column(tabla, "institucion_id", nullable=False)
        op.create_foreign_key(
            f"fk_{tabla}_institucion_id",
            tabla,
            "instituciones",
            ["institucion_id"],
            ["id"],
            ondelete="RESTRICT",
        )
        op.create_index(
            f"ix_{tabla}_institucion_id", tabla, ["institucion_id"]
        )

    for tabla in TABLAS_REFERENCIADAS:
        op.create_unique_constraint(
            f"uq_{tabla}_institucion_id", tabla, ["institucion_id", "id"]
        )

    conexion = op.get_bind()
    inspector = sa.inspect(conexion)
    for tabla, columnas in UNIQUE_POR_INSTITUCION.items():
        constraints = inspector.get_unique_constraints(tabla)
        for columna in columnas:
            op.create_unique_constraint(
                f"uq_{tabla}_institucion_{columna}",
                tabla,
                ["institucion_id", columna],
            )
        for constraint in constraints:
            columnas_unicas = constraint.get("column_names") or []
            if len(columnas_unicas) == 1 and columnas_unicas[0] in columnas:
                op.drop_constraint(
                    constraint["name"], tabla, type_="unique"
                )

    for tabla, columna, destino, sufijo in RELACIONES_TENANT:
        actuales = inspector.get_foreign_keys(tabla)
        for foreign_key in actuales:
            if foreign_key.get("constrained_columns") == [columna]:
                op.drop_constraint(
                    foreign_key["name"], tabla, type_="foreignkey"
                )
        op.create_foreign_key(
            f"fk_{tabla}_{sufijo}_institucion",
            tabla,
            destino,
            ["institucion_id", columna],
            ["institucion_id", "id"],
            ondelete="CASCADE" if tabla == "notificaciones_leidas" else None,
        )


def downgrade():
    conexion = op.get_bind()
    cantidad = conexion.execute(
        sa.text("SELECT COUNT(*) FROM instituciones")
    ).scalar_one()
    if cantidad > 1:
        raise RuntimeError(
            "No se puede revertir el aislamiento mientras haya más de una institución."
        )

    for tabla, columna, destino, sufijo in reversed(RELACIONES_TENANT):
        op.drop_constraint(
            f"fk_{tabla}_{sufijo}_institucion", tabla, type_="foreignkey"
        )
        op.create_foreign_key(
            f"fk_{tabla}_{columna}_legacy",
            tabla,
            destino,
            [columna],
            ["id"],
        )

    for tabla, columnas in UNIQUE_POR_INSTITUCION.items():
        for columna in columnas:
            op.drop_constraint(
                f"uq_{tabla}_institucion_{columna}", tabla, type_="unique"
            )
            op.create_unique_constraint(
                f"uq_{tabla}_{columna}", tabla, [columna]
            )

    for tabla in reversed(TABLAS_REFERENCIADAS):
        op.drop_constraint(
            f"uq_{tabla}_institucion_id", tabla, type_="unique"
        )

    for tabla in reversed(TABLAS):
        op.drop_index(f"ix_{tabla}_institucion_id", table_name=tabla)
        op.drop_constraint(
            f"fk_{tabla}_institucion_id", tabla, type_="foreignkey"
        )
        op.drop_column(tabla, "institucion_id")

    op.drop_table("instituciones")
