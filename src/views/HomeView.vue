<template>
  <div class="home-page">
    <div class="header">
      <h1>Добро пожаловать в УралНикель!</h1>
      <p class="subtext">
        УралНикель — ведущий производитель никеля и меди в России. Мы стремимся к высоким стандартам качества и инновациям в своей отрасли.
      </p>

      <div v-if="isAdmin" class="admin-tools">
        <router-link to="/admin/news" class="btn-manage-news">Управление новостями</router-link>
      </div>
    </div>

    <div class="news-section">
      <h2 class="news-title">Последние новости</h2>
      <div class="news-list">
        <div v-for="news in sortedNews" :key="news.id" class="news-card">
          <div class="card-header">
            <h3 class="news-header">{{ news.title }}</h3>
            <span class="news-date">{{ formatDate(news.date) }}</span>
          </div>
          <div class="news-image-wrapper">
            <img v-if="news.image" :src="`${baseURL}${news.image}`" class="news-image" />
          </div>
          <div class="news-description" v-html="formatParagraphs(news.description)"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  data() {
    return {
      newsList: [],
      isAdmin: false,
      baseURL: import.meta.env.VITE_API_URL
    };
  },
  computed: {
    sortedNews() {
      return [...this.newsList].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  },
  async created() {
    const user = JSON.parse(localStorage.getItem('user'));
    this.isAdmin = user?.role === 'admin';

    try {
      const res = await this.$axios.get('/news');
      this.newsList = res.data;
    } catch (err) {
      console.error('Ошибка загрузки новостей:', err);
    }
  },
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleDateString();
    },
    formatParagraphs(text) {
      return text
        .split('\n')
        .filter(p => p.trim().length)
        .map(p => `<p>${p.trim()}</p>`)
        .join('');
    }
  }
};
</script>

<style scoped>
.home-page {
  max-width: 800px;
  margin: 40px auto;
  padding: 0 20px;
  font-family: 'Inter', sans-serif;
  color: #1e293b;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.subtext {
  font-size: 18px;
  color: #4b5563;
  margin-top: 12px;
}

.admin-tools {
  margin-top: 20px;
}

.btn-manage-news {
  background: linear-gradient(to right, #facc15, #eab308);
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  color: #111827;
  text-decoration: none;
  box-shadow: 0 3px 6px rgba(0,0,0,0.1);
  transition: 0.2s;
}

.btn-manage-news:hover {
  background: linear-gradient(to right, #eab308, #ca8a04);
}

.news-section {
  background: #f9fafb;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.news-title {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 20px;
  text-align: center;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.news-card {
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
.news-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.news-header {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.news-date {
  font-size: 13px;
  color: #6b7280;
}

.news-image-wrapper {
  width: 100%;
  overflow: hidden;
  border-radius: 10px;
  max-height: 400px;
}

.news-image {
  width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
  border-radius: 8px;
}

.news-description {
  font-size: 16px;
  color: #374151;
  text-align: justify;
  line-height: 1.6;
}

.news-description p {
  margin-bottom: 1em;
  text-indent: 1.5em;
}
</style>
