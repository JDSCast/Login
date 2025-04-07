<template>
  <div class="container-inicio gradient-custom ">
    <div class="card card vw-100">
      <div class="card-body card-body-inicio ">
          <div class="container">
            <h2 class="text-center ">Gestión de Tareas</h2>
            <p>Bienvenido, {{ userName }}</p>
          </div>

        <div class="mb-3 container">
          <input
            v-model="newTask"
            type="text"
            class="form-control"
            placeholder="Nueva tarea"
          />
          <button class="btn btn-primary mt-2" @click="addTask">Agregar Tarea</button>
        </div>

        <div class="row">
          <div class="col-md-4 " v-for="estado in estados" :key="estado.valor">
            <h4 class="card-header bg-dark text-white text-center rounded mb-2">{{ estado.titulo }}</h4>
            <draggable
              :list="filtrarPorEstado(estado.valor)"
              group="tareas"
              @end="onDragEnd"
              item-key="id"
              class="list-group"
            >
              <template #item="{ element }">
                <li class="list-group-item mt-3 border">
                  <div v-if="!element.isEditing">
                    <div class="d-flex justify-content-between">
                      <span>{{ element.text }}</span>
                      <p>Creador: {{element.creador}}</p>
                      <div>
                        <button class="btn btn-warning btn-sm ms-2" @click="enableEdit(element)">Editar</button>
                        <button class="btn btn-danger btn-sm ms-2" @click="deleteTask(element.id)">Eliminar</button>
                      </div>
                    </div>
                  </div>

                  <div v-else>
                    <div class="mb-2">
                      <input type="text" v-model="element.text" class="form-control" />
                    </div>
                    <div class="d-flex justify-content-end">
                      <button class="btn btn-success btn-sm ms-2" @click="saveEdit(element)">Guardar</button>
                      <button class="btn btn-secondary btn-sm ms-2" @click="cancelEdit(element)">Cancelar</button>
                      <button class="btn btn-danger btn-sm ms-2" @click="deleteTask(element.id)">Eliminar</button>
                    </div>
                  </div>
                </li>
              </template>
            </draggable>
          </div>
        </div>

      </div>
      <div class="fixed-bottom m-2 justify-content-start align-items-start">
        <button
          type="button"
          class="btn boton-shadow btn-info w-25 m-2 fs-4"
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
import draggable from 'vuedraggable';
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
  getDoc,
} from "firebase/firestore";

export default {
  components: {
    draggable,
  },
  setup() {
    const user = ref(null);
    const userName = ref("");
    const tasks = ref([]);
    const newTask = ref("");
    const router = useRouter();
    const auth = getAuth();
    const db = getFirestore();

    const estados = [
      { valor: 'sin-iniciar', titulo: 'Sin Iniciar' },
      { valor: 'en-proceso', titulo: 'En Proceso' },
      { valor: 'finalizada', titulo: 'Finalizada' },
    ];

    const fetchTasks = async () => {
      const tasksCollection = collection(db, "tareas");
      const tasksSnapshot = await getDocs(tasksCollection);

      const usuariosCollection = collection(db, "usuarios");
      const usuariosSnapshot = await getDocs(usuariosCollection);

      // Creamos un mapa con userId -> nombre
      const usuariosMap = {};
      usuariosSnapshot.forEach((doc) => {
        usuariosMap[doc.id] = doc.data().name || "Sin nombre";
      });

      // Recorremos tareas y le añadimos el nombre del creador
      const tareasConNombre = tasksSnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          isEditing: false,
          creador: usuariosMap[data.userId] || "Usuario desconocido",
        };
      });

      tasks.value = tareasConNombre;
    };

    const addTask = async () => {
      if (!newTask.value.trim()) return;

      const tasksCollection = collection(db, "tareas");
      const docRef = await addDoc(tasksCollection, {
        text: newTask.value,
        userId: user.value.uid,
        estado: 'sin-iniciar'
      });
      tasks.value.push({ id: docRef.id, text: newTask.value, userId: user.value.uid, estado: 'sin-iniciar', isEditing: false });
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
      fetchTasks();
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

    const filtrarPorEstado = (estado) => {
      return tasks.value.filter(task => task.estado === estado);
    };

    const onDragEnd = async (evt) => {
      const movedTask = evt.item.__draggable_context.element;
      const newEstado = evt.to.parentElement.querySelector('h4').textContent.toLowerCase().replace(' ', '-');
      if (movedTask && newEstado && movedTask.estado !== newEstado) {
        movedTask.estado = newEstado;
        const taskDoc = doc(db, "tareas", movedTask.id);
        await updateDoc(taskDoc, { estado: newEstado });
      }
    };

    onMounted(async () => {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          user.value = currentUser;

          const userDoc = doc(db, "usuarios", currentUser.uid);
          const userSnapshot = await getDoc(userDoc);
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
      estados,
      filtrarPorEstado,
      onDragEnd
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
.list-group {
  min-height: 300px;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 10px;
  background-color: white;
}
</style>
