<template>
  <div class="news-admin">
    <h2 class="title">Управление новостями</h2>

    <!-- Форма добавления -->
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
      <button type="submit" class="btn btn-primary">Добавить новость</button>
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
        <button @click="deleteNews(item.id)" class="btn-delete">Удалить</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      news: [],
      newNews: {
        title: '',
        description: '',
        date: '',
      },
      image: null,
      baseURL: import.meta.env.VITE_API_URL.replace('/api', '')
    };
  },
  async mounted() {
    await this.fetchNews();
  },
  methods: {
    async fetchNews() {
      const res = await this.$api.get('/news');
      this.news = res.data;
    },
    onFileChange(e) {
      this.image = e.target.files[0];
    },
    async submitNews() {
      const formData = new FormData();
      formData.append('title', this.newNews.title);
      formData.append('description', this.newNews.description);
      formData.append('date', this.newNews.date);
      if (this.image) formData.append('image', this.image);

      await this.$api.post('/news', formData);
      this.newNews = { title: '', description: '', date: '' };
      this.image = null;
      await this.fetchNews();
    },
    async deleteNews(id) {
      if (!confirm('Удалить эту новость?')) return;
      await this.$api.delete(`/news/${id}`);
      this.news = this.news.filter(n => n.id !== id);
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
  max-width: 900px;
  margin: auto;
  padding: 40px 20px;
  font-family: 'Inter', sans-serif;
}
.title {
  font-size: 28px;
  margin-bottom: 30px;
  text-align: center;
}
.news-form {
  background: white;;
  padding: 30px;
  border-radius: 14px;
  margin-bottom: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
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
</style>
