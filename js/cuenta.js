/* CRAN ENSENADA · Acceso visual y conexión opcional con backend real.
   No almacena contraseñas ni crea cuentas simuladas. Para activar el servicio,
   configurar window.CRAN_AUTH_API_BASE antes de cargar este archivo.
   Endpoints: POST /login, /register, /forgot-password, /reset-password. */
(() => {
  'use strict';
  const trigger = document.querySelector('[data-ce-account]');
  if (!trigger) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'ce-account-dialog';
  dialog.setAttribute('aria-label', 'Acceso a mi cuenta');
  document.body.append(dialog);
  const configuredApi = typeof window.CRAN_AUTH_API_BASE === 'string' && window.CRAN_AUTH_API_BASE.trim() !== '';
  const apiBase = configuredApi ? window.CRAN_AUTH_API_BASE.replace(/\/$/, '') : '';
  let mode = 'login';
  const validModes = new Set(['login', 'register', 'recover', 'reset']);
  const authTexts = {
    login: ['Bienvenido nuevamente', 'Inicia sesión', 'Ingresa con tu correo y contraseña para acceder a tu cuenta.', 'Iniciar sesión'],
    register: ['Forma parte de la comunidad', 'Crea tu cuenta', 'Regístrate para conocer más de CRAN ENSENADA.', 'Crear cuenta'],
    recover: ['Recuperación de acceso', '¿Olvidaste tu contraseña?', 'Escribe el correo asociado a tu cuenta para solicitar instrucciones de recuperación.', 'Solicitar enlace'],
    reset: ['Restablecimiento de acceso', 'Crea una nueva contraseña', 'Ingresa tu nueva contraseña para completar el restablecimiento de tu cuenta.', 'Guardar contraseña']
  };
  const rawToken = new URLSearchParams(location.search).get('reset_token');
  function field(label, html) { return `<label>${label}${html}</label>`; }
  function render(next) {
    mode = validModes.has(next) ? next : 'login';
    const [kicker, title, intro, submit] = authTexts[mode];
    const register = mode === 'register', login = mode === 'login', recover = mode === 'recover', reset = mode === 'reset';
    dialog.innerHTML = `
      <div class="ce-account-inner">
        <button class="ce-account-close" type="button" data-auth-close aria-label="Cerrar formulario">×</button>
        <p class="ce-account-topline">${kicker}</p>
        <h2 class="ce-account-heading" id="ce-account-title">${title}</h2>
        <p class="ce-account-intro">${intro}</p>
        <form class="ce-account-fields" id="ce-account-form">
          ${register ? field('Nombre completo','<input name="name" autocomplete="name" maxlength="90" minlength="2" required placeholder="Tu nombre y apellido">') : ''}
          ${reset ? '' : field('Correo electrónico','<input name="email" type="email" autocomplete="email" maxlength="254" required placeholder="nombre@correo.cl">')}
          ${login || register || reset ? field(reset?'Nueva contraseña':'Contraseña',`<input name="password" type="password" autocomplete="${login?'current-password':'new-password'}" minlength="8" required placeholder="Mínimo 8 caracteres">`) : ''}
          ${register || reset ? field('Confirmar contraseña','<input name="passwordConfirm" type="password" autocomplete="new-password" minlength="8" required placeholder="Repite tu contraseña">') : ''}
          ${login ? '<div class="ce-account-help"><button class="ce-account-link" type="button" data-auth-mode="recover">¿Olvidaste tu contraseña?</button></div>' : ''}
          <button class="ce-account-submit" type="submit">${submit}</button>
        </form>
        <p class="ce-account-message" id="ce-account-message" role="status" aria-live="polite" hidden></p>
        <div class="ce-account-divider">CRAN ENSENADA</div>
        <p class="ce-account-bottom">${login ? '¿No tienes cuenta? <button class="ce-account-link" type="button" data-auth-mode="register">Regístrate aquí</button>' : register ? '¿Ya tienes cuenta? <button class="ce-account-link" type="button" data-auth-mode="login">Inicia sesión</button>' : '¿Recordaste tu contraseña? <button class="ce-account-link" type="button" data-auth-mode="login">Volver a iniciar sesión</button>'}</p>
        ${!configuredApi ? '<p class="ce-account-note">Vista demostrativa: el registro, acceso y recuperación por correo requieren conectar un servidor de autenticación. No se envían ni almacenan contraseñas aquí.</p>' : ''}
      </div>`;
    dialog.setAttribute('aria-labelledby','ce-account-title');
    dialog.querySelector('input')?.focus();
  }
  function open(next='login') { render(next); if (!dialog.open) dialog.showModal(); }
  function feedback(message, isError=false) {
    const output=dialog.querySelector('#ce-account-message');
    output.textContent=message;
    output.hidden=false;
    output.classList.toggle('is-error',isError);
  }
  trigger.addEventListener('click',()=>open('login'));
  dialog.addEventListener('click',event=>{
    if(event.target===dialog || event.target.closest('[data-auth-close]')){dialog.close();return;}
    const switcher=event.target.closest('[data-auth-mode]');
    if(switcher)render(switcher.dataset.authMode);
  });
  dialog.addEventListener('submit',async event=>{
    if(event.target.id!=='ce-account-form')return;
    event.preventDefault();
    const form=event.target;
    const data=new FormData(form);
    const password=String(data.get('password')||'');
    if((mode==='register'||mode==='reset') && password!==String(data.get('passwordConfirm')||'')){
      feedback('Las contraseñas no coinciden. Revísalas e inténtalo nuevamente.',true);
      return;
    }
    if(mode==='reset' && !rawToken){feedback('El enlace de recuperación no contiene un token válido. Solicita uno nuevo.',true);return;}
    if(!configuredApi){
      feedback(mode==='recover' ? 'Formulario preparado. Para enviarte un correo real de recuperación, primero debemos conectar la web con un servidor de autenticación.' : 'Este formulario aún es demostrativo: necesitas conectar el sistema de usuarios y la base de datos para completar esta operación.');
      return;
    }
    const endpoint={login:'/login',register:'/register',recover:'/forgot-password',reset:'/reset-password'}[mode];
    const payload=mode==='reset' ? {token:rawToken,newPassword:password} : mode==='recover' ? {email:String(data.get('email')||'')} : mode==='login' ? {email:String(data.get('email')||''),password} : {name:String(data.get('name')||''),email:String(data.get('email')||''),password};
    const submit=form.querySelector('[type=submit]');
    submit.disabled=true;
    try{
      const response=await fetch(apiBase+endpoint,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(!response.ok){feedback('No pudimos completar la solicitud. Revisa tus datos o inténtalo nuevamente.',true);return;}
      if(mode==='recover'){feedback('Si existe una cuenta asociada a ese correo, recibirás instrucciones de recuperación. Revisa también tu carpeta de spam.');form.reset();}
      else if(mode==='reset'){feedback('Contraseña actualizada. Ya puedes iniciar sesión.');form.reset();}
      else if(mode==='register'){feedback('Tu registro se completó. Ya puedes iniciar sesión.');form.reset();}
      else{feedback('Inicio de sesión confirmado.');setTimeout(()=>location.reload(),700);}
    }catch{feedback('No se pudo conectar con el servidor. Comprueba que la API de autenticación esté disponible.',true);}
    finally{submit.disabled=false;}
  });
  dialog.addEventListener('close',()=>trigger.focus());
  if(rawToken) open('reset');
})();
