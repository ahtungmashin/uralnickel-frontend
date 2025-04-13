<template>
  <button @click="logout" class="btn btn-outline-danger">Выйти</button>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();

function logout() {
  localStorage.removeItem('authToken');
  router.push('/login');
}
</script>
