# Corrección del inicio de sesión

18 de noviembre de 2026.

## Fallos encontrados

- Una descarga fallida de la escena Spline propagaba una excepción que desmontaba toda la pantalla: al bloquear la descarga se reprodujeron `Failed to fetch`, cero campos de correo y cuerpo vacío. La decoración ahora tiene un límite de error propio y un respaldo local; después de diez segundos sin cargar también muestra el respaldo. El formulario permanece disponible.
- El formulario esperaba indefinidamente una solicitud de autenticación que no terminara. Ahora usa el servicio de autenticación compartido, cancela a los 60 segundos y permite reintentar conservando los campos. Una respuesta tardía no crea una sesión después de la cancelación.
- El backend no tenía límites de conexión/lectura al proveedor de autenticación. Ahora usa 5 segundos para conectar y 15 segundos para leer; una espera agotada devuelve un error 503 recuperable.
- El login mantenía una transacción de PostgreSQL mientras consultaba Supabase. Ahora obtiene el rol y sus permisos con el perfil, sin mantener esa transacción durante la petición externa.

## Verificación

- Render respondió `UP`, aceptó CORS de `http://localhost:5173` y devolvió 401 en 0,63 segundos a una cuenta inexistente de diagnóstico. No se utilizaron contraseñas reales.
- Java 25: 15 pruebas aprobadas (3 de comunicación con Supabase, 1 de lectura de perfil real sin modificar cuentas, 11 de permisos).
- Edge: prueba aprobada con escena 3D bloqueada, solicitud detenida, cancelación, reintento, credenciales incorrectas, acceso al portal y persistencia tras recargar.
- ESLint y compilación de producción del frontend completados; JAR del backend generado.
- La auditoría estática del plugin de diseño agotó 20 segundos sin dictamen. Su resultado se conserva en `auditoria-login.json`; no se cuenta como una auditoría aprobada.

## Aplicación

Recargar el frontend local. Para aplicar también los cambios de autenticación del backend, desplegar el backend actualizado en Render. No requiere migraciones de base de datos ni cambiar contraseñas, claves o tokens.

La prueba del acceso correcto usa una respuesta de autenticación controlada y un perfil real de solo lectura; no certifica las credenciales particulares de un usuario en Render.
