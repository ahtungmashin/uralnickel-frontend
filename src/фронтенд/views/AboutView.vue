<template>
  <div class="about-page">
    <div class="about-section">
      <video autoplay muted loop playsinline class="background-video">
        <source src="/video/industry.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>

      <div class="overlay">
        <div class="content-box" ref="contentBox">
          <h1 class="title">О компании «УралНикель»</h1>
          <div class="description" v-html="htmlContent"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      htmlContent: ''
    };
  },
  async mounted() {
    try {
      const res = await fetch('/about_uralnickel.html');
      this.htmlContent = await res.text();

      this.$nextTick(() => {
        this.setupScrollHandlers();
      });
    } catch (error) {
      console.error('Ошибка загрузки текста:', error);
    }
  },
  methods: {
    setupScrollHandlers() {
      const container = this.$refs.contentBox;

      container.addEventListener('wheel', (e) => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const atTop = scrollTop === 0;
        const atBottom = scrollHeight - scrollTop <= clientHeight + 1;

        if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
          window.scrollBy({
            top: e.deltaY,
            behavior: 'smooth'
          });
        }
      });
    }
  }
};
</script>

<style scoped>
.about-page {
  font-family: 'Inter', sans-serif;
  padding-bottom: 40px; /* отступ под футер */
}

.about-section {
  position: relative;
  width: 100%;
  margin-top: 40px;
  min-height: 100vh; 
}

.background-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  object-fit: cover;
  z-index: 1;
}

.overlay {
  position: relative;
  z-index: 2;
  background: rgba(0, 0, 0, 0.65);
  padding: 60px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.content-box {
  max-height: 80vh;
  overflow-y: auto;
  padding: 30px 40px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 20px rgba(100, 255, 255, 0.15);
  color: #e2e8f0;
  scrollbar-width: none;
}
.content-box::-webkit-scrollbar {
  display: none;
}

.title {
  font-size: 36px;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 24px;
  text-align: center;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

.description {
  font-size: 18px;
  line-height: 1.75;
  color: #e2e8f0;
  text-align: justify;
}
.description p {
  text-indent: 2em;
  margin-bottom: 1em;
}
@media (max-width: 768px) {
  .overlay {
    padding: 40px 12px;
  }

  .content-box {
    padding: 20px 16px;
    max-height: 70vh;
    border-radius: 14px;
  }

  .title {
    font-size: 24px;
    margin-bottom: 16px;
  }

  .description {
    font-size: 15px;
    line-height: 1.6;
  }

  .description p {
    text-indent: 1.5em;
    margin-bottom: 0.8em;
  }
}

</style>
