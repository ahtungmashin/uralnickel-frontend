<template>
  <div class="admin-projects">
    <h2 class="title">Создание нового проекта</h2>

    <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
    <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

    <div class="form-card">
      <form @submit.prevent="submitProject">
        <input v-model.trim="form.title" class="input" :class="inputClass('title')" placeholder="Название проекта" required />
        <textarea v-model.trim="form.description" class="textarea" :class="inputClass('description')" placeholder="Описание проекта" required></textarea>

        <!-- Отделы -->
        <div class="block">
          <h4>Отделы:</h4>
          <div class="inline">
            <select v-model="selectedDepartment" class="input">
              <option disabled value="">Выберите отдел</option>
              <option v-for="dept in departmentsList" :key="dept" :value="dept">{{ dept }}</option>
            </select>
            <button type="button" @click="addDepartment" class="btn-add">Добавить</button>
          </div>
          <ul class="mini-list">
            <li v-for="dept in form.departments" :key="dept">
              {{ dept }} <span @click="removeDepartment(dept)">✖</span>
            </li>
          </ul>
          <div v-if="invalidFields.departments" class="error">Укажите хотя бы один отдел</div>
        </div>

        <!-- Руководитель -->
        <label>Руководитель проекта:</label>
        <select v-model="form.managerId" class="input" :class="inputClass('managerId')" required>
          <option disabled value="">Выберите руководителя</option>
          <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
        </select>

        <!-- Дата начала -->
        <label>Дата начала:</label>
        <input type="date" v-model="form.startDate" class="input" :class="inputClass('startDate')" required />

        <!-- Роли -->
        <div class="block">
          <h4>Роли в проекте:</h4>
          <div class="inline">
            <select v-model="roleInput" class="input">
              <option disabled value="">Выберите должность</option>
              <option v-for="role in positionsList" :key="role">{{ role }}</option>
            </select>
            <input type="number" v-model.number="countInput" class="input small" placeholder="Кол-во" min="1" />
            <input v-model="compInput" class="input" placeholder="Компетенции (через запятую)" />
            <button type="button" @click="addRole" class="btn-add">Добавить</button>
          </div>
          <ul class="mini-list">
            <li v-for="(role, index) in form.roles" :key="index">
              {{ role.title }} — {{ role.count }} чел. — {{ role.competencies.join(', ') }}
              <span @click="removeRole(index)">✖</span>
            </li>
          </ul>
          <div v-if="invalidFields.roles" class="error">Добавьте хотя бы одну роль</div>
        </div>

        <!-- Фото -->
        <label class="file-label">
          <input type="file" @change="onFileChange" class="file-input" :class="inputClass('photo')" />
          Выбрать файл
        </label>
        <span class="file-name">{{ imageFile?.name || 'Файл не выбран' }}</span>
        <div v-if="previewImage" class="image-preview">
          <img :src="previewImage" alt="Предпросмотр" />
        </div>
        <div v-if="invalidFields.photo" class="error">Пожалуйста, прикрепите изображение проекта</div>

        <button type="submit" class="btn-submit">Создать проект</button>
      </form>
    </div>
  </div>
</template>

<script>
import { useToast } from 'vue-toastification';

