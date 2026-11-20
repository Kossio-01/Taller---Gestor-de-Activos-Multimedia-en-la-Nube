# Cloud Media Vault

Cloud Media Vault es un gestor frontend de activos multimedia construido con Next.js App Router, React, TypeScript y Tailwind CSS.

Permite subir imágenes, videos y documentos PDF, visualizar una galería curada y eliminar archivos. El proyecto está integrado con endpoints para Cloudinary y Neon, pero puede continuar mostrando datos de demostración cuando el backend no está disponible.

## Integrantes y roles

| Integrante | Rol |
| --- | --- |
| Sebastian Vasquez | Rol 4 — Frontend: formulario de carga y validaciones; Rol 5 — Frontend: galería multimedia, filtros y QA |
| Laura Henao | Rol 2 — Backend: ingesta y subida cloud |
| Juan Camilo Casierra | Rol 1 — Arquitectura cloud y base de datos |
| Sebastian Giraldo | Rol 3 — Backend: persistencia CRUD y sincronización |

## Tecnologías

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Prisma 8
- Cloudinary
- Neon / PostgreSQL

## Funcionalidades

- Landing editorial con navegación vertical.
- Carga mediante selector de archivos o arrastrar y soltar.
- Validación de formatos:
  - Imágenes
  - Videos
  - PDF
- Peso máximo estricto de 10 MiB.
- Autocompletado del título con el nombre del archivo.
- Campos de título y autor.
- Estados de carga, éxito y error.
- Galería responsive con:
  - Vista previa de imágenes
  - Reproductor de video
  - Portada y enlace para PDF
- Metadatos de título, autor, peso y fecha.
- Eliminación con confirmación.
- Búsqueda por título o autor.
- Filtro por tipo de archivo.
- Datos mock temporales si la API no responde.

## Ejecutar localmente

Requiere Node.js y npm.

```powers
npm ci
Copy-Item .env.example .env
npm run dev
```

Abre `http://localhost:3000`.

Completa las variables de `.env` con las credenciales proporcionadas para el entorno del proyecto. No agregues secretos reales a `.env.example` ni al repositorio.

## Variables de entorno

Consulta `.env.example` para ver los nombres requeridos:

- `DATABASE_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/archivos` | Consulta archivos. Permite `tipo` (`imagen`, `video`, `pdf`) y `q` (título). |
| `POST` | `/api/archivos` | Recibe `multipart/form-data` con `file`, `titulo` y `subidoPor`. |
| `DELETE` | `/api/archivos/:id` | Elimina el recurso de Cloudinary y su registro de la base de datos. |

La carga está limitada a 10 MiB. El servidor valida el tipo MIME y la firma del contenido.

## Modelo compartido

El frontend y la persistencia usan el modelo `MediaAsset`:

```typescript
export interface MediaAsset {
  id: string;
  titulo: string;
  url: string;
  publicId: string;
  tipoArchivo: 'imagen' | 'video' | 'pdf' | string;
  tamanoBytes: number;
  fechaSubida: string;
  subidoPor: string;
}
```

## Verificación

```powers
npm run lint
npm run build
```

## Demostración

Sin credenciales válidas o sin acceso a los servicios externos:

1. Ejecuta `npm ci`.
2. Ejecuta `npm run dev`.
3. La interfaz cambiará automáticamente a modo respaldo y mostrará tres archivos de ejemplo.
4. La subida y eliminación podrán simularse localmente.
5. Indica claramente durante la presentación que el modo respaldo no representa persistencia real.

Cuando las variables de entorno estén disponibles:

1. Abre la aplicación.
2. Sube una imagen, un video y un PDF.
3. Comprueba que aparecen en la galería.
4. Busca por título o autor y prueba los filtros.
5. Recarga la página para comprobar que los metadatos provienen de la API.
6. Elimina un archivo y verifica su desaparición en la interfaz, Neon y Cloudinary.
