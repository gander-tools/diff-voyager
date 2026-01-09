import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import { getSavedLocale, i18n } from './i18n';
import router from './router';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(i18n);

// Set saved locale
i18n.global.locale = getSavedLocale();

app.mount('#app');
