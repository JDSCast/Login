<template>
    <div class="container-inicio gradient-custom">
      <div class="card card-inicio">
        <div class="card-body card-body-inicio">
          <h2 class="text-center">CRUD TAREAS</h2>
          <p>Organiza tus tareas del día a día de forma simple y rápida.</p>
          <div class="d-grid gap-2">
            <button class="btn btn-success" @click="$router.push('/login')">Logearse</button>
            <button class="btn btn-warning" @click="$router.push('/register')">Registrarse</button>
          </div>
        </div>
      </div>
    </div>
</template>
<style scoped>
    @import "../styles/home.css";
    .gradient-custom {
  background: linear-gradient(135deg, #000000 0%, #6a0dad 100%);
  min-height: 100vh;
}
</style>