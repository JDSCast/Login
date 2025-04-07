<template>
  <section class="vh-100 gradient-custom">
    <div class="container py-5 h-100">
      <div class="row d-flex justify-content-center align-items-center h-100">
        <div class="col-12 col-md-8 col-lg-6 col-xl-5">
          <div class="card bg-dark text-white" style="border-radius: 1rem;">
            <div class="card-body p-5 text-center">
              <div class="mb-md-5 mt-md-4 pb-5">
                <h2 class="fw-bold mb-2 text-uppercase">Registro</h2>
                <p class="text-white-50 mb-5">¡Crea tu cuenta para comenzar!</p>

                <form @submit.prevent="handleRegister">
                  <div class="form-outline form-white mb-4">
                    <input type="text" id="inputName" class="form-control form-control-lg" v-model="name" />
                    <label class="form-label" for="inputName">Nombre de usuario</label>
                  </div>

                  <div class="form-outline form-white mb-4">
                    <input type="email" id="inputEmail" class="form-control form-control-lg" v-model="email" />
                    <label class="form-label" for="inputEmail">Correo electrónico</label>
                  </div>

                  <div class="form-outline form-white mb-4">
                    <input type="password" id="inputPassword" class="form-control form-control-lg" v-model="password" />
                    <label class="form-label" for="inputPassword">Contraseña</label>
                  </div>

                  <button class="btn btn-outline-light btn-lg px-5" type="submit">Registrarse</button>
                </form>
              </div>

              <div>
                <p class="mb-0">¿Ya tienes cuenta?
                  <router-link to="/login" class="text-white-50 fw-bold">Inicia sesión</router-link>
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
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Swal from 'sweetalert2';



export default {
  setup() {
    const name = ref('');
    const email = ref('');
    const password = ref('');
    const router = useRouter();
    
    const auth = getAuth();
    const db = getFirestore();

    const verificarNombreUnico = async (nombre) => {
      const q = query(collection(db, "usuarios"), where("name", "==", nombre));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    };

    const handleRegister = async () => {
      if (!name.value || !email.value || !password.value) {
        Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Todos los campos son obligatorios.',
        confirmButtonText: 'OK'
        });

        return;
      }
      

      try {
        const existeNombre = await verificarNombreUnico(name.value);
        if (existeNombre) {
          Swal.fire({
          icon: 'error',
            title: 'Nombre en uso',
          text: 'El nombre de usuario ya fue registrado por otro jugador.',
          confirmButtonText: 'OK'
        });


          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
        const user = userCredential.user;
        await updateProfile(user, { displayName: name.value });

        await setDoc(doc(db, "usuarios", user.uid), {
          uid: user.uid,
          name: name.value,
          email: email.value,
        });
        Swal.fire({
        icon: "success",
        title: "Registrado",
        text: "Usuario registrado.",
        confirmButtonText: "OK",
      });

        router.push("/login");
      } catch (error) {
        handleAuthError(error.code);
      }
    };

    const handleAuthError = (errorCode) => {
      const errorMessages = {
        'auth/email-already-in-use': "El correo ya está registrado.",
        'auth/invalid-email': "Correo inválido.",
        'auth/weak-password': "La contraseña debe tener al menos 6 caracteres.",
      };
      Swal.fire({
        icon: "error",
        title: "Error de autenticación",
        text: errorMessages[errorCode] || "Error al registrar. Inténtalo de nuevo.",
        confirmButtonText: "OK",
      });
    };

    return { name, email, password, handleRegister };
  }
};
</script>

<style scoped>
@import '../styles/register.css';
.gradient-custom {
  background: linear-gradient(135deg, #000000 0%, #6a0dad 100%);
  min-height: 100vh;
}
</style>