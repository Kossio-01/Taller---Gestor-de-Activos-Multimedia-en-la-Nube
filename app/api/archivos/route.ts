import { randomUUID } from 'node:crypto';
import { connection } from 'next/server';
import { deleteMedia, uploadMedia } from '@/lib/cloudinary';
import { mediaTypes, UploadError, validateUpload } from '@/lib/media-upload';

export async function GET(request: Request) {
  await connection();
  const params = new URL(request.url).searchParams;
  const tipo = params.get('tipo')?.trim();
  const q = params.get('q')?.trim() ?? '';
  if ((tipo && !mediaTypes.some((value) => value === tipo)) || q.length > 200) {
    return Response.json({ message: 'Los filtros de búsqueda no son válidos.' }, { status: 400 });
  }

  try {
    const { db } = await import('@/prisma/db');
    const archivos = db.orm.public.ArchivoMultimedia;
    const porTipo = tipo ? archivos.where({ tipoArchivo: tipo }) : archivos;
    const patron = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
    const consulta = q ? porTipo.where((archivo) => archivo.titulo.ilike(patron)) : porTipo;
    const resultado = await consulta
      .orderBy([(archivo) => archivo.fechaSubida.desc(), (archivo) => archivo.id.desc()])
      .all();
    return Response.json(resultado, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error consultando metadatos de archivos:', error);
    return Response.json({ message: 'No fue posible consultar los archivos.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const { file, titulo, subidoPor, tipoArchivo } = await validateUpload(request);
    const { db } = await import('@/prisma/db');
    const archivos = db.orm.public.ArchivoMultimedia;
    const id = randomUUID();
    const publicId = `cloud-media-vault/${id}${tipoArchivo === 'pdf' ? '.pdf' : ''}`;

    let cloudAsset;
    try {
      cloudAsset = await uploadMedia(file, tipoArchivo, publicId);
    } catch (error) {
      // A provider timeout can occur after it has stored the asset.
      await deleteMedia(publicId, tipoArchivo).catch((cleanupError) => {
        console.error('No se confirmó la limpieza de la subida:', publicId, cleanupError);
      });
      console.error('Error subiendo archivo a Cloudinary:', error);
      return Response.json({ message: 'No fue posible subir el archivo a Cloudinary.' }, { status: 502 });
    }

    try {
      const archivo = await archivos.create({
        id, titulo, subidoPor, tipoArchivo, ...cloudAsset, tamanoBytes: file.size,
      });
      return Response.json(archivo, { status: 201 });
    } catch (error) {
      console.error('Error guardando metadatos:', id, error);
      try {
        const registrado = await archivos.where({ id }).first();
        if (registrado) return Response.json(registrado, { status: 201 });
        await deleteMedia(publicId, tipoArchivo);
      } catch (cleanupError) {
        console.error('Se requiere verificar la sincronización del archivo:', id, publicId, cleanupError);
      }
      return Response.json({ message: 'No fue posible guardar los metadatos del archivo.' }, { status: 503 });
    }
  } catch (error) {
    if (error instanceof UploadError) {
      return Response.json({ message: error.message }, { status: error.status });
    }
    console.error('Error procesando la carga de archivos:', error);
    return Response.json({ message: 'No fue posible procesar la carga.' }, { status: 503 });
  }
}
