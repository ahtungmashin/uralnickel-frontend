<script>
import axios from 'axios';
import { useToast } from 'vue-toastification';

export default {
  name: 'ManagerRequestsView',
  data() {
    return {
      courseRequests: [],
      projectRequests: [],
      certificates: [],
      courses: [],
      selectedCourses: {}, // ключ — cert.id, значение — course.id
      baseURL: import.meta.env.VITE_API_URL.replace('/api', ''),
      toast: useToast()
    };
  },
  methods: {
    async fetchAll() {
      try {
        const [courseRes, projectRes, certRes, allCoursesRes] = await Promise.all([
          axios.get('/requests'),
          axios.get('/project-requests'),
          axios.get('/certificates'),
          axios.get('/courses')
        ]);

        this.courseRequests = courseRes.data;
        this.projectRequests = projectRes.data;
        this.certificates = certRes.data.filter(c => !c.is_verified);
        this.courses = allCoursesRes.data;
      } catch (err) {
        console.error('Ошибка при загрузке заявок:', err);
        this.toast.error('Ошибка при загрузке данных');
      }
    },
    async approveCourse(id) {
      try {
        await axios.patch(`/requests/${id}/approve`);
        this.toast.success('Заявка на курс подтверждена ✅');
        this.fetchAll();
      } catch {
        this.toast.error('Ошибка при подтверждении заявки на курс');
      }
    },
    async rejectCourse(id) {
      try {
        await axios.patch(`/requests/${id}/reject`);
        this.toast.warning('Заявка на курс отклонена ❌');
        this.fetchAll();
      } catch {
        this.toast.error('Ошибка при отклонении заявки на курс');
      }
    },
    async approveProject(id) {
      try {
        await axios.patch(`/project-requests/${id}/approve`);
        this.toast.success('Заявка на проект подтверждена ✅');
        this.fetchAll();
      } catch {
        this.toast.error('Ошибка при подтверждении заявки на проект');
      }
    },
    async rejectProject(id) {
      try {
        await axios.patch(`/project-requests/${id}/reject`);
        this.toast.warning('Заявка на проект отклонена ❌');
        this.fetchAll();
      } catch {
        this.toast.error('Ошибка при отклонении заявки на проект');
      }
    },
    async verifyCertificate(cert) {
      const courseId = this.selectedCourses[cert.id];
      if (!courseId) {
        return this.toast.warning('Выберите курс для подтверждения сертификата');
      }

      try {
        await axios.patch(`/certificates/${cert.id}/verify`, {
          course_id: courseId
        });
        this.toast.success('Сертификат подтверждён ✅');
        this.fetchAll();
      } catch {
        this.toast.error('Ошибка при подтверждении сертификата');
      }
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    },
    translateStatus(status) {
      return {
        pending: '⏳ На рассмотрении',
        approved: '✅ Подтверждена',
        rejected: '❌ Отклонена'
      }[status] || '—';
    }
  },
  mounted() {
    this.fetchAll();
  }
};
</script>

<template>
  <div class="manager-page">
    <h1>Заявки сотрудников</h1>

    <!-- КУРСЫ -->
    <section class="section-block">
      <h2>📚 Заявки на курсы</h2>
      <div v-if="courseRequests.length">
        <div
          v-for="req in courseRequests"
          :key="'course-' + req.id"
          class="request-card"
          :class="req.status"
        >
          <div class="info">
            <p><strong>👤 Сотрудник:</strong> {{ req.user?.name || '—' }}</p>
            <p><strong>📘 Курс:</strong> {{ req.course?.title || '—' }}</p>
            <p><strong>📌 Статус:</strong> {{ translateStatus(req.status) }}</p>
          </div>
          <div class="actions" v-if="req.status === 'pending'">
            <button class="btn btn-approve" @click="approveCourse(req.id)">✅ Подтвердить</button>
            <button class="btn btn-reject" @click="rejectCourse(req.id)">❌ Отклонить</button>
          </div>
        </div>
      </div>
      <div v-else><p>Нет заявок на курсы.</p></div>
    </section>

    <!-- ПРОЕКТЫ -->
    <section class="section-block">
      <h2>🛠️ Заявки на проекты</h2>
      <div v-if="projectRequests.length">
        <div
          v-for="req in projectRequests"
          :key="'project-' + req.id"
          class="request-card"
          :class="req.status"
        >
          <div class="info">
            <p><strong>👤 Сотрудник:</strong> {{ req.user?.name || '—' }}</p>
            <p><strong>📁 Проект:</strong> {{ req.project?.title || '—' }}</p>
            <p><strong>📌 Статус:</strong> {{ translateStatus(req.status) }}</p>
          </div>
          <div class="actions" v-if="req.status === 'pending'">
            <button class="btn btn-approve" @click="approveProject(req.id)">✅ Подтвердить</button>
            <button class="btn btn-reject" @click="rejectProject(req.id)">❌ Отклонить</button>
          </div>
        </div>
      </div>
      <div v-else><p>Нет заявок на проекты.</p></div>
    </section>

    <!-- СЕРТИФИКАТЫ -->
    <section class="section-block">
      <h2>📄 Сертификаты на проверку</h2>
      <div v-if="certificates.length">
        <div
          v-for="cert in certificates"
          :key="'cert-' + cert.id"
          class="request-card pending"
        >
          <div class="info">
            <p><strong>👤 Сотрудник:</strong> {{ cert.user?.name || '—' }}</p>
            <p><strong>📄 Файл:</strong>
              <a
                :href="baseURL + cert.file_path"
                target="_blank"
                rel="noopener"
                class="file-link"
              >Открыть PDF</a>
            </p>
            <p><strong>📅 Загружено:</strong> {{ formatDate(cert.createdAt) }}</p>

            <!-- Выбор курса -->
            <select v-model="selectedCourses[cert.id]" class="select-course">
              <option disabled value="">Выберите курс</option>
              <option v-for="course in courses" :key="course.id" :value="course.id">
                {{ course.title }}
              </option>
            </select>
          </div>
          <div class="actions">
            <button class="btn btn-approve" @click="verifyCertificate(cert)">✅ Подтвердить</button>
          </div>
        </div>
      </div>
      <div v-else><p>Нет загруженных сертификатов.</p></div>
    </section>
  </div>
</template>

<style scoped>
.select-course {
  margin-top: 10px;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #1e293b;
  width: 100%;
  max-width: 250px;
}

.manager-page {
  max-width: 850px;
  margin: 40px auto;
  font-family: 'Inter', sans-serif;
  color: #1e293b;
}

.section-block {
  margin-bottom: 50px;
}

.request-card {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-left: 5px solid #3b82f6;
  transition: all 0.3s ease;
}

.request-card.approved {
  border-left-color: #10b981;
  background: #f0fdf4;
}
.request-card.rejected {
  border-left-color: #ef4444;
  background: #fef2f2;
}
.request-card.pending {
  border-left-color: #facc15;
  background: #fefce8;
}

.info p {
  margin: 6px 0;
  font-size: 15px;
}

.actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 16px;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-approve {
  background: #10b981;
  color: white;
}
.btn-approve:hover {
  background: #059669;
}

.btn-reject {
  background: #ef4444;
  color: white;
}
.btn-reject:hover {
  background: #dc2626;
}

.file-link {
  color: #2563eb;
  text-decoration: underline;
  font-weight: 500;
  font-size: 14px;
}
</style>
