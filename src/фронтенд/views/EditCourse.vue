<template>
  <div class="news-admin">
    <h2 class="title">Управление курсами</h2>

    <!-- Добавление / редактирование курса -->
    <form @submit.prevent="submitCourse" class="news-form">
      <div class="form-grid">
        <input v-model="newCourse.title" placeholder="Название" class="input" required />
        <input v-model="newCourse.cost" type="number" placeholder="Стоимость" class="input" />
        <input type="date" v-model="newCourse.start_date" class="input" />
        <input type="date" v-model="newCourse.end_date" class="input" />

        <!-- Множественный выбор отделов -->
        <div>
          <div class="inline">
            <select v-model="selectedDepartment" class="input">
              <option disabled value="">Выберите отдел</option>
              <option v-for="dept in departments" :key="dept">{{ dept }}</option>
            </select>
            <button type="button" @click="addDepartment" class="btn-add">Добавить</button>
          </div>
          <ul class="mini-list">
            <li v-for="dept in newCourse.departments" :key="dept">
              {{ dept }} <span @click="removeDepartment(dept)">✖</span>
            </li>
          </ul>
        </div>

        <input v-model="newCourse.competenciesStr" class="input" placeholder="Компетенции (через запятую)" />
        <input v-model="newCourse.link" class="input" placeholder="Ссылка на курс" />
        <textarea v-model="newCourse.description" placeholder="Описание" class="textarea"></textarea>
        <label class="file-label">
          <input type="file" @change="onFileChange($event)" class="file-input" accept="image/*" />
          Загрузить изображение
        </label>
        <span class="file-name">{{ image?.name || 'Файл не выбран' }}</span>
      </div>

      <img v-if="preview" :src="preview" alt="preview" class="preview-image" />

      <div class="button-group">
        <button type="submit" class="btn btn-primary">
          {{ newCourse.id ? 'Сохранить изменения' : 'Добавить курс' }}
        </button>
        <button v-if="newCourse.id" @click="resetForm" class="btn btn-secondary">Отмена</button>
      </div>
    </form>

    <!-- Актуальные курсы -->
    <h3 class="section-title">Актуальные курсы</h3>
    <div class="news-list">
      <div
        v-for="course in currentCourses"
        :key="course.id"
        class="news-item"
      >
        <div class="header">
          <h3>{{ course.title }}</h3>
          <small>{{ formatDate(course.start_date) }} — {{ formatDate(course.end_date) }}</small>
        </div>
        <img v-if="course.photo" :src="`${baseURL}${course.photo}`" alt="Course" />
        <div class="description">{{ course.description }}</div>
        <button @click="editCourse(course)" class="btn-edit">Редактировать</button>
        <button @click="confirmDelete(course)" class="btn-delete">Удалить</button>
      </div>
    </div>

    <!-- Устаревшие курсы -->
    <h3 class="section-title">Курс уже стартовал</h3>
    <div class="news-list">
      <div
        v-for="course in outdatedCourses"
        :key="course.id"
        class="news-item"
      >
        <div class="header">
          <h3>{{ course.title }}</h3>
          <small>{{ formatDate(course.start_date) }} — {{ formatDate(course.end_date) }}</small>
        </div>
        <img v-if="course.photo" :src="`${baseURL}${course.photo}`" alt="Course" />
        <div class="description">{{ course.description }}</div>
        <button @click="editCourse(course)" class="btn-edit">Редактировать</button>
        <button @click="confirmDelete(course)" class="btn-delete">Удалить</button>
      </div>
    </div>

    <!-- Модалка удаления -->
    <div class="modal fade" id="deleteModal" tabindex="-1" ref="deleteModal">
      <div class="modal-dialog">
        <div class="modal-content p-3">
          <h5 class="modal-title">Подтверждение удаления</h5>
          <p class="mt-2">Удалить курс «<strong>{{ toDelete?.title }}</strong>»?</p>
          <div class="d-flex justify-content-end gap-2 mt-3">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
            <button class="btn btn-danger" @click="performDelete">Удалить</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useToast } from 'vue-toastification';
