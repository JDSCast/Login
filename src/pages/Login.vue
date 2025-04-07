<template>
  <section class="vh-100 gradient-custom">
    <div class="container py-5 h-100">
      <div class="row d-flex justify-content-center align-items-center h-100">
        <div class="col-12 col-md-8 col-lg-6 col-xl-5">
          <div class="card bg-dark text-white" style="border-radius: 1rem;">
            <div class="card-body p-5 text-center">
              <div class="mb-md-5 mt-md-4 pb-5">
                <h2 class="fw-bold mb-2 text-uppercase mb-5">Ingresar</h2>

                <div class="form-outline form-white mb-4">
                  <input
                    type="email"
                    id="typeEmailX"
                    class="form-control form-control-lg"
                    v-model="email"
                  />
                  <label class="form-label" for="typeEmailX">Email</label>
                </div>

                <div class="form-outline form-white mb-4">
                  <input
                    type="password"
                    id="typePasswordX"
                    class="form-control form-control-lg"
                    v-model="password"
                  />
                  <label class="form-label" for="typePasswordX">Password</label>
                </div>

                <button
                  class="btn btn-outline-light btn-lg px-5"
                  @click="handleLogin"
                >
                  Ingresar
                </button>

                <div class="d-flex justify-content-center text-center mt-4 pt-1">
                  <a href="#" class="text-white"><i class="fab fa-facebook-f fa-lg"></i></a>
                  <a href="#" class="text-white"><i class="fab fa-twitter fa-lg mx-4 px-2"></i></a>
                  <a href="#" class="text-white"><i class="fab fa-google fa-lg"></i></a>
                </div>
              </div>

              <div>
                <p class="mb-0">
                  No estas registrado?
                  <router-link to="/register" class="text-white-50 fw-bold">Registrarse</router-link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config.js';
import Swal from 'sweetalert2';


export default {
  setup() {
    const email = ref('');
    const password = ref('');
    const router = useRouter();
    
    const handleLogin = async () => {
      if ( !email.value || !password.value) {
        //alerta de sweetalert2
        Swal.fire({
        title: '¡Error!',
        text: 'Debes llenar todos los campos.',
        icon: 'error',
        });
        
        return;
      }
    try {
      await signInWithEmailAndPassword(auth, email.value, password.value);

      Swal.fire({
        title: '¡Bienvenido!',
        text: 'Has iniciado sesión correctamente.',
        icon: 'success',
        confirmButtonText: 'Continuar'
      }).then(() => {
        router.push("/inicio");
      });

    } catch (error) {
      console.error("Error al iniciar sesión:", error);

      Swal.fire({
        title: 'Error',
        text: error.message.includes('auth/user-not-found')
          ? 'El usuario no existe.'
          : error.message.includes('auth/wrong-password')
          ? 'Contraseña incorrecta.'
          : 'No se puede iniciar sesión.',
        icon: 'error',
        confirmButtonText: 'Intentar de nuevo'
      });
    }
  };


    const handleAuthError = (errorCode) => {
      const errorMessages = {
        'auth/invalid-credential': "Correo o contraseña incorrectos",
        'auth/user-not-found': "El usuario no está registrado",
        'auth/wrong-password': "Contraseña incorrecta",
        'auth/invalid-email': "Correo no válido",
        'auth/user-disabled': "Este usuario ha sido deshabilitado",
      };
      
      Swal.fire({
        title: '¡Problemas!',
        text: {errorMessages},
        icon: 'Error',
        confirmButtonText: 'Intentar de nuevo.'
      })
    };

    return { email, password, handleLogin };
  }
};
</script>

<style scoped>
@import '../styles/login.css';
.gradient-custom {
  background: linear-gradient(135deg, #000000 0%, #6a0dad 100%);
  min-height: 100vh;
}
</style>