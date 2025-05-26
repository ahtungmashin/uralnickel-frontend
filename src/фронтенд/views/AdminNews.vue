<template>
  <div class="news-admin">
    <h2 class="title">Управление новостями</h2>

    <!-- Форма добавления / редактирования -->
    <form @submit.prevent="submitNews" class="news-form">
      <div class="form-grid">
        <input v-model="newNews.title" placeholder="Заголовок" class="input" required />
        <input type="date" v-model="newNews.date" class="input" required />
        <textarea v-model="newNews.description" placeholder="Описание" class="textarea" required></textarea>
        <label class="file-label">
          <input type="file" @change="onFileChange" accept="image/*" class="file-input" />
          Загрузить изображение
        </label>
        <span class="file-name">{{ image?.name || 'Файл не выбран' }}</span>
      </div>

      <img v-if="preview" :src="preview" alt="preview" class="preview-image" />

      <div class="button-group">
        <button type="submit" class="btn btn-primary">
          {{ newNews.id ? 'Сохранить изменения' : 'Добавить новость' }}
        </button>
        <button v-if="newNews.id" @click="resetForm" class="btn btn-secondary">Отмена</button>
      </div>
    </form>

    <!-- Список новостей -->
    <div class="news-list">
      <div v-for="item in news" :key="item.id" class="news-item">
        <div class="header">
          <h3>{{ item.title }}</h3>
          <small>{{ formatDate(item.date) }}</small>
        </div>
        <img v-if="item.image" :src="`${baseURL}${item.image}`" alt="news" />
        <div class="description" v-html="formatDescription(item.description)"></div>
        <button @click="editNews(item)" class="btn-edit">Редактировать</button>
        <button @click="confirmDelete(item)" class="btn-delete">Удалить</button>
      </div>
    </div>

    <!-- Подтверждение удаления -->
    <div class="modal fade" id="deleteModal" tabindex="-1" ref="deleteModal">
      <div class="modal-dialog">
        <div class="modal-content p-3">
          <h5 class="modal-title">Подтверждение удаления</h5>
          <p class="mt-2">Вы действительно хотите удалить новость «<strong>{{ toDelete?.title }}</strong>»?</p>
          <div class="d-flex justify-content-end gap-2 mt-3">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
            <button class="btn btn-danger" @click="performDelete">Удалить</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Подтверждение сохранения -->
    <div class="modal fade" id="saveModal" tabindex="-1" ref="saveModal">
      <div class="modal-dialog">
        <div class="modal-content p-3">
          <h5 class="modal-title">Подтверждение изменений</h5>
          <p class="mt-2">Сохранить изменения для новости «<strong>{{ newNews.title }}</strong>»?</p>
          <div class="d-flex justify-content-end gap-2 mt-3">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
            <button class="btn btn-primary" @click="performSave">Сохранить</button>
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
      news: [],
      newNews: {
        id: null,
        title: '',
        description: '',
        date: '',
      },
      image: null,
      preview: null,
      baseURL: import.meta.env.VITE_API_URL.replace('/api', ''),
      toast: null,
      toDelete: null,
      pendingDeleteId: null,
    };
  },
  async mounted() {
    this.toast = useToast();
    await this.fetchNews();
  },
  methods: {
    async fetchNews() {
      try {
        const res = await this.$api.get('/news');
        this.news = res.data;
      } catch {
        this.toast.error('Не удалось загрузить список новостей');
      }
    },
    onFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        this.toast.warning('Пожалуйста, выберите изображение (jpeg, png, webp...)');
        this.image = null;
        this.preview = null;
        e.target.value = '';
        return;
      }

      this.image = file;
      this.preview = URL.createObjectURL(file);
    },
    async submitNews() {
      if (this.newNews.id) {
        const modal = new Modal(this.$refs.saveModal);
        modal.show();
      } else {
        await this.performSave();
      }
    },
    async performSave() {
      const modalInstance = Modal.getInstance(this.$refs.saveModal);
      if (modalInstance) modalInstance.hide();

      const isEdit = !!this.newNews.id;
      const formData = new FormData();

      formData.append('title', this.newNews.title);
      formData.append('description', this.newNews.description);
      formData.append('date', this.newNews.date);
      if (this.image) formData.append('image', this.image);

      try {
        if (isEdit) {
          await this.$api.put(`/news/${this.newNews.id}`, formData);
          this.toast.success('Новость обновлена ✅');
        } else {
          await this.$api.post('/news', formData);
          this.toast.success('Новость добавлена ✅');
        }
        this.resetForm();
        await this.fetchNews();
      } catch {
        this.toast.error('Ошибка при сохранении');
      }
    },
    confirmDelete(item) {
      this.toDelete = item;
      this.pendingDeleteId = item.id;
      const modal = new Modal(this.$refs.deleteModal);
      modal.show();
    },
    async performDelete() {
      const modalInstance = Modal.getInstance(this.$refs.deleteModal);
      if (modalInstance) modalInstance.hide();

      const id = this.pendingDeleteId;
      try {
        await this.$api.delete(`/news/${id}`);
        this.news = this.news.filter(n => n.id !== id);
        this.toast.success('Новость удалена ✅');
        this.toDelete = null;
        this.pendingDeleteId = null;
      } catch {
        this.toast.error('Ошибка при удалении');
      }
    },
    editNews(item) {
      this.newNews = {
        id: item.id,
        title: item.title,
        description: item.description,
        date: item.date?.split('T')[0] || ''
      };
      this.image = null;
      this.preview = item.image ? `${this.baseURL}${item.image}` : null;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    resetForm() {
      this.newNews = { id: null, title: '', description: '', date: '' };
      this.image = null;
      this.preview = null;
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString();
    },
    formatDescription(text) {
      return text
        .split('\n')
        .map(p => `<p style="text-indent: 1.5em; margin-bottom: 0.8em;">${p.trim()}</p>`)
        .join('');
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
.textarea {
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
  margin-left: 16px;
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

dialog {
  padding: 20px;
  border: none;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  max-width: 300px;
  margin: auto;
  font-size: 16px;
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
}
</style>