import { Modal } from 'bootstrap';

export default {
  data() {
    return {
      courses: [],
      newCourse: {
        id: null,
        title: '',
        description: '',
        cost: null,
        start_date: '',
        end_date: '',
        departments: [],
        competenciesStr: '',
        link: ''
      },
      selectedDepartment: '',
      image: null,
      preview: null,
      toDelete: null,
      baseURL: import.meta.env.VITE_API_URL.replace('/api', ''),
      toast: null,
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
      ]
    };
  },
  computed: {
    currentCourses() {
      const now = new Date();
      return this.courses
        .filter(course => new Date(course.start_date) > now)
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    },
    outdatedCourses() {
      const now = new Date();
      return this.courses
        .filter(course => new Date(course.start_date) <= now)
        .sort((a, b) => new Date(b.start_date) - new Date(b.start_date)); // если хочешь сортировку от самых новых
    }
  },
  async mounted() {
    this.toast = useToast();
    await this.fetchCourses();
  },
  methods: {
    formatDate(date) {
      return date ? new Date(date).toLocaleDateString() : '—';
    },
    onFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        this.toast.warning('Выберите изображение');
        return;
      }
      this.image = file;
      this.preview = URL.createObjectURL(file);
    },
    async fetchCourses() {
      try {
        const token = localStorage.getItem('authToken');
        const res = await this.$api.get('/courses/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.courses = res.data.map(c => ({
          ...c,
          departments: Array.isArray(c.departments)
            ? c.departments
            : JSON.parse(c.departments || '[]'),
          competenciesStr: Array.isArray(c.competencies)
            ? c.competencies.join(', ')
            : JSON.parse(c.competencies || '[]').join(', ')
        }));
      } catch {
        this.toast.error('Ошибка загрузки курсов');
      }
    },
    resetForm() {
      this.newCourse = {
        id: null,
        title: '',
        description: '',
        cost: null,
        start_date: '',
        end_date: '',
        departments: [],
        competenciesStr: '',
        link: ''
      };
      this.selectedDepartment = '';
      this.image = null;
      this.preview = null;
    },
    async submitCourse() {
      const isEdit = !!this.newCourse.id;
      const formData = new FormData();

      formData.append('title', this.newCourse.title);
      formData.append('description', this.newCourse.description);
      formData.append('cost', this.newCourse.cost);
      formData.append('start_date', this.newCourse.start_date || '');
      formData.append('end_date', this.newCourse.end_date || '');
      formData.append('departments', JSON.stringify(this.newCourse.departments || []));
      formData.append('competencies', JSON.stringify(this.newCourse.competenciesStr.split(',').map(s => s.trim())));
      formData.append('link', this.newCourse.link || '');
      if (this.image) formData.append('photo', this.image);

      try {
        const token = localStorage.getItem('authToken');
        if (isEdit) {
          await this.$api.put(`/courses/${this.newCourse.id}`, formData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          this.toast.success('Курс обновлён ✅');
        } else {
          const res = await this.$api.post('/courses', formData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          this.toast.success('Курс добавлен ✅');
        }
        this.resetForm();
      } catch (err) {
        this.toast.error(err?.response?.data?.message || 'Ошибка при сохранении');
        return; // прерываем, если была ошибка
      }

      // 🔄 Загружаем свежий список курсов отдельно
      try {
        await this.fetchCourses();
      } catch {
        this.toast.warning('Курс добавлен, но возникла ошибка при обновлении списка');
      }
    },
    editCourse(course) {
      this.newCourse = {
        id: course.id,
        title: course.title,
        description: course.description,
        cost: course.cost,
        start_date: course.start_date,
        end_date: course.end_date,
        departments: Array.isArray(course.departments)
          ? course.departments
          : JSON.parse(course.departments || '[]'),
        competenciesStr: course.competenciesStr,
        link: course.link
      };
      this.selectedDepartment = '';
      this.preview = course.photo ? `${this.baseURL}${course.photo}` : null;
      this.image = null;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    confirmDelete(course) {
      this.toDelete = course;
      const modal = new Modal(this.$refs.deleteModal);
      modal.show();
    },
    async performDelete() {
      const modalInstance = Modal.getInstance(this.$refs.deleteModal);
      if (modalInstance) modalInstance.hide();
      try {
        const token = localStorage.getItem('authToken');
        await this.$api.delete(`/courses/${this.toDelete.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.courses = this.courses.filter(c => c.id !== this.toDelete.id);
        this.toast.success('Курс удалён ✅');
      } catch {
        this.toast.error('Ошибка при удалении');
      }
    },
    addDepartment() {
      const dept = this.selectedDepartment;
      if (dept && !this.newCourse.departments.includes(dept)) {
        this.newCourse.departments.push(dept);
      }
      this.selectedDepartment = '';
    },
    removeDepartment(dept) {
      this.newCourse.departments = this.newCourse.departments.filter(d => d !== dept);
    }
  }
};
</script>

<style scoped>
.news-admin {
  width: 100%;
  padding: 40px 16px;
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .news-admin {
    max-width: 900px;
    margin: auto;
  }
}

.title {
  font-size: 28px;
  margin-bottom: 30px;
  text-align: center;
}

.section-title {
  font-size: 22px;
  font-weight: 600;
  color: #1e3a8a;
  margin: 24px 0 16px;
  text-align: center;
}

.news-form {
  background: white;
  padding: 24px;
  border-radius: 14px;
  margin-bottom: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.button-group {
  margin-top: 24px;
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.form-grid {
  display: grid;
  gap: 16px;
}

.input,
.textarea,
select {
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  width: 100%;
  box-sizing: border-box;
}

.textarea {
  min-height: 120px;
  resize: vertical;
}

.file-label {
  background: linear-gradient(to right, #64748b, #475569);
  color: white;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  width: fit-content;
}

.file-input {
  display: none;
}

.file-name {
  font-size: 13px;
  color: #555;
}

.preview-image {
  max-height: 200px;
  object-fit: contain;
  margin-bottom: 16px;
  border-radius: 6px;
}

.btn {
  margin-top: 20px;
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
  width: 100%;
  max-width: 300px;
}

.btn-secondary {
  background: #e5e7eb;
  color: #111827;
  font-weight: 600;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.btn-primary:hover {
  background: linear-gradient(to right, #1e40af, #1d4ed8);
}

.news-list .news-item {
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  box-sizing: border-box;
}

.news-item img {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 8px;
  margin: 10px 0;
}

.news-item .header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.description {
  font-size: 15px;
  color: #374151;
  text-align: justify;
}

.btn-delete {
  background: #ef4444;
  color: white;
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  margin-top: 10px;
  cursor: pointer;
}

.btn-delete:hover {
  background: #dc2626;
}

.btn-edit {
  background: #3b82f6;
  color: white;
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  margin-right: 10px;
  cursor: pointer;
}

.btn-edit:hover {
  background: #2563eb;
}

/* 🔽 Новые стили для отделов */
.inline {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.btn-add {
  background: #facc15;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #111827;
  transition: filter 0.3s ease;
}
.btn-add:hover {
  filter: brightness(0.95);
}

.mini-list {
  list-style: none;
  padding-left: 0;
  margin: 10px 0 0 0;
}
.mini-list li {
  background: #f1f5f9;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mini-list li span {
  color: #ef4444;
  cursor: pointer;
  margin-left: 12px;
  font-weight: bold;
}

@media (max-width: 768px) {
  .news-form {
    padding: 20px 16px;
  }

  .btn-primary {
    width: 100%;
    font-size: 15px;
    padding: 10px 20px;
  }

  .input,
  .textarea {
    font-size: 15px;
  }

  .news-item {
    padding: 16px;
  }

  .news-item .header h3 {
    font-size: 18px;
  }

  .file-name {
    display: block;
    font-size: 13px;
    margin-top: -6px;
  }

  .title {
    font-size: 22px;
  }

  .inline {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-add {
    width: 100%;
    text-align: center;
  }
}
</style>
