<template>
  <div class="courses-page">
    <div class="courses-header">
      <h1>Каталог курсов</h1>
      <p class="subtext">Обучающие программы, которые помогут вам прокачать компетенции и продвинуться по карьерной лестнице.</p>

      <div v-if="isAdmin" class="admin-tools">
        <router-link to="/admin/courses" class="btn-manage-news">Управление курсами</router-link>
      </div>
    </div>

    <div class="courses-section">
      <div class="course-list">
        <div v-for="course in visibleCourses" :key="course.id" class="course-card">
          <div class="card-header">
          <div class="header-left">
            <h3 class="course-title">{{ course.title }}</h3>
            <div class="date-range">
              <span class="date-label">📅</span>
              <span class="date-value">
                <template v-if="course.start_date || course.end_date">
                  {{ formatDate(course.start_date) }} – {{ formatDate(course.end_date) }}
                </template>
                <template v-else>
                  Бессрочно
                </template>
              </span>
            </div>
          </div>
          <span class="badge-new">💼 Обучение</span>
          </div>


          <div v-if="course.photo" class="course-image-wrapper">
            <img :src="`${baseURL}${course.photo}`" class="course-image" />
          </div>

          <div class="competency-block">
            <h6 class="competency-title">Компетенции:</h6>
            <div class="competency-tags">
              <span
                v-for="(tag, index) in parseCompetencies(course.competencies)"
                :key="index"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn-details" @click="goToCourse(course.id)">Подробнее</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CoursesView',
  data() {
    return {
      courses: [],
      baseURL: import.meta.env.VITE_API_URL.replace('/api', ''),
      isAdmin: false,
    };
  },
  computed: {
    visibleCourses() {
      const now = new Date();
      return this.courses.filter(course => {
        if (!course.end_date) return true; // бессрочный курс
        return new Date(course.end_date) >= now;
      });
    }
  },
  async created() {
    try {
      const token = localStorage.getItem('authToken');
      const user = JSON.parse(localStorage.getItem('user'));
      this.isAdmin = user?.role === 'admin';

      const res = await this.$axios.get('/courses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      this.courses = res.data;
    } catch (error) {
      console.error('Ошибка загрузки курсов:', error);
    }
  },
  methods: {
  goToCourse(id) {
    this.$router.push(`/courses/${id}`);
  },
  parseCompetencies(raw) {
    try {
      const parsed = Array.isArray(raw) ? raw : JSON.parse(raw || '[]');
      return parsed;
    } catch {
      return [];
    }
  },
  formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }
}
};
</script>

<style scoped>
.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.date-range {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #334155;
  gap: 6px;
}
.date-label {
  font-weight: bold;
}
.date-value {
  font-weight: 500;
}
.courses-page {
  max-width: 850px;
  margin: 40px auto;
  padding: 0 20px;
  font-family: 'Inter', sans-serif;
  color: #1e293b;
}

.courses-header {
  text-align: center;
  margin-bottom: 40px;
}

.subtext {
  font-size: 17px;
  color: #4b5563;
  margin-top: 12px;
}

.admin-tools {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.btn-manage-news {
  background: linear-gradient(to right, #facc15, #eab308);
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  color: #111827;
  text-decoration: none;
  border: none;
  box-shadow: 0 3px 6px rgba(0,0,0,0.1);
  transition: background 0.2s ease;
}
.btn-manage-news:hover {
  background: linear-gradient(to right, #eab308, #ca8a04);
}

.courses-section {
  background: #f9fafb;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.course-card {
  background: white;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  border-left: 5px solid #facc15;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.course-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  border-color: #eab308;
  background-color: #fff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.course-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}
.badge-new {
  background: #ffedd5;
  color: #b45309;
  padding: 4px 10px;
  font-size: 13px;
  border-radius: 10px;
  font-weight: 600;
}

.course-image-wrapper {
  width: 100%;
  overflow: hidden;
  border-radius: 10px;
  max-height: 400px;
}

.course-image {
  width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
  border-radius: 8px;
}

.competency-block {
  margin-top: 10px;
}
.competency-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 6px;
}
.competency-tags {
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
  white-space: nowrap;
}

.card-footer {
  margin-top: auto;
  text-align: right;
}
.btn-details {
  padding: 8px 16px;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
}
.btn-details:hover {
  background: #2563eb;
}
</style>


