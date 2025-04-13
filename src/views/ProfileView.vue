<template>
  <div class="profile-page">
    <h2 class="profile-title">Личный кабинет</h2>

    <div v-if="user" class="profile-wrapper">
      <!-- Фото профиля -->
      <div class="profile-photo">
        <img
          v-if="user.photo"
          :src="user.photo.startsWith('/uploads/') ? `${baseURL}${user.photo}?${Date.now()}` : user.photo"
          alt="Фото профиля"
          class="photo"
        />
      </div>

      <div class="profile-card">
        <h3 class="welcome">Добро пожаловать, {{ user.name }}!</h3>

        <!-- Основная информация -->
        <div class="info-grid">
          <div class="info-box" v-for="(label, key) in fields" :key="key">
            <div class="label">{{ label }}</div>
            <div class="value">
              {{ key === 'birthdate' ? formatDate(user[key]) : key === 'gender' ? formatGender(user[key]) : user[key] || 'Не указано' }}
            </div>
          </div>
        </div>

        <!-- Компетенции -->
        <div class="skills-box">
          <div class="label">Компетенции</div>
          <div class="skills-tags">
            <span v-for="(comp, i) in parsedCompetencies" :key="i" class="tag">{{ comp }}</span>
          </div>
        </div>

        <!-- Загрузка файлов -->
        <div class="actions-group">
          <!-- Фото -->
          <div class="button-pair">
            <div class="dropzone" @click="triggerPhotoInput" @dragover.prevent @drop.prevent="onDropPhoto">
              <div v-if="previewPhoto">
                <img :src="previewPhoto" class="photo-preview" />
              </div>
              <div v-else class="dropzone-label">📷 Перетащите фото или кликните</div>
              <input ref="photoInput" type="file" accept="image/*" class="file-input" @change="selectPhoto" />
            </div>
            <button v-if="selectedPhotoFile" class="btn-confirm" @click="uploadPhoto">Загрузить фото</button>
          </div>

          <!-- Сертификат -->
          <div class="button-pair" v-if="user.role !== 'manager' && user.role !== 'admin'">
            <div class="dropzone" @click="triggerCertInput" @dragover.prevent @drop.prevent="onDropCertificate">
              <div class="dropzone-label">📄 Перетащите PDF или кликните</div>
              <div v-if="certificateName" class="file-name">Файл: {{ certificateName }}</div>
              <input ref="certInput" type="file" accept="application/pdf" class="file-input" @change="selectCertificate" />
            </div>
            <button v-if="selectedCertificateFile" class="btn-confirm" @click="uploadCertificate">Отправить сертификат</button>
          </div>
        </div>

        <!-- Выход -->
        <div class="logout-wrapper">
          <button class="btn-logout" @click="logout">Выйти из аккаунта</button>
        </div>
      </div>
    </div>

    <div v-else class="login-prompt">
      <p>Пожалуйста, войдите в систему.</p>
    </div>
  </div>
</template>

<script>
import { useToast } from 'vue-toastification';
import { useNotificationStore } from '@/stores/notificationStore';
import { stopNotificationWatcher } from '@/utils/notificationWatcher';

