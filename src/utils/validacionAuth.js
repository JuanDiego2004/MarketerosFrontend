const esCorreoValido = (correo) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)

export const validarFormularioLogin = (correo, contrasena) => {
  if (!correo || !contrasena) return 'Por favor completa todos los campos.'
  if (!esCorreoValido(correo)) return 'Ingresa un correo electrónico válido.'
  if (contrasena.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
  return null
}

export const validarFormularioRegistro = (correo, contrasena, confirmarContrasena) => {
  if (!correo || !contrasena || !confirmarContrasena) return 'Por favor completa todos los campos.'
  if (!esCorreoValido(correo)) return 'Ingresa un correo electrónico válido.'
  if (contrasena.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
  if (contrasena !== confirmarContrasena) return 'Las contraseñas no coinciden.'
  return null
}
