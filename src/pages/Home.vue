<template>
  <div class="container-inicio">
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
            class="list-group-item d-flex justify-content-between align-items-center"
          >
            <div v-if="!task.isEditing">
              <span>{{ task.text }}</span>
              <button class="btn btn-warning btn-sm ms-2" @click="enableEdit(task)">
                Editar
              </button>
            </div>
            <div v-else>
              <input
                type="text"
                v-model="task.text"
                class="form-control"
              />
              <button class="btn btn-success btn-sm ms-2" @click="saveEdit(task)">
                Guardar
              </button>
              <button class="btn btn-secondary btn-sm ms-2" @click="cancelEdit(task)">
                Cancelar
              </button>
            </div>
            <button class="btn btn-danger btn-sm ms-2" @click="deleteTask(task.id)">
              Eliminar
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
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

      const tasksCollection = collection(db, "tareas");
      const tasksSnapshot = await getDocs(tasksCollection);
      tasks.value = tasksSnapshot.docs
        .filter((doc) => doc.data().userId === user.value.uid)
        .map((doc) => ({
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
    };

    onMounted(() => {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          user.value = currentUser;

          const userDoc = doc(db, "usuarios", currentUser.uid);
          const userSnapshot = await getDocs(userDoc);
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
</style>