<template>
  <div class="container-inicio gradient-custom">
    <div class="card card-inicio">
      <div class="card-body card-body-inicio">
        <h2 class="text-center">Gestión de Tareas</h2>
        <p>Bienvenido, {{ userName }}</p>

        <div class="mb-3">
          <input
            v-model="newTask"
            type="text"
            class="form-control"
            placeholder="Nueva tarea"
          />
          <button class="btn btn-primary mt-2" @click="addTask">Agregar Tarea</button>
        </div>

        <ul class="list-group">
          <li
            v-for="task in tasks"
            :key="task.id"
            class="list-group-item"
          >
            <div v-if="!task.isEditing">
              <div class="d-flex justify-content-between">
                <span>{{ task.text }}</span>
                <div>
                  <button class="btn btn-warning btn-sm ms-2" @click="enableEdit(task)">
                    Editar
                  </button>
                  <button class="btn btn-danger btn-sm ms-2" @click="deleteTask(task.id)">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>

            <div v-else>
              <div class="mb-2">
                <input
                  type="text"
                  v-model="task.text"
                  class="form-control"
                />
              </div>
              <div class="d-flex justify-content-end">
                <button class="btn btn-success btn-sm ms-2" @click="saveEdit(task)">
                  Guardar
                </button>
                <button class="btn btn-secondary btn-sm ms-2" @click="cancelEdit(task)">
                  Cancelar
                </button>
                <button class="btn btn-danger btn-sm ms-2" @click="deleteTask(task.id)">
                  Eliminar
                </button>
              </div>
            </div>
          </li>
        </ul>

      </div>
      <div class="fixed-bottom m-2 justify-content-start align-items-start">
        <button
        type="button"
        class="btn boton-shadow btn-info  w-25 m-2 fs-4  "
        @click="handleLogout"
        >
        Salir
      </button>
    </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import Swal from 'sweetalert2';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc, // Asegúrate de importar getDoc
} from "firebase/firestore";

export default {
  setup() {
    const user = ref(null);
    const userName = ref("");
    const tasks = ref([]);
    const newTask = ref("");
    const router = useRouter();
    const auth = getAuth();
    const db = getFirestore();

    const fetchTasks = async () => {
      if (!user.value) return;

      // Consulta las tareas relacionadas con el usuario actual
      const tasksCollection = collection(db, "tareas");
      const q = query(tasksCollection, where("userId", "==", user.value.uid));
      const tasksSnapshot = await getDocs(q);

      tasks.value = tasksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isEditing: false,
      }));
    };

    const addTask = async () => {
      if (!newTask.value.trim()) return;

      const tasksCollection = collection(db, "tareas");
      const docRef = await addDoc(tasksCollection, {
        text: newTask.value,
        userId: user.value.uid,
      });
      tasks.value.push({ id: docRef.id, text: newTask.value, userId: user.value.uid, isEditing: false });
      newTask.value = "";

      Swal.fire({
        title: '¡Bienvenido!',
        text: 'Tarea Creada.',
        icon: 'success',
        confirmButtonText: 'Continuar'
      })
    };

    const enableEdit = (task) => {
      task.isEditing = true;
    };

    const saveEdit = async (task) => {
      const taskDoc = doc(db, "tareas", task.id);
      await updateDoc(taskDoc, { text: task.text });
      task.isEditing = false;
    };

    const cancelEdit = (task) => {
      task.isEditing = false;
      fetchTasks(); // Refrescar las tareas para descartar cambios no guardados
    };

    const deleteTask = async (taskId) => {
      const taskDoc = doc(db, "tareas", taskId);
      await deleteDoc(taskDoc);
      tasks.value = tasks.value.filter((task) => task.id !== taskId);
      Swal.fire({
        title: '¡Tarea Eliminada!',
        text: 'Tu tarea fue eliminada.',
        icon: 'error',
        confirmButtonText: 'Continuar'
      })
    };

    onMounted(() => {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        // console.log("Usuario autenticado:", currentUser);
        if (currentUser) {
          user.value = currentUser;

          const userDoc = doc(db, "usuarios", currentUser.uid);
          const userSnapshot = await getDoc(userDoc); // Cambiado a getDoc
          if (userSnapshot.exists()) {
            userName.value = userSnapshot.data().name;
          } else {
            userName.value = currentUser.displayName || "Usuario";
          }

          await fetchTasks();
        } else {
          user.value = null;
          userName.value = "";
          tasks.value = [];
        }
      });

      return () => unsubscribe();
    });

    const handleLogout = async () => {
      try {
        await signOut(auth);
        router.push("/login");
      } catch (error) {
        console.error("Error al cerrar sesión:", error.message);
      }
    };

    return {
      userName,
      tasks,
      newTask,
      addTask,
      enableEdit,
      saveEdit,
      cancelEdit,
      deleteTask,
      handleLogout,
    };
  },
};
</script>

<style scoped>
@import "../styles/home.css";
.gradient-custom {
  background: linear-gradient(135deg, #000000 0%, #6a0dad 100%);
  min-height: 100vh;
}
</style>