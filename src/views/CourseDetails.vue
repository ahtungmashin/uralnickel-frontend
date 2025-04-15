<template>
  <div class="course-details-page" v-if="course">
    <!-- 1. Заголовок -->
    <div class="course-title-wrapper">
      <h1 class="title">{{ course.title }}</h1>
    </div>

    <!-- 2. Основной контент: фотография + карточки -->
    <div class="hero-content">
      <div class="hero-image-wrapper">
        <img
          v-if="course.photo"
          :src="`${baseURL}${course.photo}`"
          alt="Course Photo"
          class="hero-image"
        />
      </div>

      <div class="hero-info">
        <div class="meta-grid">
          <div class="meta-box">
            <div class="meta-label">Отдел:</div>
            <div class="meta-value-box">{{ course.department || '—' }}</div>
          </div>
          <div class="meta-box">
            <div class="meta-label">Стоимость:</div>
            <div class="meta-value-box">{{ course.cost }} руб.</div>
          </div>
          <div class="meta-box">
            <div class="meta-label">Даты:</div>
            <div class="meta-value-box">
              {{ formatDate(course.start_date) }} – {{ formatDate(course.end_date) }}
            </div>
          </div>
          <div class="meta-box">
            <div class="meta-label">Компетенции:</div>
            <div class="meta-value-tags">
              <span v-for="(tag, i) in parsedCompetencies" :key="i" class="tag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Кнопка записи -->
    <div class="enroll-wrapper">
      <button @click="enroll" class="btn-enroll">Записаться на курс</button>
    </div>

    <!-- 4. Подробное описание -->
    <div class="description-block">
      <div class="section description-section">
        <h2>Подробное описание</h2>
        <p>{{ course.description }}</p>
      </div>
    </div>
  </div>

  <!-- Пока курс не загружен -->
  <div v-else class="description-block">
    <p>Загрузка данных курса...</p>
  </div>
</template>

<script>
export default {
  name: 'CourseDetails',
  data() {
    return {
      course: null,
      baseURL: import.meta.env.VITE_API_URL.replace('/api', '')
    };
  },
  computed: {
    parsedCompetencies() {
      const data = this.course?.competencies || [];
      if (Array.isArray(data)) return data;
      try {
        return JSON.parse(data);
      } catch {
        return [];
      }
    }
  },
  async created() {
    const courseId = this.$route.params.id;
    try {
      const token = localStorage.getItem('authToken');
      const res = await this.$api.get(`/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      this.course = res.data.find(c => c.id === parseInt(courseId));
    } catch (err) {
      console.error('Ошибка загрузки курса:', err);
    }
  },
  methods: {
  formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  },
  async enroll() {
    try {
      const token = localStorage.getItem('authToken');
      const res = await this.$api.post(
        `/courses/${this.course.id}/apply`,
        { title: this.course.title }, // для уведомлений
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert(res.data.message); // Успешно
    } catch (error) {
      if (error.response?.status === 400) {
        alert(error.response.data.message); // Уже подана заявка
      } else {
        console.error('Ошибка при записи на курс:', error);
        alert('Произошла ошибка при подаче заявки');
      }
    }
  }
}
};
</script>
  
  <style scoped>
  .course-details-page {
    padding: 30px 0;
    font-family: 'Inter', sans-serif;
    color: #1e293b;
    background: #f0f4ff;
  }
  
  /* Заголовок */
  .title {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 30px;
    text-align: center;
    color: #111827;
  }
  
  /* Hero Section */
  .hero-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 40px;
    flex-wrap: nowrap;
    max-width: 1100px;
    margin: 0 auto;
    padding-top: 20px;
  }
  
  .hero-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 1;
    min-width: 300px;
  }
  
  .hero-image-wrapper {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    margin-right: 30px;
  }
  .hero-image {
    width: 360px;
    height: 240px;
    object-fit: cover;
    border-radius: 14px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  .meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
  }
  
  .meta-box {
    background: #ffffff;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .meta-label {
    font-weight: 700;
    font-size: 15px;
    color: #1e293b;
  }
  
  .meta-value-box {
    background: #e0e7ff;
    color: #1e3a8a;
    padding: 8px 14px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
  }
  
  .meta-value-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tag {
    background: #e0e7ff;
    color: #1e3a8a;
    font-size: 14px;
    padding: 4px 10px;
    border-radius: 14px;
    font-weight: 500;
    white-space: nowrap;
  }
  /* Кнопка */
  .enroll-wrapper {
  display: flex;
  justify-content: right; /* по центру */
  margin: 30px auto 0;
  max-width: 1100px; /* растягивается на всю ширину */
  }
  
  .btn-enroll {
    display: block;
    padding: 14px 28px;
    font-size: 17px;
    font-weight: 600;
    background: linear-gradient(to right, #f97316, #ea580c);
    border: none;
    color: white;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .btn-enroll:hover {
    background: linear-gradient(to right, #ea580c, #c2410c);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }
  
  /* Описание курса */
  .description-block {
    background: #ffffff;
    margin: 50px auto;
    max-width: 1000px;
    border-radius: 12px;
    padding: 40px 30px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }
  
  .description-section h2 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 18px;
  }
  .description-section p {
    font-size: 17px;
    line-height: 1.7;
    color: #334155;
    text-align: justify;
  }
  </style>
  