export default {
  data() {
    return {
      form: {
        title: '',
        description: '',
        departments: [],
        startDate: '',
        managerId: '',
        roles: []
      },
      users: [],
      departmentsList: [
        'Отдел добычи', 'Отдел обогащения', 'Отдел логистики',
        'Отдел технического обслуживания', 'Бухгалтерия',
        'Отдел финансового планирования и анализа', 'Отдел геологоразведки',
        'Отдел экологического контроля', 'Отдел кадров', 'Отдел обучения и развития',
        'Отдел охраны труда'
      ],
      positionsList: ['Инженер', 'Аналитик', 'Геолог', 'Оператор', 'Бухгалтер', 'Менеджер'],
      selectedDepartment: '',
      roleInput: '',
      countInput: null,
      compInput: '',
      imageFile: null,
      previewImage: null,
      errorMessage: '',
      successMessage: '',
      invalidFields: {},
      toast: null
    };
  },
  async mounted() {
    this.toast = useToast();
    try {
      const usersRes = await this.$api.get('/users');
      this.users = usersRes.data;
    } catch (err) {
      console.error('Ошибка при инициализации:', err);
      this.toast.error('Ошибка при загрузке списка пользователей');
    }
  },
  methods: {
    onFileChange(e) {
      const file = e.target.files[0];

      if (!file) return;

      if (!file.type.startsWith('image/')) {
        this.toast.warning('Пожалуйста, загрузите изображение (jpeg, png, webp...)');
        this.imageFile = null;
        this.previewImage = null;
        e.target.value = ''; // очистка input
        return;
      }

      this.imageFile = file;
      this.previewImage = URL.createObjectURL(file);
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
      } else {
        this.errorMessage = 'Заполните все поля при добавлении роли';
      }
    },
    removeRole(index) {
      this.form.roles.splice(index, 1);
    },
    inputClass(field) {
      return {
        invalid: this.invalidFields[field],
        valid: !this.invalidFields[field] && this.form[field]
      };
    },
    async submitProject() {
      this.errorMessage = '';
      this.successMessage = '';
      this.invalidFields = {};

      const { title, description, departments, startDate, managerId, roles } = this.form;

      if (!title) this.invalidFields.title = true;
      if (!description) this.invalidFields.description = true;
      if (!departments.length) this.invalidFields.departments = true;
      if (!startDate) this.invalidFields.startDate = true;
      if (!managerId) this.invalidFields.managerId = true;
      if (!roles.length) this.invalidFields.roles = true;
      if (!this.imageFile) this.invalidFields.photo = true;

      if (Object.keys(this.invalidFields).length > 0) {
        this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
        return;
      }

      try {
        const fd = new FormData();
        fd.append('title', title);
        fd.append('description', description);
        fd.append('startDate', startDate);
        fd.append('managerId', managerId);
        fd.append('departments', JSON.stringify(departments));

        const positions = {}, competencies = {};
        roles.forEach(r => {
          positions[r.title] = r.count;
          competencies[r.title] = r.competencies;
        });
        fd.append('positions_required', JSON.stringify(positions));
        fd.append('competencies_required', JSON.stringify(competencies));

        fd.append('photo', this.imageFile);

        await this.$api.post('/projects', fd);

        this.successMessage = 'Проект успешно создан!';
        this.toast.success(this.successMessage); // ✅ Успех через toast

        setTimeout(() => this.$router.push('/projects'), 1500);
      } catch (err) {
        console.error(err);
        this.errorMessage = 'Ошибка при создании проекта.';
        this.toast.error(this.errorMessage); // ❌ Ошибка через toast
      }
    }
  }
};
</script>


<style scoped>
.admin-projects {
  width: 100%;
  max-width: 900px;
  margin: 40px auto;
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
}
.title {
  text-align: center;
  font-size: 28px;
  margin-bottom: 24px;
  color: #1e3a8a;
}
.form-card {
  background: #ffffff;
  padding: 30px;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
  min-height: 100px;
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
}
.btn-submit {
  background: #2563eb;
  color: white;
  padding: 12px 20px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  width: 100%;
  margin-top: 20px;
  cursor: pointer;
  transition: background 0.3s ease;
}
.btn-submit:hover {
  background: #1e40af;
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
.file-label {
  background: linear-gradient(to right, #64748b, #475569);
  color: white;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: inline-block;
  margin-bottom: 10px;
  transition: filter 0.3s ease;
}
.file-label:hover {
  filter: brightness(0.9);
}
.file-input {
  display: none;
}
.file-name {
  font-size: 13px;
  color: #475569;
  margin-left: 10px;
}
.block {
  margin: 20px 0;
}
.mini-list {
  list-style: none;
  padding-left: 0;
}
.mini-list li {
  margin-bottom: 5px;
  background: #f1f5f9;
  padding: 6px 10px;
  border-radius: 6px;
}
.mini-list li span {
  float: right;
  cursor: pointer;
  color: #ef4444;
}
.invalid {
  border-color: red;
}
.valid {
  border-color: #22c55e;
}
.alert {
  padding: 12px;
  margin-bottom: 16px;
  border-radius: 8px;
  font-weight: 500;
  text-align: center;
}
.alert-danger {
  background: #fee2e2;
  color: #b91c1c;
}
.alert-success {
  background: #dcfce7;
  color: #15803d;
}
.error {
  color: red;
  font-size: 13px;
  margin-top: -10px;
  margin-bottom: 10px;
}
.image-preview img {
  margin-top: 10px;
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
@media (max-width: 768px) {
  .admin-projects {
    padding: 0 16px;
    margin: 24px auto;
  }

  .title {
    font-size: 22px;
  }

  .form-card {
    padding: 20px;
  }

  .inline {
    flex-direction: column;
    gap: 12px;
  }

  .input,
  .textarea,
  select {
    font-size: 15px;
  }

  .input.small {
    width: 100%;
  }

  .btn-add {
    width: 100%;
    text-align: center;
    font-size: 15px;
    padding: 10px;
  }

  .btn-submit {
    font-size: 16px;
    padding: 14px;
    margin-top: 24px;
  }

  .file-label {
    display: block;
    width: 100%;
    text-align: center;
    font-size: 15px;
  }

  .file-name {
    display: block;
    margin-left: 0;
    margin-top: 6px;
  }

  .image-preview img {
    max-height: 220px;
    object-fit: contain;
  }

  .mini-list li {
    font-size: 14px;
  }
}
</style>
