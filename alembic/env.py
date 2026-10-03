import os
import sys
from logging.config import fileConfig

# 1. Agregar la raíz del proyecto al sys.path para que Alembic reconozca las carpetas
sys.path.insert(
    0, os.path.realpath(os.path.join(os.path.dirname(__file__), ".."))
)

from alembic import context
from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool

# 2. Cargar variables de entorno
load_dotenv()

from database.almacen import miClaseBase
from modulos.aulas.tabla import Aulas
from modulos.docentes.tabla import Docentes
from modulos.carreras.tabla import Carreras
from modulos.estudiantes.tabla import Estudiantes

# Configuracion de Alembic
config = context.config

# 4. Leer la URL de la base de datos desde el .env
url_db = os.getenv("DATABASE_URL")
if url_db:
  config.set_main_option("sqlalchemy.url", url_db)

if config.config_file_name is not None:
  fileConfig(config.config_file_name)

# 5. Asignar los metadatos para que autogenerate detecte las tablas
target_metadata = miClaseBase.metadata

def run_migrations_offline() -> None:
  url = config.get_main_option("sqlalchemy.url")
  context.configure(
      url=url,
      target_metadata=target_metadata,
      literal_binds=True,
      dialect_opts={"paramstyle": "named"},
  )

  with context.begin_transaction():
    context.run_migrations()

def run_migrations_online() -> None:
  connectable = engine_from_config(
      config.get_section(config.config_ini_section, {}),
      prefix="sqlalchemy.",
      poolclass=pool.NullPool,
  )

  with connectable.connect() as connection:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
      context.run_migrations()

if context.is_offline_mode():
  run_migrations_offline()
else:
  run_migrations_online()
