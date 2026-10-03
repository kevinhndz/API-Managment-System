## Importante!


Quiero que revises dentro de /utils/auth.py , ese archivo es de autoiracion

por ahora solo estamos conectandonos por medio de un usuario random asi que no quiero eso

Quiero que hayan dos roles Docente y Admin, admin va tener acceso a todos los enpdoints de cada modulo docente te lo dejo a tu criterio. pero dale un acceso restringdio dependiendo de la logica de este management system

y pues por ende vas a crear una carepeta dentro de carpeta modulos y le va sa llamar login este va tener los mismos - tablas, repository, schema, service y roter oslo que va alojar el login y s eva comunciar con las librerias de utils para hacer el hash y autentca el token y lo demas. Asi que vas a tener que crear una tabla usuarios

Antes de cada commit revisa que funcione bien el backend , olvidate de front end por ahora. una vez veas que todo funcione:

agregues una columna o modifiques un campo en tablas.py, de cualquier modulo el flujo de trabajo obligatorio será:
1.	alembic revision --autogenerate -m "comentario " (Para que Alembic dibuje el nuevo plano).
2.	alembic upgrade head (Para que se aplique en Supabase).

una vez hecho esto revisa que no hayan errores, y haz el git add. , git commit, y git push pero todo lo haras en refactor no haras PR's a ninguna otra rama todo sera en refactor pero si quiero que hagas un monton de commits si es  posible 6 commits por modulo,  y los dejas en la rama refactor.