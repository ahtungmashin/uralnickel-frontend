<template>
  <div class="edit-page">
    <h2 class="page-title">Управление курсами</h2>

    <!-- Актуальные курсы -->
    <h3 class="section-title">Актуальные курсы</h3>
    <div class="course-list">
      <div v-for="course in currentCourses" :key="course.id" class="course-card">
        <img v-if="course.photo" :src="`${baseURL}${course.photo}`" alt="Course" class="course-image" />
        <input v-model="course.title" class="input" placeholder="Название" />
        <textarea v-model="course.description" class="textarea small" placeholder="Описание"></textarea>
        <input type="number" v-model="course.cost" class="input" placeholder="Стоимость" />
        <input type="date" v-model="course.start_date" class="input" />
        <input type="date" v-model="course.end_date" class="input" />
        <label>Отдел</label>
        <select v-model="course.department" class="input">
          <option disabled value="">Выберите отдел</option>
          <option v-for="dept in departments" :key="dept">{{ dept }}</option>
        </select>
        <input v-model="course.competenciesStr" class="input" placeholder="Компетенции (через запятую)" />
        <input v-model="course.link" class="input" placeholder="Ссылка на курс" />

        <label class="file-label">
          <input type="file" @change="onFileChange($event, course)" class="file-input" />
          Загрузить файл
        </label>
        <span class="file-name">{{ course.file ? course.file.name : 'Файл не выбран' }}</span>

        <div class="btn-group">
          <button @click="updateCourse(course)" class="btn btn-save">Сохранить</button>
          <button @click="deleteCourse(course.id)" class="btn btn-delete">Удалить</button>
        </div>
      </div>
    </div>

    <!-- Устаревшие курсы -->
    <h3 class="section-title">Устаревшие курсы</h3>
    <div class="course-list">
      <div v-for="course in outdatedCourses" :key="course.id" class="course-card">
        <img v-if="course.photo" :src="`${baseURL}${course.photo}`" alt="Course" class="course-image" />
        <input v-model="course.title" class="input" placeholder="Название" />
        <textarea v-model="course.description" class="textarea small" placeholder="Описание"></textarea>
        <input type="number" v-model="course.cost" class="input" placeholder="Стоимость" />
        <input type="date" v-model="course.start_date" class="input" />
        <input type="date" v-model="course.end_date" class="input" />
        <label>Отдел</label>
        <select v-model="course.department" class="input">
          <option disabled value="">Выберите отдел</option>
          <option v-for="dept in departments" :key="dept">{{ dept }}</option>
        </select>
        <input v-model="course.competenciesStr" class="input" placeholder="Компетенции (через запятую)" />
        <input v-model="course.link" class="input" placeholder="Ссылка на курс" />

        <label class="file-label">
          <input type="file" @change="onFileChange($event, course)" class="file-input" />
          Загрузить файл
        </label>
        <span class="file-name">{{ course.file ? course.file.name : 'Файл не выбран' }}</span>

        <div class="btn-group">
          <button @click="updateCourse(course)" class="btn btn-save">Сохранить</button>
          <button @click="deleteCourse(course.id)" class="btn btn-delete">Удалить</button>
        </div>
      </div>
    </div>

    <!-- Добавление нового курса -->
    <div class="new-course">
      <h3>Добавить новый курс</h3>

      <div class="form-grid">
        <input v-model="newCourse.title" placeholder="Название" class="input" />
        <label>Отдел</label>
        <select v-model="newCourse.department" class="input">
          <option disabled value="">Выберите отдел</option>
          <option v-for="dept in departments" :key="dept">{{ dept }}</option>
        </select>

        <textarea
          v-model="newCourse.description"
          placeholder="Описание"
          class="textarea description-tall"
        ></textarea>

        <input v-model="newCourse.competenciesStr" placeholder="Компетенции (через запятую)" class="input" />
        <input type="number" v-model="newCourse.cost" placeholder="Стоимость" class="input" />
        <input v-model="newCourse.link" placeholder="Ссылка на курс" class="input" />

        <div class="input-group">
          <label>Дата начала:</label>
          <input type="date" v-model="newCourse.start_date" class="input" />
        </div>
        <div class="input-group">
          <label>Дата окончания:</label>
          <input type="date" v-model="newCourse.end_date" class="input" />
        </div>
      </div>

      <div class="btn-row">
        <label class="file-label">
          <input type="file" @change="onFileChange($event, newCourse)" class="file-input" />
          Загрузить файл
        </label>
        <span class="file-name">{{ newCourse.file ? newCourse.file.name : 'Файл не выбран' }}</span>
        <div class="add-btn-wrapper">
          <button @click="addCourse" class="btn btn-primary">Добавить курс</button>
        </div>
      </div>
    </div>
  </div>
</template>ы

