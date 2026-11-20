// Rol 2 — POST /api/archivos: recibe multipart/form-data, valida y sube a Cloudinary.
import { NextResponse } from 'next/server';
import { subirACloudinary } from '@/lib/cloudinary';
import { ErrorValidacion, validarArchivo, validarTexto } from '@/lib/validaciones';

export async function POST(request: Request) {
  try {
    // 1. Leer el formulario
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw new ErrorValidacion('La solicitud debe ser multipart/form-data.');
    }

    const file = formData.get('file');
    if (!(file instanceof File)) throw new ErrorValidacion('No se recibió ningún archivo.');
    const titulo = validarTexto(formData.get('titulo'), 'titulo');
    const subidoPor = validarTexto(formData.get('subidoPor'), 'subidoPor');

    // 2. Validar peso, tipo MIME y firma real del archivo
    const buffer = Buffer.from(await file.arrayBuffer());
    const tipoArchivo = validarArchivo(file, buffer);

    // 3. Subir el binario a Cloudinary
    let subida;
    try {
      subida = await subirACloudinary(buffer, tipoArchivo);
    } catch (error) {
      console.error('[POST /api/archivos] Error de Cloudinary:', error);
      return NextResponse.json(
        { message: 'No se pudo subir el archivo al almacenamiento en la nube. Intenta de nuevo.' },
        { status: 502 },
      );
    }

    // 4. Datos listos para guardar en la BD (esquema ArchivoMultimedia)
    const datos = {
      titulo,
      url: subida.secure_url,
      publicId: subida.public_id,
      tipoArchivo,
      tamanoBytes: file.size,
      subidoPor,
    };

    // TODO (Rol 3): guardar `datos` en Neon y devolver el registro creado.
    // Si el guardado en la BD falla, llamar eliminarDeCloudinary(datos.publicId, tipoArchivo)
    // para no dejar archivos huérfanos en la nube.
    //
    //   const registro = await guardarMetadatos(datos);
    //   return NextResponse.json({ asset: registro }, { status: 201 });

    // Respuesta TEMPORAL (hasta integrar la BD): usa el publicId como id para que el frontend funcione.
    return NextResponse.json(
      { asset: { id: datos.publicId, ...datos, fechaSubida: new Date().toISOString() } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ErrorValidacion) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('[POST /api/archivos] Error inesperado:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}