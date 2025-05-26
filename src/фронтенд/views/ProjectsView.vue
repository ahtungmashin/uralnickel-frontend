<template>
  <div class="project-page">
    <!-- Заголовок и админ-кнопки -->
    <div class="project-header">
      <h1>Проекты компании</h1>
      <p class="subtext">Здесь собраны все актуальные проекты, к которым вы можете присоединиться.</p>

      <div v-if="isAdmin" class="admin-tools">
        <router-link to="/admin/projects" class="btn-manage">Создать проект</router-link>
        <button class="btn-manage" @click="toggleMode">
          {{ isAdminMode ? 'Режим пользователя' : 'Режим администратора' }}
        </button>
      </div>
    </div>

    <!-- Список проектов -->
    <div class="project-section">
      <div class="project-list">
        <div v-for="project in projects" :key="project.id" class="project-card">
          <div class="card-header">
            <h3 class="project-title">{{ project.title }}</h3>
            <span class="project-date">{{ formatDate(project.startDate) }}</span>
          </div>

          <div v-if="project.photo" class="project-image-wrapper">
            <img :src="getProjectImage(project.photo)" class="project-image" />
          </div>

          <div class="project-description">
            <p>{{ project.description }}</p>
            <ul class="project-details">
              <li><strong>Отделы:</strong> {{ project.departments?.join(', ') }}</li>
              <li v-for="(count, role) in project.positions_required" :key="role">
                <strong>{{ role }}</strong> — {{ count }} чел.<br />
                <small class="text-muted">
                  Компетенции: {{ (project.competencies_required?.[role] || []).join(', ') || '—' }}
                </small>
              </li>
            </ul>
          </div>

          <div class="card-footer">
            <!-- Менеджер проекта -->
            <template v-if="user.role === 'manager' && project.managerId === user.id">
              <div class="manager-block">
                <span class="badge-manager">Вы руководитель проекта</span>

                <div v-if="project.requests && project.requests.length" class="participants">
                  <h6 class="mt-2 mb-1">Участники:</h6>
                  <ul class="list-group">
                    <li
                      v-for="r in project.requests.filter(req => req.status === 'approved')"
                      :key="r.id"
                      class="list-group-item"
                    >
                      {{ r.user.name }} — {{ r.user.position }}, {{ r.user.department }}
                      <br />
                      <small>Компетенции: {{ parseCompetencies(r.user.competencies).join(', ') }}</small>
                    </li>
                  </ul>
                </div>
                <div v-else>
                  <em class="text-muted">Пока нет утверждённых участников</em>
                </div>
              </div>
            </template>

            <!-- Администратор -->
            <template v-else-if="isAdmin && isAdminMode">
              <button class="btn btn-outline-primary me-2" @click="editProject(project)">Редактировать</button>
              <button class="btn btn-outline-danger" @click="confirmDelete(project)">Удалить</button>
            </template>

            <!-- Сотрудник (если не менеджер и не админ) -->
            <template v-else>
              <button class="btn btn-success w-100" @click="applyToProject(project)">Подать заявку</button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Подтверждение удаления -->
    <div class="modal fade" id="confirmModal" tabindex="-1" ref="confirmModal">
      <div class="modal-dialog">
        <div class="modal-content p-3">
          <h5 class="modal-title">Подтверждение удаления</h5>
          <p class="mt-2">Вы действительно хотите удалить проект "<strong>{{ toDelete?.title }}</strong>"?</p>
          <div class="d-flex justify-content-end gap-2 mt-3">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
            <button class="btn btn-danger" @click="deleteProject">Удалить</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модалка редактирования -->
    <div class="modal fade" id="editModal" tabindex="-1" ref="editModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content p-4">
          <h5 class="modal-title mb-3">Редактировать проект</h5>
          <form @submit.prevent="saveEdit">
            <input v-model="form.title" class="input mb-2" placeholder="Название проекта" required />
            <textarea v-model="form.description" class="textarea mb-2" placeholder="Описание проекта" required />

            <div class="block">
              <h6>Отделы</h6>
              <div class="inline mb-2">
                <select v-model="selectedDepartment" class="input">
                  <option disabled value="">Выберите отдел</option>
                  <option v-for="dept in departmentsList" :key="dept" :value="dept">{{ dept }}</option>
                </select>
                <button type="button" class="btn-add" @click="addDepartment">Добавить</button>
              </div>
              <ul class="mini-list">
                <li v-for="dept in form.departments" :key="dept">
                  {{ dept }} <span @click="removeDepartment(dept)">✖</span>
                </li>
              </ul>
            </div>

            <label class="mt-3">Руководитель:</label>
            <select v-model="form.managerId" class="input" required>
              <option disabled value="">Выберите руководителя</option>
              <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
            </select>

            <label class="mt-3">Дата начала:</label>
            <input type="date" v-model="form.startDate" class="input" required />

            <div class="block mt-3">
              <h6>Роли в проекте</h6>
              <div class="inline mb-2">
                <select v-model="roleInput" class="input">
                  <option disabled value="">Выберите должность</option>
                  <option v-for="role in positionsList" :key="role">{{ role }}</option>
                </select>
                <input type="number" v-model.number="countInput" class="input small" placeholder="Кол-во" min="1" />
                <input v-model="compInput" class="input" placeholder="Компетенции (через запятую)" />
                <button type="button" class="btn-add" @click="addRole">Добавить</button>
              </div>
              <ul class="mini-list">
                <li v-for="(role, index) in form.roles" :key="index">
                  {{ role.title }} — {{ role.count }} чел. — {{ role.competencies.join(', ') }}
                  <span @click="removeRole(index)">✖</span>
                </li>
              </ul>
            </div>

            <label class="mt-3">Изображение:</label>
            <input type="file" @change="onFileChange" class="form-control mb-2" />
            <img v-if="previewImage" :src="previewImage" class="img-preview mt-2" />

            <div class="mt-4 d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
              <button type="submit" class="btn btn-primary">Сохранить изменения</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Модалка о компетенциях -->
    <div class="modal fade" id="competencyModal" tabindex="-1" ref="competencyModal">
      <div class="modal-dialog">
        <div class="modal-content p-4">
          <h5 class="modal-title">Недостаточно компетенций</h5>
          <p class="mt-2">Вам не хватает следующих компетенций:</p>
          <ul>
            <li v-for="c in missingCompetencies" :key="c">{{ c }}</li>
          </ul>
          <p class="text-muted mt-2">Вы можете пройти курсы, чтобы их получить.</p>
          <div class="text-end">
            <button class="btn btn-secondary mt-3" data-bs-dismiss="modal">Понятно</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from 'bootstrap';
