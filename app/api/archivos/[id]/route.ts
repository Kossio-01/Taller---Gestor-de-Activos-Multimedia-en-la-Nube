import { deleteMedia } from '@/lib/cloudinary';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const { db } = await import('@/prisma/db');
    const query = db.orm.public.ArchivoMultimedia.where({ id });
    const archivo = await query.first();
    if (!archivo) {
      return Response.json({ message: 'El archivo no existe.' }, { status: 404 });
    }

    try {
      await deleteMedia(archivo.publicId, archivo.tipoArchivo, archivo.url);
    } catch (error) {
      console.error('Error eliminando archivo de Cloudinary:', id, error);
      return Response.json({ message: 'No fue posible eliminar el archivo de Cloudinary.' }, { status: 502 });
    }

    // If PostgreSQL fails, retrying still works when Cloudinary returns "not found".
    await query.deleteAndCount();
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error eliminando metadatos de archivo:', id, error);
    return Response.json({ message: 'No fue posible completar la eliminación. Puedes reintentar.' }, { status: 503 });
  }
}