<script>
export default {
  name: 'EditCourse',
  data() {
    return {
      courses: [],
      departments: [
        'Отдел добычи',
        'Отдел обогащения',
        'Отдел логистики',
        'Отдел технического обслуживания',
        'Бухгалтерия',
        'Отдел геологоразведки',
        'Отдел охраны труда',
        'Отдел кадров',
        'Отдел экологии',
        'Отдел обучения и развития'
      ],
      newCourse: {
        title: '',
        description: '',
        cost: null,
        start_date: '',
        end_date: '',
        department: '',
        competenciesStr: '',
        link: '',
        file: null
      },
      baseURL: 'http://localhost:5000'
    };
  },
  computed: {
    currentCourses() {
      const now = new Date();
      return this.courses.filter(course => {
        if (!course.end_date) return true;
        return new Date(course.end_date) >= now;
      });
    },
    outdatedCourses() {
      const now = new Date();
      return this.courses.filter(course => {
        if (!course.end_date) return false;
        return new Date(course.end_date) < now;
      });
    }
  },
  async created() {
    await this.fetchCourses();
  },
  methods: {
    async fetchCourses() {
      const token = localStorage.getItem('authToken');
      const res = await this.$axios.get('/courses/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      this.courses = res.data.map(course => ({
        ...course,
        competenciesStr: Array.isArray(course.competencies)
          ? course.competencies.join(', ')
          : JSON.parse(course.competencies || '[]').join(', '),
        file: null
      }));
    },
    onFileChange(event, course) {
      course.file = event.target.files[0];
    },
    async updateCourse(course) {
      const formData = new FormData();
      formData.append('title', course.title);
      formData.append('description', course.description);
      formData.append('cost', course.cost);
      formData.append('start_date', course.start_date || '');
      formData.append('end_date', course.end_date || '');
      formData.append('department', course.department || '');
      formData.append('competencies', JSON.stringify(course.competenciesStr.split(',').map(s => s.trim())));
      formData.append('link', course.link || '');
      if (course.file) formData.append('photo', course.file);

      const token = localStorage.getItem('authToken');
      await this.$axios.put(`/courses/${course.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Курс обновлён!');
      await this.fetchCourses();
    },
    async deleteCourse(id) {
      const token = localStorage.getItem('authToken');
      await this.$axios.delete(`/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      this.courses = this.courses.filter(c => c.id !== id);
    },
    async addCourse() {
      const formData = new FormData();
      formData.append('title', this.newCourse.title);
      formData.append('description', this.newCourse.description);
      formData.append('cost', this.newCourse.cost);
      formData.append('start_date', this.newCourse.start_date || '');
      formData.append('end_date', this.newCourse.end_date || '');
      formData.append('department', this.newCourse.department || '');
      formData.append('competencies', JSON.stringify(this.newCourse.competenciesStr.split(',').map(s => s.trim())));
      formData.append('link', this.newCourse.link || '');
      if (this.newCourse.file) formData.append('photo', this.newCourse.file);

      const token = localStorage.getItem('authToken');
      const res = await this.$axios.post('/courses', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      this.courses.push({
        ...res.data,
        competenciesStr: JSON.parse(res.data.competencies || '[]').join(', '),
        file: null
      });

      this.newCourse = {
        title: '',
        description: '',
        cost: null,
        start_date: '',
        end_date: '',
        department: '',
        competenciesStr: '',
        link: '',
        file: null
      };

      alert('Курс добавлен!');
    }
  }
};
</script>


<style scoped>

.add-btn-wrapper {
  margin-left: auto;
}
.section-title {
  font-size: 22px;
  font-weight: 600;
  color: #1e3a8a;
  margin: 24px 0;
  text-align: center; /* ✅ Центрируем текст */
}
.edit-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Inter', sans-serif;
}
.page-title {
  font-size: 30px;
  font-weight: 700;
  margin-bottom: 30px;
  color: #111827;
  text-align: center;
}
.course-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.course-card {
  width: 700px;
  margin: 0 auto;
  background: #ffffff;
  padding: 20px;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.course-image {
  width: 100%;
  height: 320px;
  object-fit: cover;
  border-radius: 10px;
}
.input,
.textarea {
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  width: 100%;
}
.textarea.small {
  min-height: 140px;
  resize: vertical;
}
.new-course {
  margin-top: 60px;
  width: 700px;
  margin-left: auto;
  margin-right: auto;
  padding: 30px;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.new-course h3 {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #111827;
  text-align: center;
}
.new-course .input-group,
.new-course .form-grid input,
.new-course .form-grid textarea {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.textarea.description-tall {
  min-height: 160px;
  resize: vertical;
}
.input-group label,
.file-label {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}
.btn-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
}
.file-label {
  width: 165px;
  height: 48px;
  background: linear-gradient(to right, #64748b, #475569);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}
.file-label:hover {
  background: linear-gradient(to right, #475569, #334155);
}
.file-input {
  display: none;
}
.file-name {
  font-size: 13px;
  color: #555;
}
.btn-group {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
.btn {
  padding: 8px 16px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s ease;
}
.btn-save {
  background: linear-gradient(to right, #22c55e, #16a34a);
  color: white;
}
.btn-save:hover {
  background: linear-gradient(to right, #16a34a, #15803d);
}
.btn-delete {
  background: linear-gradient(to right, #ef4444, #dc2626);
  color: white;
}
.btn-delete:hover {
  background: linear-gradient(to right, #dc2626, #b91c1c);
}
.btn-primary {
  background: linear-gradient(to right, #2563eb, #1d4ed8);
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s ease;
}
.btn-primary:hover {
  background: linear-gradient(to right, #1e40af, #1d4ed8);
}
</style>