import { useToast } from 'vue-toastification';

export default {
  name: 'ProjectsView',
  data() {
    return {
      projects: [],
      users: [],
      user: JSON.parse(localStorage.getItem('user') || '{}'),
      isAdminMode: false,
      baseURL: import.meta.env.VITE_API_URL.replace('/api', ''),
      toast: null, // ✅

      // Удаление
      toDelete: null,

      // Редактирование
      editingProject: null,
      form: {
        title: '',
        description: '',
        departments: [],
        startDate: '',
        managerId: '',
        roles: []
      },
      selectedDepartment: '',
      roleInput: '',
      countInput: null,
      compInput: '',
      imageFile: null,
      previewImage: null,

      departmentsList: [
        'Отдел добычи', 'Отдел обогащения', 'Отдел логистики',
        'Отдел технического обслуживания', 'Бухгалтерия',
        'Отдел финансового планирования и анализа', 'Отдел геологоразведки',
        'Отдел экологического контроля', 'Отдел кадров', 'Отдел обучения и развития',
        'Отдел охраны труда'
      ],
      positionsList: ['Инженер', 'Аналитик', 'Геолог', 'Оператор', 'Бухгалтер', 'Менеджер'],

      missingCompetencies: []
    };
  },
  computed: {
    isAdmin() {
      return this.user?.role === 'admin';
    }
  },
  methods: {
    async fetchProjects() {
      const res = await this.$api.get('/projects');
      this.projects = res.data;
    },
    parseCompetencies(raw) {
      try {
        return Array.isArray(raw) ? raw : JSON.parse(raw || '[]');
      } catch {
        return [];
      }
    },
    async fetchUsers() {
      const res = await this.$api.get('/users');
      this.users = res.data;
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString();
    },
    flattenCompetencies(obj) {
      return Object.values(obj || {}).flat();
    },
    getProjectImage(photo) {
      return photo ? `${this.baseURL}${photo}` : null;
    },
    async applyToProject(project) {
      const raw = this.user?.competencies;
      const userComps = Array.isArray(raw) ? raw : JSON.parse(raw || '[]');
      const userPosition = this.user?.position;

      const requiredCompsMap = project.competencies_required || {};

      if (!Object.keys(requiredCompsMap).includes(userPosition)) {
        this.toast.error(`В проекте нет открытых ролей для вашей должности: ${userPosition}`);
        return;
      }

      const requiredForPosition = requiredCompsMap[userPosition] || [];
      const missing = requiredForPosition.filter(c => !userComps.includes(c));

      if (missing.length) {
        this.missingCompetencies = missing;
        new Modal(this.$refs.competencyModal).show();
        return;
      }

      try {
        const token = localStorage.getItem('authToken');
        await this.$api.post(
          `/project-requests/${project.id}/request`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        this.toast.success('Заявка успешно отправлена ✅');
      } catch (err) {
        if (err.response?.status === 400 || err.response?.status === 409) {
          this.toast.error(err.response.data?.message || 'Ошибка при подаче заявки ❌');
        } else {
          console.error('Ошибка при подаче заявки:', err);
          this.toast.error('Ошибка при подаче заявки ❌');
        }
      }
    },
    toggleMode() {
      this.isAdminMode = !this.isAdminMode;
    },
    confirmDelete(project) {
      this.toDelete = project;
      new Modal(this.$refs.confirmModal).show();
    },
    async deleteProject() {
      try {
        await this.$api.delete(`/projects/${this.toDelete.id}`);
        this.toDelete = null;
        await this.fetchProjects();
        Modal.getInstance(this.$refs.confirmModal).hide();
        this.toast.success('Проект удалён');
      } catch {
        this.toast.error('Ошибка при удалении проекта');
      }
    },
    editProject(project) {
      this.editingProject = project;
      this.form = {
        title: project.title,
        description: project.description,
        departments: [...(project.departments || [])],
        startDate: project.startDate,
        managerId: project.managerId,
        roles: []
      };

      const positions = project.positions_required || {};
      const competencies = project.competencies_required || {};
      for (const title in positions) {
        this.form.roles.push({
          title,
          count: positions[title],
          competencies: competencies[title] || []
        });
      }

      this.imageFile = null;
      this.previewImage = project.photo ? this.getProjectImage(project.photo) : null;

      new Modal(this.$refs.editModal).show();
    },
    addDepartment() {
      if (this.selectedDepartment && !this.form.departments.includes(this.selectedDepartment)) {
        this.form.departments.push(this.selectedDepartment);
        this.selectedDepartment = '';
      }
    },
    removeDepartment(dept) {
      this.form.departments = this.form.departments.filter(d => d !== dept);
    },
    addRole() {
      if (this.roleInput && this.countInput && this.compInput.trim()) {
        this.form.roles.push({
          title: this.roleInput,
          count: this.countInput,
          competencies: this.compInput.split(',').map(c => c.trim())
        });
        this.roleInput = '';
        this.countInput = null;
        this.compInput = '';
      }
    },
    removeRole(index) {
      this.form.roles.splice(index, 1);
    },
    onFileChange(e) {
      this.imageFile = e.target.files[0];
      if (this.imageFile) {
        this.previewImage = URL.createObjectURL(this.imageFile);
      }
    },
    async saveEdit() {
      try {
        const fd = new FormData();
        fd.append('title', this.form.title);
        fd.append('description', this.form.description);
        fd.append('startDate', this.form.startDate);
        fd.append('managerId', this.form.managerId);
        fd.append('departments', JSON.stringify(this.form.departments));

        const positions = {}, competencies = {};
        this.form.roles.forEach(r => {
          positions[r.title] = r.count;
          competencies[r.title] = r.competencies;
        });
        fd.append('positions_required', JSON.stringify(positions));
        fd.append('competencies_required', JSON.stringify(competencies));

        if (this.imageFile) {
          fd.append('photo', this.imageFile);
        }

        await this.$api.put(`/projects/${this.editingProject.id}`, fd, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        await this.fetchProjects();
        Modal.getInstance(this.$refs.editModal).hide();
        this.toast.success('Изменения успешно сохранены ✅');
      } catch (err) {
        console.error('Ошибка при сохранении:', err);
        this.toast.error('Ошибка при сохранении проекта ❌');
      }
    }
  },
  mounted() {
    this.toast = useToast(); // ✅ инициализация тоста
    this.fetchProjects();
    this.fetchUsers();

     // 👇 Вывод данных после задержки (чтобы дождаться fetch)
  setTimeout(() => {
    console.log('[DEBUG] Список проектов:', this.projects);
  }, 1000);
  }
};
</script>

<style scoped>
.manager-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}
.badge-manager {
  display: inline-block;
  background-color: #fde047;
  color: #1e293b;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  min-width: 180px;
  text-align: center;
}
.input, .textarea, select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  margin-bottom: 14px;
  font-size: 14px;
}
.textarea {
  resize: vertical;
  min-height: 80px;
}
.input.small {
  width: 100px;
}
.inline {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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
  filter: brightness(0.9);
}
.block {
  margin: 20px 0 10px;
}
.mini-list {
  list-style: none;
  padding-left: 0;
}
.mini-list li {
  background: #f1f5f9;
  padding: 6px 10px;
  border-radius: 6px;
  margin-bottom: 5px;
}
.mini-list li span {
  float: right;
  cursor: pointer;
  color: #ef4444;
}
.img-preview {
  max-width: 100%;
  max-height: 250px;
  border-radius: 8px;
  margin-top: 10px;
  box-shadow: 0 3px 6px rgba(0,0,0,0.08);
}
.project-page {
  max-width: 850px;
  margin: 40px auto;
  padding: 0 20px;
  font-family: 'Inter', sans-serif;
  color: #1e293b;
}

