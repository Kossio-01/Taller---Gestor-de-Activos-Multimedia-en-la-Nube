# Taller---Gestor-de-Activos-Multimedia-en-la-Nube

## Backend de archivos

Ejecuta estos comandos en la terminal integrada de VS Code (PowerShell) desde la carpeta que contiene `package.json`.

```powershell
npm ci
Copy-Item .env.example .env
```

Crea `.env` solo si aún no existe. Completa en ese archivo las credenciales de Cloudinary y la conexión de Neon del rol 1. La base debe tener la tabla `ArchivoMultimedia` del contrato de Prisma. Luego ejecuta `npm run dev` y abre http://localhost:3000.

| Método y ruta | Entrada | Respuesta correcta |
| --- | --- | --- |
| `POST /api/archivos` | Multipart con `file`, `titulo` y `subidoPor` | `201` y los metadatos guardados |
| `GET /api/archivos` | Filtros opcionales `tipo` (`imagen`, `video`, `pdf`) y `q` (parte del título) | `200` y un arreglo del más reciente al más antiguo |
| `DELETE /api/archivos/:id` | `id` del registro de Neon | `204` tras eliminar el archivo de Cloudinary y su registro |

El límite por archivo es de 10 MiB. El servidor verifica el tipo MIME y la firma del encabezado para JPEG, PNG, GIF, WebP, AVIF, MP4, MOV, WebM y PDF. Los errores incluyen un campo JSON `message`.

Para comprobar ambos roles, sube un archivo desde el formulario, recarga la página, consulta `/api/archivos?tipo=pdf&q=titulo` con un título de prueba y elimina el archivo. Verifica que el registro desaparezca de Neon y que el recurso se elimine de Cloudinary. Si la cuenta restringe la entrega pública de PDFs, habilita la opción correspondiente en Cloudinary para abrirlos desde la galería.

Los endpoints usan el modelo de acceso del taller, sin autenticación. La columna `subidoPor` contiene el texto del formulario y no acredita la identidad del usuario. Si la aplicación se publica, protege el acceso antes de exponer la carga y el borrado.