export default {
  name: 'ProfileView',
  data() {
    return {
      user: null,
      previewPhoto: null,
      selectedPhotoFile: null,
      selectedCertificateFile: null,
      certificateName: '',
      availableCourses: [],
      baseURL: 'http://localhost:5000',
      fields: {
        department: 'Отдел',
        position: 'Должность',
        birthdate: 'Дата рождения',
        gender: 'Пол',
        experience: 'Стаж работы'
      }
    };
  },
  computed: {
    parsedCompetencies() {
      const data = this.user?.competencies || [];
      if (Array.isArray(data)) return data;
      try {
        return JSON.parse(data);
      } catch {
        return [];
      }
    }
  },
  async created() {
    await this.loadUser();
  },
  methods: {
    use() {
      return useToast();
    },
    async loadUser() {
      try {
        const res = await this.$api.get('/users/me', { __skipGlobalToast: true });
        this.user = res.data;
      } catch {
        this.use().error('Ошибка загрузки профиля');
      }
    },
    async fetchApprovedCourses() {
      try {
        const res = await this.$api.get('/requests/my', { __skipGlobalToast: true });
        const approved = res.data.filter(r => r.status === 'approved');
        const unique = new Map(approved.map(r => [r.course?.id, r.course]));
        this.availableCourses = [...unique.values()].filter(Boolean);
      } catch {
        this.use().error('Ошибка загрузки курсов');
      }
    },
    triggerPhotoInput() {
      this.$refs.photoInput.click();
    },
    triggerCertInput() {
      this.$refs.certInput.click();
    },
    selectPhoto(e) {
      const file = e.target.files[0];
      if (!file?.type.startsWith('image/')) return;
      this.previewPhoto = URL.createObjectURL(file);
      this.selectedPhotoFile = file;
    },
    async uploadPhoto() {
      const toast = this.use();
      const formData = new FormData();
      formData.append('photo', this.selectedPhotoFile);
      try {
        const res = await this.$api.post('/users/photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        this.user.photo = res.data.photo;
        toast.success('Фото загружено');
        this.selectedPhotoFile = null;
        this.previewPhoto = null; // ❗️ Удаляем предпросмотр
      } catch {
        toast.error('Ошибка загрузки фото');
      }
    },
    onDropPhoto(e) {
      const file = e.dataTransfer.files[0];
      if (!file?.type.startsWith('image/')) return;
      this.previewPhoto = URL.createObjectURL(file);
      this.selectedPhotoFile = file;
    },
    selectCertificate(e) {
      const file = e.target.files[0];
      if (!file || file.type !== 'application/pdf') return;
      this.selectedCertificateFile = file;
      this.certificateName = file.name;
    },
    onDropCertificate(e) {
      const file = e.dataTransfer.files[0];
      if (!file || file.type !== 'application/pdf') return;
      this.selectedCertificateFile = file;
      this.certificateName = file.name;
    },
    async uploadCertificate() {
      const toast = this.use();
      const formData = new FormData();
      formData.append('certificate', this.selectedCertificateFile);
      try {
        await this.$api.post('/certificates', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Сертификат загружен');
        this.selectedCertificateFile = null;
        this.certificateName = '';
      } catch {
        toast.error('Ошибка при загрузке сертификата');
      }
    },
    formatGender(gender) {
      return { male: 'Мужской', female: 'Женский' }[gender] || 'Не указано';
    },
    formatDate(dateStr) {
      return dateStr
        ? new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : 'Не указано';
    },
    logout() {
      stopNotificationWatcher(); // Остановить вотчер
      const store = useNotificationStore(); // Вынести сюда
      store.$reset();                      // Очистить store

      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

      this.$router.push('/login');        // Редирект
    }
  }
};
</script>


<style scoped>
/* Общая страница */
.profile-page {
  padding: 40px 20px;
  max-width: 900px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
  color: #1e293b;
}

.profile-title {
  font-size: 32px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 40px;
  color: #1e3a8a;
}

.profile-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

/* Фото пользователя */
.profile-photo .photo {
  width: 175px;
  height: 175px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #e0e7ff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.photo-preview {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #cbd5e1;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 6px;
}

/* Карточка */
.profile-card {
  background: white;
  padding: 30px;
  border-radius: 14px;
  width: 100%;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
}

.welcome {
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  color: #1d4ed8;
  margin-bottom: 20px;
}

/* Информация */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-box .label {
  font-weight: 600;
  font-size: 14px;
  color: #475569;
}

.info-box .value {
  background: #e0e7ff;
  color: #1e3a8a;
  padding: 6px 12px;
  font-size: 14px;
  border-radius: 8px;
  margin-top: 4px;
}

/* Компетенции */
.skills-box {
  margin-top: 20px;
}

.skills-box .label {
  font-weight: 600;
  font-size: 14px;
  color: #475569;
  margin-bottom: 6px;
}

.skills-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  background: #e0e7ff;
  color: #1e3a8a;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 500;
}

/* Загрузка файлов */
.actions-group {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 40px;
  justify-content: center;
  align-items: flex-start;
}

.button-pair {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

/* Dropzone */
.dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  background: #f8fafc;
  position: relative;
  width: 250px;
  transition: background 0.2s ease;
}

.dropzone:hover {
  background: #f1f5f9;
}

.dropzone-label {
  color: #475569;
  font-size: 14px;
  font-weight: 500;
}

.file-input {
  display: none;
}

.file-name {
  margin-top: 6px;
  font-size: 13px;
  color: #334155;
}

/* Кнопка подтверждения */
.btn-confirm {
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-confirm:hover {
  background: #1d4ed8;
}

/* Селект */
.select-course {
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #1e293b;
  width: 250px;
}

/* Выход */
.logout-wrapper {
  margin-top: 30px;
  text-align: center;
}

.btn-logout {
  padding: 12px 24px;
  font-size: 15px;
  background: linear-gradient(to right, #dc2626, #b91c1c);
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-logout:hover {
  background: linear-gradient(to right, #b91c1c, #991b1b);
}

.login-prompt {
  text-align: center;
  font-size: 18px;
  color: #555;
  margin-top: 60px;
}
</style>