.project-header {
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
  gap: 10px;
  flex-wrap: wrap;
}

.btn-manage {
  background: linear-gradient(to right, #facc15, #eab308);
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  color: #111827;
  text-decoration: none;
  border: none;
  box-shadow: 0 3px 6px rgba(0,0,0,0.1);
  transition: 0.2s;
}

.btn-manage:hover {
  background: linear-gradient(to right, #eab308, #ca8a04);
}

.project-section {
  background: #f9fafb;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.project-card {
  background: white;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-left: 5px solid #eab308;
  transition: transform 0.2s ease;
}
.project-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.project-date {
  font-size: 13px;
  color: #6b7280;
}

.project-image-wrapper {
  width: 100%;
  overflow: hidden;
  border-radius: 10px;
  max-height: 300px;
}

.project-image {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
  border-radius: 8px;
}

.project-description {
  font-size: 16px;
  color: #374151;
  text-align: justify;
  line-height: 1.6;
}

.project-details {
  font-size: 14px;
  margin-top: 10px;
  color: #4b5563;
  list-style: none;
  padding: 0;
}

.card-footer {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
@media (max-width: 768px) {
  .project-page {
    padding: 24px 16px;
  }

  .project-header h1 {
    font-size: 22px;
  }

  .subtext {
    font-size: 15px;
  }

  .admin-tools {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .btn-manage {
    width: 100%;
    text-align: center;
  }

  .project-section {
    padding: 20px;
  }

  .project-card {
    padding: 16px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .project-title {
    font-size: 18px;
  }

  .project-date {
    font-size: 12px;
  }

  .project-description {
    font-size: 15px;
  }

  .project-details {
    font-size: 13px;
  }

  .btn {
    width: 100%;
    font-size: 15px;
    padding: 10px 14px;
  }

  .card-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .input,
  .textarea,
  select {
    font-size: 15px;
  }

  .input.small {
    width: 100%;
  }

  .inline {
    flex-direction: column;
    align-items: stretch;
  }

  .img-preview {
    max-height: 200px;
    object-fit: contain;
  }

  .modal-dialog {
    margin: 0;
    max-width: 100%;
  }

  .modal-content {
    padding: 16px;
    border-radius: 12px;
  }

  .modal-title {
    font-size: 18px;
  }

  .mini-list li {
    font-size: 14px;
  }
}

</style>
